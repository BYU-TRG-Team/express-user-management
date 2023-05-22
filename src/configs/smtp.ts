import { Transport, TransportOptions } from "nodemailer";

interface SMTPInfo {
  transporterConfig: TransportOptions | Transport;
  senderAddress: string;
}

class SMTPConfig {
  private transporterConfig_: TransportOptions | Transport;
  private senderAddress_: string;

  constructor(smtpInfo: SMTPInfo) {
    const {
      transporterConfig,
      senderAddress
    } = smtpInfo;

    this.transporterConfig_ = transporterConfig;
    this.senderAddress_ = senderAddress;
  }

  get transporterConfig() {
    return this.transporterConfig_;
  }

  get senderAddress() {
    return this.senderAddress_;
  }
}

export default SMTPConfig;