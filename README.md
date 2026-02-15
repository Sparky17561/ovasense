# OvaSense AI - Setup Instructions

Complete setup guide for the PCOS Phenotype Demo Platform.

## Prerequisites

- **Python** 3.9 or higher
- **Node.js** 16 or higher
- **npm** or **yarn**
- **Chrome or Edge browser** (for voice features)

---

## Backend Setup (Django)

### 1. Navigate to backend directory
```powershell
cd c:\Users\saipr\Desktop\ovasense\backend
```

### 2. Create virtual environment
```powershell
python -m venv venv
```

### 3. Activate virtual environment
```powershell
.\venv\Scripts\Activate.ps1
```

If you get a script execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Install Python dependencies
```powershell
pip install -r requirements.txt
```

### 5. Run database migrations
```powershell
python manage.py makemigrations
python manage.py migrate
```

### 6. Create superuser (optional, for admin access)
```powershell
python manage.py createsuperuser
```
Follow the prompts to set username, email, and password.

### 7. Start the Django server
```powershell
python manage.py runserver
```

The backend API will be available at: **http://localhost:8000**

Admin panel: **http://localhost:8000/admin**

---

## Frontend Setup (React + Vite)

### 1. Open new terminal and navigate to frontend directory
```powershell
cd c:\Users\saipr\Desktop\ovasense\frontend
```

### 2. Install dependencies
```powershell
npm install
```

### 3. Start development server
```powershell
npm run dev
```

The frontend will be available at: **http://localhost:3000**

---

## Using the Application

### 1. Open your browser
Navigate to **http://localhost:3000** in **Chrome** or **Edge** browser.

### 2. Dashboard
- View your symptom history
- See latest phenotype assessment
- Track cycle trends in the chart
- Click "Talk to Baymax" to start a new session

### 3. Talk to Baymax
- **Text Input**: Type responses in the chat box
- **Voice Input**: Click the 🎤 microphone button and speak
- Baymax will ask you questions about:
  - Cycle gap (days between periods)
  - Acne presence
  - BMI
  - Stress level (1-10)
  - Sleep hours

### 4. Get Results
- After answering all questions, Baymax will classify your phenotype
- Download PDF report
- Return to dashboard to see updated history

---

## API Endpoints

### POST /api/log/
Save symptom data without classification.

**Request:**
```json
{
  "cycle_gap_days": 45,
  "acne": true,
  "bmi": 24.5,
  "stress_level": 7,
  "sleep_hours": 6.5
}
```

### POST /api/classify/
Submit symptoms and get phenotype classification.

**Request:** Same as above

**Response:**
```json
{
  "symptom_log_id": 1,
  "result_id": 1,
  "phenotype": "Moderate Risk",
  "confidence": 72.0,
  "reasons": [
    "Slightly irregular cycles (45 days)",
    "Some hormonal signs present"
  ],
  "created_at": "2026-02-15T10:30:00Z"
}
```

### GET /api/history/
Get all symptom logs with results.

**Response:**
```json
[
  {
    "id": 1,
    "cycle_gap_days": 45,
    "acne": true,
    "bmi": 24.5,
    "stress_level": 7,
    "sleep_hours": 6.5,
    "created_at": "2026-02-15T10:30:00Z",
    "result": {
      "phenotype": "Moderate Risk",
      "confidence": 72.0,
      "reasons": ["..."]
    }
  }
]
```

### GET /api/report/{result_id}/
Download PDF report for a specific result.

---

## Sample Test Data

You can test the classification logic with these scenarios:

### Low Risk (Normal)
```json
{
  "cycle_gap_days": 28,
  "acne": false,
  "bmi": 22.0,
  "stress_level": 3,
  "sleep_hours": 8.0
}
```

### Insulin Resistant PCOS
```json
{
  "cycle_gap_days": 75,
  "acne": true,
  "bmi": 30.0,
  "stress_level": 6,
  "sleep_hours": 6.0
}
```

### Lean PCOS
```json
{
  "cycle_gap_days": 65,
  "acne": true,
  "bmi": 20.0,
  "stress_level": 5,
  "sleep_hours": 7.0
}
```

### Stress-Induced Irregularity
```json
{
  "cycle_gap_days": 40,
  "acne": false,
  "bmi": 23.5,
  "stress_level": 9,
  "sleep_hours": 5.0
}
```

---

## Troubleshooting

### Voice not working
- **Use Chrome or Edge browser** (Safari and Firefox have limited support)
- **Check microphone permissions** in browser settings
- **HTTPS required in production** (localhost works fine)

### Backend errors
- Make sure Python virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check that migrations are applied: `python manage.py migrate`

### Frontend connection errors
- Ensure backend is running on port 8000
- Check Vite proxy configuration in `vite.config.js`
- Clear browser cache if needed

### CORS errors
- Verify `django-cors-headers` is installed
- Check `CORS_ALLOW_ALL_ORIGINS = True` in settings.py

---

## Project Structure

```
ovasense/
├── backend/
│   ├── api/
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API endpoints
│   │   ├── serializers.py     # DRF serializers
│   │   ├── ml_engine.py       # Classification logic
│   │   ├── report.py          # PDF generation
│   │   └── urls.py            # API routing
│   ├── ovasense_backend/
│   │   ├── settings.py        # Django configuration
│   │   └── urls.py            # Root URLs
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatBox.jsx    # Chat UI component
    │   │   └── VoiceButton.jsx # Voice input
    │   ├── pages/
    │   │   ├── Dashboard.jsx  # Main dashboard
    │   │   └── Baymax.jsx     # AI assistant
    │   ├── api.js             # API client
    │   ├── App.jsx            # Root component
    │   └── index.css          # Global styles
    ├── package.json
    └── vite.config.js
```

---

## Next Steps for Production

1. **Add User Authentication**
   - Implement user registration/login
   - Associate symptom logs with users
   - Use JWT tokens for API authentication

2. **Enhance ML Model**
   - Replace rule-based logic with actual ML model
   - Add more phenotype categories
   - Include more symptom factors

3. **Security**
   - Change Django `SECRET_KEY`
   - Set `DEBUG = False`
   - Use specific CORS origins instead of `ALLOW_ALL`
   - Add rate limiting

4. **Deployment**
   - Configure production database (PostgreSQL)
   - Use environment variables for secrets
   - Set up HTTPS
   - Deploy backend (Heroku, AWS, etc.)
   - Deploy frontend (Vercel, Netlify, etc.)

---

## Support

For issues or questions about this demo platform, please refer to the code comments or check the Django and React documentation.

**Built with ❤️ for PCOS awareness and health tracking**
