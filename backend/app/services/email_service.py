import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def _is_resend_configured() -> bool:
        return bool(settings.RESEND_API_KEY)

    @staticmethod
    def _is_smtp_configured() -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    @staticmethod
    async def _send_resend_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        import httpx
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {settings.RESEND_API_KEY.strip()}",
                "Content-Type": "application/json",
            }
            from_addr = settings.EMAILS_FROM_EMAIL.strip()
            sender = f"{settings.EMAILS_FROM_NAME} <{from_addr}>"

            payload = {
                "from": sender,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code in (200, 201):
                    logger.info(f"✅ Email successfully sent to {to_email} via Resend API (ID: {res.json().get('id')})")
                    return True
                else:
                    logger.error(f"❌ Resend API returned error {res.status_code}: {res.text}")
                    return False
        except Exception as e:
            logger.error(f"❌ Failed to dispatch email via Resend API: {e}", exc_info=True)
            return False

    @staticmethod
    async def _send_brevo_api_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        import httpx
        try:
            api_key = (settings.SMTP_PASSWORD or "").strip()
            if not api_key:
                return False
            
            from_addr = settings.SMTP_USER if (not settings.EMAILS_FROM_EMAIL or settings.EMAILS_FROM_EMAIL == "noreply@hirxora.ai") else settings.EMAILS_FROM_EMAIL
            url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            payload = {
                "sender": {
                    "name": settings.EMAILS_FROM_NAME,
                    "email": from_addr
                },
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_body,
                "textContent": text_body
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code in (200, 201, 202):
                    logger.info(f"✅ Email successfully sent to {to_email} via Brevo HTTP API (ID: {res.json().get('messageId')})")
                    return True
                else:
                    logger.warning(f"⚠️ Brevo API returned {res.status_code}: {res.text}. Trying SMTP fallback...")
                    return False
        except Exception as e:
            logger.warning(f"⚠️ Brevo API request failed: {e}. Trying SMTP fallback...")
            return False

    @staticmethod
    async def _dispatch_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        # 1. Resend API
        if settings.EMAIL_PROVIDER == "resend" or (settings.EMAIL_PROVIDER == "auto" and EmailService._is_resend_configured()):
            return await EmailService._send_resend_email(to_email, subject, html_body, text_body)

        # 2. Brevo HTTPS API (Port 443 - Bypasses Render firewall blocks on port 587)
        if "brevo" in settings.SMTP_HOST.lower() or settings.EMAIL_PROVIDER in ("brevo", "auto"):
            if settings.SMTP_PASSWORD:
                success = await EmailService._send_brevo_api_email(to_email, subject, html_body, text_body)
                if success:
                    return True

        # 3. Direct SMTP (Fallback)
        if EmailService._is_smtp_configured():
            return await EmailService._send_smtp_email(to_email, subject, html_body, text_body)

        # 4. Dev Simulation Fallback
        logger.info("=" * 60)
        logger.info(f"📧 [DEV EMAIL SIMULATION] To: {to_email} | Subject: {subject}")
        logger.info("=" * 60)
        return True

    @staticmethod
    async def send_verification_email(email: str, token: str, user_name: Optional[str] = None) -> bool:
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify Your Hirxora Account"
        name = user_name or email.split("@")[0]

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #080607; color: #FAF8F5; margin: 0; padding: 24px; }}
            .card {{ max-width: 540px; margin: 0 auto; background: #121214; border: 1px solid rgba(250,248,245,0.15); border-radius: 20px; padding: 36px; }}
            .brand {{ font-size: 22px; font-weight: bold; color: #FAF8F5; letter-spacing: -0.5px; margin-bottom: 24px; }}
            .brand span {{ color: #FF6B6B; }}
            .btn {{ display: inline-block; background: linear-gradient(135deg, #FF6B6B, #FA7268); color: #FFFFFF !important; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 9999px; margin: 24px 0; }}
            .footer {{ font-size: 11px; color: rgba(250,248,245,0.5); margin-top: 32px; border-top: 1px solid rgba(250,248,245,0.1); padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">Hirxora<span>.</span></div>
            <h2 style="margin-top:0; color:#FAF8F5; font-size:20px;">Verify your email address</h2>
            <p style="color:#E8E2D6; font-size:14px; line-height:1.6;">Hi {name},</p>
            <p style="color:#E8E2D6; font-size:14px; line-height:1.6;">Thank you for joining Hirxora. Please confirm your email address to unlock all autonomous career copilot features.</p>
            <div style="text-align: center;">
              <a href="{verify_url}" class="btn">Verify My Email</a>
            </div>
            <p style="color:rgba(250,248,245,0.6); font-size:12px; line-height:1.5;">Or copy and paste this link into your browser:<br/><a href="{verify_url}" style="color:#FF7E67; word-break:break-all;">{verify_url}</a></p>
            <div class="footer">
              If you did not sign up for Hirxora, you can safely ignore this email.
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"Hi {name},\n\nPlease verify your Hirxora account by clicking: {verify_url}\n"
        return await EmailService._dispatch_email(email, subject, html_content, text_content)

    @staticmethod
    async def send_password_reset_email(email: str, token: str) -> bool:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Reset Your Hirxora Password"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #080607; color: #FAF8F5; margin: 0; padding: 24px; }}
            .card {{ max-width: 540px; margin: 0 auto; background: #121214; border: 1px solid rgba(250,248,245,0.15); border-radius: 20px; padding: 36px; }}
            .brand {{ font-size: 22px; font-weight: bold; color: #FAF8F5; letter-spacing: -0.5px; margin-bottom: 24px; }}
            .brand span {{ color: #FF6B6B; }}
            .btn {{ display: inline-block; background: linear-gradient(135deg, #FF6B6B, #FA7268); color: #FFFFFF !important; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 9999px; margin: 24px 0; }}
            .footer {{ font-size: 11px; color: rgba(250,248,245,0.5); margin-top: 32px; border-top: 1px solid rgba(250,248,245,0.1); padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">Hirxora<span>.</span></div>
            <h2 style="margin-top:0; color:#FAF8F5; font-size:20px;">Reset Your Password</h2>
            <p style="color:#E8E2D6; font-size:14px; line-height:1.6;">We received a request to reset your Hirxora account password. Click the button below to choose a new password.</p>
            <div style="text-align: center;">
              <a href="{reset_url}" class="btn">Reset Password</a>
            </div>
            <p style="color:rgba(250,248,245,0.6); font-size:12px; line-height:1.5;">This link will expire in 1 hour.<br/>If the button does not work, visit: <br/><a href="{reset_url}" style="color:#FF7E67; word-break:break-all;">{reset_url}</a></p>
            <div class="footer">
              If you didn't request a password reset, you can safely ignore this email.
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"Reset your Hirxora password by visiting: {reset_url}\nThis link expires in 1 hour."
        return await EmailService._dispatch_email(email, subject, html_content, text_content)

    @staticmethod
    def _send_smtp_sync(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        try:
            from_addr = settings.SMTP_USER if (not settings.EMAILS_FROM_EMAIL or settings.EMAILS_FROM_EMAIL == "noreply@hirxora.ai") else settings.EMAILS_FROM_EMAIL
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{from_addr}>"
            msg["To"] = to_email

            part1 = MIMEText(text_body, "plain", "utf-8")
            part2 = MIMEText(html_body, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            if settings.SMTP_PORT == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=20) as server:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(from_addr, to_email, msg.as_string())
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                    if settings.SMTP_TLS:
                        server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(from_addr, to_email, msg.as_string())

            logger.info(f"✅ Email successfully dispatched to {to_email} via SMTP ({settings.SMTP_HOST})")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send SMTP email to {to_email}: {e}", exc_info=True)
            return False

    @staticmethod
    async def _send_smtp_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        import asyncio
        return await asyncio.to_thread(EmailService._send_smtp_sync, to_email, subject, html_body, text_body)
