"""
Predictive PCOS Engine (LLM-Driven)
-----------------------------------
Uses patient history + symptoms to predict:

• Future PCOS risk (3–6 months)
• Mixed phenotype likelihood
• Recommended lab tests
• Lifestyle priorities

No hardcoded medical logic.
Explainable + auditable.
"""

import os
import json
from datetime import datetime, timedelta
from groq import Groq
from dotenv import load_dotenv

from .models import CycleRecord, HealthMetric

load_dotenv()


# ============================================================
# Collect Patient History
# ============================================================

def get_patient_history(profile):

    cycles = CycleRecord.objects.filter(
        user=profile,
        predicted=False
    ).order_by("-start_date")[:6]

    cycle_lengths = []
    for i in range(len(cycles)-1):
        gap = (cycles[i].start_date - cycles[i+1].start_date).days
        cycle_lengths.append(gap)

    metrics = HealthMetric.objects.filter(
        user=profile,
        date__gte=datetime.now().date() - timedelta(days=30)
    )

    metric_summary = {}
    for m in metrics:
        metric_summary.setdefault(m.metric_type, []).append(m.value)

    return {
        "recent_cycle_lengths": cycle_lengths,
        "recent_metrics": metric_summary
    }


# ============================================================
# Build Predictive Prompt
# ============================================================

def build_predictive_prompt(symptoms, history, phenotype):

    return f"""
You are an endocrinologist AI specializing in predictive PCOS care.

Patient current phenotype:
{phenotype}

Current symptom data:
{json.dumps(symptoms, indent=2)}

Recent cycle and health history:
{json.dumps(history, indent=2)}

You MUST return ONLY valid JSON:

{{
  "future_risk_score": number (0-100),
  "mixed_pcos_types": ["type1","type2"],
  "priority_lifestyle_changes": ["action1","action2","action3"],
  "recommended_lab_tests": ["test1","test2"],
  "reasoning": "short explanation"
}}

Think clinically and predict risk for next 3–6 months.
Do NOT add extra text.
"""


# ============================================================
# Run LLM Prediction
# ============================================================

def run_predictive_llm(symptoms, history, phenotype):

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        prompt = build_predictive_prompt(symptoms, history, phenotype)

        chat = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=400,
        )

        text = chat.choices[0].message.content.strip()

        # Remove ```json fences if present
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        result = json.loads(text)

        return result

    except Exception as e:
        print("⚠️ Predictive LMM failed:", e)

        return {
            "future_risk_score": None,
            "mixed_pcos_types": [],
            "priority_lifestyle_changes": [],
            "recommended_lab_tests": [],
            "reasoning": "Predictive model unavailable"
        }


# ============================================================
# Public API
# ============================================================

def generate_predictive_analysis(profile, symptom_data, phenotype):

    history = get_patient_history(profile)

    result = run_predictive_llm(symptom_data, history, phenotype)

    return result
