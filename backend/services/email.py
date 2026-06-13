import smtplib
import ssl
import secrets
import string
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
        """Send email using SMTP (Simulated)."""
        print(f"[EMAIL] Email sending disabled. Would send to {to_email}:")
        print(f"  Subject: {subject}")
        print(f"  HTML: {html_content[:200]}...")
        return True  # Always simulate success

    def generate_temp_password(self):
        """Generate random 8-character password."""
        # Mix of uppercase, lowercase, and digits
        chars = string.ascii_letters + string.digits
        return ''.join(secrets.choice(chars) for _ in range(8))

    def send_invitation(self, to_email, name, temp_password):
        """Send invitation email with temporary password only."""

        subject = "Welcome to Nura AI Labs - Your Account Invitation"

        text_content = f"""
Hello {name},

You've been invited to join Nura AI Labs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: {to_email}
Password: {temp_password}

Login URL: {self.frontend_url}/login.html

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After your first login, you can change your password from your Profile page.

If you did not expect this invitation, please ignore this email.

Best regards,
Nura AI Labs Team
        """

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #F8FAFC; color: #1E293B; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 40px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
        .logo {{ text-align: center; margin-bottom: 30px; }}
        h1 {{ color: #1E293B; font-size: 24px; margin-bottom: 10px; font-weight: 600; }}
        .subtitle {{ color: #64748B; font-size: 16px; margin-bottom: 30px; }}
        .credentials-box {{ background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 12px; padding: 24px; margin: 20px 0; }}
        .credentials-title {{ font-weight: 600; color: #3B82F6; margin-bottom: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .credentials {{ background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; }}
        .credential-row {{ display: flex; margin-bottom: 8px; font-size: 14px; }}
        .credential-row:last-child {{ margin-bottom: 0; }}
        .label {{ color: #64748B; min-width: 70px; font-weight: 500; }}
        .value {{ color: #1E293B; font-weight: 600; font-family: monospace; }}
        .password {{ color: #059669; font-size: 18px; font-weight: 700; letter-spacing: 2px; }}
        p {{ color: #475569; line-height: 1.6; margin-bottom: 16px; font-size: 14px; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 8px 0; }}
        .button:hover {{ background: #2563EB; }}
        .note {{ color: #64748B; font-size: 13px; margin-top: 16px; background: #F1F5F9; padding: 12px; border-radius: 8px; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; color: #94A3B8; font-size: 12px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#3B82F6"/>
                <path d="M24 12C24 12 14 18 14 28C14 32.4183 17.5817 36 22 36H26C30.4183 36 34 32.4183 34 28C34 18 24 12 24 12Z" stroke="white" stroke-width="2" fill="none"/>
                <circle cx="24" cy="26" r="4" fill="white"/>
                <path d="M20 20H28" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <h1>Welcome to Nura AI Labs</h1>
        <p class="subtitle">You've been invited to join our experiment platform.</p>

        <div class="credentials-box">
            <div class="credentials-title">🔐 Your Login Credentials</div>
            <div class="credentials">
                <div class="credential-row">
                    <span class="label">Email:</span>
                    <span class="value">{to_email}</span>
                </div>
                <div class="credential-row">
                    <span class="label">Password:</span>
                    <span class="value password">{temp_password}</span>
                </div>
            </div>
            <p style="text-align: center; margin-top: 16px;">
                <a href="{self.frontend_url}/login.html" class="button">Login Now</a>
            </p>
        </div>

        <div class="note">
            💡 After your first login, you can change your password from your Profile page.
        </div>

        <div class="footer">
            If you did not expect this invitation, please ignore this email.<br>
            Nura AI Labs &copy; 2025
        </div>
    </div>
</body>
</html>
        """

        return self._send_email(to_email, subject, html_content, text_content), temp_password

    def send_password_reset(self, to_email, name, temp_password):
        """Send password reset email with temporary password."""
        subject = "Your New Password - Nura AI Labs"

        text_content = f"""
Hello {name},

You requested a password reset for your Nura AI Labs account.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR NEW PASSWORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: {to_email}
Password: {temp_password}

Login URL: {self.frontend_url}/login.html

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use this password to login. You can change it from your Profile page.

If you did not request this, please ignore this email.

Best regards,
Nura AI Labs Team
        """

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #F8FAFC; color: #1E293B; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 40px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
        .logo {{ text-align: center; margin-bottom: 30px; }}
        h1 {{ color: #1E293B; font-size: 24px; margin-bottom: 10px; font-weight: 600; }}
        .subtitle {{ color: #64748B; font-size: 16px; margin-bottom: 30px; }}
        .credentials-box {{ background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 12px; padding: 24px; margin: 20px 0; }}
        .credentials-title {{ font-weight: 600; color: #3B82F6; margin-bottom: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .credentials {{ background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; }}
        .credential-row {{ display: flex; margin-bottom: 8px; font-size: 14px; }}
        .credential-row:last-child {{ margin-bottom: 0; }}
        .label {{ color: #64748B; min-width: 70px; font-weight: 500; }}
        .value {{ color: #1E293B; font-weight: 600; font-family: monospace; }}
        .password {{ color: #059669; font-size: 18px; font-weight: 700; letter-spacing: 2px; }}
        p {{ color: #475569; line-height: 1.6; margin-bottom: 16px; font-size: 14px; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 8px 0; }}
        .button:hover {{ background: #2563EB; }}
        .note {{ color: #64748B; font-size: 13px; margin-top: 16px; background: #F1F5F9; padding: 12px; border-radius: 8px; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; color: #94A3B8; font-size: 12px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#3B82F6"/>
                <path d="M24 12C24 12 14 18 14 28C14 32.4183 17.5817 36 22 36H26C30.4183 36 34 32.4183 34 28C34 18 24 12 24 12Z" stroke="white" stroke-width="2" fill="none"/>
                <circle cx="24" cy="26" r="4" fill="white"/>
                <path d="M20 20H28" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <h1>Password Reset</h1>
        <p class="subtitle">You requested a password reset for your account.</p>

        <div class="credentials-box">
            <div class="credentials-title">🔐 Your New Password</div>
            <div class="credentials">
                <div class="credential-row">
                    <span class="label">Email:</span>
                    <span class="value">{to_email}</span>
                </div>
                <div class="credential-row">
                    <span class="label">Password:</span>
                    <span class="value password">{temp_password}</span>
                </div>
            </div>
            <p style="text-align: center; margin-top: 16px;">
                <a href="{self.frontend_url}/login.html" class="button">Login Now</a>
            </p>
        </div>

        <div class="note">
            💡 After logging in, you can change your password from your Profile page.
        </div>

        <div class="footer">
            If you did not request this, please ignore this email.<br>
            Nura AI Labs &copy; 2025
        </div>
    </div>
</body>
</html>
        """

        return self._send_email(to_email, subject, html_content, text_content)

# Singleton instance
email_service = EmailService()
