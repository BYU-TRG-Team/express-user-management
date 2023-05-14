import { AuthConfig } from "@typings/auth";
import { PoolConfig } from "pg";
import { SMTPClientConfig } from "@typings/smtp";
import { deepFreeze } from "@helpers";

class ConfigManager {
  public auth: AuthConfig;
  public dbClient: PoolConfig;
  public smtpClient: SMTPClientConfig;

  constructor(
    authConfig: AuthConfig,
    dbClientConfig: PoolConfig,
    smtpClientConfig: SMTPClientConfig,
  ) {
    this.auth = authConfig;
    this.dbClient = dbClientConfig;
    this.smtpClient = smtpClientConfig;
    deepFreeze(this);
  }
}

export default ConfigManager;