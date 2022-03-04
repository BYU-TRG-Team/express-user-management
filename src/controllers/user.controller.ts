import bcrypt from "bcrypt";
import TokenHandler from "../support/tokenhandler.support.js";
import errorMessages from "../messages/errors.messages.js";
import { Logger } from "winston";
import DB from "db";
import { Request, Response } from "express";
import authConfig from "../config/auth.js";
import { Role } from "../types/auth.js";

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
      const isClientUser = Number(req.userId) === Number(req.params.id);
      const newAttributes: {[key: string]: string} = {};
      const superadminNewAttributes: {[key: string]: string} = {};

      Object.keys(req.body).forEach((attr) => {
        if (['username', 'email', 'name', 'password'].includes(attr)) {
          newAttributes[attr] = req.body[attr];
        }

        if (['roleId'].includes(attr)) {
          superadminNewAttributes[attr] = req.body[attr];
        }
      });

      if (newAttributes.password !== undefined) {
        newAttributes.password = await bcrypt.hash(newAttributes.password, 10);
      }

      if (
        isClientUser
        && Object.keys(newAttributes).length > 0
      ) {
        const attributes: any[] = [];
        const values: any[] = [];
        Object.keys(newAttributes).forEach((attr) => { attributes.push(attr); values.push(newAttributes[attr]); });
        await this.db.objects.User.setAttributes(attributes, values, req.userId);
      }

      // Update these attributes regardless of whether the param id is equal to the client's id
      if (
        req.role === Role.Admin
        && Object.keys(superadminNewAttributes).length > 0
      ) {
        const attributes = ['role_id'];
        const values = [superadminNewAttributes.roleId];
        await this.db.objects.User.setAttributes(attributes, values, req.params.id);
      }

      if (newAttributes.username) {
        const newToken = await this.tokenHandler.generateUpdatedUserAuthToken(req, newAttributes);
        res.cookie(authConfig.cookieName, newToken, authConfig.cookieConfig);
        res.send({ newToken });
        return;
      }

      res.status(204).send();
    } catch (err: any) {
      this.logger.log({
        level: 'error',
        message: err,
      });
      res.status(500).send({ message: errorMessages.generic });
    }
  }

  /*
  * GET /api/user/:id
  */
  async getUser(req: Request, res: Response) {
    try {
      if (Number(req.params.id) !== req.userId) {
        return res.status(400).send({ message: errorMessages.generic });
      }

      const usersQuery = await this.db.objects.User.findUsers(['user_id'], [req.params.id]);

      if (usersQuery.rows.length === 0) {
        return res.status(404).send({ message: errorMessages.notFound });
      }

      const { email, username, name } = usersQuery.rows[0];

      return res.status(200).send({
        email, username, name,
      });
    } catch (err: any) {
      this.logger.log({
        level: 'error',
        message: err,
      });
      return res.status(500).send({ message: errorMessages.generic });
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
        level: 'error',
        message: err,
      });
      return res.status(500).send({ message: errorMessages.generic });
    }
  }

  /*
  * DELETE /api/user/:id
  */
  async deleteUser(req: Request, res: Response) {
    try {
      await this.db.objects.User.deleteUser(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      this.logger.log({
        level: 'error',
        message: err,
      });
      res.status(500).send({ message: errorMessages.generic });
    }
  }
}

export default UserController;