from rest_framework import serializers
from .models import (
    SymptomLog, PhenotypeResult,
    UserProfile, CycleRecord, HealthMetric, KnowledgeArticle
)


class SymptomLogSerializer(serializers.ModelSerializer):
    """
    Serializer for SymptomLog model.
    """
    class Meta:
        model = SymptomLog
        fields = [
            'id',
            'cycle_gap_days',
            'periods_regular',
            'longest_cycle_gap_last_year',
            'acne',
            'bmi',
            'stress_level',
            'sleep_hours',
            'sugar_cravings',
            'weight_gain',
            'hair_loss',
            'facial_hair_growth',
            'dark_patches',
            'waist_cm',
            'family_diabetes_history',
            'fatigue_after_meals',
            'mood_swings',
            'pill_usage',
            'trying_to_conceive',
            'spotting_between_periods',
            'heavy_bleeding',
            'severe_pelvic_pain',
            'possible_pregnancy',
            'cycle_irregularity_duration_months',
            'acne_duration_months',
            'weight_gain_duration_months',
            'recent_major_stress_event',
            'thyroid_history',
            'recent_travel_or_illness',
            'sudden_weight_change',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PhenotypeResultSerializer(serializers.ModelSerializer):
    """
    Serializer for PhenotypeResult model.
    """
    class Meta:
        model = PhenotypeResult
        fields = [
            'id',
            'symptom_log',
            'phenotype',
            'confidence',
            'reasons',
            'data_quality_score',
            'rule_version',
            'differential_diagnosis',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class HistorySerializer(serializers.ModelSerializer):
    """
    Combined serializer for symptom logs with their results.
    """
    result = PhenotypeResultSerializer(read_only=True)
    
    class Meta:
        model = SymptomLog
        fields = [
            'id',
            'cycle_gap_days',
            'periods_regular',
            'longest_cycle_gap_last_year',
            'acne',
            'bmi',
            'stress_level',
            'sleep_hours',
            'sugar_cravings',
            'weight_gain',
            'hair_loss',
            'facial_hair_growth',
            'dark_patches',
            'waist_cm',
            'family_diabetes_history',
            'fatigue_after_meals',
            'mood_swings',
            'pill_usage',
            'trying_to_conceive',
            'spotting_between_periods',
            'heavy_bleeding',
            'severe_pelvic_pain',
            'possible_pregnancy',
            'created_at',
            'result'
        ]


# ============================================================
# NEW SERIALIZERS FOR FULL HEALTH COMPANION (Phase 2)
# ============================================================

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    class Meta:
        model = UserProfile
        fields = [
            'user_id',
            'name',
            'age',
            'height_cm',
            'preferences',
            'last_phenotype',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CycleRecordSerializer(serializers.ModelSerializer):
    """Serializer for CycleRecord model with calculated cycle_length."""
    cycle_length = serializers.SerializerMethodField()
    
    class Meta:
        model = CycleRecord
        fields = [
            'id',
            'user',
            'start_date',
            'end_date',
            'flow_intensity',
            'symptoms',
            'notes',
            'predicted',
            'cycle_length',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'cycle_length']
    
    def get_cycle_length(self, obj):
        return obj.cycle_length()


class HealthMetricSerializer(serializers.ModelSerializer):
    """Serializer for HealthMetric model."""
    metric_type_display = serializers.CharField(
        source='get_metric_type_display',
        read_only=True
    )
    
    class Meta:
        model = HealthMetric
        fields = [
            'id',
            'user',
            'date',
            'metric_type',
            'metric_type_display',
            'value',
            'notes',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class KnowledgeArticleSerializer(serializers.ModelSerializer):
    """Serializer for KnowledgeArticle model."""
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    
    class Meta:
        model = KnowledgeArticle
        fields = [
            'id',
            'title',
            'slug',
            'category',
            'category_display',
            'content',
            'summary',
            'author',
            'read_time_minutes',
            'thumbnail_url',
            'published',
            'publish_date',
            'updated_at',
            'views'
        ]
        read_only_fields = ['id', 'publish_date', 'updated_at', 'views']


class KnowledgeArticleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for article lists (without full content)."""
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    
    class Meta:
        model = KnowledgeArticle
        fields = [
            'id',
            'title',
            'slug',
            'category',
            'category_display',
            'summary',
            'author',
            'read_time_minutes',
            'thumbnail_url',
            'publish_date',
            'views'
        ]
