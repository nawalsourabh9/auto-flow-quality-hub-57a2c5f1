
interface OTPEmailTemplateProps {
  otp: string;
  expiryMinutes: number;
}

export const getOTPEmailTemplate = ({ otp, expiryMinutes }: OTPEmailTemplateProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Code</title>
        <style>
          .email-container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            letter-spacing: 4px;
            margin: 20px 0;
          }
          .info-text {
            color: #4b5563;
            line-height: 1.6;
          }
          .expiry-notice {
            color: #dc2626;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h2>Verify Your Email</h2>
          <p class="info-text">Please use the following verification code to complete your registration:</p>
          <div class="otp-code">${otp}</div>
          <p class="info-text">
            Enter this code in the verification page to confirm your email address.
          </p>
          <p class="expiry-notice">
            This code will expire in ${expiryMinutes} minutes.
          </p>
          <p class="info-text" style="margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;
};
