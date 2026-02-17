"""
Rule-based PCOS phenotype classification engine.

This module provides explainable AI logic for classifying PCOS phenotypes
based on symptom data without requiring machine learning models.
"""


def classify_phenotype(symptom_data):
    """
    Classify PCOS phenotype based on strict Rotterdam criteria, differential diagnosis, and rule versioning.
    Rule Version: 1.1.0
    """
    RULE_VERSION = "1.1.0"
    
    # --- 1. Data Quality & Completeness Score ---
    required_fields = [
        'cycle_gap_days', 'periods_regular', 'acne', 'hair_loss', 
        'facial_hair_growth', 'bmi', 'waist_cm', 'stress_level', 'sleep_hours'
    ]
    valid_inputs = len([k for k in required_fields if symptom_data.get(k) is not None])
    data_quality_score = int((valid_inputs / len(required_fields)) * 100)

    # --- 2. Safety Checks (Red Flags) ---
    red_flags = []
    if symptom_data.get('heavy_bleeding'): red_flags.append("Excessive menstrual bleeding")
    if symptom_data.get('severe_pelvic_pain'): red_flags.append("Severe pelvic pain")
    if symptom_data.get('possible_pregnancy'): red_flags.append("Possibility of pregnancy")
    # Quick medical reject for impossible values
    bmi = symptom_data.get('bmi') or 0
    if bmi > 60: red_flags.append(f"bmi {bmi} requires clinical verification")
        
    if red_flags:
        return {
            'phenotype': "Medical Attention Required",
            'confidence': 100.0,
            'reasons': ["Red flag symptoms detected: " + ", ".join(red_flags), "Please consult a doctor immediately."],
            'data_quality_score': data_quality_score,
            'rule_version': RULE_VERSION,
            'differential_diagnosis': "Urgent Medical Review"
        }

    # --- 3. Differential Diagnosis (Rule Out) ---
    differential_flags = []
    if symptom_data.get('thyroid_history'): differential_flags.append("Thyroid History")
    if symptom_data.get('recent_major_stress_event'): differential_flags.append("Recent Major Stress")
    if symptom_data.get('recent_travel_or_illness'): differential_flags.append("Recent Travel/Illness")
    
    # Duration Check (Acute vs Chronic)
    is_chronic = True
    cycle_duration = symptom_data.get('cycle_irregularity_duration_months') or 0
    if cycle_duration > 0 and cycle_duration < 3:
        differential_flags.append("Short duration symptoms (< 3 months)")
        is_chronic = False

    # --- 4. Evaluate Rotterdam Criteria (Strict) ---
    cycle_gap = symptom_data.get('cycle_gap_days') or 28
    regular = symptom_data.get('periods_regular')
    max_gap = symptom_data.get('longest_cycle_gap_last_year') or 0
    
    # Criterion 1: Ovulatory Dysfunction (MUST be persistent/chronic)
    has_ovulatory_dysfunction = ((cycle_gap > 45) or (max_gap > 60) or (regular is False)) and is_chronic
    ovulatory_issues = []
    if has_ovulatory_dysfunction:
        ovulatory_issues.append("Persistent irregular menstrual cycles")

    # Criterion 2: Hyperandrogenism
    acne = symptom_data.get('acne')
    hair_loss = symptom_data.get('hair_loss')
    facial_hair = symptom_data.get('facial_hair_growth')
    dark_patches = symptom_data.get('dark_patches')
    
    has_androgen_signs = acne or hair_loss or facial_hair or dark_patches
    androgen_signs = []
    if acne: androgen_signs.append("Persistent acne")
    if hair_loss: androgen_signs.append("Hair thinning")
    if facial_hair: androgen_signs.append("Hirsutism")
    if dark_patches: androgen_signs.append("Acanthosis nigricans")

    # Criterion 3: Metabolic (Proxy for Polycystic Ovaries)
    waist = symptom_data.get('waist_cm') or 0
    sugar = symptom_data.get('sugar_cravings')
    weight_gain = symptom_data.get('weight_gain')
    family_diabetes = symptom_data.get('family_diabetes_history')
    
    # Increased metabolic cutoff
    has_metabolic_signs = (bmi >= 27) or (waist > 88) or family_diabetes
    metabolic_signs = []
    if bmi >= 27: metabolic_signs.append(f"Elevated BMI ({bmi:.1f})")
    if waist > 88: metabolic_signs.append(f"Increased waist circumference ({waist}cm)")
    if family_diabetes: metabolic_signs.append("Family history of diabetes")

    # --- 5. Classification Logic ---
    criteria_met = 0
    if has_ovulatory_dysfunction: criteria_met += 1
    if has_androgen_signs: criteria_met += 1
    if has_metabolic_signs: criteria_met += 1

    phenotype = "Assessment Inconclusive"
    reasons = []
    confidence = 0.0
    differential_diagnosis = None

    # Priority 1: Short Duration Override (Acute vs Chronic)
    if not is_chronic:
        phenotype = "Possible Temporary Hormonal Imbalance"
        reasons = differential_flags + ["Symptoms are recent (< 3 months). Monitor for 3 more months."]
        confidence = 60.0
        differential_diagnosis = ", ".join(differential_flags)

    # Priority 2: PCOS Diagnosis (Requires 2+ Criteria)
    elif criteria_met >= 2:
        # Sub-typing (same as before)
        is_insulin = has_metabolic_signs and (dark_patches or sugar)
        is_inflammatory = acne and symptom_data.get('mood_swings') and symptom_data.get('fatigue_after_meals')
        is_adrenal = (symptom_data.get('stress_level', 0) >= 7) and (symptom_data.get('sleep_hours', 8) <= 5) and (bmi < 25)
        is_lean = (bmi < 24) and has_androgen_signs and has_ovulatory_dysfunction

        base_phenotype = "Likely PCOS"
        
        if is_insulin:
            phenotype = "Insulin-Resistant PCOS Impact"
            reasons = metabolic_signs + ["Insulin resistance markers"]
        elif is_inflammatory:
            phenotype = "Inflammatory PCOS Impact"
            reasons = androgen_signs + ["Inflammatory markers (mood/fatigue)"]
        elif is_adrenal:
            phenotype = "Adrenal PCOS Impact"
            reasons = ["High stress biomarkers", "Sleep deprivation"] + androgen_signs
        elif is_lean:
            phenotype = "Lean PCOS Impact"
            reasons = ["Normal BMI"] + androgen_signs
        else:
            phenotype = "Likely PCOS (Classic Pattern)"
            reasons = ovulatory_issues + androgen_signs + metabolic_signs

        # Handle Co-morbidities (Thyroid/Stress) without overriding PCOS
        if differential_flags:
            phenotype += " (Complex Case)"
            reasons.append(f"⚠️ Complicating factors: {', '.join(differential_flags)}")
            differential_diagnosis = ", ".join(differential_flags)
            confidence = 70.0 # Cap slightly lower due to complexity
        else:
            # Standard Confidence Calculation
            base_confidence = 65.0 + (criteria_met * 10)
            confidence = min(base_confidence * (data_quality_score / 100.0), 85.0)

    # Priority 3: Differential Override (If NOT meeting PCOS criteria)
    elif differential_flags:
        phenotype = "Likely Non-PCOS Hormonal Issue"
        reasons = differential_flags + ["Symptoms do not meet full PCOS criteria"]
        confidence = 65.0
        differential_diagnosis = ", ".join(differential_flags)

    # Priority 4: Single Symptom (Hormonal Imbalance)
    elif criteria_met == 1:
        phenotype = "Hormonal Imbalance (Not PCOS)"
        reasons = ["Only 1 of 3 Rotterdam criteria met"] + ovulatory_issues + androgen_signs
        confidence = 50.0

    else:
        phenotype = "Low Likelihood of PCOS"
        reasons = ["Symptoms do not align with clinical criteria"]
        confidence = 90.0

    # Ensure disclaimer is always present (in reasons or UI, but here we enforce logic)
    reasons.append("⚠️ Educational guidance only. Not a medical diagnosis.")

    return {
        'phenotype': phenotype,
        'confidence': round(confidence, 1),
        'reasons': reasons,
        'data_quality_score': data_quality_score,
        'rule_version': RULE_VERSION,
        'differential_diagnosis': differential_diagnosis
    }
