"""
health_views.py
Full health companion endpoints.

✔ Supports session login
✔ Supports ?user_id=demo_user for testing
✔ Includes ALL endpoints used in urls.py
"""
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .insights import generate_cycle_insight
from .models import (
    UserProfile,
    CycleRecord,
    HealthMetric,
    KnowledgeArticle,
    CycleInsight
)
from .serializers import (
    CycleRecordSerializer,
    HealthMetricSerializer,
    KnowledgeArticleSerializer,
    KnowledgeArticleListSerializer
)

# ============================================================
# HELPER
# ============================================================

def get_profile(request, user_param=None):
    """
    Resolve profile using session login first.
    """

    if getattr(request, "user", None) and request.user.is_authenticated:
        user = request.user

    elif user_param:
        from django.contrib.auth.models import User
        try:
            user = User.objects.get(username=user_param)
        except User.DoesNotExist:
            return None, Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        return None, Response(
            {"error": "Login required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={"name": user.username}
    )

    return profile, None



# ============================================================
# PERIOD TRACKING
# ============================================================
@csrf_exempt
@api_view(["POST"])
def log_cycle(request):

    profile, err = get_profile(request, request.data.get("user"))
    if err: return err

    data = request.data.copy()
    data["user"] = profile.pk

    serializer = CycleRecordSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(["GET"])
def list_cycles(request):

    profile, err = get_profile(request, request.GET.get("user_id"))
    if err: return err

    try:
        limit = int(request.GET.get("limit", 10))
    except:
        limit = 10

    cycles = CycleRecord.objects.filter(user=profile).order_by("-start_date")[:limit]
    return Response(CycleRecordSerializer(cycles, many=True).data)


@api_view(["GET"])
def predict_cycle(request):

    profile, err = get_profile(request, request.GET.get("user_id"))
    if err: return err

    cycles = CycleRecord.objects.filter(
        user=profile,
        predicted=False
    ).order_by("-start_date")[:4]

    if cycles.count() < 2:
        return Response({
            "error": "Need at least 2 cycles",
            "next_period_date": None,
            "confidence": None
        })

    cycles = list(cycles)[:3]
    cycles.reverse()

    lengths = [
        (cycles[i+1].start_date - cycles[i].start_date).days
        for i in range(len(cycles)-1)
    ]

    avg = sum(lengths)/len(lengths)
    predicted = cycles[-1].start_date + timedelta(days=int(avg))

    std = (sum((x-avg)**2 for x in lengths)/len(lengths))**0.5
    confidence = max(50, min(95, 95 - std*5))

    return Response({
        "next_period_date": predicted,
        "average_cycle_length": round(avg,1),
        "confidence": round(confidence,1),
        "days_until": (predicted - datetime.now().date()).days
    })


@csrf_exempt
@api_view(["POST"])
def delete_cycle(request, cycle_id):
    """Delete a specific cycle record"""
    profile, err = get_profile(request, request.data.get("user_id") or request.GET.get("user_id"))
    if err: return err
    
    try:
        cycle = CycleRecord.objects.get(id=cycle_id, user=profile)
        cycle.delete()
        return Response({"message": "Cycle deleted successfully"}, status=200)
    except CycleRecord.DoesNotExist:
        return Response({"error": "Cycle not found"}, status=404)


# ============================================================
# HEALTH METRICS
# ============================================================

@api_view(["POST"])
def log_health_metric(request):

    profile, err = get_profile(request, request.data.get("user"))
    if err: return err

    data = request.data.copy()
    data["user"] = profile.pk

    serializer = HealthMetricSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(["GET"])
def health_trends(request):

    profile, err = get_profile(request, request.GET.get("user_id"))
    if err: return err

    metric = request.GET.get("metric_type", "weight")
    days = int(request.GET.get("days", 30))

    start = datetime.now().date() - timedelta(days=days)

    metrics = HealthMetric.objects.filter(
        user=profile,
        metric_type=metric,
        date__gte=start
    ).order_by("date")

    data = HealthMetricSerializer(metrics, many=True).data
    values = [m.value for m in metrics]

    return Response({
        "metric_type": metric,
        "data_points": data,
        "average": round(sum(values)/len(values),2) if values else 0,
        "min": min(values) if values else 0,
        "max": max(values) if values else 0,
        "latest": values[-1] if values else None
    })


@api_view(["GET"])
def health_summary(request):

    profile, err = get_profile(request, request.GET.get("user_id"))
    if err: return err

    start = datetime.now().date() - timedelta(days=7)

    summary = {}
    types = ["weight","sleep","stress","acne_severity","mood","energy"]

    for t in types:
        metrics = HealthMetric.objects.filter(
            user=profile,
            metric_type=t,
            date__gte=start
        ).order_by("date")

        if metrics.exists():
            vals = [m.value for m in metrics]
            summary[t] = {
                "average": round(sum(vals)/len(vals),1),
                "latest": vals[-1],
                "trend": "improving" if len(vals)>1 and vals[-1]<vals[0] else "stable"
            }

    return Response(summary)


# ============================================================
# KNOWLEDGE BASE
# ============================================================

@api_view(["GET"])
def list_articles(request):

    qs = KnowledgeArticle.objects.filter(published=True)

    if request.GET.get("category"):
        qs = qs.filter(category=request.GET["category"])

    if request.GET.get("search"):
        s = request.GET["search"]
        qs = qs.filter(title__icontains=s) | qs.filter(content__icontains=s)

    return Response(KnowledgeArticleListSerializer(qs, many=True).data)


@api_view(["GET"])
def get_article(request, article_id):

    art = get_object_or_404(KnowledgeArticle, id=article_id, published=True)
    art.views += 1
    art.save(update_fields=["views"])

    return Response(KnowledgeArticleSerializer(art).data)


@api_view(["GET"])
def get_faqs(request):

    qs = KnowledgeArticle.objects.filter(category="faq", published=True)
    return Response(KnowledgeArticleListSerializer(qs, many=True).data)


# ============================================================
# AI INSIGHT
# ============================================================

@api_view(["GET"])
def cycle_ai_insight(request):

    profile, err = get_profile(request, request.GET.get("user_id"))
    if err: return err

    today = datetime.now().date()



    data = generate_cycle_insight(profile.id)



    insight = CycleInsight.objects.create(
        user=profile,
        phase=data.get("phase"),
        cycle_day=data.get("cycle_day"),
        risk_score=max(0,min(100,int(data.get("risk_score",50)))),
        main_reason=data.get("main_reason",""),
        recommendations=data.get("recommendations",[])
    )

    return Response({
        "phase": insight.phase,
        "cycle_day": insight.cycle_day,
        "risk_score": insight.risk_score,
        "main_reason": insight.main_reason,
        "recommendations": insight.recommendations,
        "cached": False
    })


@api_view(["GET"])
def insight_history(request):

    profile, err = get_profile(request, request.GET.get("user_id"))
    if err: return err

    data = CycleInsight.objects.filter(user=profile)\
        .values("created_at","risk_score")\
        .order_by("-created_at")

    return Response(list(data))
