# BagBridge — Customer Enquiry Website

A simple, responsive luggage-shipping marketing website. Customers do **not** need to create an account or log in.

## Included
- Home page, services, how-it-works and contact pages
- Quote enquiry form
- Google Maps Places autocomplete suggestions for pickup and delivery locations
- Required pickup and delivery ZIP/postal codes
- Enquiries saved locally to `data/enquiries.csv`
- Optional server-side WhatsApp Cloud API notification to your business
- No customer-facing WhatsApp click-to-chat link, so your business number is not printed or embedded in the website HTML

## Run on Windows
1. Install Python 3.10+ from the official Python website if it is not installed.
2. Extract this folder.
3. Double-click `run_windows.bat`.
4. Open `http://127.0.0.1:5000` in your browser.

If Windows blocks the script, open Command Prompt in this folder and run:
```bat
py -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python app.py
```

## Google Maps suggestions setup
The form is wired to Google Maps Places Autocomplete. To make the suggestions work:
1. Create a Google Cloud project and enable **Maps JavaScript API** and **Places API** (Places API (New) may be needed depending on your Google setup).
2. Configure billing and create an API key in Google Cloud.
3. Restrict the key to your website domains and the required APIs before public launch.
4. Replace `YOUR_GOOGLE_MAPS_API_KEY` in `templates/index.html` with your API key.
Without a valid API key and enabled APIs, the address suggestions will not load; the form still displays but suggestions require setup. Google Maps Platform usage may incur charges.

## WhatsApp privacy and setup
The website does not show a WhatsApp number or use a public `wa.me` link. To receive new form enquiries in your WhatsApp, configure the Meta WhatsApp Cloud API:
1. Create/configure a Meta developer app and WhatsApp Business Platform account.
2. Obtain an access token and the WhatsApp phone number ID.
3. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_BUSINESS_RECIPIENT` as environment variables before starting the app. See `.env.example` for names.
4. Your Meta account must be permitted to send the message to the recipient. Production use may require a suitable approved template depending on the messaging window and account configuration.

**Important:** This package includes the optional API notification code, but it is not connected to your Meta account until you supply and configure your own credentials. Without credentials, enquiries still save to `data/enquiries.csv`. Keep the CSV private because it contains customer contact and address details.

## Before publishing publicly
- Replace the sample business contact details in `templates/contact.html`.
- Add your real privacy policy, terms, shipping restrictions, service coverage, and pricing disclaimers.
- Configure HTTPS, a strong `FLASK_SECRET_KEY`, and production hosting. Do not run Flask's development server as a public production server.
- Add spam protection/rate limiting and secure enquiry storage before high-volume production use.
- The site is an enquiry/quotation website, not an automated carrier booking, payment, label-generation, or shipment-tracking platform.


## Latest enquiry-form changes
- Customer email is optional.
- Google Places suggestions are used for pickup and delivery location fields; choose a valid suggestion after typing a few characters. A working Google Maps API key with Places enabled is still required.
- The form saves enquiries to `data/enquiries.csv`.
- To redirect to WhatsApp with the enquiry prefilled, set `BAGBRIDGE_WHATSAPP_NUMBER` to the destination number in international digits (no `+`, spaces or punctuation). **Important:** a normal `wa.me` redirect exposes the destination number to customers. If the business number must remain hidden, leave this setting blank and configure the WhatsApp Cloud API credentials for a private server-side notification instead.


## Bags, boxes and WhatsApp redirect
- The enquiry form now asks for bag quantity and box quantity separately.
- WhatsApp click-to-chat is configured for the supplied destination number using international digits.
- Important: standard WhatsApp click-to-chat (`wa.me`) exposes the destination number to customers, even if the WhatsApp profile displays the BagBridge company name. It is not technically possible to redirect customers to a normal WhatsApp chat while hiding that account's number. To keep the number private, use a WhatsApp Business Cloud API notification on the server instead; that sends the enquiry to the business without redirecting the customer into a chat.
