"""
Email Notification Service
==========================
Send email alerts for disease detection and other events.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.config import (
    FRONTEND_URL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM,
    SMTP_USE_TLS,
)

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    plain_body: Optional[str] = None,
) -> bool:
    """
    Send an email using SMTP.

    Args:
        to_email:   Recipient email address.
        subject:    Email subject line.
        html_body:  HTML content of the email.
        plain_body: Optional plain text fallback.

    Returns:
        True if sent successfully, False otherwise.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping email send")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg["Subject"] = subject

        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_disease_alert(
    to_email: str,
    user_name: str,
    disease_name: str,
    confidence: float,
    anomaly_type: str,
    record_id: str,
) -> bool:
    """
    Send a disease detection alert email.

    Args:
        to_email:     Recipient email.
        user_name:    Name of the user.
        disease_name: Detected disease.
        confidence:   Prediction confidence %.
        anomaly_type: Type of anomaly detected.
        record_id:    Prediction record ID.

    Returns:
        True if sent successfully.
    """
    subject = f"Leaf Anomaly Alert: {disease_name} Detected ({confidence}%)"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 20px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 20px; }}
            .alert-box {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 15px 0; }}
            .alert-box.warning {{ background: #fffbeb; border-color: #fed7aa; }}
            .alert-box.danger {{ background: #fef2f2; border-color: #fecaca; }}
            .stat {{ display: inline-block; margin: 10px 15px 10px 0; }}
            .stat-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
            .stat-value {{ font-size: 18px; font-weight: bold; color: #16a34a; }}
            .stat-value.danger {{ color: #dc2626; }}
            .btn {{ display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }}
            .footer {{ background: #f9fafb; padding: 15px 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌿 Leaf Anomaly Detection</h1>
            </div>
            <div class="content">
                <p>Hello {user_name},</p>
                <p>A <strong>disease has been detected</strong> in one of your leaf scans.</p>

                <div class="alert-box danger">
                    <div class="stat">
                        <div class="stat-label">Disease</div>
                        <div class="stat-value danger">{disease_name}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Confidence</div>
                        <div class="stat-value">{confidence}%</div>
                    </div>
                </div>

                <p><strong>Recommended Action:</strong></p>
                <ul>
                    <li>Isolate affected plants if possible</li>
                    <li>Check for signs of spread to nearby plants</li>
                    <li>Review treatment recommendations in the app</li>
                </ul>

                <a href="{FRONTEND_URL}/history" class="btn">View Details</a>
            </div>
            <div class="footer">
                <p>This is an automated alert from Leaf Anomaly Detection System.</p>
                <p>To disable these alerts, update your notification settings in the app.</p>
            </div>
        </div>
    </body>
    </html>
    """

    plain_body = f"""
    Leaf Anomaly Detection Alert

    Hello {user_name},

    A disease has been detected in one of your leaf scans.

    Disease: {disease_name}
    Confidence: {confidence}%

    Recommended Action:
    - Isolate affected plants if possible
    - Check for signs of spread to nearby plants
    - Review treatment recommendations in the app

    View details at: {FRONTEND_URL}/history
    """

    return send_email(to_email, subject, html_body, plain_body)


def send_weekly_report(
    to_email: str,
    user_name: str,
    total_scans: int,
    healthy_count: int,
    diseased_count: int,
    top_disease: str,
) -> bool:
    """Send a weekly summary report email."""
    subject = f"Weekly Leaf Health Report - {total_scans} scans completed"

    healthy_pct = round((healthy_count / total_scans * 100), 1) if total_scans > 0 else 0

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .stats-grid {{ display: flex; justify-content: space-around; margin: 20px 0; text-align: center; }}
            .stat-box {{ padding: 15px; }}
            .stat-num {{ font-size: 28px; font-weight: bold; color: #16a34a; }}
            .stat-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
            .footer {{ background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>Weekly Leaf Health Report</h1></div>
            <div class="content">
                <p>Hello {user_name},</p>
                <p>Here's your weekly summary:</p>
                <div class="stats-grid">
                    <div class="stat-box"><div class="stat-num">{total_scans}</div><div class="stat-label">Total Scans</div></div>
                    <div class="stat-box"><div class="stat-num" style="color:#16a34a">{healthy_count}</div><div class="stat-label">Healthy</div></div>
                    <div class="stat-box"><div class="stat-num" style="color:#dc2626">{diseased_count}</div><div class="stat-label">Diseased</div></div>
                    <div class="stat-box"><div class="stat-num">{healthy_pct}%</div><div class="stat-label">Health Rate</div></div>
                </div>
                <p><strong>Top Detected Issue:</strong> {top_disease}</p>
            </div>
            <div class="footer"><p>Leaf Anomaly Detection System</p></div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_body)


def send_treatment_reminder(
    to_email: str,
    user_name: str,
    plant_name: str,
    disease_name: str,
    treatment_type: str,
) -> bool:
    """Send a treatment reminder email."""
    subject = f"Treatment Reminder: {plant_name} - {treatment_type}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .footer {{ background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>Treatment Reminder</h1></div>
            <div class="content">
                <p>Hello {user_name},</p>
                <p>This is a reminder to check the treatment progress for:</p>
                <ul>
                    <li><strong>Plant:</strong> {plant_name}</li>
                    <li><strong>Disease:</strong> {disease_name}</li>
                    <li><strong>Treatment:</strong> {treatment_type}</li>
                </ul>
                <p>Please re-scan the plant to check if the treatment is working.</p>
            </div>
            <div class="footer"><p>Leaf Anomaly Detection System</p></div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_body)
