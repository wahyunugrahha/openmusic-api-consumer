const nodemailer = require("nodemailer");

class MailSender {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    this._from = process.env.SMTP_USER;
  }

  async sendExportEmail(to, playlistId, exportJson) {
    const filename = `playlist-${playlistId}.json`;
    const jsonString = JSON.stringify(exportJson, null, 2);

    const info = await this._transporter.sendMail({
      from: this._from,
      to,
      subject: `Ekspor Playlist ${playlistId}`,
      text: ["Berikut hasil ekspor playlist Anda."].join("\n"),
      attachments: [
        {
          filename,
          content: jsonString,
          contentType: "application/json",
        },
      ],
    });

    return info;
  }
}

module.exports = MailSender;
