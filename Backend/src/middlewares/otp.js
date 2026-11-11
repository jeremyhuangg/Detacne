import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smptp-mail.outlook.com",
    auth: {
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
    },
});

export default transporter;