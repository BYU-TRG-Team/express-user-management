import Email from "@emails/email";
import SMTPClient from "@smtp-client";
import { TEST_SMTP_CONFIG } from "@tests/constants";
import { generateTestEmail } from "@tests/helpers/smtp";
import EmailRenderer from "email-templates";

let testEmail: Email;

describe("tests SMTPClient", () => {
  beforeAll(async () => {
    testEmail = await generateTestEmail();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should invoke a the sendMail nodemailer transporter method with the supplied options plus the SMTPClient's sender address", async () => {
    const smtpClient = new SMTPClient(TEST_SMTP_CONFIG);
    jest.spyOn(EmailRenderer.prototype, "send");

    await smtpClient.sendEmail(testEmail);

    expect(EmailRenderer.prototype.send).toHaveBeenCalledTimes(1);
    expect(EmailRenderer.prototype.send).toHaveBeenCalledWith({
      template: TEST_SMTP_CONFIG.emailTemplates[testEmail.template],
      message: {
        to: testEmail.recipient
      },
      locals: testEmail.locals
    });
  });
});
