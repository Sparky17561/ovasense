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


@api_view(['POST'])
def classify_symptoms(request):
    """
    POST /api/classify/
    
    Classify PCOS phenotype based on symptom data.
    Creates both SymptomLog and PhenotypeResult.
    
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
        "symptom_log_id": int,
        "phenotype": str,
        "confidence": float,
        "reasons": [str]
    }
    """
    # Validate and save symptom data
    symptom_serializer = SymptomLogSerializer(data=request.data)
    
    if not symptom_serializer.is_valid():
        return Response(
            symptom_serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    symptom_log = symptom_serializer.save()
    
    # Perform classification
    classification = classify_phenotype(request.data)
    
    # Save classification result
    result_data = {
        'symptom_log': symptom_log.id,
        'phenotype': classification['phenotype'],
        'confidence': classification['confidence'],
        'reasons': classification['reasons']
    }
    
    result_serializer = PhenotypeResultSerializer(data=result_data)
    
    if result_serializer.is_valid():
        phenotype_result = result_serializer.save()
        
        return Response({
            'symptom_log_id': symptom_log.id,
            'result_id': phenotype_result.id,
            'phenotype': phenotype_result.phenotype,
            'confidence': phenotype_result.confidence,
            'reasons': phenotype_result.reasons,
            'created_at': phenotype_result.created_at
        }, status=status.HTTP_201_CREATED)
    
    return Response(
        result_serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
def get_history(request):
    """
    GET /api/history/
    
    Retrieve all symptom logs with their classification results.
    
    Returns:
    [
        {
            "id": int,
            "cycle_gap_days": int,
            "acne": bool,
            "bmi": float,
            "stress_level": int,
            "sleep_hours": float,
            "created_at": datetime,
            "result": {
                "phenotype": str,
                "confidence": float,
                "reasons": [str]
            }
        }
    ]
    """
    symptom_logs = SymptomLog.objects.all()
    serializer = HistorySerializer(symptom_logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def download_report(request, result_id):
    """
    GET /api/report/<result_id>/
    
    Download PDF report for a specific phenotype result.
    
    Returns:
    PDF file as attachment
    """
    try:
        phenotype_result = PhenotypeResult.objects.get(id=result_id)
        symptom_log = phenotype_result.symptom_log
        
        # Generate PDF
        pdf_buffer = generate_pdf_report(symptom_log, phenotype_result)
        
        # Create HTTP response with PDF
        response = HttpResponse(
            pdf_buffer.getvalue(),
            content_type='application/pdf'
        )
        
        filename = f"OvaSense_Report_{result_id}_{symptom_log.created_at.strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except PhenotypeResult.DoesNotExist:
        return Response(
            {'error': 'Result not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def process_voice(request):
    """
    POST /api/voice/
    
    Process voice input: transcribe, get Baymax response, generate TTS.
    
    Request:
    - multipart/form-data with 'audio' file
    - optional 'conversation_history' JSON string
    
    Returns:
    {
        "transcript": str,
        "response_text": str,
        "response_audio": base64 string
    }
    """
    from .voice_pipeline import process_voice_input
    import json
    import tempfile
    import os
    
    if 'audio' not in request.FILES:
        return Response(
            {'error': 'No audio file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    audio_file = request.FILES['audio']
    
    # Get conversation history and current data from request
    conversation_history = []
    current_data = {}
    
    try:
        if 'conversation_history' in request.POST:
            conversation_history = json.loads(request.POST['conversation_history'])
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing conversation_history: {e}")
    
    try:
        if 'current_data' in request.POST:
            current_data = json.loads(request.POST['current_data'])
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing current_data: {e}")
    
    # Save uploaded file temporarily
    temp_audio_path = None
    try:
        # Create temporary file with proper extension
        file_extension = audio_file.name.split('.')[-1] if '.' in audio_file.name else 'webm'
        with tempfile.NamedTemporaryFile(suffix=f'.{file_extension}', delete=False) as temp_file:
            temp_audio_path = temp_file.name
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
        
        print(f"📁 Saved audio to {temp_audio_path}")
        
        # Process through voice pipeline with current collected data
        result = process_voice_input(temp_audio_path, conversation_history, current_data)
        
        # Convert response audio to WAV bytes and encode as base64
        import numpy as np
        import io
        import wave
        import base64
        
        response_audio_bytes = None
        if result['response_audio'] is not None:
            with io.BytesIO() as wav_io:
                with wave.open(wav_io, 'wb') as wav_file:
                    wav_file.setnchannels(1)
                    wav_file.setsampwidth(2)  # 16-bit
                    wav_file.setframerate(result['audio_samplerate'])
                    
                    # Convert float32 to int16
                    audio_int16 = (result['response_audio'] * 32767).astype(np.int16)
                    wav_file.writeframes(audio_int16.tobytes())
                
                response_audio_bytes = wav_io.getvalue()
        
        audio_base64 = base64.b64encode(response_audio_bytes).decode('utf-8') if response_audio_bytes else None
        
        return Response({
            'transcript': result['transcript'],
            'response_text': result['response_text'],
            'response_audio': audio_base64,
            'extracted_data': result.get('extracted_data'),
            'ready_for_classification': result.get('ready_for_classification', False)
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Voice processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        # Clean up temporary file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass

@api_view(['POST'])
def process_text(request):
    """
    POST /api/chat/
    
    Process text chat input: get Baymax response and extraction.
    
    Request:
    {
        "text": str,
        "conversation_history": list,
        "current_data": dict
    }
    
    Returns:
    {
        "response_text": str,
        "extracted_data": dict,
        "ready_for_classification": bool
    }
    """
    from .voice_pipeline import get_baymax_response
    
    try:
        user_text = request.data.get('text', '')
        conversation_history = request.data.get('conversation_history', [])
        current_data = request.data.get('current_data', {})
        
        if not user_text:
            return Response(
                {'error': 'No text provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        result = get_baymax_response(user_text, conversation_history, current_data)
        
        return Response({
            'response_text': result['response_text'],
            'extracted_data': result.get('extracted_data'),
            'ready_for_classification': result.get('ready_for_classification', False)
        })
        
    except Exception as e:
        print(f"Error in text chat: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
