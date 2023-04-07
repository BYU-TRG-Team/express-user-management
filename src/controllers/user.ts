import bcrypt from "bcrypt";
import { Logger } from "winston";
import { Request, Response } from "express";
import TokenHandler from "@support/token-handler";
import * as errorMessages from "@constants/errors/messages";
import DB from "@db";
import * as cookieConfig from "@constants/http/cookie";
import { Role } from "@typings/auth";

class UserController {
  private logger: Logger;
  private db: DB;
  private tokenHandler: TokenHandler;

  constructor(tokenHandler: TokenHandler, logger: Logger, db: DB) {
    this.tokenHandler = tokenHandler;
    this.logger = logger;
    this.db = db;
  }

  /*
  * PATCH /api/user/:id
  * @username (optional)
  * @email (optional)
  * @name (optional)
  * @password (optional)
  * @roleId (optional)
  */
  async updateUser(req: Request, res: Response) {
    try {
      const isClientUser = req.userId === req.params.id;
      const newAttributes: {[key: string]: string} = {};
      const newAdminAttributes: {[key: string]: string} = {};

      Object.keys(req.body).forEach((attr) => {
        if (["username", "email", "name", "password"].includes(attr)) {
          newAttributes[attr] = req.body[attr];
        }

        if (["roleId"].includes(attr)) {
          newAdminAttributes["role_id"] = req.body[attr];
        }
      });

      if (newAttributes.password !== undefined) {
        newAttributes.password = await bcrypt.hash(newAttributes.password, 10);
      }

      if (
        isClientUser
        && Object.keys(newAttributes).length > 0
      ) {
        await this.db.objects.User.setAttributes(req.params.id, newAttributes);
      }

      // Update these attributes regardless of whether the param id is equal to the client's id
      if (
        req.role === Role.Admin
        && Object.keys(newAdminAttributes).length > 0
      ) {
        await this.db.objects.User.setAttributes(req.params.id, newAdminAttributes);
      }

      if (newAttributes.username) {
        const newToken = await this.tokenHandler.generateUpdatedUserAuthToken(req, newAttributes);
        res.cookie(
          cookieConfig.NAME, 
          newToken, 
          cookieConfig.OPTIONS(Date.now())
        );
        res.send({ newToken });
        return;
      }

      res.status(204).send();
    } catch (err: any) {
      this.logger.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: errorMessages.GENERIC });
    }
  }

  /*
  * GET /api/user/:id
  */
  async getUser(req: Request, res: Response) {
    try {
      if (req.params.id !== req.userId) {
        return res.status(400).send({ message: errorMessages.GENERIC });
      }

      const usersQuery = await this.db.objects.User.findUsers({
        "user_id": req.params.id,
      });

      if (usersQuery.rows.length === 0) {
        return res.status(404).send({ message: errorMessages.RESOURCE_NOT_FOUND });
      }

      const { email, username, name } = usersQuery.rows[0];

      return res.status(200).send({
        email, username, name,
      });
    } catch (err: any) {
      this.logger.log({
        level: "error",
        message: err,
      });
      return res.status(500).send({ message: errorMessages.GENERIC });
    }
  }

  /*
  * GET /api/users
  */
  async getUsers(req: Request, res: Response) {
    try {
      const usersQuery = await this.db.objects.User.getAllUsers();
      return res.json({ users: usersQuery.rows });
    } catch (err: any) {
      this.logger.log({
        level: "error",
        message: err,
      });
      return res.status(500).send({ message: errorMessages.GENERIC });
    }
  }

  /*
  * DELETE /api/user/:id
  */
  async deleteUser(req: Request, res: Response) {
    try {
      await this.db.objects.User.deleteUser(req.params.id);
      res.status(204).send();
    } catch (err: any) {
      this.logger.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: errorMessages.GENERIC });
    }
  }
}

export default UserController;