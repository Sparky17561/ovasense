import sys
import os

# Redirect stdout to a file with UTF-8 encoding
with open('verification_results.txt', 'w', encoding='utf-8') as f:
    sys.stdout = f
    import test_medical_logic
    test_medical_logic.run_tests()

sys.stdout = sys.__stdout__
print("Verification complete. Results written to verification_results.txt")
