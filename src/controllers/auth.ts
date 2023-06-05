import bcrypt from "bcrypt";
import { Logger } from "winston";
import { Response, Request } from "express";
import SMTPClient from "@smtp-client";
import DBClientPool from "@db-client-pool";
import { OneTimeTokenType } from "@typings/auth";
import User from "@db/models/user";
import { LOGIN_AUTHENTICATION_ERROR, GENERIC_ERROR } from "@constants/errors";
import { constructHTTPCookieConfig, createHTTPCookie } from "@helpers/auth";
import { PoolClient } from "pg";
import { isError } from "@helpers/types";
import UserRepository from "@db/repositories/user";
import TokenRepository from "@db/repositories/token";
import Token from "@db/models/token";
import AuthConfig from "@configs/auth";
import VerificationEmail from "@emails/verification";
import PasswordResetEmail from "@emails/password-reset";

class AuthController {
  private smtpClient_: SMTPClient;
  private dbClientPool_: DBClientPool;
  private logger_: Logger;
  private authConfig_: AuthConfig;

  constructor(smtpClient: SMTPClient, dbClientPool: DBClientPool, logger: Logger, authConfig: AuthConfig) {
    this.smtpClient_ = smtpClient;
    this.dbClientPool_ = dbClientPool;
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
      dbTXNClient = await this.dbClientPool_.beginTransaction();
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

      const verificationEmail = new VerificationEmail({
        req,
        user: newUser,
        token: verificationToken
      });
      await this.smtpClient_.sendEmail(verificationEmail);
      await this.dbClientPool_.commitTransaction(dbTXNClient);
      res.status(204).send();
    } catch (err: any) {
      if (isError(err)) {
        this.logger_.log({
          level: "error",
          message: err.message,
        });
      }
      
      await this.dbClientPool_.rollbackTransaction(dbTXNClient);
      res.status(500).send({ message: GENERIC_ERROR });
    } 
  }

  /*
  * POST /api/auth/signin
  * @username
  * @password
  */
  async signin(req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClientPool_.connectionPool);

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
        this.authConfig_.httpCookieName, 
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
      res.clearCookie(this.authConfig_.httpCookieName, { path: "/" }).send();
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
    const userRepo = new UserRepository(this.dbClientPool_.connectionPool);
    const tokenRepo = new TokenRepository(this.dbClientPool_.connectionPool);

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
      dbTXNClient = await this.dbClientPool_.beginTransaction();
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

      const passwordResetEmail = new PasswordResetEmail({
        req,
        user,
        token: recoveryToken
      });
      await this.smtpClient_.sendEmail(passwordResetEmail);
      await this.dbClientPool_.commitTransaction(dbTXNClient);
      res.redirect("/recover/sent");
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });

      await this.dbClientPool_.rollbackTransaction(dbTXNClient);
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * GET api/auth/recovery/verify/:token
  */
  async verifyRecovery(req: Request, res: Response) {
    const tokenRepo = new TokenRepository(this.dbClientPool_.connectionPool);
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
    const userRepo = new UserRepository(this.dbClientPool_.connectionPool);
    const tokenRepo = new TokenRepository(this.dbClientPool_.connectionPool);
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
        this.authConfig_.httpCookieName, 
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
}

export default AuthController;