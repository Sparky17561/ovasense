from django.db import models


class SymptomLog(models.Model):
    """
    Stores user symptom data collected through Baymax assistant.
    """
    cycle_gap_days = models.IntegerField(
        help_text="Days between menstrual cycles"
    )
    acne = models.BooleanField(
        default=False,
        help_text="Presence of acne"
    )
    bmi = models.FloatField(
        help_text="Body Mass Index"
    )
    stress_level = models.IntegerField(
        help_text="Stress level on scale 1-10"
    )
    sleep_hours = models.FloatField(
        help_text="Average hours of sleep per night"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when log was created"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"SymptomLog {self.id} - {self.created_at.strftime('%Y-%m-%d')}"


class PhenotypeResult(models.Model):
    """
    Stores PCOS phenotype classification results.
    """
    symptom_log = models.OneToOneField(
        SymptomLog,
        on_delete=models.CASCADE,
        related_name='result'
    )
    phenotype = models.CharField(
        max_length=100,
        help_text="Classified PCOS phenotype"
    )
    confidence = models.FloatField(
        help_text="Confidence score (0-100)"
    )
    reasons = models.JSONField(
        help_text="List of contributing factors"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when classification was performed"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.phenotype} - {self.confidence}%"
