import nodemailer from "nodemailer";
import config from "../config";

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

// Utility function to send an email
export const sendMail = async (mailOptions: MailOptions): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.mail.SMTP_HOST,
      port: config.mail.SMTP_PORT,
      secure: false, // Use TLS (set true for port 465)
      auth: {
        user: config.mail.SMTP_USER,
        pass: config.mail.SMTP_PASS,
      },
    });

    const mailData = {
      from: config.mail.FROM_EMAIL,
      ...mailOptions,
    };

    // Send the email
    await transporter.sendMail(mailData);
    console.log(`Email sent to ${mailOptions.to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// // Function to get configuration from the database or use default
// const getMailConfig = async (): Promise<{
//   host: string;
//   port: number;
//   secure: boolean;
//   auth: { user: string; pass: string };
// }> => {
//   // Mock database config fetch
//   const dbConfig = await getDatabaseConfig(); // Replace with actual DB fetch logic

//   return {
//     host: dbConfig?.SMTP_HOST || 'smtp.example.com',
//     port: dbConfig?.SMTP_PORT || 587,
//     secure: dbConfig?.SECURE || false,
//     auth: {
//       user: dbConfig?.SMTP_USER || 'your-email@example.com',
//       pass: dbConfig?.SMTP_PASS || 'your-password',
//     },
//   };
// };

// Mock database fetch function
// const getDatabaseConfig = async (): Promise<
//   Partial<{
//     SMTP_HOST: string;
//     SMTP_PORT: number;
//     SECURE: boolean;
//     SMTP_USER: string;
//     SMTP_PASS: string;
//   }>
// > => {
//   // Simulated database values
//   return {
//     SMTP_HOST: 'smtp.database.com',
//     SMTP_PORT: 465,
//     SECURE: true,
//     SMTP_USER: 'db-user@example.com',
//     SMTP_PASS: 'db-password',
//   };
// };

// Utility function to send an email
// export const sendMail = async (mailOptions: MailOptions): Promise<void> => {
//   try {
//     // Get mail configuration
//     const config = await getMailConfig();

//     // Configure the transporter
//     const transporter = nodemailer.createTransport({
//       host: config.host,
//       port: config.port,
//       secure: config.secure,
//       auth: config.auth,
//     });

//     // Prepare the mail data
//     const mailData = {
//       from: process.env.FROM_EMAIL || 'no-reply@example.com', // Sender's email address
//       ...mailOptions,
//     };

//     // Send the email
//     await transporter.sendMail(mailData);
//     console.log(`Email sent to ${mailOptions.to}`);
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw new Error('Failed to send email');
//   }
// };
