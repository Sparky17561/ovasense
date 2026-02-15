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
    
    reasons = []
    phenotype = "Low Risk"
    confidence = 50.0
    
    # Rule 1: Insulin Resistant PCOS
    # High BMI + irregular cycles
    if bmi > 27 and cycle_gap > 60:
        phenotype = "Insulin Resistant PCOS"
        confidence = 85.0
        reasons.append(f"High BMI ({bmi:.1f}) indicates insulin resistance")
        reasons.append(f"Irregular cycles ({cycle_gap} days apart)")
        
        if acne:
            reasons.append("Acne presence supports hormonal imbalance")
            confidence += 5.0
            
        if stress > 7:
            reasons.append("High stress may worsen symptoms")
            
        return {
            'phenotype': phenotype,
            'confidence': min(confidence, 95.0),
            'reasons': reasons
        }
    
    # Rule 2: Lean PCOS
    # Low BMI + irregular cycles
    if bmi < 22 and cycle_gap > 60:
        phenotype = "Lean PCOS"
        confidence = 80.0
        reasons.append(f"Low BMI ({bmi:.1f}) with irregular cycles")
        reasons.append(f"Cycle gap of {cycle_gap} days")
        
        if acne:
            reasons.append("Acne indicates androgen excess")
            confidence += 5.0
            
        if stress > 7:
            reasons.append("Elevated stress levels")
            confidence += 3.0
            
        return {
            'phenotype': phenotype,
            'confidence': min(confidence, 92.0),
            'reasons': reasons
        }
    
    # Rule 3: Stress-Induced Irregular Cycles
    # High stress + moderately irregular cycles
    if stress > 7 and cycle_gap > 35:
        phenotype = "Stress-Induced Irregularity"
        confidence = 75.0
        reasons.append(f"High stress level ({stress}/10)")
        reasons.append(f"Moderately irregular cycles ({cycle_gap} days)")
        
        if sleep < 6:
            reasons.append(f"Poor sleep quality ({sleep} hours)")
            confidence += 5.0
            
        if bmi >= 22 and bmi <= 27:
            reasons.append("Normal BMI range")
            
        return {
            'phenotype': phenotype,
            'confidence': min(confidence, 88.0),
            'reasons': reasons
        }
    
    # Rule 4: Moderate Risk
    # Some irregular cycles but no strong indicators
    if cycle_gap > 35 and cycle_gap <= 60:
        phenotype = "Moderate Risk"
        confidence = 65.0
        reasons.append(f"Slightly irregular cycles ({cycle_gap} days)")
        
        if bmi > 25:
            reasons.append(f"BMI in overweight range ({bmi:.1f})")
            confidence += 5.0
            
        if acne:
            reasons.append("Some hormonal signs present")
            confidence += 5.0
            
        if stress > 5:
            reasons.append(f"Moderate stress ({stress}/10)")
            
        return {
            'phenotype': phenotype,
            'confidence': min(confidence, 78.0),
            'reasons': reasons
        }
    
    # Rule 5: Low Risk (default)
    # Regular cycles, normal metrics
    phenotype = "Low Risk"
    confidence = 90.0
    reasons.append(f"Regular menstrual cycles ({cycle_gap} days)")
    
    if bmi >= 18.5 and bmi <= 24.9:
        reasons.append(f"Healthy BMI ({bmi:.1f})")
        confidence += 5.0
    
    if stress <= 5:
        reasons.append("Low stress levels")
        
    if sleep >= 7:
        reasons.append(f"Good sleep quality ({sleep} hours)")
        
    return {
        'phenotype': phenotype,
        'confidence': min(confidence, 95.0),
        'reasons': reasons
    }
