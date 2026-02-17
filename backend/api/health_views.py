"""
New API views for Full Health Companion features (Phase 2 Expansion).
Provides endpoints for:
- Period/cycle tracking
- Health metrics/trends
- Knowledge base articles
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from django.db.models import Avg, Max, Min
from .models import UserProfile, CycleRecord, HealthMetric, KnowledgeArticle
from .serializers import (
    UserProfileSerializer,
    CycleRecordSerializer,
    HealthMetricSerializer,
    KnowledgeArticleSerializer,
    KnowledgeArticleListSerializer
)


# ============================================================
# PERIOD TRACKING APIS
# ============================================================

@api_view(['POST'])
def log_cycle(request):
    """
    POST /api/cycle/log/
    Log a new menstrual cycle record.
    Auto-creates UserProfile if needed.
    """
    user_id = request.data.get('user')
    if not user_id:
        return Response({'error': 'user field required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Auto-create UserProfile if it doesn't exist
    profile, _ = UserProfile.objects.get_or_create(
        user_id=user_id,
        defaults={'name': user_id}
    )
    
    # Replace user string with actual FK id
    data = request.data.copy()
    data['user'] = profile.pk
    
    serializer = CycleRecordSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
def list_cycles(request):
    """
    GET /api/cycle/list/?user_id=<user_id>&limit=10
    Get menstrual cycle history for a user.
    """
    user_id = request.GET.get('user_id')
    limit = int(request.GET.get('limit', 10))
    
    if not user_id:
        return Response({'error': 'user_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    cycles = CycleRecord.objects.filter(user__user_id=user_id)[:limit]
    serializer = CycleRecordSerializer(cycles, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def predict_cycle(request):
    """
    GET /api/cycle/predict/?user_id=<user_id>
    Predict next period based on past 3 cycles.
    """
    user_id = request.GET.get('user_id')
    
    if not user_id:
        return Response({'error': 'user_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get last 3 actual (non-predicted) cycles
    cycles = CycleRecord.objects.filter(
        user__user_id=user_id,
        predicted=False
    ).order_by('-start_date')[:3]
    
    if cycles.count() < 2:
        return Response({
            'error': 'Need at least 2 cycles to make prediction',
            'next_period_date': None,
            'confidence': None
        })
    
    # Calculate average cycle length
    cycle_lengths = []
    sorted_cycles = list(cycles)
    sorted_cycles.reverse()  # Oldest first
    
    for i in range(len(sorted_cycles) - 1):
        days_between = (sorted_cycles[i+1].start_date - sorted_cycles[i].start_date).days
        cycle_lengths.append(days_between)
    
    avg_length = sum(cycle_lengths) / len(cycle_lengths)
    last_period = cycles[0].start_date
    predicted_date = last_period + timedelta(days=int(avg_length))
    
    # Calculate confidence based on cycle regularity
    std_dev = (sum((x - avg_length) ** 2 for x in cycle_lengths) / len(cycle_lengths)) ** 0.5
    confidence = max(50, min(95, 95 - (std_dev * 5)))  # Lower confidence for irregular cycles
    
    return Response({
        'next_period_date': predicted_date,
        'average_cycle_length': round(avg_length, 1),
        'confidence': round(confidence, 1),
        'days_until': (predicted_date - datetime.now().date()).days
    })


# ============================================================
# HEALTH METRICS APIS
# ============================================================

@api_view(['POST'])
def log_health_metric(request):
    """
    POST /api/health/metric/
    Log a health metric (weight, sleep, stress, etc.).
    """
    serializer = HealthMetricSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def health_trends(request):
    """
    GET /api/health/trends/?user_id=<user_id>&metric_type=weight&days=30
    Get health metric trends over time.
    """
    user_id = request.GET.get('user_id')
    metric_type = request.GET.get('metric_type', 'weight')
    days = int(request.GET.get('days', 30))
    
    if not user_id:
        return Response({'error': 'user_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    start_date = datetime.now().date() - timedelta(days=days)
    
    metrics = HealthMetric.objects.filter(
        user__user_id=user_id,
        metric_type=metric_type,
        date__gte=start_date
    ).order_by('date')
    
    serializer = HealthMetricSerializer(metrics, many=True)
    
    # Calculate trend stats
    values = [m.value for m in metrics]
    trend_data = {
        'metric_type': metric_type,
        'data_points': serializer.data,
        'average': round(sum(values) / len(values), 2) if values else 0,
        'min': min(values) if values else 0,
        'max': max(values) if values else 0,
        'latest': values[-1] if values else 0
    }
    
    return Response(trend_data)


@api_view(['GET'])
def health_summary(request):
    """
    GET /api/health/summary/?user_id=<user_id>
    Get dashboard summary of all health metrics (last 7 days).
    """
    user_id = request.GET.get('user_id')
    
    if not user_id:
        return Response({'error': 'user_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    start_date = datetime.now().date() - timedelta(days=7)
    
    summary = {}
    metric_types = ['weight', 'sleep', 'stress', 'acne_severity', 'mood', 'energy']
    
    for metric_type in metric_types:
        metrics = HealthMetric.objects.filter(
            user__user_id=user_id,
            metric_type=metric_type,
            date__gte=start_date
        )
        
        if metrics.exists():
            values = [m.value for m in metrics]
            summary[metric_type] = {
                'average': round(sum(values) / len(values), 1),
                'latest': values[-1] if values else None,
                'trend': 'improving' if len(values) > 1 and values[-1] < values[0] else 'stable'
            }
    
    return Response(summary)


# ============================================================
# KNOWLEDGE BASE APIS
# ============================================================

@api_view(['GET'])
def list_articles(request):
    """
    GET /api/articles/?category=diet&search=insulin
    List knowledge base articles with optional filtering.
    """
    category = request.GET.get('category')
    search = request.GET.get('search')
    
    articles = KnowledgeArticle.objects.filter(published=True)
    
    if category:
        articles = articles.filter(category=category)
    
    if search:
        articles = articles.filter(title__icontains=search) | articles.filter(content__icontains=search)
    
    serializer = KnowledgeArticleListSerializer(articles, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_article(request, article_id):
    """
    GET /api/articles/<id>/
    Get full article details and increment view count.
    """
    article = get_object_or_404(KnowledgeArticle, id=article_id, published=True)
    
    # Increment view count
    article.views += 1
    article.save(update_fields=['views'])
    
    serializer = KnowledgeArticleSerializer(article)
    return Response(serializer.data)


@api_view(['GET'])
def get_faqs(request):
    """
    GET /api/faqs/
    Get all FAQ articles.
    """
    faqs = KnowledgeArticle.objects.filter(category='faq', published=True)
    serializer = KnowledgeArticleListSerializer(faqs, many=True)
    return Response(serializer.data)
