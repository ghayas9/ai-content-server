// src/templates/emails/password-reset-request.ts
/**
 * Email template for the initial password reset request with OTP
 */
export const passwordResetRequestTemplate = (
  userName: string,
  otp: string,
  expiryMinutes: number = 10,
) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eeeeee;
      }
      .logo {
        max-height: 60px;
      }
      h1 {
        color: #2c3e50;
        font-size: 24px;
        margin-bottom: 20px;
      }
      .otp-container {
        background-color: #f7f9fc;
        padding: 15px;
        text-align: center;
        margin: 25px 0;
        border-radius: 4px;
        border-left: 4px solid #3498db;
      }
      .otp-code {
        font-family: 'Courier New', monospace;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 5px;
        color: #3498db;
      }
      .info {
        padding: 15px 0;
      }
      .footer {
        text-align: center;
        color: #7f8c8d;
        font-size: 12px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eeeeee;
      }
      .button {
        display: inline-block;
        background-color: #3498db;
        color: white;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 4px;
        margin-top: 15px;
      }
      .warning {
        color: #e74c3c;
        font-size: 14px;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://yourdomain.com/logo.png" alt="Your Company Logo" class="logo">
      </div>
      
      <h1>Password Reset Request</h1>
      
      <p>Hello ${userName},</p>
      
      <p>We received a request to reset your password. Please use the verification code below to complete the password reset process:</p>
      
      <div class="otp-container">
        <div class="otp-code">${otp}</div>
      </div>
      
      <div class="info">
        <p>This code will expire in <strong>${expiryMinutes} minutes</strong>.</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
      </div>
      
      <p class="warning">Never share this code with anyone, including our own staff. Our team will never ask for your verification code.</p>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        <p>123 Main Street, City, Country</p>
      </div>
    </div>
  </body>
  </html>
    `;
};

// src/templates/emails/password-reset-success.ts
/**
 * Email template for successful password reset confirmation
 */
export const passwordResetSuccessTemplate = (
  userName: string,
  resetTime: string = new Date().toLocaleString(),
) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eeeeee;
      }
      .logo {
        max-height: 60px;
      }
      h1 {
        color: #2c3e50;
        font-size: 24px;
        margin-bottom: 20px;
      }
      .success-icon {
        text-align: center;
        margin: 25px 0;
        font-size: 48px;
        color: #2ecc71;
      }
      .info {
        padding: 15px 0;
      }
      .details {
        background-color: #f7f9fc;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        color: #7f8c8d;
        font-size: 12px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eeeeee;
      }
      .button {
        display: inline-block;
        background-color: #3498db;
        color: white;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 4px;
        margin-top: 15px;
      }
      .warning {
        color: #e74c3c;
        font-size: 14px;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://yourdomain.com/logo.png" alt="Your Company Logo" class="logo">
      </div>
      
      <h1>Password Reset Successful</h1>
      
      <div class="success-icon">✓</div>
      
      <p>Hello ${userName},</p>
      
      <p>Your password has been successfully reset.</p>
      
      <div class="details">
        <p><strong>Time of reset:</strong> ${resetTime}</p>
      </div>
      
      <div class="info">
        <p>You can now log in to your account using your new password.</p>
        <p>If you did not make this change or if you believe an unauthorized person has accessed your account, please contact our support team immediately.</p>
      </div>
      
      <center>
        <a href="https://yourdomain.com/login" class="button">Go to Login</a>
      </center>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        <p>123 Main Street, City, Country</p>
      </div>
    </div>
  </body>
  </html>
    `;
};

// src/templates/emails/suspicious-activity.ts
/**
 * Email template for suspicious activity notification
 * (sent when there are multiple failed reset attempts)
 */
export const suspiciousActivityTemplate = (
  userName: string,
  activityTime: string = new Date().toLocaleString(),
  ipAddress: string = "Unknown",
  location: string = "Unknown",
) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert - Suspicious Activity</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eeeeee;
      }
      .logo {
        max-height: 60px;
      }
      h1 {
        color: #e74c3c;
        font-size: 24px;
        margin-bottom: 20px;
      }
      .alert-icon {
        text-align: center;
        margin: 25px 0;
        font-size: 48px;
        color: #e74c3c;
      }
      .info {
        padding: 15px 0;
      }
      .details {
        background-color: #f7f9fc;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
        border-left: 4px solid #e74c3c;
      }
      .footer {
        text-align: center;
        color: #7f8c8d;
        font-size: 12px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eeeeee;
      }
      .button {
        display: inline-block;
        background-color: #e74c3c;
        color: white;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 4px;
        margin-top: 15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://yourdomain.com/logo.png" alt="Your Company Logo" class="logo">
      </div>
      
      <h1>Security Alert: Suspicious Activity</h1>
      
      <div class="alert-icon">⚠️</div>
      
      <p>Hello ${userName},</p>
      
      <p>We've detected suspicious activity on your account related to password reset attempts.</p>
      
      <div class="details">
        <p><strong>Time:</strong> ${activityTime}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Activity:</strong> Multiple failed password reset attempts</p>
      </div>
      
      <div class="info">
        <p>If this was you, you can ignore this email. If you suspect unauthorized access, we recommend taking the following actions:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Enable two-factor authentication if available</li>
          <li>Review your account activity</li>
          <li>Contact our support team</li>
        </ol>
      </div>
      
      <center>
        <a href="https://yourdomain.com/account/security" class="button">Secure Your Account</a>
      </center>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        <p>123 Main Street, City, Country</p>
      </div>
    </div>
  </body>
  </html>
    `;
};
