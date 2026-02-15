"""
Rule-based PCOS phenotype classification engine.

This module provides explainable AI logic for classifying PCOS phenotypes
based on symptom data without requiring machine learning models.
"""


def classify_phenotype(symptom_data):
    """
    Classify PCOS phenotype based on rule-based logic.
    
    Returns:
        dict: {
            'phenotype': str,
            'confidence': float (0-100),
            'reasons': list of str
        }
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
    # Cycle Health
    cycle_gap = symptom_data.get('cycle_gap_days') or 28
    regular = symptom_data.get('periods_regular')
    max_gap = symptom_data.get('longest_cycle_gap_last_year') or 0
    
    # Androgen Signs
    acne = symptom_data.get('acne')
    hair_loss = symptom_data.get('hair_loss')
    facial_hair = symptom_data.get('facial_hair_growth')
    dark_patches = symptom_data.get('dark_patches')
    
    # Metabolic & Health
    bmi = symptom_data.get('bmi') or 0
    waist = symptom_data.get('waist_cm') or 0
    sugar = symptom_data.get('sugar_cravings')
    weight_gain = symptom_data.get('weight_gain')
    family_diabetes = symptom_data.get('family_diabetes_history')
    fatigue_meal = symptom_data.get('fatigue_after_meals')
    
    # Stress/Mood
    stress = symptom_data.get('stress_level') or 0
    sleep = symptom_data.get('sleep_hours') or 0
    mood = symptom_data.get('mood_swings')

    # --- 3. Evaluate Rotterdam Criteria ---
    # Criterion 1: Ovulatory Dysfunction
    ovulatory_issues = []
    if cycle_gap > 35 or (regular is False) or max_gap > 45:
        ovulatory_issues.append("Irregular menstrual cycles")
    
    # Criterion 2: Hyperandrogenism (Clinical)
    androgen_signs = []
    if acne: androgen_signs.append("Persistent acne")
    if hair_loss: androgen_signs.append("Hair thinning (alopecia)")
    if facial_hair: androgen_signs.append("Excessive facial/body hair (hirsutism)")
    # Biochemical hyperandrogenism would go here if we had labs
    
    # Criterion 3: Polycystic Ovaries (Proxy via Metabolic/insulin signs)
    # Without ultrasound, we use strong metabolic indicators as a risk proxy
    metabolic_signs = []
    if bmi >= 25: metabolic_signs.append(f"Elevated BMI ({bmi:.1f})")
    if waist > 80: metabolic_signs.append("Increased waist circumference") # specific to women
    if dark_patches: metabolic_signs.append("Acanthosis nigricans (insulin resistance sign)")
    if family_diabetes: metabolic_signs.append("Family history of diabetes")
    if weight_gain and sugar: metabolic_signs.append("Unexplained weight gain with sugar cravings")

    # Check sufficient evidence (simplified Rotterdam: 2 out of 3)
    criteria_met_count = 0
    if ovulatory_issues: criteria_met_count += 1
    if androgen_signs: criteria_met_count += 1
    if metabolic_signs: criteria_met_count += 1 # Using metabolic as proxy/risk factor

    reasons = []
    phenotype = "Assessment Inconclusive"
    confidence = 0.0

    # --- 4. Phenotype Classification (Deterministic) ---
    
    if criteria_met_count >= 2:
        # PCO Likely - Determine Phenotype
        
        # Type A: Insulin-Resistant (Classic)
        # Needs: Metabolic signs + (Dark patches OR Fatigue after meals OR High waist/BMI)
        is_insulin = (len(metabolic_signs) >= 2) or dark_patches or (fatigue_meal and weight_gain)
        
        # Type B: Inflammatory
        # Needs: Acne + (Mood swings OR Fatigue OR Skin issues) + NOT primarily metabolic
        is_inflammatory = acne and (mood or symptom_data.get('fatigue_after_meals')) and (bmi < 30)
        
        # Type C: Adrenal
        # Needs: High stress + Normal BMI + Androgen signs active
        is_adrenal = (stress >= 7) and (bmi < 25) and androgen_signs
        
        # Classification Hierarchy
        if is_insulin:
            phenotype = "Insulin-Resistant PCOS (Likely)"
            reasons = metabolic_signs + ["Strong insulin resistance indicators present"]
            confidence = 85.0
        elif is_inflammatory:
            phenotype = "Inflammatory PCOS (Likely)"
            reasons = androgen_signs + ["Signs of inflammation (acne/mood)"]
            confidence = 80.0
        elif is_adrenal:
            phenotype = "Adrenal PCOS (Likely)"
            reasons = ["High stress levels", "Normal BMI"] + androgen_signs
            confidence = 80.0
        else:
            # Fallback for general Rotterdam positive
            phenotype = "PCOS likely (Unspecified Phenotype)"
            reasons = ovulatory_issues + androgen_signs + metabolic_signs
            confidence = 75.0
            
    elif criteria_met_count == 1:
        # At Risk / Pre-PCOS
        phenotype = "Possible PCOS Risk (Insufficient Evidence)"
        reasons = ["Met only 1 of 3 key criteria"] + ovulatory_issues + androgen_signs + metabolic_signs
        confidence = 50.0
        
    else:
        # Unlikely
        phenotype = "Low Likelihood of PCOS"
        reasons = ["Did not meet major clinical criteria (Ovulatory, Androgen, Metabolic)"]
        confidence = 90.0
        
    # Cap confidence
    confidence = min(confidence, 95.0)

    return {
        'phenotype': phenotype,
        'confidence': confidence,
        'reasons': reasons
    }
