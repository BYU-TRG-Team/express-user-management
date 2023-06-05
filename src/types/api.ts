import { Request } from "express";

export interface SignUpRequest extends Request {
  body: {
    username: string;
    password: string;
    email: string;
    name: string;
  }
}