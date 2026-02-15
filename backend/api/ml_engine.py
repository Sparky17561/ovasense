"""
Rule-based PCOS phenotype classification engine.

This module provides explainable AI logic for classifying PCOS phenotypes
based on symptom data without requiring machine learning models.
"""


def classify_phenotype(symptom_data):
    """
    Classify PCOS phenotype based on rule-based logic.
    
    Args:
        symptom_data (dict): Dictionary containing:
            - cycle_gap_days (int): Days between periods
            - acne (bool): Presence of acne
            - bmi (float): Body Mass Index
            - stress_level (int): Stress level 1-10
            - sleep_hours (float): Hours of sleep
    
    Returns:
        dict: {
            'phenotype': str,
            'confidence': float (0-100),
            'reasons': list of str
        }
    """
    cycle_gap = symptom_data.get('cycle_gap_days', 0)
    acne = symptom_data.get('acne', False)
    bmi = symptom_data.get('bmi', 0)
    stress = symptom_data.get('stress_level', 0)
    sleep = symptom_data.get('sleep_hours', 0)
    
    # New fields
    sugar_cravings = symptom_data.get('sugar_cravings', False)
    weight_gain = symptom_data.get('weight_gain', False)
    hair_loss = symptom_data.get('hair_loss', False)
    dark_patches = symptom_data.get('dark_patches', False)
    mood_swings = symptom_data.get('mood_swings', False)
    pill_usage = symptom_data.get('pill_usage', False)
    
    reasons = []
    phenotype = "Unclassified Type"
    confidence = 50.0
    
    # ---------------------------------------------------------
    # Rule 1: Post-Pill PCOS
    # ---------------------------------------------------------
    if pill_usage and cycle_gap > 35:
        phenotype = "Post-Pill PCOS"
        confidence = 90.0
        reasons.append("Recent discontinuation of birth control pills")
        reasons.append(f"Irregular cycles continuing ({cycle_gap} days)")
        
        if acne:
            reasons.append("Temporary androgen rebound causing acne")
        
        return {
            'phenotype': phenotype,
            'confidence': confidence,
            'reasons': reasons
        }

    # ---------------------------------------------------------
    # Rule 2: Insulin-Resistant PCOS (Most Common)
    # ---------------------------------------------------------
    # Indicators: High BMI, Weight Gain, Sugar Cravings, Dark Patches
    insulin_score = 0
    insulin_reasons = []
    
    if bmi > 25:
        insulin_score += 2
        insulin_reasons.append(f"Elevated BMI ({bmi:.1f})")
    if weight_gain:
        insulin_score += 3
        insulin_reasons.append("Unexplained weight gain / difficulty losing weight")
    if sugar_cravings:
        insulin_score += 2
        insulin_reasons.append("Frequent sugar/carb cravings")
    if dark_patches:
        insulin_score += 4  # Strong indicator
        insulin_reasons.append("Acanthosis nigricans (dark skin patches)")
    if cycle_gap > 40:
        insulin_score += 1
        insulin_reasons.append(f"Irregular ovulation ({cycle_gap} days)")

    if insulin_score >= 5:
        phenotype = "Insulin-Resistant PCOS"
        confidence = min(60 + (insulin_score * 5), 98.0)
        reasons = insulin_reasons
        return {
            'phenotype': phenotype,
            'confidence': confidence,
            'reasons': reasons
        }

    # ---------------------------------------------------------
    # Rule 3: Adrenal PCOS
    # ---------------------------------------------------------
    # Indicators: High stress, anxiety/mood, sleep issues, often normal BMI
    adrenal_score = 0
    adrenal_reasons = []
    
    if stress >= 7:
        adrenal_score += 3
        adrenal_reasons.append(f"High stress levels ({stress}/10)")
    if mood_swings:
        adrenal_score += 2
        adrenal_reasons.append("Anxiety or mood swings present")
    if sleep < 6:
        adrenal_score += 2
        adrenal_reasons.append(f"Poor sleep quality ({sleep} hours)")
    if bmi < 25:
        adrenal_score += 1  # Often lean/normal weight
        adrenal_reasons.append("Normal BMI range")

    if adrenal_score >= 5:
        phenotype = "Adrenal PCOS"
        confidence = min(60 + (adrenal_score * 5), 95.0)
        reasons = adrenal_reasons
        return {
            'phenotype': phenotype,
            'confidence': confidence,
            'reasons': reasons
        }

    # ---------------------------------------------------------
    # Rule 4: Inflammatory PCOS
    # ---------------------------------------------------------
    # Indicators: Severe acne, hair loss, fatigue, skin issues
    inflammatory_score = 0
    inflammatory_reasons = []
    
    if acne:
        inflammatory_score += 3
        inflammatory_reasons.append("Persistent acne/skin inflammation")
    if hair_loss:
        inflammatory_score += 3
        inflammatory_reasons.append("Hair thinning or loss")
    if bmi > 25 and not weight_gain: # Inflammation can cause weight but distinct from insulin
        inflammatory_score += 1 
    if mood_swings: # Inflammation affects brain/mood
        inflammatory_score += 1
        
    if inflammatory_score >= 5:
        phenotype = "Inflammatory PCOS"
        confidence = min(60 + (inflammatory_score * 5), 92.0)
        reasons = inflammatory_reasons
        return {
            'phenotype': phenotype,
            'confidence': confidence,
            'reasons': reasons
        }

    # ---------------------------------------------------------
    # Default / Low Risk / Mixed
    # ---------------------------------------------------------
    if cycle_gap <= 35 and not acne and not hair_loss:
        phenotype = "Low Risk / No PCOS"
        confidence = 90.0
        reasons = ["Regular cycles", "No major hyperandrogenism signs"]
    else:
        phenotype = "Mixed Phenotype / Unclassified"
        confidence = 60.0
        reasons = ["Symptoms do not strongly match a single specific phenotype", "Likely a combination of factors"]

    return {
        'phenotype': phenotype,
        'confidence': confidence,
        'reasons': reasons
    }
