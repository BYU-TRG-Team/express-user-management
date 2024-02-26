"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SmtpService {
    constructor(transporter, hostAddress) {
        this.transporter = transporter;
        this.hostAddress = hostAddress;
    }
    sendEmail(mailOptions) {
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions).then((result) => resolve(result))
                .catch((error) => reject(error));
        });
    }
}
exports.default = SmtpService;
//# sourceMappingURL=smtp.js.map