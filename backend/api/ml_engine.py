"""
Rule-based PCOS phenotype classification engine.

This module provides explainable AI logic for classifying PCOS phenotypes
based on symptom data without requiring machine learning models.
"""


def classify_phenotype(symptom_data):
    """
    Classify PCOS phenotype based on strict Rotterdam criteria and deterministic rules.
    """
    # --- 1. Safety Checks (Red Flags) ---
    red_flags = []
    if symptom_data.get('heavy_bleeding'):
        red_flags.append("Excessive menstrual bleeding")
    if symptom_data.get('severe_pelvic_pain'):
        red_flags.append("Severe pelvic pain")
    if symptom_data.get('possible_pregnancy'):
        red_flags.append("Possibility of pregnancy")
        
    if red_flags:
        return {
            'phenotype': "Medical Attention Required",
            'confidence': 100.0,
            'reasons': ["Red flag symptoms detected: " + ", ".join(red_flags), "Please consult a doctor immediately."]
        }

    # --- 2. Extract Key Indicators ---
    cycle_gap = symptom_data.get('cycle_gap_days') or 28
    regular = symptom_data.get('periods_regular')
    max_gap = symptom_data.get('longest_cycle_gap_last_year') or 0
    
    acne = symptom_data.get('acne')
    hair_loss = symptom_data.get('hair_loss')
    facial_hair = symptom_data.get('facial_hair_growth')
    dark_patches = symptom_data.get('dark_patches')
    
    bmi = symptom_data.get('bmi') or 0
    waist = symptom_data.get('waist_cm') or 0
    sugar = symptom_data.get('sugar_cravings')
    weight_gain = symptom_data.get('weight_gain')
    family_diabetes = symptom_data.get('family_diabetes_history')
    fatigue_meal = symptom_data.get('fatigue_after_meals')
    
    stress = symptom_data.get('stress_level') or 0
    sleep = symptom_data.get('sleep_hours') or 0
    mood = symptom_data.get('mood_swings')

    # --- 3. Evaluate Rotterdam Criteria (Strict) ---
    # Criterion 1: Ovulatory Dysfunction
    has_ovulatory_dysfunction = (cycle_gap > 45) or (max_gap > 60) or (regular is False)
    ovulatory_issues = []
    if has_ovulatory_dysfunction:
        ovulatory_issues.append("Irregular menstrual cycles (Gap > 45d or unpredictable)")

    # Criterion 2: Hyperandrogenism (Clinical)
    has_androgen_signs = acne or hair_loss or facial_hair or dark_patches
    androgen_signs = []
    if acne: androgen_signs.append("Persistent acne")
    if hair_loss: androgen_signs.append("Hair thinning (alopecia)")
    if facial_hair: androgen_signs.append("Hirsutism (excessive hair)")
    if dark_patches: androgen_signs.append("Acanthosis nigricans")

    # Criterion 3: Polycystic Ovaries (Proxy via Metabolic)
    # Using BMI >= 27 as strict cutoff per user request
    has_metabolic_signs = (bmi >= 27) or sugar or weight_gain or (waist > 88) or family_diabetes
    metabolic_signs = []
    if bmi >= 27: metabolic_signs.append(f"Elevated BMI ({bmi:.1f})")
    if sugar: metabolic_signs.append("Sugar cravings")
    if weight_gain: metabolic_signs.append("Unexplained weight gain")
    if waist > 88: metabolic_signs.append("Increased waist circumference")
    if family_diabetes: metabolic_signs.append("Family history of diabetes")

    # --- 4. Determine PCOS Likelihood ---
    criteria_met = 0
    if has_ovulatory_dysfunction: criteria_met += 1
    if has_androgen_signs: criteria_met += 1
    if has_metabolic_signs: criteria_met += 1

    phenotype = "Insufficient Evidence"
    reasons = []
    confidence = 0.0

    # Strict Classification Logic
    if criteria_met >= 2:
        # Determine specific phenotype
        # Type A: Insulin-Resistant (Metabolic + Dark Patches/Sugar)
        is_insulin = has_metabolic_signs and (dark_patches or sugar)
        
        # Type B: Inflammatory (Acne + Mood + Fatigue)
        is_inflammatory = acne and mood and fatigue_meal
        
        # Type C: Adrenal (Stress >= 7 + Sleep <= 5 + Normal BMI)
        is_adrenal = (stress >= 7) and (sleep <= 5) and (bmi < 25)
        
        # Type D: Lean PCOS (BMI < 24 + Androgen + Ovulatory)
        is_lean = (bmi < 24) and has_androgen_signs and has_ovulatory_dysfunction

        if is_insulin:
            phenotype = "Insulin-Resistant PCOS (Likely)"
            reasons = metabolic_signs + ["Strong insulin resistance indicators"]
            phenotype_bonus = 0.2
        elif is_inflammatory:
            phenotype = "Inflammatory PCOS (Likely)"
            reasons = androgen_signs + ["Signs of inflammation (acne/mood/fatigue)"]
            phenotype_bonus = 0.15
        elif is_adrenal:
            phenotype = "Adrenal PCOS (Likely)"
            reasons = ["High stress", "Low sleep", "Normal BMI"] + androgen_signs
            phenotype_bonus = 0.15
        elif is_lean:
            phenotype = "Lean PCOS (Likely)"
            reasons = ["Normal BMI"] + androgen_signs + ovulatory_issues
            phenotype_bonus = 0.15
        else:
            # Fallback based on criteria combination
            if has_ovulatory_dysfunction and has_androgen_signs:
                 phenotype = "PCOS Likely (Classic Phenotype)"
                 reasons = ovulatory_issues + androgen_signs
                 phenotype_bonus = 0.1
            else:
                 phenotype = "Possible PCOS Pattern (Rotterdam Criteria Met)"
                 reasons = ovulatory_issues + androgen_signs + metabolic_signs
                 phenotype_bonus = 0.05
        
        # Confidence Calculation
        # Base: Criteria met / 3
        # Bonus: specific phenotype match
        # Cap: 0.8 (since no labs)
        base_confidence = (criteria_met / 3.0) + phenotype_bonus
        
        # Completeness Check (reduce if key fields missing)
        key_fields = [cycle_gap, regular, acne, bmi, stress]
        completeness = len([f for f in key_fields if f is not None]) / len(key_fields)
        
        confidence = min((base_confidence * completeness) * 100, 80.0)

    elif criteria_met == 1:
        phenotype = "Possible PCOS Risk (Insufficient Evidence)"
        reasons = ["Met only 1 of 3 key criteria"] + ovulatory_issues + androgen_signs + metabolic_signs
        confidence = 40.0
        if has_ovulatory_dysfunction:
            reasons.append("Irregular cycles alone are not enough for diagnosis.")
    
    else:
        phenotype = "Low Likelihood of PCOS"
        reasons = ["Symptoms do not align with Rotterdam criteria"]
        confidence = 90.0

    return {
        'phenotype': phenotype,
        'confidence': round(confidence, 1),
        'reasons': reasons
    }
