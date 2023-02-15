const nodemailer = jest.createMockFromModule("nodemailer") as any;

nodemailer.createTransport = () => ({
  sendMail: () => new Promise<void>((resolve) => resolve())
});

export default nodemailer;