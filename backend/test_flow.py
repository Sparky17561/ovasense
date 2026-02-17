import os
import sys
import django
from dotenv import load_dotenv

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovasense_backend.settings')
django.setup()

# Force UTF-8 for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

from api.voice_pipeline import get_baymax_response

def test_flow():
    print("🗣️ Starting Conversation Flow Test...\n")
    
    # simulate a new user
    history = []
    current_data = {}
    
    # Turn 1: User initiates
    user_input = "Hi Baymax, I think I have PCOS."
    print(f"User: {user_input}")
    
    response = get_baymax_response(user_input, history, current_data)
    print(f"Baymax: {response['response_text']}")
    print(f"Backend Missing Fields: {response.get('missing_fields')}")
    
    # Update state
    history.append({'sender': 'user', 'text': user_input})
    history.append({'sender': 'assistant', 'text': response['response_text']})
    current_data = response['extracted_data']
    
    # Turn 2: User answers cycle question (simulated)
    # Baymax likely asked about cycles.
    user_input = "My periods are very irregular, sometimes 45 days apart."
    print(f"\nUser: {user_input}")
    
    response = get_baymax_response(user_input, history, current_data)
    print(f"Baymax: {response['response_text']}")
    
    # Update state
    history.append({'sender': 'user', 'text': user_input})
    history.append({'sender': 'assistant', 'text': response['response_text']})
    current_data = response['extracted_data']
    
    # Turn 3: User answers androgen question
    user_input = "I have some acne on my chin, but no hair loss."
    print(f"\nUser: {user_input}")
    
    response = get_baymax_response(user_input, history, current_data)
    print(f"Baymax: {response['response_text']}")
    
    # Check if data is being filled
    print(f"\n📊 Current Data: {current_data}")
    
    # Calculate missing fields based on all_fields list (replicated from pipeline)
    all_fields = [
        'cycle_gap_days', 'periods_regular', 'longest_cycle_gap_last_year',
        'acne', 'hair_loss', 'facial_hair_growth', 'bmi', 'waist_cm',
        'sugar_cravings', 'weight_gain', 'dark_patches', 'family_diabetes_history',
        'fatigue_after_meals', 'mood_swings', 'stress_level', 'sleep_hours',
        'heavy_bleeding', 'severe_pelvic_pain', 'possible_pregnancy', 'pill_usage',
        'cycle_irregularity_duration_months', 'acne_duration_months', 'weight_gain_duration_months',
        'recent_major_stress_event', 'thyroid_history', 'recent_travel_or_illness', 'sudden_weight_change'
    ]
    missing = [f for f in all_fields if current_data.get(f) is None]
    print(f"❌ Missing: {missing}")

    if response['ready_for_classification']:
        print("\n✅ READY FOR CLASSIFICATION")
    else:
        print("\n❌ NOT READY YET (Correct behavior if fields missing)")

if __name__ == "__main__":
    with open('flow_results.txt', 'w', encoding='utf-8') as f:
        sys.stdout = f
        test_flow()
    sys.stdout = sys.__stdout__
    print("Flow test complete. Results written to flow_results.txt")
