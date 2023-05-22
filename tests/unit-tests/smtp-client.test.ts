import Email from "@emails/email";
import SMTPClient from "@smtp-client";
import { TEST_SMTP_CONFIG } from "@tests/constants";
import { generateTestEmail } from "@tests/helpers/smtp";
import Mail from "nodemailer/lib/mailer";

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
    jest.spyOn(Mail.prototype, "sendMail");

    smtpClient.sendEmail(testEmail);

    expect(Mail.prototype.sendMail).toHaveBeenCalledTimes(1);
    expect(Mail.prototype.sendMail).toHaveBeenCalledWith({
      ...testEmail.mailOptions,
      from: TEST_SMTP_CONFIG.senderAddress
    });
  });
});
