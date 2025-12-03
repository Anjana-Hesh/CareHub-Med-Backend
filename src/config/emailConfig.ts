import * as nodemailer from 'nodemailer'; // Send email ---- (Nodemailer librarynpm install --save-dev @types/nodemailer)

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: MailOptions): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: `Care Hub Med -> <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    
    console.log('Message sent: %s', info.messageId);
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
}

// export {transporter , MailOptions}