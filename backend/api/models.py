from django.db import models


class SymptomLog(models.Model):
    """
    Stores user symptom data collected through Baymax assistant.
    """
    cycle_gap_days = models.IntegerField(
        help_text="Days between menstrual cycles"
    )
    # Clinical Indicators (Rotterdam & Phenotype)
    periods_regular = models.BooleanField(
        null=True, blank=True,
        help_text="Are periods regular?"
    )
    longest_cycle_gap_last_year = models.IntegerField(
        null=True, blank=True,
        help_text="Longest gap between periods in last 12 months"
    )
    
    # Androgen Signs
    acne = models.BooleanField(
        null=True, blank=True,
        default=None,
        help_text="Presence of acne"
    )
    hair_loss = models.BooleanField(
        null=True, blank=True,
        default=None,
        help_text="Hair thinning or loss from scalp"
    )
    facial_hair_growth = models.BooleanField(
        null=True, blank=True,
        help_text="Excessive facial or body hair (hirsutism)"
    )
    dark_patches = models.BooleanField(
        null=True, blank=True,
        default=None,
        help_text="Dark patches on skin (acanthosis nigricans)"
    )
    
    # Metabolic Signs
    sugar_cravings = models.BooleanField(
        null=True, blank=True,
        default=None,
        help_text="Experiencing sugar cravings"
    )
    weight_gain = models.BooleanField(
        null=True, blank=True,
        default=None,
        help_text="Unexplained weight gain or difficulty losing weight"
    )
    waist_cm = models.IntegerField(
        null=True, blank=True,
        help_text="Waist circumference in cm"
    )
    family_diabetes_history = models.BooleanField(
        null=True, blank=True,
        help_text="Family history of diabetes"
    )
    fatigue_after_meals = models.BooleanField(
        null=True, blank=True,
        help_text="Feeling tired after eating"
    )

    # General Health & Lifestyle
    bmi = models.FloatField(
        null=True, blank=True,
        help_text="Body Mass Index"
    )
    stress_level = models.IntegerField(
        null=True, blank=True,
        help_text="Stress level (1-10)"
    )
    sleep_hours = models.FloatField(
        null=True, blank=True,
        help_text="Average sleep hours per night"
    )
    
    # Other Phenotype Flags
    mood_swings = models.BooleanField(
        null=True, blank=True,
        default=None,
        help_text="Mood swings, anxiety, or depression"
    )
    pill_usage = models.BooleanField(
        null=True, blank=True,
        default=None,
        help_text="Recent use of birth control pills"
    )
    trying_to_conceive = models.BooleanField(
        null=True, blank=True,
        help_text="Active attempt to conceive"
    )
    spotting_between_periods = models.BooleanField(
        null=True, blank=True,
        help_text="Bleeding between periods"
    )
    
    # Red Flags (Safety Checks)
    heavy_bleeding = models.BooleanField(
        null=True, blank=True,
        help_text="Excessive menstrual bleeding"
    )
    severe_pelvic_pain = models.BooleanField(
        null=True, blank=True,
        help_text="Severe pelvic pain"
    )
    possible_pregnancy = models.BooleanField(
        null=True, blank=True,
        help_text="Possibility of pregnancy"
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
