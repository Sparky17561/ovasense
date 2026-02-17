"""
Cycle-Aware AI Insights Engine
--------------------------------
Uses:
• Period history
• Cycle irregularity
• Last 7-day health metrics
• Few-shot LLM prompt with strict JSON output

SAFE + DEBUGGABLE + WORKS WITH GROQ
"""

import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from groq import Groq

from .models import CycleRecord, HealthMetric

# ============================================================
# LOAD ENV
# ============================================================
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


# ============================================================
# FALLBACK
# ============================================================
def fallback(phase, day):
    return {
        "phase": phase,
        "cycle_day": day,
        "risk_score": 50,
        "main_reason": "AI unavailable. Showing basic analysis.",
        "recommendations": [
            "Track sleep",
            "Reduce stress",
            "Log cycles"
        ]
    }


# ============================================================
# 1️⃣ Detect Current Cycle Phase
# ============================================================
def get_cycle_phase(profile_id):

    cycle = CycleRecord.objects.filter(
        user__id=profile_id,
        predicted=False
    ).order_by('-start_date').first()

    if not cycle:
        return "Unknown", None

    today = datetime.now().date()
    day = (today - cycle.start_date).days + 1

    if day <= 5:
        phase = "Menstrual"
    elif day <= 13:
        phase = "Follicular"
    elif day <= 16:
        phase = "Ovulation"
    else:
        phase = "Luteal"

    return phase, day


# ============================================================
# 2️⃣ Cycle Irregularity
# ============================================================
def get_cycle_irregularity(profile_id):

    cycles = CycleRecord.objects.filter(
        user__id=profile_id,
        predicted=False
    ).order_by('-start_date')[:3]

    if len(cycles) < 2:
        return {"irregular": False, "note": "Not enough data"}

    cycles = list(cycles)[::-1]

    lengths = []
    for i in range(len(cycles) - 1):
        gap = (cycles[i+1].start_date - cycles[i].start_date).days
        lengths.append(gap)

    variance = max(lengths) - min(lengths)

    return {
        "irregular": variance > 7,
        "lengths": lengths,
        "variance": variance
    }


# ============================================================
# 3️⃣ Last 7-Day Metrics
# ============================================================
def get_recent_metrics(profile_id):

    start = datetime.now().date() - timedelta(days=7)

    metrics = HealthMetric.objects.filter(
        user__id=profile_id,
        date__gte=start
    )

    data = {}
    for m in metrics:
        data.setdefault(m.metric_type, []).append(m.value)

    summary = {}
    for k, v in data.items():
        summary[k] = {
            "avg": round(sum(v) / len(v), 2),
            "latest": v[-1],
            "trend": "up" if len(v) > 1 and v[-1] > v[0] else "down"
        }

    return summary


# ============================================================
# 4️⃣ Prompt
# ============================================================
def build_prompt(data):

    return f"""
You are an endocrinologist AI analyzing menstrual & lifestyle data.

Return ONLY valid JSON.

Schema:
{{
  "risk_score": number (0-100),
  "main_reason": "short explanation",
  "recommendations": ["3 short actions"]
}}

Patient Data:
{json.dumps(data, indent=2)}
"""


# ============================================================
# 5️⃣ JSON CLEANER
# ============================================================
def clean_ai_json(text):

    print("🧠 RAW AI RESPONSE:", text)

    if text.startswith("```"):
        text = text.split("```")[1]

    if text.startswith("json"):
        text = text.replace("json", "", 1)

    text = text.strip()

    start = text.find("{")
    end = text.rfind("}") + 1
    text = text[start:end]

    return text


# ============================================================
# 6️⃣ MAIN INSIGHT FUNCTION
# ============================================================
def generate_cycle_insight(profile_id):

    phase, day = get_cycle_phase(profile_id)
    metrics = get_recent_metrics(profile_id)
    cycle_info = get_cycle_irregularity(profile_id)

    structured = {
        "cycle_phase": phase,
        "cycle_day": day,
        "cycle_irregularity": cycle_info,
        "metrics": metrics
    }

    if not GROQ_API_KEY:
        print("⚠️ GROQ_API_KEY missing")
        return fallback(phase, day)

    try:
        client = Groq(api_key=GROQ_API_KEY)

        chat = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": build_prompt(structured)}],
            temperature=0,
            max_tokens=300,
        )

        text = chat.choices[0].message.content.strip()
        text = clean_ai_json(text)

        try:
            result = json.loads(text)
        except Exception as e:
            print("❌ AI JSON PARSE FAILED:", e)
            print("TEXT:", text)
            return fallback(phase, day)

        score = result.get("risk_score", 50)
        score = float(score)
        if score <= 1:
            score *= 100

        return {
            "phase": phase,
            "cycle_day": day,
            "risk_score": int(score),
            "main_reason": result.get("main_reason", ""),
            "recommendations": result.get("recommendations", [])
        }

    except Exception as e:
        print("⚠️ AI insight failed:", e)
        return fallback(phase, day)
