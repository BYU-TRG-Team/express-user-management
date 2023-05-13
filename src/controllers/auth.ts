import bcrypt from "bcrypt";
import { Logger } from "winston";
import { Response, Request } from "express";
import TokenHandler from "@support/token-handler";
import SmtpService from "@services/smtp";
import DB from "@db";
import { SessionTokenType } from "@typings/auth";
import { User } from "@typings/user";
import { LOGIN_AUTHENTICATION_ERROR, GENERIC_ERROR } from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";
import { constructHTTPCookieConfig } from "@helpers/auth";

class AuthController {
  private smtpService: SmtpService;
  private tokenHandler: TokenHandler;
  private db: DB;
  private logger: Logger;

  constructor(smtpService: SmtpService, tokenHandler: TokenHandler, db: DB, logger: Logger) {
    this.smtpService = smtpService;
    this.tokenHandler = tokenHandler;
    this.db = db;
    this.logger = logger;
  }

  /*
  * POST /api/auth/signup
  * @username
  * @email
  * @password
  * @name
  */
  async signup(req: Request, res: Response) {
    let transactionInProgress = false;
    const client = await this.db.pool.connect();

    try {
      const {
        username, email, password, name,
      } = req.body ;

      if (username === undefined || email === undefined || password === undefined || name === undefined) {
        res.status(400).send({ message: "Body must include username, email, password, and name" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await client.query("BEGIN");
      transactionInProgress = true;

      const userResponse = await this.db.objects.User.create(username, email, hashedPassword, 1, name, client);
      const newUser = userResponse.rows[0];
      let emailVerificationToken;

      while(emailVerificationToken === undefined) {
        const shortToken = this.tokenHandler.generateShortToken();

        try {
          await this.db.objects.Token.create(newUser.user_id, shortToken, SessionTokenType.Verification, client);
          emailVerificationToken = shortToken;
        } catch(e: any) {
          if (e.code === "23505") {
            continue;
          }

          throw new Error(`Error creating a verification token. PG error code ${e.code}`);
        }
      }

      await this.sendVerificationEmail(req, newUser, emailVerificationToken);

      await client.query("COMMIT");
      transactionInProgress = false;

      res.status(204).send();
      return;
    } catch (err: any) {
      this.logger.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    } finally {
      if (transactionInProgress) {
        await client.query("ROLLBACK");
      }
      client.release();
    }
  }

  /*
  * POST /api/auth/signin
  * @username
  * @password
  */
  async signin(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (username === undefined || password === undefined) {
        res.status(400).send({ message: "Body must include a username and password" });
        return;
      }

      const userResponse = await this.db.objects.User.findUsers({ username });

      if (userResponse.rows.length === 0) {
        res.status(400).send({ message: LOGIN_AUTHENTICATION_ERROR });
        return;
      }

      const user = userResponse.rows[0];

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

      const token = this.tokenHandler.generateUserAuthToken(user, req);
      res.cookie(
        HTTP_COOKIE_NAME, 
        token, 
        constructHTTPCookieConfig()
      );
      res.json({ token });
    } catch (err: any) {
      this.logger.log({
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
      this.logger.log({
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
    try {
      // Find a matching token
      const verifyTokenResponse = await this.db.objects.Token.findTokens({
        "token": req.params.token,
        "type": SessionTokenType.Verification
      });

      if (verifyTokenResponse.rows.length === 0) {
        res.redirect("/login");
        return;
      }

      const verifyToken = verifyTokenResponse.rows[0];

      // Find associated user
      const userResponse = await this.db.objects.User.findUsers({
        "user_id": verifyToken.user_id
      });

      if (userResponse.rows.length === 0) {
        res.status(500).send({ message: GENERIC_ERROR });
        return;
      }
      const user = userResponse.rows[0];

      // Set user as verified
      await this.db.objects.User.setAttributes(
        user.user_id, 
        {
          "verified": true,
        });
      await this.db.objects.Token.deleteToken(verifyToken.token);

      res.redirect("/login");
    } catch (err: any) {
      this.logger.log({
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
    try {
      const { email } = req.body;

      if (email === undefined) {
        res.status(400).send({ message: "Body must include email" });
        return;
      }

      const userResponse = await this.db.objects.User.findUsers({ email });
      if (userResponse.rows.length === 0) {
        res.redirect("/recover/sent");
        return;
      }

      const user = userResponse.rows[0];
      await this.sendPasswordResetEmail(req, user);
      res.redirect("/recover/sent");
    } catch (err: any) {
      this.logger.log({
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
      const tokenResponse = await this.db.objects.Token.findTokens({
        "token": req.params.token,
        "type": SessionTokenType.Password
      });

      if (tokenResponse.rows.length === 0) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      const token = tokenResponse.rows[0];

      if (this.tokenHandler.isPasswordTokenExpired(token)) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      res.redirect(`/recover/${req.params.token}`);
    } catch (err: any) {
      this.logger.log({
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
    const { password } = req.body;

    if (password === undefined) {
      res.status(400).json({ message: "Body must include password" });
      return;
    }

    try {
      const tokenResponse = await this.db.objects.Token.findTokens({
        "token": req.params.token,
        "type": SessionTokenType.Password
      });
      if (tokenResponse.rows.length === 0) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      const token = tokenResponse.rows[0];
      if (this.tokenHandler.isPasswordTokenExpired(token)) {
        res.status(400).send({ message: GENERIC_ERROR });
        return;
      }

      const userResponse = await this.db.objects.User.findUsers({
        "user_id": token.user_id
      });
      if (userResponse.rows.length === 0) {
        res.status(500).send({ message: GENERIC_ERROR });
        return;
      }

      const user = userResponse.rows[0];

      const hashedPassword = await bcrypt.hash(password, 10);
      await this.db.objects.User.setAttributes(
        token.user_id,
        {
          "password": hashedPassword
        });
      await this.db.objects.Token.deleteToken(req.params.token);
      
      const authToken = this.tokenHandler.generateUserAuthToken(user, req);
      res.cookie(
        HTTP_COOKIE_NAME, 
        authToken, 
        constructHTTPCookieConfig()
      );
      res.send({ token: authToken });
    } catch (err: any) {
      this.logger.log({
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
      from: this.smtpService.hostAddress,
      html: `
      <p>Hi ${user.username},</p>
      <p>Please visit this <a href="${link}">link</a> to verify your account.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
    };

    return this.smtpService.sendEmail(emailOptions);
  }

  async sendPasswordResetEmail(req: Request, user: User) {
    let resetPasswordToken: string | undefined;

    while(resetPasswordToken === undefined) {
      const shortToken = this.tokenHandler.generateShortToken();

      try {
        await this.db.objects.Token.create(user.user_id, shortToken, SessionTokenType.Password);
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
      from: this.smtpService.hostAddress,
      html: `
      <p>Hi ${user.username},</p>
      <p>Please visit this <a href="${link}">link</a> to reset your password.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
    };

    return this.smtpService.sendEmail(emailOptions);
  }
}

export default AuthController;