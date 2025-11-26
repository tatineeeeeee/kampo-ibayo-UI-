import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    const body = await request.json();
    const { to, subject, text, html } = body;

    if (!to || !subject || (!text && !html)) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a transporter object using Gmail service (simplified approach)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER, // Still use env vars for security
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
        }
    });

    try {
        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            text, // Plain text version
            html: html || text, // HTML version
        });

        console.log('Message sent: %s', info.messageId);

        return NextResponse.json({
            message: 'Email sent successfully',
            messageId: info.messageId
        }, { status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({
            error: 'Failed to send email',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}