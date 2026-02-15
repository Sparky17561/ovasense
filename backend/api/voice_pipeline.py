"""
Voice processing module for Baymax AI assistant.
Uses Groq API, Whisper (CPU), and Kokoro TTS for fast server-side voice processing.
"""

import os
import tempfile
import numpy as np
from faster_whisper import WhisperModel
from kokoro import KPipeline

# Disable GPU to avoid cuDNN issues
os.environ["CT2_USE_ONNX"] = "0"
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["ORT_DISABLE_GPU"] = "1"

# Load settings from environment
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
KOKORO_VOICE = os.getenv("KOKORO_VOICE", "af_bella")
KOKORO_SR = 24000

# Lazy-loaded globals
_whisper = None
_groq_client = None
_kokoro = None
_baymax_prompt = None


def load_system_prompt():
    """Load Baymax persona from prompt.txt"""
    global _baymax_prompt
    if _baymax_prompt:
        return _baymax_prompt
    
    try:
        prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompt.txt')
        with open(prompt_path, "r", encoding="utf-8") as f:
            _baymax_prompt = f.read().strip()
            print("✔ Loaded Baymax persona from prompt.txt")
    except Exception as e:
        print(f"⚠ Error loading prompt.txt: {e}")
        _baymax_prompt = "You are Baymax, a gentle medical logging assistant for PCOS symptom tracking."
    
    return _baymax_prompt


def load_whisper():
    """Lazy-load Whisper model (CPU)"""
    global _whisper
    if _whisper:
        return _whisper
    
    print("🧠 Loading Whisper (CPU)...")
    _whisper = WhisperModel(
        WHISPER_MODEL,
        device="cpu",
        compute_type="float32"
    )
    print("✔ Whisper loaded")
    return _whisper


def load_groq():
    """Lazy-load Groq client"""
    global _groq_client
    if _groq_client:
        return _groq_client
    
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set in .env file")
    
    print("🔗 Connecting to Groq...")
    from groq import Groq
    _groq_client = Groq(api_key=GROQ_API_KEY)
    print("✔ Groq connected")
    return _groq_client


def load_kokoro():
    """Lazy-load Kokoro TTS"""
    global _kokoro
    if _kokoro:
        return _kokoro
    
    print("🔊 Loading Kokoro TTS (CPU)...")
    _kokoro = KPipeline(lang_code="a")
    print("✔ Kokoro loaded")
    return _kokoro


def transcribe_audio(audio_file_path):
    """
    Transcribe audio file using Whisper.
    
    Args:
        audio_file_path: Path to audio file (any format supported by ffmpeg)
        
    Returns:
        str: Transcribed text
    """
    whisper = load_whisper()
    
    print(f"🧠 Transcribing audio from {audio_file_path}...")
    
    segments, info = whisper.transcribe(audio_file_path)
    text = "".join([seg.text for seg in segments]).strip()
    
    print(f"📝 Transcript: {text}")
    return text


def extract_symptom_data(conversation_history):
    """
    Extract symptom data from the entire conversation using Groq.
    Returns partial or complete data.
    """
    groq_client = load_groq()
    
    # Build conversation text
    conv_text = "\n".join([
        f"{'User' if msg.get('sender') == 'user' else 'Baymax'}: {msg.get('text', '')}"
        for msg in conversation_history
    ])
    
    extraction_prompt = f"""You are a data extraction AI. Extract PCOS symptom data from this conversation.

Required fields (extract only if mentioned, including negatives):
1. cycle_gap_days (int): Days since last period
2. periods_regular (bool): Are periods irregular/unpredictable? (true=regular, false=irregular)
3. longest_cycle_gap_last_year (int): Longest gap in days between periods in last year
4. acne (bool): Has acne/skin issues (true if present, false if explicitly denied)
5. hair_loss (bool): Hair thinning or loss from scalp
6. facial_hair_growth (bool): Excessive facial/body hair (hirsutism)
7. bmi (float): Calculate from height/weight if given
8. waist_cm (int): Waist circumference in cm
9. family_diabetes_history (bool): Parents/siblings with diabetes
10. sugar_cravings (bool): Cravings for sweets/sugar
11. weight_gain (bool): Unexplained weight gain
12. fatigue_after_meals (bool): Tiredness after eating
13. mood_swings (bool): Anxiety, depression, mood swings
14. dark_patches (bool): Dark skin patches
15. stress_level (int): 1-10
16. sleep_hours (float): Hours/night
17. heavy_bleeding (bool): Soaking through pads quickly / clots > quarter size
18. severe_pelvic_pain (bool): Debilitating pain
19. possible_pregnancy (bool): Could be pregnant?
20. pill_usage (bool): Recent birth control pill usage

Conversation:
{conv_text}

CRITICAL: Output ONLY a single line of valid JSON.
If a field is NOT mentioned at all (neither yes nor no), return null.
Format: {{"cycle_gap_days": <int>, "periods_regular": <bool>, "longest_cycle_gap_last_year": <int>, "acne": <bool>, "hair_loss": <bool>, "facial_hair_growth": <bool>, "bmi": <float>, "waist_cm": <int>, "family_diabetes_history": <bool>, "sugar_cravings": <bool>, "weight_gain": <bool>, "fatigue_after_meals": <bool>, "mood_swings": <bool>, "dark_patches": <bool>, "stress_level": <int>, "sleep_hours": <float>, "heavy_bleeding": <bool>, "severe_pelvic_pain": <bool>, "possible_pregnancy": <bool>, "pill_usage": <bool>}}

Conversation:
{conv_text}

CRITICAL: Output ONLY a single line of valid JSON. NO comments, NO explanations, NO notes.
If a field is NOT mentioned at all (neither yes nor no), return null.
Format: {{"cycle_gap_days": <int or null>, "acne": <true/false/null>, "bmi": <float or null>, "stress_level": <int or null>, "sleep_hours": <float or null>, "sugar_cravings": <bool>, "weight_gain": <bool>, "hair_loss": <bool>, "dark_patches": <bool>, "mood_swings": <bool>, "pill_usage": <bool>}}"""

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": extraction_prompt}],
            temperature=0.3,
            max_tokens=200
        )
        
        response_text = completion.choices[0].message.content.strip()
        print(f"🔍 Extraction response: {response_text}")
        
        # Extract and clean JSON
        import json
        import re
        
        # Find JSON block
        json_match = re.search(r'\{[^}]+\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            
            # Remove comments (both // and /* */ style)
            json_str = re.sub(r'//.*?$', '', json_str, flags=re.MULTILINE)  # Remove // comments
            json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)  # Remove /* */ comments
            
            # Parse cleaned JSON
            extracted = json.loads(json_str)
            print(f"✅ Extracted data: {extracted}")
            return extracted
        
        return {}
    except Exception as e:
        print(f"⚠️ Extraction error: {e}")
        return {}



def get_baymax_response(user_text, conversation_history=None, current_data=None):
    """
    Get Baymax response using Groq SDK.
    Never asks duplicate questions - checks what data is already collected.
    
    Args:
        user_text: User's input text
        conversation_history: Optional list of previous messages
        current_data: Dict of already collected data fields
        
    Returns:
        dict: {
            'response_text': str,
            'extracted_data': dict (partial or complete),
            'ready_for_classification': bool
        }
    """
    groq_client = load_groq()
    system_prompt = load_system_prompt()
    
    # Determine what's missing with exact values
    current_data = current_data or {}
    
    # Format current status clearly - treat None as MISSING
    # We must track ALL 20 fields strictly
    all_fields = [
        'cycle_gap_days', 'periods_regular', 'longest_cycle_gap_last_year',
        'acne', 'hair_loss', 'facial_hair_growth', 'bmi', 'waist_cm',
        'sugar_cravings', 'weight_gain', 'dark_patches', 'family_diabetes_history',
        'fatigue_after_meals', 'mood_swings', 'stress_level', 'sleep_hours',
        'heavy_bleeding', 'severe_pelvic_pain', 'possible_pregnancy', 'pill_usage'
    ]
    
    data_status = {}
    for field in all_fields:
        val = current_data.get(field)
        data_status[field] = val if val is not None else 'MISSING'
    
    missing_fields = [k for k, v in data_status.items() if v == 'MISSING']
    collected_fields = [k for k, v in data_status.items() if v != 'MISSING']
    
    # Enhanced prompt with EXACT data status
    context_prompt = system_prompt + f"""
    
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STATUS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COLLECTED: {collected_fields if collected_fields else "NONE"}
❌ MISSING (YOU MUST COLLECT THESE): {missing_fields if missing_fields else "ALL DONE"}

⚠️ CRITICAL INSTRUCTION:
You are in DATA COLLECTION MODE.
Your ONLY goal is to get values for the MISSING fields above.
1. Look at the "MISSING" list.
2. Pick the top 1-2 most important fields from that list (Prioritize: Period Regularity > Androgen signs > Metabolic signs).
3. Ask the user SPECIFIC questions to get those details.
4. DO NOT provide advice or analysis yet.
5. If the user mentions a RED FLAG (heavy bleeding, pain), STOP and advise a doctor.

Example: If 'acne' and 'weight_gain' are missing, ask: "Have you noticed any changes in your skin like acne, or any unexplained weight gain?"
"""
    
    # Build conversation messages
    messages = [
        {"role": "system", "content": context_prompt}
    ]
    
    # Add conversation history
    if conversation_history:
        for msg in conversation_history[-10:]:
            role = "user" if msg.get('sender') == 'user' else "assistant"
            messages.append({"role": role, "content": msg.get('text', '')})
    
    # Add current user message
    messages.append({"role": "user", "content": user_text})
    
    print(f"🤖 Getting Baymax response... (missing: {missing_fields})")
    
    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=512
        )
        
        response_text = completion.choices[0].message.content.strip()
        print(f"💬 Baymax: {response_text}")
        
        # Extract data from full conversation
        full_history = (conversation_history or []) + [
            {'sender': 'user', 'text': user_text},
            {'sender': 'assistant', 'text': response_text}
        ]
        extracted_data = extract_symptom_data(full_history)
        
        # Merge with current data
        merged_data = {**current_data}
        for key, value in extracted_data.items():
            if value is not None:
                merged_data[key] = value
        
        # STRICT COMPLETION CHECK
        # Recalculate missing based on merged_data
        still_missing = [f for f in all_fields if merged_data.get(f) is None]
        
        # Ready only if NOTHING is missing
        is_complete = len(still_missing) == 0
        
        print(f"📊 Merged data: {merged_data}, Complete: {is_complete}")
        
        return {
            'response_text': response_text,
            'extracted_data': merged_data,
            'ready_for_classification': is_complete
        }
        
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {
            'response_text': "I apologize, but I'm having trouble processing your request right now.",
            'extracted_data': current_data,
            'ready_for_classification': False
        }


def generate_speech(text):
    """
    Generate speech audio from text using Kokoro TTS.
    
    Args:
        text: Text to convert to speech
        
    Returns:
        tuple: (audio_array, samplerate)
    """
    pipeline = load_kokoro()
    
    print("🔊 Generating speech...")
    audio_chunks = []
    
    for _, _, audio in pipeline(text, voice=KOKORO_VOICE):
        audio_chunks.append(audio)
    
    if audio_chunks:
        audio = np.concatenate(audio_chunks)
        print(f"✔ Generated {len(audio) / KOKORO_SR:.2f}s of audio")
        return audio, KOKORO_SR
    else:
        # Return silence if generation failed
        return np.zeros(int(KOKORO_SR * 0.5)), KOKORO_SR


def process_voice_input(audio_file_path, conversation_history=None, current_data=None):
    """
    Complete voice processing pipeline with intelligent data extraction.
    
    Returns:
        dict: {
            'transcript': str,
            'response_text': str,
            'response_audio': numpy.array,
            'audio_samplerate': int,
            'extracted_data': dict (partial or complete),
            'ready_for_classification': bool
        }
    """
    try:
        # Step 1: Transcribe
        transcript = transcribe_audio(audio_file_path)
        
        if not transcript.strip():
            return {
                'transcript': '',
                'response_text': 'I did not hear anything. Could you please speak again?',
                'response_audio': None,
                'audio_samplerate': KOKORO_SR,
                'extracted_data': current_data or {},
                'ready_for_classification': False
            }
        
        # Step 2: Get response with data extraction
        baymax_result = get_baymax_response(transcript, conversation_history, current_data)
        response_text = baymax_result['response_text']
        
        # Step 3: Generate speech
        response_audio, audio_sr = generate_speech(response_text)
        
        return {
            'transcript': transcript,
            'response_text': response_text,
            'response_audio': response_audio,
            'audio_samplerate': audio_sr,
            'extracted_data': baymax_result.get('extracted_data', {}),
            'ready_for_classification': baymax_result.get('ready_for_classification', False)
        }
        
        return {
            'transcript': transcript,
            'response_text': response_text,
            'response_audio': response_audio,
            'audio_samplerate': audio_sr,
            'extracted_data': baymax_result.get('extracted_data'),
            'ready_for_classification': baymax_result.get('ready_for_classification', False)
        }
        
    except Exception as e:
        print(f"Error in voice processing: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'transcript': '',
            'response_text': 'I apologize, but I encountered an error. Please try again.',
            'response_audio': None,
            'audio_samplerate': KOKORO_SR,
            'extracted_data': None,
            'ready_for_classification': False
        }
