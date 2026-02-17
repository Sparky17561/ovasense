"""
OvaSense ML Engine
Hybrid PCOS Intelligence Engine
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# SAFE JSON PARSER
# ============================================================

def safe_json_parse(text):
    if not text:
        return {}

    text = text.strip()

    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    try:
        return json.loads(text)
    except Exception as e:
        print("❌ JSON parse failed:", e)
        print("RAW:", text)
        return {}


# ============================================================
# RULE ENGINE
# ============================================================

def rule_based_classification(symptom_data):

    bmi = symptom_data.get("bmi") or 0
    regular = symptom_data.get("periods_regular")
    acne = symptom_data.get("acne")
    hair = symptom_data.get("facial_hair_growth")
    dark = symptom_data.get("dark_patches")
    stress = symptom_data.get("stress_level", 0)
    sleep = symptom_data.get("sleep_hours", 8)

    ovulatory = regular is False
    androgen = acne or hair or dark
    metabolic = bmi >= 27 or dark

    criteria = sum([ovulatory, androgen, metabolic])

    phenotype = "Low Likelihood of PCOS"
    reasons = []

    if criteria >= 2:

        if metabolic and dark:
            phenotype = "Insulin-Resistant PCOS"
            reasons = ["Dark patches", "High BMI", "Insulin markers"]

        elif stress >= 7 and sleep <= 5 and bmi < 25:
            phenotype = "Adrenal PCOS"
            reasons = ["High stress", "Low sleep"]

        elif bmi < 24 and androgen:
            phenotype = "Lean PCOS"
            reasons = ["Normal BMI with androgen symptoms"]

        elif acne:
            phenotype = "Inflammatory PCOS"
            reasons = ["Acne + inflammation"]

        else:
            phenotype = "Likely PCOS"
            reasons = ["Multiple Rotterdam criteria met"]

    else:
        reasons = ["Not enough Rotterdam criteria"]

    confidence = min(95, 60 + criteria * 10)

    return {
        "phenotype": phenotype,
        "confidence": confidence,
        "rule_version": "2.1.0",
        "reasons": reasons
    }


# ============================================================
# LLM EXPLANATION
# ============================================================

def generate_llm_explanation(symptom_data, phenotype):

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        prompt = f"""
Explain WHY this PCOS phenotype was predicted.

Phenotype:
{phenotype}

Symptoms:
{json.dumps(symptom_data, indent=2)}

Keep it short.
"""

        chat = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )

        return chat.choices[0].message.content.strip()

    except Exception as e:
        print("⚠️ Explanation LLM failed:", e)
        return "AI explanation unavailable."


# ============================================================
# PREDICTIVE LAYER
# ============================================================

def generate_predictive_analysis(symptom_data, phenotype):

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        prompt = f"""
Predict PCOS risk for next 3-6 months.

Phenotype: {phenotype}

Symptoms:
{json.dumps(symptom_data, indent=2)}

Return ONLY JSON:
{{
 "future_risk_score": number,
 "mixed_pcos_types": ["type"],
 "recommended_lab_tests": ["test"],
 "priority_lifestyle_changes": ["action"],
 "reasoning": "short"
}}
"""

        chat = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=400,
        )

        return safe_json_parse(chat.choices[0].message.content)

    except Exception as e:
        print("⚠️ Predictive LMM failed:", e)
        return {}


# ============================================================
# MAIN ENTRY
# ============================================================

def classify_phenotype(symptom_data):

    rule = rule_based_classification(symptom_data)

    explanation = generate_llm_explanation(symptom_data, rule["phenotype"])
    predictive = generate_predictive_analysis(symptom_data, rule["phenotype"])

    return {
        "phenotype": rule["phenotype"],
        "confidence": rule["confidence"],
        "rule_version": rule["rule_version"],
        "reasons": rule.get("reasons", ["No explanation generated"]),
        "ai_explanation": explanation,
        "future_risk_score": predictive.get("future_risk_score"),
        "mixed_pcos_types": predictive.get("mixed_pcos_types", []),
        "recommended_lab_tests": predictive.get("recommended_lab_tests", []),
        "priority_lifestyle_changes": predictive.get("priority_lifestyle_changes", []),
        "predictive_reasoning": predictive.get("reasoning"),
    }
