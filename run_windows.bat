@echo off
cd /d "%~dp0"
if not exist .venv (
  py -m venv .venv
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
echo.
echo Starting BagBridge website at http://127.0.0.1:5000
echo Press Ctrl+C to stop the website.
python app.py
pause
