import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovasense_backend.settings')
django.setup()

from api.ml_engine import classify_phenotype

def run_tests():
    print("🏥 Running Safety & Differential Diagnosis Logic Tests...\n")
    
    # Test 1: Red Flags (Should trigger immediate referral)
    print("Test 1: Red Flag Detection")
    red_flag_case = {'heavy_bleeding': True, 'bmi': 25}
    result = classify_phenotype(red_flag_case)
    assert result['phenotype'] == "Medical Attention Required", "Failed to detect red flag"
    print("✅ Passed: Red Flags detected correctly.\n")

    # Test 2: Differential Diagnosis (Thyroid Co-morbidity)
    print("Test 2: Differential Diagnosis (Thyroid)")
    thyroid_case = {
        'cycle_gap_days': 45, 'periods_regular': False, 'acne': True, # Would be PCOS
        'thyroid_history': True,
        'cycle_irregularity_duration_months': 12
    }
    result = classify_phenotype(thyroid_case)
    assert "Complex Case" in result['phenotype'], f"Failed to detect Complex Case. Got: {result['phenotype']}"
    assert "Thyroid History" in result['differential_diagnosis'], "Thyroid not in differential"
    print("✅ Passed: Thyroid history correctly identified as Complicating Factor.\n")

    # Test 3: Short Duration (Acute vs Chronic)
    print("Test 3: Acute vs Chronic (Short Duration)")
    acute_case = {
        'cycle_gap_days': 50, 'periods_regular': False, 'acne': True,
        'cycle_irregularity_duration_months': 2 # Less than 3 months
    }
    result = classify_phenotype(acute_case)
    assert "Temporary" in result['phenotype'], f"Failed to downgrade acute symptoms. Got: {result['phenotype']}"
    assert "Short duration" in result['differential_diagnosis'], "Short duration not flagged"
    print("✅ Passed: Short duration correctly downgraded.\n")

    # Test 4: Strict Rotterdam (2 Criteria Required)
    print("Test 4: Strict Rotterdam (1 vs 2 Criteria)")
    one_criteria_case = {'cycle_gap_days': 60, 'periods_regular': False, 'cycle_irregularity_duration_months': 12}
    result = classify_phenotype(one_criteria_case)
    assert result['phenotype'] == "Hormonal Imbalance (Not PCOS)", f"Failed to reject single criteria. Got: {result['phenotype']}"
    
    two_criteria_case = {
        'cycle_gap_days': 60, 'periods_regular': False, 
        'acne': True, # + Androgen
        'cycle_irregularity_duration_months': 12
    }
    result = classify_phenotype(two_criteria_case)
    assert "Likely PCOS" in result['phenotype'] or "PCOS Impact" in result['phenotype'], f"Failed to detect 2 criteria. Got: {result['phenotype']}"
    print("✅ Passed: Strict Rotterdam (2+ criteria) enforced.\n")

    # Test 5: Confidence Capping
    print("Test 5: Confidence Capping")
    perfect_case = {
        'cycle_gap_days': 60, 'periods_regular': False, 'acne': True, 'bmi': 30, 'waist_cm': 100,
        'cycle_irregularity_duration_months': 12,
        'stress_level': 5, 'sleep_hours': 8, 'hair_loss': True
    }
    result = classify_phenotype(perfect_case)
    assert result['confidence'] <= 85.0, f"Confidence too high ({result['confidence']}%). Should be capped at 85%."
    print(f"✅ Passed: Confidence capped at {result['confidence']}%.\n")

    # Test 6: Safety Disclaimer
    print("Test 6: Safety Disclaimer")
    assert "educational guidance" in result['reasons'][-1].lower(), "Missing safety disclaimer"
    print("✅ Passed: Disclaimer present.\n")
    
    print("🎉 All medical logic tests passed!")

if __name__ == "__main__":
    run_tests()
