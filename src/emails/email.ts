import { EmailTemplate, EmailTemplateLocals } from "@typings/smtp";

abstract class Email {
  abstract get template(): EmailTemplate;
  abstract get recipient(): string;
  abstract get locals(): EmailTemplateLocals
}

export default Email;