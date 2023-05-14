import { AuthConfig } from "@typings/auth";
import { PoolConfig } from "pg";
import { SMTPClientConfig } from "@typings/smtp";

class ConfigManager {
  public authConfig: AuthConfig;
  public dbClientConfig: PoolConfig;
  public smtpClientConfig: SMTPClientConfig;

  constructor(
    authConfig: AuthConfig,
    dbClientConfig: PoolConfig,
    smtpClientConfig: SMTPClientConfig,
  ) {
    this.authConfig = Object.freeze(authConfig);
    this.dbClientConfig = Object.freeze(dbClientConfig);
    this.smtpClientConfig = Object.freeze(smtpClientConfig);
  }
}

export default ConfigManager;