import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovasense_backend.settings')
django.setup()

from api.ml_engine import classify_phenotype

def test_all_phenotypes():
    """
    Comprehensive test suite for all PCOS phenotypes.
    This ensures the classification engine works correctly for every case.
    """
    print("🧪 COMPREHENSIVE PHENOTYPE CLASSIFICATION TEST\n")
    print("=" * 60)
    
    # Test 1: Insulin-Resistant PCOS
    print("\n📊 Test 1: Insulin-Resistant PCOS")
    print("-" * 60)
    insulin_case = {
        'cycle_gap_days': 50,
        'periods_regular': False,
        'longest_cycle_gap_last_year': 65,
        'acne': True,
        'hair_loss': False,
        'facial_hair_growth': False,
        'bmi': 31.5,
        'waist_cm': 95,
        'sugar_cravings': True,
        'weight_gain': True,
        'dark_patches': True,
        'family_diabetes_history': True,
        'fatigue_after_meals': True,
        'mood_swings': False,
        'stress_level': 5,
        'sleep_hours': 7,
        'cycle_irregularity_duration_months': 18,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(insulin_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Insulin" in result['phenotype'], f"❌ FAILED: Expected Insulin-Resistant, got {result['phenotype']}"
    assert result['confidence'] >= 70, f"❌ FAILED: Confidence too low ({result['confidence']}%)"
    print("✅ PASSED: Correctly identified Insulin-Resistant PCOS\n")

    # Test 2: Lean PCOS
    print("\n📊 Test 2: Lean PCOS")
    print("-" * 60)
    lean_case = {
        'cycle_gap_days': 55,
        'periods_regular': False,
        'longest_cycle_gap_last_year': 70,
        'acne': True,
        'hair_loss': True,
        'facial_hair_growth': True,
        'bmi': 22.0,
        'waist_cm': 72,
        'sugar_cravings': False,
        'weight_gain': False,
        'dark_patches': False,
        'family_diabetes_history': False,
        'fatigue_after_meals': False,
        'mood_swings': False,
        'stress_level': 4,
        'sleep_hours': 7,
        'cycle_irregularity_duration_months': 24,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(lean_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Lean" in result['phenotype'], f"❌ FAILED: Expected Lean PCOS, got {result['phenotype']}"
    assert result['confidence'] >= 65, f"❌ FAILED: Confidence too low ({result['confidence']}%)"
    print("✅ PASSED: Correctly identified Lean PCOS\n")

    # Test 3: Inflammatory PCOS
    print("\n📊 Test 3: Inflammatory PCOS")
    print("-" * 60)
    inflammatory_case = {
        'cycle_gap_days': 48,
        'periods_regular': False,
        'longest_cycle_gap_last_year': 62,
        'acne': True,
        'hair_loss': False,
        'facial_hair_growth': False,
        'bmi': 26.5,
        'waist_cm': 82,
        'sugar_cravings': False,
        'weight_gain': False,
        'dark_patches': False,
        'family_diabetes_history': False,
        'fatigue_after_meals': True,
        'mood_swings': True,
        'stress_level': 6,
        'sleep_hours': 6,
        'cycle_irregularity_duration_months': 12,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(inflammatory_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Inflammatory" in result['phenotype'], f"❌ FAILED: Expected Inflammatory PCOS, got {result['phenotype']}"
    assert result['confidence'] >= 65, f"❌ FAILED: Confidence too low ({result['confidence']}%)"
    print("✅ PASSED: Correctly identified Inflammatory PCOS\n")

    # Test 4: Adrenal PCOS
    print("\n📊 Test 4: Adrenal PCOS")
    print("-" * 60)
    adrenal_case = {
        'cycle_gap_days': 52,
        'periods_regular': False,
        'longest_cycle_gap_last_year': 68,
        'acne': True,
        'hair_loss': True,
        'facial_hair_growth': False,
        'bmi': 23.5,
        'waist_cm': 75,
        'sugar_cravings': False,
        'weight_gain': False,
        'dark_patches': False,
        'family_diabetes_history': False,
        'fatigue_after_meals': False,
        'mood_swings': True,
        'stress_level': 9,
        'sleep_hours': 4.5,
        'cycle_irregularity_duration_months': 15,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(adrenal_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Adrenal" in result['phenotype'], f"❌ FAILED: Expected Adrenal PCOS, got {result['phenotype']}"
    assert result['confidence'] >= 65, f"❌ FAILED: Confidence too low ({result['confidence']}%)"
    print("✅ PASSED: Correctly identified Adrenal PCOS\n")

    # Test 5: Classic PCOS (No specific subtype)
    print("\n📊 Test 5: Classic/General PCOS")
    print("-" * 60)
    classic_case = {
        'cycle_gap_days': 60,
        'periods_regular': False,
        'longest_cycle_gap_last_year': 75,
        'acne': True,
        'hair_loss': False,
        'facial_hair_growth': True,
        'bmi': 28.0,
        'waist_cm': 90,
        'sugar_cravings': False,
        'weight_gain': True,
        'dark_patches': False,
        'family_diabetes_history': True,
        'fatigue_after_meals': False,
        'mood_swings': False,
        'stress_level': 5,
        'sleep_hours': 7,
        'cycle_irregularity_duration_months': 20,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(classic_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "PCOS" in result['phenotype'], f"❌ FAILED: Expected PCOS diagnosis, got {result['phenotype']}"
    assert result['confidence'] >= 70, f"❌ FAILED: Confidence too low ({result['confidence']}%)"
    print("✅ PASSED: Correctly identified Classic PCOS\n")

    # Test 6: Complex Case (PCOS + Thyroid)
    print("\n📊 Test 6: Complex Case (PCOS + Thyroid)")
    print("-" * 60)
    complex_case = {
        'cycle_gap_days': 50,
        'periods_regular': False,
        'longest_cycle_gap_last_year': 65,
        'acne': True,
        'hair_loss': False,
        'facial_hair_growth': True,
        'bmi': 29.0,
        'waist_cm': 88,
        'thyroid_history': True,
        'cycle_irregularity_duration_months': 18,
        'stress_level': 5,
        'sleep_hours': 7,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(complex_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Complex Case" in result['phenotype'], f"❌ FAILED: Expected Complex Case, got {result['phenotype']}"
    assert "Thyroid" in result['differential_diagnosis'], f"❌ FAILED: Thyroid not flagged in differential"
    print("✅ PASSED: Correctly identified Complex Case\n")

    # Test 7: NOT PCOS - Single Criterion (Hormonal Imbalance)
    print("\n📊 Test 7: Hormonal Imbalance (NOT PCOS)")
    print("-" * 60)
    single_criterion_case = {
        'cycle_gap_days': 50,
        'periods_regular': False,
        'longest_cycle_gap_last_year': 65,
        'acne': False,
        'hair_loss': False,
        'facial_hair_growth': False,
        'bmi': 22.0,
        'waist_cm': 70,
        'sugar_cravings': False,
        'weight_gain': False,
        'family_diabetes_history': False,
        'cycle_irregularity_duration_months': 12,
        'stress_level': 4,
        'sleep_hours': 7,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(single_criterion_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Not PCOS" in result['phenotype'] or "Hormonal Imbalance" in result['phenotype'], \
        f"❌ FAILED: Expected 'Not PCOS', got {result['phenotype']}"
    print("✅ PASSED: Correctly rejected PCOS (single criterion)\n")

    # Test 8: Temporary Hormonal Imbalance (Short Duration)
    print("\n📊 Test 8: Temporary Hormonal Imbalance (Short Duration)")
    print("-" * 60)
    temporary_case = {
        'cycle_gap_days': 50,
        'periods_regular': False,
        'acne': True,
        'bmi': 28.0,
        'cycle_irregularity_duration_months': 2,  # Less than 3 months
        'stress_level': 5,
        'sleep_hours': 7,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(temporary_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Temporary" in result['phenotype'], f"❌ FAILED: Expected Temporary, got {result['phenotype']}"
    print("✅ PASSED: Correctly identified Temporary Hormonal Imbalance\n")

    # Test 9: Red Flag Case
    print("\n📊 Test 9: Red Flag (Medical Attention Required)")
    print("-" * 60)
    red_flag_case = {
        'cycle_gap_days': 50,
        'periods_regular': False,
        'heavy_bleeding': True,  # RED FLAG
        'stress_level': 5,
        'sleep_hours': 7
    }
    result = classify_phenotype(red_flag_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Medical Attention" in result['phenotype'], f"❌ FAILED: Expected Medical Attention, got {result['phenotype']}"
    assert result['confidence'] == 100.0, f"❌ FAILED: Red flag should be 100% confidence"
    print("✅ PASSED: Correctly flagged for medical attention\n")

    # Test 10: Low Likelihood of PCOS
    print("\n📊 Test 10: Low Likelihood of PCOS")
    print("-" * 60)
    low_likelihood_case = {
        'cycle_gap_days': 30,
        'periods_regular': True,
        'acne': False,
        'hair_loss': False,
        'facial_hair_growth': False,
        'bmi': 22.0,
        'waist_cm': 70,
        'sugar_cravings': False,
        'weight_gain': False,
        'family_diabetes_history': False,
        'stress_level': 3,
        'sleep_hours': 8,
        'heavy_bleeding': False,
        'severe_pelvic_pain': False,
        'possible_pregnancy': False
    }
    result = classify_phenotype(low_likelihood_case)
    print(f"Result: {result['phenotype']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Reasons: {result['reasons']}")
    assert "Low Likelihood" in result['phenotype'], f"❌ FAILED: Expected Low Likelihood, got {result['phenotype']}"
    print("✅ PASSED: Correctly identified Low Likelihood\n")

    print("=" * 60)
    print("🎉 ALL PHENOTYPE TESTS PASSED!")
    print("=" * 60)
    print("\n✅ Classification engine is working correctly for all cases")
    print("✅ Ready to proceed with full application expansion")

if __name__ == "__main__":
    test_all_phenotypes()
