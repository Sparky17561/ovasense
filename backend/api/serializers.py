from rest_framework import serializers
from .models import (
    SymptomLog, PhenotypeResult,
    UserProfile, CycleRecord, HealthMetric, KnowledgeArticle
)

# ============================================================
# SYMPTOM LOG
# ============================================================

class SymptomLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SymptomLog
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


# ============================================================
# PHENOTYPE RESULT
# ============================================================

class PhenotypeResultSerializer(serializers.ModelSerializer):
    """
    Serializer for PhenotypeResult model.
    Now includes ai_explanation and diet_plan so they are
    returned from /history/ and available in the frontend.
    """

    data_quality_score = serializers.IntegerField(
        required=False,
        allow_null=True,
        default=0
    )

    reasons = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )

    # ✅ NEW — these were missing, so history never returned them
    ai_explanation = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        default=None
    )

    diet_plan = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        default=None
    )

    class Meta:
        model = PhenotypeResult
        fields = [
            "id",
            "symptom_log",
            "phenotype",
            "confidence",
            "reasons",
            "data_quality_score",
            "rule_version",
            "differential_diagnosis",
            "ai_explanation",       # ✅ NEW
            "diet_plan",            # ✅ NEW
            "future_risk_score",
            "mixed_pcos_types",
            "recommended_lab_tests",
            "priority_lifestyle_changes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ============================================================
# HISTORY VIEW
# ============================================================

class HistorySerializer(serializers.ModelSerializer):
    """
    Combined serializer for symptom logs with their results.
    The nested `result` now includes ai_explanation + diet_plan.
    """
    result = PhenotypeResultSerializer(read_only=True)

    class Meta:
        model = SymptomLog
        fields = "__all__"


# ============================================================
# USER PROFILE
# ============================================================

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


# ============================================================
# CYCLE RECORD
# ============================================================

class CycleRecordSerializer(serializers.ModelSerializer):
    cycle_length = serializers.SerializerMethodField()

    class Meta:
        model = CycleRecord
        fields = "__all__"
        read_only_fields = ["id", "created_at", "cycle_length"]

    def get_cycle_length(self, obj):
        try:
            return obj.cycle_length()
        except:
            return None


# ============================================================
# HEALTH METRIC
# ============================================================

class HealthMetricSerializer(serializers.ModelSerializer):
    metric_type_display = serializers.CharField(
        source="get_metric_type_display",
        read_only=True
    )

    class Meta:
        model = HealthMetric
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


# ============================================================
# KNOWLEDGE ARTICLES
# ============================================================

class KnowledgeArticleSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True
    )

    class Meta:
        model = KnowledgeArticle
        fields = "__all__"
        read_only_fields = ["id", "publish_date", "updated_at", "views"]


class KnowledgeArticleListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True
    )

    class Meta:
        model = KnowledgeArticle
        fields = [
            "id",
            "title",
            "slug",
            "category",
            "category_display",
            "summary",
            "author",
            "read_time_minutes",
            "thumbnail_url",
            "publish_date",
            "views"
        ]