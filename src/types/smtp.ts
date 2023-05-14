import { Transport, TransportOptions } from "nodemailer";

export interface SMTPClientConfig {
  transporterConfig: TransportOptions | Transport;
  email: string;
}
