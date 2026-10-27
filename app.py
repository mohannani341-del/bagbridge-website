import csv
import os
from datetime import datetime
from pathlib import Path

import requests
from flask import Flask, render_template, request, redirect, url_for, flash

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
CSV_PATH = DATA_DIR / "enquiries.csv"

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change-this-local-development-key")

FIELDS = [
    "submitted_at", "customer_name", "customer_email", "customer_phone",
    "pickup_location", "pickup_zip",
    "delivery_name", "delivery_email", "delivery_phone",
    "delivery_location", "delivery_zip",
    "bags_count", "boxes_count", "estimated_weight", "pickup_date", "delivery_date", "message",
]

def save_enquiry(data):
    new_file = not CSV_PATH.exists()
    with CSV_PATH.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        if new_file:
            writer.writeheader()
        writer.writerow({key: data.get(key, "") for key in FIELDS})

def notify_business_whatsapp(data):
    """
    Optional private notification using Meta WhatsApp Cloud API.
    The API credentials and recipient number stay on the server and are
    never embedded in the customer-facing page. Configure the environment
    variables in .env (see .env.example).
    """
    token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_number_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    recipient = os.environ.get("WHATSAPP_BUSINESS_RECIPIENT", "").strip()
    if not (token and phone_number_id and recipient):
        return False, "WhatsApp API not configured"

    pickup = f'{data.get("pickup_location")}, ZIP/postal code {data.get("pickup_zip")}'
    delivery = f'{data.get("delivery_location")}, ZIP/postal code {data.get("delivery_zip")}' 
    body = (
        "New BagBridge website enquiry\\n"
        f'Customer: {data.get("customer_name")}\\n'
        f'Email: {data.get("customer_email")}\\n'
        f'Phone: {data.get("customer_phone")}\\n'
        f'Pickup: {pickup}\\n'
        f'Delivery: {delivery}\\n'
        f'Bags: {data.get("bags_count")} | Weight: {data.get("estimated_weight")}\\n'
        f'Pickup date: {data.get("pickup_date") or "Not specified"}\\n'
        f'Delivery date: {data.get("delivery_date") or "Not specified"}\\n'
        f'Notes: {data.get("message") or "None"}'
    )
    endpoint = f"https://graph.facebook.com/v22.0/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient,
        "type": "text",
        "text": {"preview_url": False, "body": body[:4000]},
    }
    try:
        response = requests.post(
            endpoint,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=payload,
            timeout=12,
        )
        response.raise_for_status()
        return True, "WhatsApp notification sent"
    except requests.RequestException as exc:
        app.logger.warning("WhatsApp notification failed: %s", exc)
        return False, "WhatsApp notification failed"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/services")
def services():
    return render_template("services.html")

@app.route("/how-it-works")
def how_it_works():
    return render_template("how_it_works.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/submit-enquiry", methods=["POST"])
def submit_enquiry():
    data = {field: request.form.get(field, "").strip() for field in FIELDS}
    required = [
        "customer_name", "customer_phone",
        "pickup_location", "pickup_zip",
        "delivery_name", "delivery_phone",
        "delivery_location", "delivery_zip", "bags_count", "boxes_count",
    ]
    missing = [field for field in required if not data.get(field)]
    if missing:
        flash("Please complete all required fields, including bag and box quantities.", "error")
        return redirect(url_for("home") + "#quote")

    if data.get("customer_email") and "@" not in data["customer_email"]:
        flash("Please enter a valid email address or leave it blank.", "error")
        return redirect(url_for("home") + "#quote")

    data["submitted_at"] = datetime.now().astimezone().isoformat(timespec="seconds")
    save_enquiry(data)
    # Optionally send a private business notification through WhatsApp Cloud API.
    notified, status = notify_business_whatsapp(data)
    if status != "WhatsApp API not configured" and not notified:
        app.logger.warning("The enquiry was saved, but the WhatsApp notification could not be delivered.")

    # Optional click-to-chat redirect. Set BAGBRIDGE_WHATSAPP_NUMBER in the
    # environment to the international-format digits, e.g. 14155550123.
    # Note: a wa.me redirect makes the destination number visible to customers.
    import urllib.parse
    whatsapp_number = os.environ.get("BAGBRIDGE_WHATSAPP_NUMBER", "12172209828").strip()
    if whatsapp_number:
        pickup = f'{data.get("pickup_location")}, ZIP/postal code {data.get("pickup_zip")}'
        delivery = f'{data.get("delivery_location")}, ZIP/postal code {data.get("delivery_zip")}'
        message = (
            "New BagBridge quote enquiry\\n"
            f'Customer: {data.get("customer_name")}\\n'
            f'Email: {data.get("customer_email") or "Not provided"}\\n'
            f'Phone: {data.get("customer_phone")}\\n'
            f'Pickup: {pickup}\\n'
            f'Delivery: {delivery}\\n'
            f'Bags: {data.get("bags_count")} | Weight: {data.get("estimated_weight") or "Not provided"}\\n'
            f'Pickup date: {data.get("pickup_date") or "Not specified"}\\n'
            f'Delivery date: {data.get("delivery_date") or "Not specified"}\\n'
            f'Notes: {data.get("message") or "None"}'
        )
        return redirect("https://wa.me/" + whatsapp_number + "?text=" + urllib.parse.quote(message))
    flash("Thank you! Your quote request has been saved. WhatsApp redirect will be enabled when the business number is configured.", "success")
    return redirect(url_for("home") + "#quote")

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "0") == "1", host="127.0.0.1", port=int(os.environ.get("PORT", "5000")))
