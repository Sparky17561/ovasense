"""
Voice processing module for Baymax AI assistant.
Uses Groq API for text processing. Audio handling is offloaded to the frontend.
"""

import os
import json
import re
from datetime import datetime

# Load settings from environment
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# Lazy-loaded globals
_groq_client = None
_baymax_prompt = None


def load_system_prompt():
    """Load Baymax persona from prompt.txt"""
    global _baymax_prompt
    if _baymax_prompt:
        return _baymax_prompt
    
    _baymax_prompt = """You are Baymax, a compassionate and motivational mental health companion for OvaSense.
Your purpose is to provide emotional support, validate feelings, and gently encourage the user in their wellness journey.

CORE PERSONALITY:
- **Warm & Empathetic**: Use kind, soothing language. ("I am here for you.", "It is okay to feel this way.")
- **Motivational**: Offer gentle encouragement for small wins. ("You are doing your best, and that is enough.")
- **Human-Centric**: Speak naturally. NEVER use robotic phrases like "functioning within normal parameters" or "backend systems."
- **concise**: Keep spoken responses short (1-3 sentences) usually. BUT if asked for a diet plan/recipe, you may provide a structured list.

SCENARIOS:
1. **Mental Health**: If user says they are stressed/anxious, prioritize validation. "I hear you, and it's okay. You are handling so much."
2. **Period/PCOS**: Acknowledge symptoms with sympathy. "I'm sorry you're in pain. Your body is doing its best, and I've made a note of it."
3. **Diet Requests**: Provide a DETAILED **Indian-Context** diet plan based on their PCOS type. 
   - Suggest: Roti types (Jowar/Bajra vs Wheat), Dal, Sabzi, Curd, Chaas.
   - Avoid: High-sugar mithai, white rice (if insulin resistant), fried snacks.
   - Frame it POSITIVELY (`"Try Bajra Roti for better gut health"` instead of `"Don't eat wheat"`).
4. **General Chat**: Be a cheerleader! "I am proud of you for checking in today."

STRICTLY FORBIDDEN:
- Technical jargon (servers, backend, databases, parameters).
- Western-only food suggestions (avocado toast, kale smoothies) unless asked.
- Negative or judgmental language.
- Acting like a rigid computer program.
"""
    return _baymax_prompt


def load_groq():
    """Lazy-load Groq client"""
    global _groq_client
    if _groq_client:
        return _groq_client
    
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set in .env file")
    
    from groq import Groq
    _groq_client = Groq(api_key=GROQ_API_KEY)
    return _groq_client


def extract_symptom_data(conversation_history):
    """
    Extract structured data (symptoms, period logs, diet requests) from conversation.
    """
    groq_client = load_groq()
    
    conv_text = "\n".join([
        f"{'User' if msg.get('sender') == 'user' else 'Baymax'}: {msg.get('text', '')}"
        for msg in conversation_history
    ])
    
    extraction_prompt = f"""You are a data extraction AI. Extract health data from this conversation.

REQUIRED FIELDS:
1. **period_start_date** (str|null): "YYYY-MM-DD" if user says "started period today/yesterday/etc".
2. **period_end_date** (str|null): "YYYY-MM-DD" if user says "period ended today/yesterday/etc".
3. **diet_request** (bool): Did user ask for specific food advice?
4. **mental_state** (str|null): "stressed", "anxious", "sad", "happy", etc.
5. **symptoms** (dict): Any PCOS symptoms mentioned (acne, pain, weight_gain, etc.) as key:value.

Conversation:
{conv_text}

NOTE: today is {datetime.now().strftime('%Y-%m-%d')}. Calculate specific dates based on this.

Output valid JSON only.
Format: {{"period_start_date": "2023-10-27", "period_end_date": null, "diet_request": false, "mental_state": "anxious", "symptoms": {{}}}}
"""

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": extraction_prompt}],
            temperature=0.1,
            max_tokens=256
        )
        
        response_text = completion.choices[0].message.content.strip()
        print(f"🔍 Extraction response: {response_text}")
        
        # Clean and parse JSON
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {}
    except Exception as e:
        print(f"⚠️ Extraction error: {e}")
        return {}


def get_baymax_response(user_text, conversation_history=None, current_data=None, user_context=None):
    """
    Get Baymax response using Groq.
    """
    groq_client = load_groq()
    system_prompt = load_system_prompt()
    
    # Inject user context if available
    if user_context:
        system_prompt += f"\n\nUSER CONTEXT:\n{user_context}\nUse this information to personalize your response (e.g. use their name, refer to their cycle). "

    # Build messages
    messages = [{"role": "system", "content": system_prompt}]
    
    if conversation_history:
        for msg in conversation_history[-6:]: # Keep context short
            role = "user" if msg.get('sender') == 'user' else "assistant"
            messages.append({"role": role, "content": msg.get('text', '')})
            
    messages.append({"role": "user", "content": user_text})
    
    print(f"🤖 Getting Baymax response...")
    print(f"📤 [DEBUG] SENT TO GROQ:\n{json.dumps(messages, indent=2)}")
    
    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=256 # Keep replies concise
        )
        
        response_text = completion.choices[0].message.content.strip()
        print(f"💬 Baymax: {response_text}")
        
        # Extract data from just this turn (heuristic for speed)
        full_history = (conversation_history or []) + [
            {'sender': 'user', 'text': user_text},
            {'sender': 'assistant', 'text': response_text}
        ]
        
        extracted_data = extract_symptom_data(full_history)
        
        return {
            'response_text': response_text,
            'extracted_data': extracted_data,
            'ready_for_classification': False, 
            'missing_fields': []
        }
        
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {
            'response_text': "I am having trouble processing that right now.",
            'extracted_data': {},
        }
