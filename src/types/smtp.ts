import { createTransport } from "nodemailer";

export type NodemailerInterface = Parameters<typeof createTransport>[0];
