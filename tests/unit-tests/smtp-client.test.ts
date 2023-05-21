import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import Mail from "nodemailer/lib/mailer";

describe("tests SMTPClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should invoke a the sendMail nodemailer transporter method with the supplied options plus the SMTPClient's sender address", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const mailOptions = {
      subject: "TEST",
      to: "FOO",
      html: "<p>BAR</p>",
    };

    jest.spyOn(Mail.prototype, "sendMail");
    await bottle.container.SMTPClient.sendEmail(mailOptions);

    expect(Mail.prototype.sendMail).toHaveBeenCalledTimes(1);
    expect(Mail.prototype.sendMail).toHaveBeenCalledWith({
      ...mailOptions,
      from: mockConstants.TEST_INIT_OPTIONS.smtpConfig.email
    });
  });
});
