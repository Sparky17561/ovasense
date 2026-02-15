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

Required fields (extract only if mentioned):
1. cycle_gap_days (int): Days since last period
   - "60 days" = 60
   - "2 months" or "over 2 months" = 60
   - "3 months" or "over 3 months" = 90
   - "4 months" = 120
2. acne (bool): Has acne/skin issues (any mention of skin problems, acne, breakouts = true)
3. bmi (float): Calculate from height/weight if given (e.g., 5'11" and 100kg = 31.8), or accept direct BMI values
4. stress_level (int, 1-10): Stress rating (can be decimals like 9.5, round to 10)
5. sleep_hours (float): Hours of sleep per night (can extract from "I used to get 8, now 4-5" = 4.5)

Conversation:
{conv_text}

CRITICAL: Output ONLY a single line of valid JSON. NO comments, NO explanations, NO notes.
Format: {{"cycle_gap_days": <int or null>, "acne": <true/false/null>, "bmi": <float or null>, "stress_level": <int or null>, "sleep_hours": <float or null>}}"""

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
    
    # Format current status clearly
    data_status = {
        'cycle_gap_days': current_data.get('cycle_gap_days', 'MISSING'),
        'acne': current_data.get('acne', 'MISSING'),
        'bmi': current_data.get('bmi', 'MISSING'),
        'stress_level': current_data.get('stress_level', 'MISSING'),
        'sleep_hours': current_data.get('sleep_hours', 'MISSING')
    }
    
    missing_fields = [k for k, v in data_status.items() if v == 'MISSING']
    collected_fields = [k for k, v in data_status.items() if v != 'MISSING']
    
    # Enhanced prompt with EXACT data status
    context_prompt = system_prompt + f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CURRENT DATA STATUS (EXACT VALUES):
{chr(10).join([f"✅ {k}: {v}" if v != 'MISSING' else f"❌ {k}: NOT YET COLLECTED" for k, v in data_status.items()])}

COLLECTED: {collected_fields if collected_fields else "NONE"}
STILL NEED: {missing_fields if missing_fields else "ALL DATA COLLECTED!"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL RULES:
1. ONLY ask about fields marked "NOT YET COLLECTED"
2. NEVER ask about fields with actual values
3. Ask about ONE missing field per response
4. If NO missing fields, say you're analyzing and wrap up
5. Be natural and conversational
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
        
        # Check if complete
        is_complete = all([
            merged_data.get('cycle_gap_days'),
            merged_data.get('acne') is not None,
            merged_data.get('bmi'),
            merged_data.get('stress_level'),
            merged_data.get('sleep_hours')
        ])
        
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
