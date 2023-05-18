import bcrypt from "bcrypt";
import { Logger } from "winston";
import { Response, Request } from "express";
import TokenHandler from "@support/token-handler";
import SMTPClient from "@smtp-client";
import DBClient from "@db";
import { SessionTokenType } from "@typings/auth";
import User from "@db/models/user";
import { LOGIN_AUTHENTICATION_ERROR, GENERIC_ERROR } from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";
import { constructHTTPCookieConfig } from "@helpers/auth";
import { PoolClient } from "pg";
import { isError } from "@helpers/types";
import UserRepository from "@db/repositories/user-repository";

class AuthController {
  private smtpClient_: SMTPClient;
  private tokenHandler_: TokenHandler;
  private dbClient_: DBClient;
  private logger_: Logger;

  constructor(smtpClient: SMTPClient, tokenHandler: TokenHandler, dbClient: DBClient, logger: Logger) {
    this.smtpClient_ = smtpClient;
    this.tokenHandler_ = tokenHandler;
    this.dbClient_ = dbClient;
    this.logger_ = logger;
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

      res.status(500).send({ message: GENERIC_ERROR });
      return;
    }

    try {
      const userRepo = new UserRepository(dbTXNClient);
      const newUser = new User({
        password: hashedPassword,
        username,
        email,
        name,
      });
      await userRepo.create(newUser);
      
      let emailVerificationToken;
      while(emailVerificationToken === undefined) {
        const shortToken = this.tokenHandler_.generateShortToken();

        try {
          await this.dbClient_.objects.Token.create(newUser.userId, shortToken, SessionTokenType.Verification, dbTXNClient);
          emailVerificationToken = shortToken;
        } catch(e: any) {
          if (e.code === "23505") {
            continue;
          }

          throw new Error(`Error creating a verification token. PG error code ${e.code}`);
        }
      }

      await this.sendVerificationEmail(req, newUser, emailVerificationToken);
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

      const token = this.tokenHandler_.generateUserAuthToken(user);
      res.cookie(
        HTTP_COOKIE_NAME, 
        token, 
        constructHTTPCookieConfig()
      );
      res.json({ token });
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

    try {
      // Find a matching token
      const verifyTokenResponse = await this.dbClient_.objects.Token.findTokens({
        "token": req.params.token,
        "type": SessionTokenType.Verification
      });

      if (verifyTokenResponse.rows.length === 0) {
        res.redirect("/login");
        return;
      }

      const verifyToken = verifyTokenResponse.rows[0];
      
      // Find associated user
      const user = await userRepo.getByUUID(verifyToken.user_id);

      if (user === null) {
        res.status(500).send({ message: GENERIC_ERROR });
        return;
      }

      user.verified = true;
      await userRepo.update(user);
      await this.dbClient_.objects.Token.deleteToken(verifyToken.token);

      res.redirect("/login");
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * POST api/auth/recovery
  * @email
  */
  async recovery(req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClient_.connectionPool);

    try {
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

      await this.sendPasswordResetEmail(req, user);
      res.redirect("/recover/sent");
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * GET api/auth/recovery/verify/:token
  */
  async verifyRecovery(req: Request, res: Response) {
    try {
      const tokenResponse = await this.dbClient_.objects.Token.findTokens({
        "token": req.params.token,
        "type": SessionTokenType.Password
      });

      if (tokenResponse.rows.length === 0) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      const token = tokenResponse.rows[0];

      if (this.tokenHandler_.isPasswordTokenExpired(token)) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      res.redirect(`/recover/${req.params.token}`);
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
    const { password } = req.body;

    if (password === undefined) {
      res.status(400).json({ message: "Body must include password" });
      return;
    }

    try {
      const tokenResponse = await this.dbClient_.objects.Token.findTokens({
        "token": req.params.token,
        "type": SessionTokenType.Password
      });
      if (tokenResponse.rows.length === 0) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      const token = tokenResponse.rows[0];
      if (this.tokenHandler_.isPasswordTokenExpired(token)) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      const user = await userRepo.getByUUID(token.user_id);
      if (user === null) {
        res.status(500).send({ message: GENERIC_ERROR });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      user.password = hashedPassword;
      await userRepo.update(user);
      await this.dbClient_.objects.Token.deleteToken(req.params.token);
      
      const authToken = this.tokenHandler_.generateUserAuthToken(user);
      res.cookie(
        HTTP_COOKIE_NAME, 
        authToken, 
        constructHTTPCookieConfig()
      );
      res.send({ token: authToken });
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  sendVerificationEmail(req: Request, user: User, token: string) {
    const link = `http://${req.headers.host}/api/auth/verify/${token}`;
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

  async sendPasswordResetEmail(req: Request, user: User) {
    let resetPasswordToken: string | undefined;

    while(resetPasswordToken === undefined) {
      const shortToken = this.tokenHandler_.generateShortToken();

      try {
        await this.dbClient_.objects.Token.create(user.userId, shortToken, SessionTokenType.Password);
        resetPasswordToken = shortToken;
      } catch(e: any) {
        if (e.code === 23505) {
          continue;
        }

        throw new Error(`Error creating a verification token. PG error code ${e.code}`);
      }
    }

    const link = `http://${req.headers.host}/api/auth/recovery/verify/${resetPasswordToken}`;
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