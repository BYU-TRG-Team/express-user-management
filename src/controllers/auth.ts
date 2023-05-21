import bcrypt from "bcrypt";
import { Logger } from "winston";
import { Response, Request } from "express";
import SMTPClient from "@smtp-client";
import DBClient from "@db";
import { OneTimeTokenType } from "@typings/auth";
import User from "@db/models/user";
import { LOGIN_AUTHENTICATION_ERROR, GENERIC_ERROR } from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";
import { constructHTTPCookieConfig, createHTTPCookie } from "@helpers/auth";
import { PoolClient } from "pg";
import { isError } from "@helpers/types";
import UserRepository from "@db/repositories/user-repository";
import TokenRepository from "@db/repositories/token-repository";
import Token from "@db/models/token";
import AuthConfig from "@configs/auth";

class AuthController {
  private smtpClient_: SMTPClient;
  private dbClient_: DBClient;
  private logger_: Logger;
  private authConfig_: AuthConfig;

  constructor(smtpClient: SMTPClient, dbClient: DBClient, logger: Logger, authConfig: AuthConfig) {
    this.smtpClient_ = smtpClient;
    this.dbClient_ = dbClient;
    this.logger_ = logger;
    this.authConfig_ = authConfig;
  }

  /*
  * POST /api/auth/signup
  * @username
  * @email
  * @password
  * @name
  */
  async signup(req: Request, res: Response) {
    let dbTXNClient: PoolClient;
    const {
      username, email, password, name,
    } = req.body ;

    if (username === undefined || email === undefined || password === undefined || name === undefined) {
      res.status(400).send({ message: "Body must include username, email, password, and name" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      dbTXNClient = await this.dbClient_.beginTransaction();
    } catch (err) {
      if (isError(err)) {
        this.logger_.log({
          level: "error",
          message: err.message,
        });
      }

      return res.status(500).send({ message: GENERIC_ERROR });
    }

    try {
      const userRepo = new UserRepository(dbTXNClient);
      const tokenRepo = new TokenRepository(dbTXNClient);
      
      const newUser = new User({
        password: hashedPassword,
        username,
        email,
        name,
      });
      const verificationToken = new Token({
        userId: newUser.userId,
        type: OneTimeTokenType.Verification
      });
      
      await userRepo.create(newUser);
      await tokenRepo.create(verificationToken);
      await this.sendVerificationEmail(req, newUser, verificationToken);
      await this.dbClient_.commitTransaction(dbTXNClient);
      res.status(204).send();
    } catch (err: any) {
      if (isError(err)) {
        this.logger_.log({
          level: "error",
          message: err.message,
        });
      }
      
      await this.dbClient_.rollbackTransaction(dbTXNClient);
      res.status(500).send({ message: GENERIC_ERROR });
    } 
  }

  /*
  * POST /api/auth/signin
  * @username
  * @password
  */
  async signin(req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClient_.connectionPool);

    try {
      const { username, password } = req.body;

      if (username === undefined || password === undefined) {
        res.status(400).send({ message: "Body must include a username and password" });
        return;
      }
      
      const user = await userRepo.getByUsername(username);
      if (user === null) {
        res.status(400).send({ message: LOGIN_AUTHENTICATION_ERROR });
        return;
      }

      const passwordIsValid = bcrypt.compareSync(
        password,
        user.password,
      );

      if (!passwordIsValid) {
        res.status(400).send({
          message: LOGIN_AUTHENTICATION_ERROR,
        });
        return;
      }

      const jwt = createHTTPCookie(
        user,
        this.authConfig_
      );
      res.cookie(
        HTTP_COOKIE_NAME, 
        jwt, 
        constructHTTPCookieConfig()
      );
      res.json({ jwt });
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * GET /api/auth/logout
  */

  logout(_req: Request, res: Response) {
    try {
      res.clearCookie(HTTP_COOKIE_NAME, { path: "/" }).send();
      return;
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * GET api/auth/verify/:token
  */
  async verify(req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClient_.connectionPool);
    const tokenRepo = new TokenRepository(this.dbClient_.connectionPool);

    /*
    * TODO: Remove use of userId query param. Replace with path param.
    */
    try {
      // Find a matching token
      const verificationToken = await tokenRepo.getByUserIdAndType(
        req.query.userId as string,
        OneTimeTokenType.Verification
      ); 

      if (verificationToken === null) return res.redirect("/login");

      // Find associated user
      const user = await userRepo.getByUUID(verificationToken.userId);

      if (user === null) return res.redirect("/login");

      user.verified = true;
      await userRepo.update(user);
      await tokenRepo.delete(verificationToken);

      res.redirect("/login");
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ 
        message: GENERIC_ERROR 
      });
    }
  }

  /*
  * POST api/auth/recovery
  * @email
  */
  async recovery(req: Request, res: Response) {
    let dbTXNClient: PoolClient;

    try {
      dbTXNClient = await this.dbClient_.beginTransaction();
    } catch (err) {
      if (isError(err)) {
        this.logger_.log({
          level: "error",
          message: err.message,
        });
      }

      return res.status(500).send({ 
        message: GENERIC_ERROR 
      });
    }

    try {
      const userRepo = new UserRepository(dbTXNClient);
      const tokenRepo = new TokenRepository(dbTXNClient);
      const { email } = req.body;

      if (email === undefined) {
        res.status(400).send({ message: "Body must include email" });
        return;
      }

      const user = await userRepo.getByEmail(email);
      if (user === null) {
        res.redirect("/recover/sent");
        return;
      }
      
      // Check if recovery token already exists
      const currentRecoveryToken = await tokenRepo.getByUserIdAndType(
        user.userId,
        OneTimeTokenType.Password,
      );

      if (currentRecoveryToken !== null) {
        await tokenRepo.delete(currentRecoveryToken);
      }
      
      const recoveryToken = new Token({
        userId: user.userId,
        type: OneTimeTokenType.Password
      });
      await tokenRepo.create(recoveryToken);
      await this.sendPasswordResetEmail(req, user, recoveryToken);
      await this.dbClient_.commitTransaction(dbTXNClient);
      res.redirect("/recover/sent");
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });

      await this.dbClient_.rollbackTransaction(dbTXNClient);
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * GET api/auth/recovery/verify/:token
  */
  async verifyRecovery(req: Request, res: Response) {
    const tokenRepo = new TokenRepository(this.dbClient_.connectionPool);
    /*
    * TODO: Remove use of userId query param. Replace with path param.
    */
    try {
      const recoveryToken = await tokenRepo.getByUserIdAndType(
        req.query.userId as string,
        OneTimeTokenType.Password
      ); 

      if (recoveryToken === null) {
        return res.status(500).send({ 
          message: GENERIC_ERROR 
        });
      }

      if (recoveryToken.isExpired()) {
        await tokenRepo.delete(recoveryToken);
        return res.status(500).send({ 
          message: GENERIC_ERROR 
        });
      }

      res.redirect(`/recover/${req.params.token}?userId=${req.query.userId}`);
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /* POST api/auth/recovery/:token
  * @password
  */
  async processRecovery(req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClient_.connectionPool);
    const tokenRepo = new TokenRepository(this.dbClient_.connectionPool);
    const { password } = req.body;

    if (password === undefined) {
      res.status(400).json({ message: "Body must include password" });
      return;
    }

    /*
    * TODO: Remove use of userId query param. Replace with path param.
    */
    try {
      const recoveryToken = await tokenRepo.getByUserIdAndType(
        req.query.userId as string,
        OneTimeTokenType.Password
      );
      if (recoveryToken === null) {
        return res.status(500).send({ 
          message: GENERIC_ERROR 
        });
      }

      if (recoveryToken.isExpired()) {
        await tokenRepo.delete(recoveryToken);
        return res.status(500).send({ 
          message: GENERIC_ERROR 
        });
      }

      const user = await userRepo.getByUUID(recoveryToken.userId);
      if (user === null) {
        return res.status(500).send({ 
          message: GENERIC_ERROR 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      user.password = hashedPassword;
      await userRepo.update(user);
      await tokenRepo.delete(recoveryToken);
      
      const jwt = createHTTPCookie(
        user,
        this.authConfig_
      );
      res.cookie(
        HTTP_COOKIE_NAME, 
        jwt, 
        constructHTTPCookieConfig()
      );
      res.json({ jwt });
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  sendVerificationEmail(req: Request, user: User, token: Token) {
    const link = `http://${req.headers.host}/api/auth/verify/${token.token}?userId=${user.userId}`;
    const emailOptions = {
      subject: "Account Verification Request",
      to: user.email,
      html: `
      <p>Hi ${user.username},</p>
      <p>Please visit this <a href="${link}">link</a> to verify your account.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
    };

    return this.smtpClient_.sendEmail(emailOptions);
  }

  async sendPasswordResetEmail(req: Request, user: User, token: Token) {
    const link = `http://${req.headers.host}/api/auth/recovery/verify/${token.token}?userId=${user.userId}`;
    const emailOptions = {
      subject: "Password Recovery Request",
      to: user.email,
      html: `
      <p>Hi ${user.username},</p>
      <p>Please visit this <a href="${link}">link</a> to reset your password.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
    };

    return this.smtpClient_.sendEmail(emailOptions);
  }
}

export default AuthController;