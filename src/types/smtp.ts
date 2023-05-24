export enum EmailTemplate {
  Password = "password",
  Verification = "verification",
}

export type EmailTemplateLocals = {
  link: string;
  name: string;
}