import bcrypt from "bcrypt";
import { Logger } from "winston";
import { Request, Response } from "express";
import DB from "@db-client";
import { Role } from "@typings/auth";
import { RESOURCE_NOT_FOUND_ERROR, GENERIC_ERROR, AUTHORIZATION_ERROR } from "@constants/errors";
import { constructHTTPCookieConfig, createHTTPCookie } from "@helpers/auth";
import UserRepository from "@db/repositories/user-repository";
import AuthConfig from "@configs/auth";

class UserController {
  private logger_: Logger;
  private dbClient_: DB;
  private authConfig_: AuthConfig;

  constructor(logger: Logger, db: DB, authConfig:  AuthConfig) {
    this.logger_ = logger;
    this.dbClient_ = db;
    this.authConfig_ = authConfig;
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
    const userRepo = new UserRepository(this.dbClient_.connectionPool);
    
    if (
      req.role !== Role.Admin &&
      req.userId !== req.params.id
    ) {
      return res.status(403).send({
        message: AUTHORIZATION_ERROR,
      });
    }
    
    try {
      const user = await userRepo.getByUUID(req.params.id);

      if (user === null) {
        return res.status(404).send({ message: RESOURCE_NOT_FOUND_ERROR });
      }

      for (const attr of Object.keys(req.body)) {
        const value = req.body[attr];
        switch(attr) {
        case "roleId":
          if (req.role === Role.Admin ) {
            user.roleId = value;
          }
          break;

        case "username":
          user.username = value;
          break;

        case "email":
          user.email = value;
          break;
            
        case "name":
          user.name = value;
          break;

        case "password":
          user.password = await bcrypt.hash(value, 10);
          break;
            
        default: 
        }
      }

      await userRepo.update(user);

      const jwt = createHTTPCookie(
        user,
        this.authConfig_
      );
      res.cookie(
        this.authConfig_.httpCookieName, 
        jwt, 
        constructHTTPCookieConfig()
      );
      return res.send({ jwt });
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * GET /api/user/:id
  */
  async getUser(req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClient_.connectionPool);

    try {
      if (
        req.role !== Role.Admin &&
        req.userId !== req.params.id
      ) {
        return res.status(403).send({
          message: AUTHORIZATION_ERROR,
        });
      }
      
      const user = await userRepo.getByUUID(req.params.id);

      if (user === null) {
        return res.status(404).send({ 
          message: RESOURCE_NOT_FOUND_ERROR 
        });
      }

      const { 
        email, 
        username,
        name 
      } = user;

      return res.status(200).send({
        email, username, name,
      });
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      return res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * GET /api/users
  */
  async getUsers(_req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClient_.connectionPool);

    try {
      const users = await userRepo.getAll();
      return res.json({ users });
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      return res.status(500).send({ message: GENERIC_ERROR });
    }
  }

  /*
  * DELETE /api/user/:id
  */
  async deleteUser(req: Request, res: Response) {
    const userRepo = new UserRepository(this.dbClient_.connectionPool);

    try {
      const user = await userRepo.getByUUID(req.params.id);

      if (user !== null) {
        await userRepo.delete(user);
      }

      res.status(204).send();
    } catch (err: any) {
      this.logger_.log({
        level: "error",
        message: err,
      });
      res.status(500).send({ message: GENERIC_ERROR });
    }
  }
}

export default UserController;