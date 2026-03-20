import nodemailer from 'nodemailer';
import config from '../config/config.js';

const auth = config.GOOGLE_APP_PASSWORD
    ? {
        user: config.GOOGLE_USER,
        pass: config.GOOGLE_APP_PASSWORD
    }
    : {
        type: 'OAuth2',
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN
    };

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth
});

transporter.verify((error) => {
        if (error) {
            console.log('Error setting up transporter:', error.message);
        } else {
            console.log(`Transporter is ready (${config.GOOGLE_APP_PASSWORD ? "App Password" : "OAuth2"})`);
        }
});

export const sendEmail = async (to, subject, text, html) => {
    const info = await transporter.sendMail({
        from: config.GOOGLE_USER,
        to,
        subject,
        text,
        html
    });
    console.log('Email sent successfully:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return info;
}
