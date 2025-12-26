import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false, // prevents cert errors
            },
        });

        const mailOptions = {
            from: `${process.env.CMS_NAME || 'Support Team'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        // Development / mock mode
        if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
            console.log('📧 [MOCK EMAIL]');
            console.log(mailOptions);
            if (!process.env.EMAIL_USER) return;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);

    } catch (error) {
        console.error('Email send error:', error);
        throw error; // re-throw so your API can handle it
    }
};

export default sendEmail;
