import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovasense_backend.settings')
django.setup()

# Force UTF-8 for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from api.ml_engine import classify_phenotype

def run_tests():
    print("🏥 Running Medical Logic Verification...\n")
    
    test_cases = [
        {
            "name": "🔴 Red Flag: Heavy Bleeding",
            "data": {
                "heavy_bleeding": True,
                "cycle_gap_days": 28
            },
            "expected_phenotype": "Medical Attention Required",
            "check": lambda r: "Red flag symptoms detected" in r['reasons'][0]
        },
        {
            "name": "🟢 Low Risk (Healthy)",
            "data": {
                "cycle_gap_days": 28,
                "periods_regular": True,
                "acne": False,
                "bmi": 21
            },
            "expected_phenotype": "Low Likelihood of PCOS",
            "check": lambda r: r['confidence'] > 60
        },
        {
            "name": "🟡 Insufficient Evidence (Only Irregular Cycles)",
            "data": {
                "cycle_gap_days": 50, # > 45d is dysfunctional
                "periods_regular": False,
                "acne": False,
                "bmi": 22
            },
            "expected_phenotype": "Possible PCOS Risk (Insufficient Evidence)",
            "check": lambda r: "Met only 1 of 3 key criteria" in r['reasons'][0]
        },
        {
            "name": "🩸 Insulin-Resistant Phenotype (Strict)",
            "data": {
                "cycle_gap_days": 60, # Crit 1
                "dark_patches": True, # Crit 3 (Metabolic) & Phenotype trigger
                "bmi": 28, # Crit 3 (>= 27)
                "acne": True, # Crit 2
                "sugar_cravings": True,
                "stress_level": 5, # Completeness
                "periods_regular": False # Completeness
            },
            # Meets 3 criteria + Insulin signs
            "expected_phenotype": "Insulin-Resistant PCOS (Likely)",
            "check": lambda r: r['confidence'] >= 40 # Lower confidence due to missing fields? No, I added some.
        },
        {
            "name": "🔥 Inflammatory Phenotype",
            "data": {
                "cycle_gap_days": 35,
                "periods_regular": False, # Crit 1
                "acne": True, # Crit 2
                "mood_swings": True, # Inflammatory sign
                "fatigue_after_meals": True, # Inflammatory sign
                "bmi": 22,
                "stress_level": 5
            },
            "expected_phenotype": "Inflammatory PCOS (Likely)",
            "check": lambda r: "inflammation" in str(r['reasons'])
        },
        {
            "name": "💪 Lean PCOS (New)",
            "data": {
                "cycle_gap_days": 50, # Crit 1
                "periods_regular": False,
                "bmi": 20, # < 24
                "facial_hair_growth": True, # Crit 2
                "acne": True,
                "stress_level": 4
            },
            "expected_phenotype": "Lean PCOS (Likely)",
            "check": lambda r: "Normal BMI" in str(r['reasons'])
        },
        {
            "name": "🧠 Adrenal Phenotype (High Stress)",
            "data": {
                "cycle_gap_days": 40, # Crit 1
                "periods_regular": False,
                "stress_level": 8, # >= 7
                "sleep_hours": 4, # <= 5
                "bmi": 22, # < 25
                "facial_hair_growth": True, # Crit 2
                "acne": False
            },
            "expected_phenotype": "Adrenal PCOS (Likely)",
            "check": lambda r: "High stress" in str(r['reasons'])
        },
        {
            "name": "⚖️ Classic PCOS (Mixed)",
            "data": {
                "cycle_gap_days": 60, # Crit 1
                "periods_regular": False,
                "facial_hair_growth": True, # Crit 2
                "bmi": 29, # Crit 3
                # Meets 3 criteria but doesn't fit specific phenotype perfectly? 
                # Actually, BMI 29 + no dark patches/sugar might miss Insulin type if strict?
                # Let's check fallback.
                "acne": False
            },
            "expected_phenotype": "PCOS Likely (Classic Phenotype)",
            "check": lambda r: r['confidence'] > 50
        }

    ]

    passed = 0
    for case in test_cases:
        print(f"Testing: {case['name']}...")
        result = classify_phenotype(case['data'])
        print(f"   -> Result: {result['phenotype']} ({result['confidence']}%)")
        print(f"   -> Reasons: {result['reasons']}")
        
        try:
            if result['phenotype'] == case['expected_phenotype'] and case['check'](result):
                print("   ✅ PASS\n")
                passed += 1
            else:
                print(f"   ❌ FAIL (Expected {case['expected_phenotype']})\n")
        except Exception as e:
            print(f"   ⚠️ ERROR IN CHECK: {e}\n")

    print(f"🏁 Results: {passed}/{len(test_cases)} passed.")
