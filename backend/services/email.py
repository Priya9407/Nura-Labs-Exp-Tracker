import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.settings import Config

class EmailService:
    def __init__(self):
        self.host = Config.SMTP_HOST
        self.port = Config.SMTP_PORT
        self.email = Config.SMTP_EMAIL
        self.password = Config.SMTP_PASSWORD
        self.frontend_url = Config.FRONTEND_URL

    def _send_email(self, to_email, subject, html_content, text_content):
        """Send email using SMTP."""
        if not self.email or not self.password:
            print(f"[EMAIL] Email not configured. Would send to {to_email}:")
            print(f"  Subject: {subject}")
            print(f"  HTML: {html_content[:200]}...")
            return True  # Simulate success in dev

        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=context)
                server.login(self.email, self.password)

                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = self.email
                msg['To'] = to_email

                msg.attach(MIMEText(text_content, 'plain'))
                msg.attach(MIMEText(html_content, 'html'))

                server.sendmail(self.email, to_email, msg.as_string())
                return True
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send email: {e}")
            return False

    def send_invitation(self, to_email, name, token):
        """Send invitation email to new user."""
        activation_link = f"{self.frontend_url}/activate.html?token={token}"

        subject = "Welcome to Experiment Platform - Activate Your Account"

        text_content = f"""
Hello {name},

You've been invited to join the Experiment Platform.

Click the link below to activate your account:
{activation_link}

This link will expire in 7 days.

If you did not expect this invitation, please ignore this email.

Best regards,
The Experiment Platform Team
        """

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #1a1a2e; color: #fff; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #16213e; padding: 40px; border-radius: 12px; }}
        h1 {{ color: #fff; font-size: 24px; margin-bottom: 20px; }}
        p {{ color: #a0a0a0; line-height: 1.6; margin-bottom: 20px; }}
        .button {{ display: inline-block; padding: 14px 28px; background: #0f3460; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500; }}
        .button:hover {{ background: #1a4a7a; }}
        .link {{ color: #4a9eff; text-decoration: none; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2a4a; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Experiment Platform</h1>
        <p>Hello {name},</p>
        <p>You've been invited to join the Experiment Platform. Click the button below to activate your account:</p>
        <p><a href="{activation_link}" class="button">Activate Account</a></p>
        <p>Or copy and paste this link:</p>
        <p><a href="{activation_link}" class="link">{activation_link}</a></p>
        <p style="color: #ff6b6b;">This link will expire in 7 days.</p>
        <div class="footer">
            If you did not expect this invitation, please ignore this email.
        </div>
    </div>
</body>
</html>
        """

        return self._send_email(to_email, subject, html_content, text_content)

    def send_password_reset(self, to_email, name, token):
        """Send password reset email."""
        reset_link = f"{self.frontend_url}/reset-password.html?token={token}"

        subject = "Password Reset Request"

        text_content = f"""
Hello {name},

You requested a password reset for your Experiment Platform account.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you did not request this, please ignore this email.

Best regards,
The Experiment Platform Team
        """

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #1a1a2e; color: #fff; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #16213e; padding: 40px; border-radius: 12px; }}
        h1 {{ color: #fff; font-size: 24px; margin-bottom: 20px; }}
        p {{ color: #a0a0a0; line-height: 1.6; margin-bottom: 20px; }}
        .button {{ display: inline-block; padding: 14px 28px; background: #0f3460; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500; }}
        .button:hover {{ background: #1a4a7a; }}
        .link {{ color: #4a9eff; text-decoration: none; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2a4a; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Password Reset</h1>
        <p>Hello {name},</p>
        <p>You requested a password reset for your Experiment Platform account:</p>
        <p><a href="{reset_link}" class="button">Reset Password</a></p>
        <p>Or copy and paste this link:</p>
        <p><a href="{reset_link}" class="link">{reset_link}</a></p>
        <p style="color: #ff6b6b;">This link will expire in 1 hour.</p>
        <div class="footer">
            If you did not request this, please ignore this email.
        </div>
    </div>
</body>
</html>
        """

        return self._send_email(to_email, subject, html_content, text_content)

# Singleton instance
email_service = EmailService()
