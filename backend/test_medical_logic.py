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
            "name": "🟢 Normal / Low Risk",
            "data": {
                "cycle_gap_days": 28,
                "periods_regular": True,
                "acne": False,
                "bmi": 21
            },
            "expected_phenotype": "Low Likelihood of PCOS",
            "check": lambda r: r['confidence'] > 80
        },
        {
            "name": "💊 Post-Pill Rebound (Simulated via Rule 1 if exists, otherwise Rotterdam)",
            "data": {
                "pill_usage": True,
                "cycle_gap_days": 45
            },
            # Note: My new logic doesn't have an explicit "Post-Pill" rule at the top level anymore, 
            # it falls into Rotterdam. Wait, I replaced the old logic completely. 
            # Let's see if it hits "Insufficient Evidence" (1 criterion: Irregular cycle) 
            # or "Likely" if other signs match.
            # Actually with just irregular cycles, it should be "Possible PCOS Risk".
            "expected_phenotype": "Possible PCOS Risk (Insufficient Evidence)", 
            "check": lambda r: "Met only 1 of 3 key criteria" in r['reasons'][0]
        },
        {
            "name": "🩸 Insulin-Resistant Phenotype (Classic)",
            "data": {
                "cycle_gap_days": 90, # Irregular (Crit 1)
                "dark_patches": True, # Metabolic (Crit 3 proxy)
                "bmi": 32, # Metabolic
                "acne": True, # Androgen (Crit 2)
                "sugar_cravings": True
            },
            # Meets all 3 criteria -> Likely -> Type A
            "expected_phenotype": "Insulin-Resistant PCOS (Likely)",
            "check": lambda r: r['confidence'] >= 80
        },
        {
            "name": "🔥 Inflammatory Phenotype",
            "data": {
                "cycle_gap_days": 35, # Borderline/Regular? Let's say Irregular
                "periods_regular": False, # Irregular (Crit 1)
                "acne": True, # Androgen (Crit 2)
                "mood_swings": True,
                "hair_loss": True,
                "bmi": 22, # Lean
                "fatigue_after_meals": True
            },
            # Meets Crit 1 & 2 -> Likely -> Type B (Inflammatory)
            "expected_phenotype": "Inflammatory PCOS (Likely)",
            "check": lambda r: "inflammation" in str(r['reasons'])
        },
        {
            "name": "🧠 Adrenal Phenotype",
            "data": {
                "cycle_gap_days": 40, # Irregular (Crit 1)
                "periods_regular": False,
                "stress_level": 9,
                "sleep_hours": 4,
                "bmi": 20, # Lean
                "facial_hair_growth": True # Androgen (Crit 2)
            },
            # Meets Crit 1 & 2 -> Likely -> Type C (Adrenal)
            "expected_phenotype": "Adrenal PCOS (Likely)",
            "check": lambda r: "High stress levels" in str(r['reasons'])
        }
    ]

    passed = 0
    for case in test_cases:
        print(f"Testing: {case['name']}...")
        result = classify_phenotype(case['data'])
        print(f"   -> Result: {result['phenotype']} ({result['confidence']}%)")
        print(f"   -> Reasons: {result['reasons']}")
        
        if result['phenotype'] == case['expected_phenotype'] and case['check'](result):
            print("   ✅ PASS\n")
            passed += 1
        else:
            print(f"   ❌ FAIL (Expected {case['expected_phenotype']})\n")

    print(f"🏁 Results: {passed}/{len(test_cases)} passed.")

if __name__ == "__main__":
    run_tests()
