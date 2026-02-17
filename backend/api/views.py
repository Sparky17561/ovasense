from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import HttpResponse
from .models import SymptomLog, PhenotypeResult
from .serializers import (
    SymptomLogSerializer,
    PhenotypeResultSerializer,
    HistorySerializer
)
from .ml_engine import classify_phenotype
from .report import generate_pdf_report
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view

# Load environment variables
from dotenv import load_dotenv
load_dotenv()


@api_view(['POST'])
def log_symptoms(request):
    """
    POST /api/log/
    
    Save symptom data to database.
    
    Request body:
    {
        "cycle_gap_days": int,
        "acne": bool,
        "bmi": float,
        "stress_level": int,
        "sleep_hours": float
    }
    
    Returns:
    {
        "id": int,
        "cycle_gap_days": int,
        ...
        "created_at": datetime
    }
    """
    serializer = SymptomLogSerializer(data=request.data)
    
    if serializer.is_valid():
        symptom_log = serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import os, json
from groq import Groq

from .serializers import SymptomLogSerializer, PhenotypeResultSerializer
from .ml_engine import classify_phenotype
# ================================================================
# CLASSIFY PCOS SYMPTOMS VIEW
# ================================================================

import os
import json

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt

from groq import Groq

from .serializers import SymptomLogSerializer, PhenotypeResultSerializer
from .ml_engine import classify_phenotype


# ================================================================
# API ENDPOINT
# ================================================================
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import HttpResponse
from .models import SymptomLog, PhenotypeResult
from .serializers import (
    SymptomLogSerializer,
    PhenotypeResultSerializer,
    HistorySerializer
)
from .ml_engine import classify_phenotype
from .report import generate_pdf_report
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view

from dotenv import load_dotenv
load_dotenv()


# ================================================================
# LOG SYMPTOMS
# ================================================================

@api_view(['POST'])
def log_symptoms(request):
    serializer = SymptomLogSerializer(data=request.data)
    if serializer.is_valid():
        symptom_log = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ================================================================
# CLASSIFY PCOS SYMPTOMS
# ================================================================

import os
import json
from groq import Groq


@csrf_exempt
@api_view(['POST'])
def classify_symptoms(request):
    """
    POST /api/classify/

    ✔ Saves symptom data
    ✔ Runs ML phenotype engine
    ✔ Runs Groq AI explanation + diet
    ✔ Saves phenotype result WITH ai_explanation + diet_plan   ← FIXED
    ✔ Returns full predictive response
    """

    # ── 1. VALIDATE + SAVE SYMPTOMS ──────────────────────────────
    serializer = SymptomLogSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    symptom_log = serializer.save()

    # ── 2. RUN ML ENGINE ─────────────────────────────────────────
    try:
        classification = classify_phenotype(request.data) or {}
    except Exception as e:
        print("ML Engine Error:", e)
        classification = {}

    classification.setdefault("phenotype", "Assessment Inconclusive")
    classification.setdefault("confidence", 50)
    classification.setdefault("reasons", ["No explanation available"])
    classification.setdefault("data_quality_score", None)
    classification.setdefault("rule_version", "unknown")
    classification.setdefault("differential_diagnosis", None)
    classification.setdefault("future_risk_score", None)
    classification.setdefault("mixed_pcos_types", [])
    classification.setdefault("recommended_lab_tests", [])
    classification.setdefault("priority_lifestyle_changes", [])

    # ── 3. GROQ AI ANALYSIS ──────────────────────────────────────
    ai_explanation = ""
    diet_plan = ""

    try:
        api_key = os.environ.get("GROQ_API_KEY")

        if api_key:
            client = Groq(api_key=api_key)

            symptom_summary = json.dumps(
                {k: v for k, v in request.data.items() if v is not None},
                indent=2
            )

            ai_prompt = f"""You are an expert PCOS endocrinologist.

Patient phenotype: {classification['phenotype']}
Confidence: {classification['confidence']}%

Symptoms:
{symptom_summary}

Reasons: {'; '.join(classification['reasons'])}

Return TWO SECTIONS:

SECTION 1 - ANALYSIS
Explain why this phenotype.

SECTION 2 - DIET PLAN
Give personalized diet advice.
"""

            chat = client.chat.completions.create(
                model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
                messages=[{"role": "user", "content": ai_prompt}],
                temperature=0.4,
                max_tokens=1200,
            )

            full_response = chat.choices[0].message.content or ""

            if "SECTION 2" in full_response:
                parts = full_response.split("SECTION 2")
                ai_explanation = parts[0].replace("SECTION 1", "").strip()
                diet_plan = parts[1].strip()
            else:
                ai_explanation = full_response
                diet_plan = "Diet plan unavailable."

        else:
            ai_explanation = "GROQ_API_KEY missing. AI analysis skipped."
            diet_plan = "Diet plan unavailable."

    except Exception as e:
        print("Groq AI error:", e)
        ai_explanation = "AI analysis unavailable."
        diet_plan = "Diet plan generation failed."

    # ── 4. SAVE RESULT  ──────────────────────────────────────────
    # ✅ FIXED: ai_explanation and diet_plan are now included in
    #    result_data so they get persisted to the database.
    #    Previously they were only returned in the response but
    #    never saved, so /history/ could never return them.
    result_data = {
        "symptom_log":          symptom_log.id,
        "phenotype":            classification["phenotype"],
        "confidence":           classification["confidence"],
        "reasons":              classification["reasons"],
        "data_quality_score":   classification["data_quality_score"],
        "rule_version":         classification["rule_version"],
        "differential_diagnosis": classification["differential_diagnosis"],
        "ai_explanation":       ai_explanation,   # ✅ NOW SAVED
        "diet_plan":            diet_plan,         # ✅ NOW SAVED
    }

    result_serializer = PhenotypeResultSerializer(data=result_data)
    if not result_serializer.is_valid():
        return Response(result_serializer.errors, status=400)

    phenotype_result = result_serializer.save()

    # ── 5. FINAL RESPONSE ────────────────────────────────────────
    return Response({
        "symptom_log_id":           symptom_log.id,
        "result_id":                phenotype_result.id,

        "phenotype":                phenotype_result.phenotype,
        "confidence":               phenotype_result.confidence,
        "reasons":                  phenotype_result.reasons,

        "ai_explanation":           phenotype_result.ai_explanation,
        "diet_plan":                phenotype_result.diet_plan,

        "future_risk_score":        classification["future_risk_score"],
        "mixed_pcos_types":         classification["mixed_pcos_types"],
        "recommended_lab_tests":    classification["recommended_lab_tests"],
        "priority_lifestyle_changes": classification["priority_lifestyle_changes"],

        "data_quality_score":       classification["data_quality_score"],
        "differential_diagnosis":   classification["differential_diagnosis"],
        "created_at":               phenotype_result.created_at,

    }, status=status.HTTP_201_CREATED)


# ================================================================
# GET HISTORY
# ================================================================

@api_view(['GET'])
def get_history(request):
    """
    GET /api/history/

    Returns all symptom logs with their classification results.
    The nested `result` object now includes ai_explanation + diet_plan
    because they are saved to the DB in classify_symptoms above.
    """
    symptom_logs = SymptomLog.objects.all().order_by('-created_at')
    serializer = HistorySerializer(symptom_logs, many=True)
    return Response(serializer.data)


# ================================================================
# DOWNLOAD REPORT
# ================================================================

@api_view(['GET'])
def download_report(request, result_id):
    """
    GET /api/report/<result_id>/

    Download PDF report. Reuses ai_explanation + diet_plan already
    saved in the DB — no need to regenerate via Groq.
    """
    try:
        phenotype_result = PhenotypeResult.objects.get(id=result_id)
        symptom_log = phenotype_result.symptom_log

        # ✅ Use what's already stored — avoid an extra Groq call
        ai_explanation = phenotype_result.ai_explanation or ""
        diet_plan      = phenotype_result.diet_plan or ""

        # If for some reason they're empty (old records), regenerate
        if not ai_explanation:
            try:
                client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
                symptom_fields = {}
                for f in [
                    'cycle_gap_days', 'bmi', 'stress_level', 'sleep_hours',
                    'waist_cm', 'acne', 'hair_loss', 'facial_hair_growth',
                    'weight_gain', 'mood_swings', 'sugar_cravings',
                    'dark_patches', 'periods_regular', 'family_diabetes_history'
                ]:
                    val = getattr(symptom_log, f, None)
                    if val is not None:
                        symptom_fields[f] = val

                prompt = f"""You are an expert PCOS endocrinologist.
Patient classified as: {phenotype_result.phenotype} ({phenotype_result.confidence}% confidence).
Symptom data: {json.dumps(symptom_fields)}
Key factors: {'; '.join(phenotype_result.reasons or [])}

Provide TWO clearly separated sections:

SECTION 1 - DETAILED ANALYSIS:
Why this PCOS type, root cause mechanism, hormonal explanation.

SECTION 2 - PERSONALIZED DIET PLAN:
Foods to eat and avoid, meal timing, supplements.
"""
                chat = client.chat.completions.create(
                    model=os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile'),
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=2000,
                    temperature=0.4,
                )
                full = chat.choices[0].message.content or ""
                if "SECTION 2" in full:
                    parts = full.split("SECTION 2")
                    ai_explanation = parts[0].replace("SECTION 1", "").strip()
                    diet_plan = parts[1].strip()
                else:
                    ai_explanation = full

                # Save for next time
                PhenotypeResult.objects.filter(id=result_id).update(
                    ai_explanation=ai_explanation,
                    diet_plan=diet_plan,
                )

            except Exception as e:
                print(f"Report AI regeneration error: {e}")

        pdf_buffer = generate_pdf_report(
            symptom_log, phenotype_result, ai_explanation, diet_plan
        )

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f"OvaSense_Report_{result_id}_{symptom_log.created_at.strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except PhenotypeResult.DoesNotExist:
        return Response({'error': 'Result not found'}, status=status.HTTP_404_NOT_FOUND)


# ================================================================
# TEXT CHAT (Baymax)
# ================================================================

@api_view(['POST'])
def process_text(request):
    from .voice_pipeline import get_baymax_response

    try:
        user_text          = request.data.get('text', '')
        conversation_history = request.data.get('conversation_history', [])
        current_data       = request.data.get('current_data', {})

        if not user_text:
            return Response({'error': 'No text provided'}, status=status.HTTP_400_BAD_REQUEST)

        result = get_baymax_response(user_text, conversation_history, current_data)

        return Response({
            'response_text':          result['response_text'],
            'extracted_data':         result.get('extracted_data'),
            'ready_for_classification': result.get('ready_for_classification', False),
            'missing_fields':         result.get('missing_fields', [])
        })

    except Exception as e:
        print(f"Error in text chat: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['POST'])
# @parser_classes([MultiPartParser, FormParser])
# def process_voice(request):
#     """
#     POST /api/voice/
    
#     Process voice input: transcribe, get Baymax response, generate TTS.
    
#     Request:
#     - multipart/form-data with 'audio' file
#     - optional 'conversation_history' JSON string
    
#     Returns:
#     {
#         "transcript": str,
#         "response_text": str,
#         "response_audio": base64 string
#     }
#     """
#     # from .voice_pipeline import process_voice_input
#     import json
#     import tempfile
#     import os
    
#     if 'audio' not in request.FILES:
#         return Response(
#             {'error': 'No audio file provided'},
#             status=status.HTTP_400_BAD_REQUEST
#         )
    
#     audio_file = request.FILES['audio']
    
#     # Get conversation history and current data from request
#     conversation_history = []
#     current_data = {}
    
#     try:
#         if 'conversation_history' in request.POST:
#             conversation_history = json.loads(request.POST['conversation_history'])
#     except (json.JSONDecodeError, ValueError) as e:
#         print(f"Error parsing conversation_history: {e}")
    
#     try:
#         if 'current_data' in request.POST:
#             current_data = json.loads(request.POST['current_data'])
#     except (json.JSONDecodeError, ValueError) as e:
#         print(f"Error parsing current_data: {e}")
    
#     # Save uploaded file temporarily
#     temp_audio_path = None
#     try:
#         # Create temporary file with proper extension
#         file_extension = audio_file.name.split('.')[-1] if '.' in audio_file.name else 'webm'
#         with tempfile.NamedTemporaryFile(suffix=f'.{file_extension}', delete=False) as temp_file:
#             temp_audio_path = temp_file.name
#             for chunk in audio_file.chunks():
#                 temp_file.write(chunk)
        
#         print(f"📁 Saved audio to {temp_audio_path}")
        
#         # Process through voice pipeline with current collected data
#         result = process_voice_input(temp_audio_path, conversation_history, current_data)
        
#         # Convert response audio to WAV bytes and encode as base64
#         import numpy as np
#         import io
#         import wave
#         import base64
        
#         response_audio_bytes = None
#         if result['response_audio'] is not None:
#             with io.BytesIO() as wav_io:
#                 with wave.open(wav_io, 'wb') as wav_file:
#                     wav_file.setnchannels(1)
#                     wav_file.setsampwidth(2)  # 16-bit
#                     wav_file.setframerate(result['audio_samplerate'])
                    
#                     # Convert float32 to int16
#                     audio_int16 = (result['response_audio'] * 32767).astype(np.int16)
#                     wav_file.writeframes(audio_int16.tobytes())
                
#                 response_audio_bytes = wav_io.getvalue()
        
#         audio_base64 = base64.b64encode(response_audio_bytes).decode('utf-8') if response_audio_bytes else None
        
#         return Response({
#             'transcript': result['transcript'],
#             'response_text': result['response_text'],
#             'response_audio': audio_base64,
#             'extracted_data': result.get('extracted_data'),
#             'ready_for_classification': result.get('ready_for_classification', False),
#             'missing_fields': result.get('missing_fields', [])
#         })
        
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return Response(
#             {'error': f'Voice processing failed: {str(e)}'},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
#     finally:
#         # Clean up temporary file
#         if temp_audio_path and os.path.exists(temp_audio_path):
#             try:
#                 os.remove(temp_audio_path)
#             except:
#                 pass
