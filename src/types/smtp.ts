import { createTransport, Transport, TransportOptions } from "nodemailer";

export type NodemailerInterface = Parameters<typeof createTransport>[0];
export interface SMTPClientConfig {
  transporterConfig: TransportOptions | Transport;
  email: string;
}
