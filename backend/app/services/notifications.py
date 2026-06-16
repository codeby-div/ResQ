import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger(__name__)

# --- Configuration ---
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@resq.in")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE = os.getenv("TWILIO_PHONE", "")

FCM_SERVER_KEY = os.getenv("FCM_SERVER_KEY", "")


def send_email(to: str, subject: str, body: str) -> bool:
    if not SMTP_USER or not SMTP_PASS:
        logger.info(f"[EMAIL MOCK] To: {to} | Subject: {subject} | Body: {body}")
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, [to], msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


def send_sms(to: str, message: str) -> bool:
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.info(f"[SMS MOCK] To: {to} | Message: {message}")
        return True
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=TWILIO_PHONE, to=to)
        return True
    except Exception as e:
        logger.error(f"SMS send failed: {e}")
        return False


def send_push(subscription_token: str, title: str, body: str) -> bool:
    if not FCM_SERVER_KEY:
        logger.info(f"[PUSH MOCK] Token: {subscription_token[:20]}... | Title: {title}")
        return True
    try:
        import requests
        resp = requests.post(
            "https://fcm.googleapis.com/fcm/send",
            headers={
                "Authorization": f"key={FCM_SERVER_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "to": subscription_token,
                "notification": {"title": title, "body": body},
            },
        )
        return resp.ok
    except Exception as e:
        logger.error(f"Push send failed: {e}")
        return False


def notify_new_emergency(emergency_id: int, patient_name: str, severity: str, location: str):
    subject = f"New {severity.upper()} Emergency #{emergency_id}"
    body = f"""
    <h2>New Emergency Report</h2>
    <p><strong>Patient:</strong> {patient_name}</p>
    <p><strong>Severity:</strong> {severity}</p>
    <p><strong>Location:</strong> {location}</p>
    <p><strong>ID:</strong> #{emergency_id}</p>
    """
    logger.info(f"New emergency notification: {subject}")


def notify_ambulance_assigned(emergency_id: int, patient_name: str, vehicle_id: str, eta_min: int):
    subject = f"Ambulance {vehicle_id} Assigned to Emergency #{emergency_id}"
    body = f"""
    <h2>Ambulance Assigned</h2>
    <p><strong>Patient:</strong> {patient_name}</p>
    <p><strong>Ambulance:</strong> {vehicle_id}</p>
    <p><strong>Estimated arrival:</strong> {eta_min} min</p>
    """
    logger.info(f"Assigned notification: {subject}")


def notify_status_change(emergency_id: int, patient_name: str, new_status: str):
    subject = f"Emergency #{emergency_id} Status Updated: {new_status}"
    body = f"""
    <h2>Status Update</h2>
    <p><strong>Patient:</strong> {patient_name}</p>
    <p><strong>New Status:</strong> {new_status}</p>
    <p><strong>Emergency ID:</strong> #{emergency_id}</p>
    """
    logger.info(f"Status notification: {subject}")
