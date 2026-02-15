from rest_framework import serializers
from .models import SymptomLog, PhenotypeResult


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
