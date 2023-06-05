import { isError } from "@helpers/types";
import * as yup from "yup";
import { Request, Response } from "express";
import { PoolClient } from "pg";
import SMTPClient from "@smtp-client";
import { Logger } from "winston";
import { GENERIC_ERROR } from "@constants/errors";
import UserRepository from "@db/repositories/user";
import TokenRepository from "@db/repositories/token";
import User from "@db/models/user";
import Token from "@db/models/token";
import { hashPassword } from "@helpers/auth";
import { OneTimeTokenType } from "@typings/auth";
import VerificationEmail from "@emails/verification";
import DBClientPool from "@db-client-pool";
import { SignUpRequest } from "@typings/api";

class SignUpController {
  private smtpClient_: SMTPClient;
  private dbClientPool_: DBClientPool;
  private logger_: Logger;

  constructor(smtpClient: SMTPClient, dbClientPool: DBClientPool, logger: Logger) {
    this.smtpClient_ = smtpClient;
    this.dbClientPool_ = dbClientPool;
    this.logger_ = logger;
  }

  private async validateRequest(req: SignUpRequest): Promise<void> {
    await yup.object().shape({
      body: yup.object({
        username: yup.string().required(),
        email: yup.string().required(),
        name: yup.string().required(),
        password: yup.string().required(),
      }).required()
    }).validate(req);
  }

  public async handle(
    req: SignUpRequest,
    res: Response
  ) {
    let dbTXNClient: PoolClient;

    // Validate request
    try {
      await this.validateRequest(req);
    } catch(err) {
      return res.status(400).send({ 
        err: isError(err) ? err.message : GENERIC_ERROR 
      });
    }

    // Retrieve database transaction client
    try {
      dbTXNClient = await this.dbClientPool_.beginTransaction();
    } catch (err) {
      this.logger_.log({
        level: "error",
        message: isError(err) ? err.message : GENERIC_ERROR,
      });

      return res.status(500).send({ 
        err: GENERIC_ERROR 
      });
    }

    // Create new user and send verification email
    try {
      const userRepo = new UserRepository(dbTXNClient);
      const tokenRepo = new TokenRepository(dbTXNClient);
      const hashedPassword = await hashPassword(req.body.password);

      const newUser = new User({
        ...req.body,
        password: hashedPassword,
      });

      const verificationToken = new Token({
        userId: newUser.userId,
        type: OneTimeTokenType.Verification
      });

      const verificationEmail = new VerificationEmail({
        req,
        user: newUser,
        token: verificationToken
      });

      await userRepo.create(newUser);
      await tokenRepo.create(verificationToken);
      await this.smtpClient_.sendEmail(verificationEmail);
      await this.dbClientPool_.commitTransaction(dbTXNClient);

      res.status(204).send();
    } catch (err) {
      this.logger_.log({
        level: "error",
        message: isError(err) ? err.message : GENERIC_ERROR,
      });
      
      await this.dbClientPool_.rollbackTransaction(dbTXNClient);
      
      res.status(500).send({ 
        err: GENERIC_ERROR 
      });
    } 
  }
}

export default SignUpController;