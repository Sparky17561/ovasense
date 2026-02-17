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

    # Duration Tracking (for Acute vs Chronic check)
    cycle_irregularity_duration_months = models.IntegerField(
        null=True, blank=True,
        help_text="How long irregular cycles have persisted (months)"
    )
    acne_duration_months = models.IntegerField(
        null=True, blank=True,
        help_text="How long acne has persisted (months)"
    )
    weight_gain_duration_months = models.IntegerField(
        null=True, blank=True,
        help_text="How long weight gain has persisted (months)"
    )

    # Differential Diagnosis Flags
    recent_major_stress_event = models.BooleanField(
        null=True, blank=True,
        help_text="Major stress event in last 3 months"
    )
    thyroid_history = models.BooleanField(
        null=True, blank=True,
        help_text="Personal or family history of thyroid issues"
    )
    recent_travel_or_illness = models.BooleanField(
        null=True, blank=True,
        help_text="Recent travel or viral illness"
    )
    sudden_weight_change = models.BooleanField(
        null=True, blank=True,
        help_text="Sudden significant weight change (< 3 months)"
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
    data_quality_score = models.IntegerField(
        default=100,
        help_text="Data completion/quality score (0-100)"
    )
    rule_version = models.CharField(
        max_length=20,
        default="1.0.0",
        help_text="Version of logic rules used"
    )
    differential_diagnosis = models.CharField(
        max_length=200,
        blank=True, null=True,
        help_text="Alternative diagnosis if PCOS is unlikely"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when classification was performed"
    )

    class Meta:
        ordering = ['-created_at']


# ============================================================
# NEW MODELS FOR FULL HEALTH COMPANION (Phase 2 Expansion)
# ============================================================

class UserProfile(models.Model):
    """
    User profile for multi-user support and personalized tracking.
    """
    user_id = models.CharField(
        max_length=100,
        unique=True,
        primary_key=True,
        help_text="Unique user identifier"
    )
    name = models.CharField(
        max_length=200,
        help_text="User's name"
    )
    age = models.IntegerField(
        null=True,
        blank=True,
        help_text="User's age"
    )
    height_cm = models.FloatField(
        null=True,
        blank=True,
        help_text="Height in centimeters"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="User preferences: notifications, theme, etc."
    )
    last_phenotype = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Last PCOS phenotype assessment result"
    )

    def __str__(self):
        return f"{self.name} ({self.user_id})"

    class Meta:
        ordering = ['-created_at']


class CycleRecord(models.Model):
    """
    Menstrual cycle tracking for period prediction and pattern analysis.
    """
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='cycles',
        help_text="User who owns this cycle record"
    )
    start_date = models.DateField(
        help_text="First day of menstruation"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Last day of menstruation (optional)"
    )
    flow_intensity = models.IntegerField(
        null=True,
        blank=True,
        help_text="Flow intensity: 1=Very Light, 2=Light, 3=Normal, 4=Heavy, 5=Very Heavy"
    )
    symptoms = models.JSONField(
        default=list,
        blank=True,
        help_text="List of symptoms during cycle: cramps, bloating, headache, etc."
    )
    notes = models.TextField(
        blank=True,
        help_text="User notes about this cycle"
    )
    predicted = models.BooleanField(
        default=False,
        help_text="Whether this was an AI prediction vs actual logged period"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def cycle_length(self):
        """Calculate cycle length in days if end_date is set."""
        if self.end_date:
            return (self.end_date - self.start_date).days + 1
        return None

    def __str__(self):
        return f"{self.user.name} - {self.start_date}"

    class Meta:
        ordering = ['-start_date']


class HealthMetric(models.Model):
    """
    Daily health metrics tracking for dashboards and trend analysis.
    """
    METRIC_TYPES = [
        ('weight', 'Weight (kg)'),
        ('sleep', 'Sleep Hours'),
        ('stress', 'Stress Level (1-10)'),
        ('acne_severity', 'Acne Severity (1-10)'),
        ('mood', 'Mood (1-10)'),
        ('energy', 'Energy Level (1-10)'),
        ('exercise_minutes', 'Exercise Minutes'),
    ]

    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='health_metrics',
        help_text="User who owns this metric"
    )
    date = models.DateField(
        help_text="Date of measurement"
    )
    metric_type = models.CharField(
        max_length=50,
        choices=METRIC_TYPES,
        help_text="Type of health metric"
    )
    value = models.FloatField(
        help_text="Metric value (numeric)"
    )
    notes = models.TextField(
        blank=True,
        help_text="Optional notes about this metric"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name} - {self.metric_type}: {self.value} on {self.date}"

    class Meta:
        ordering = ['-date', 'metric_type']
        unique_together = ['user', 'date', 'metric_type']


class KnowledgeArticle(models.Model):
    """
    Knowledge base articles for PCOS education and lifestyle guidance.
    """
    CATEGORY_CHOICES = [
        ('pcos_types', 'PCOS Types'),
        ('diet', 'Diet & Nutrition'),
        ('lifestyle', 'Lifestyle & Exercise'),
        ('research', 'Research & Science'),
        ('mental_health', 'Mental Health'),
        ('symptoms', 'Symptoms & Management'),
        ('faq', 'Frequently Asked Questions'),
    ]

    title = models.CharField(
        max_length=300,
        help_text="Article title"
    )
    slug = models.SlugField(
        max_length=300,
        unique=True,
        help_text="URL-friendly slug"
    )
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        help_text="Article category"
    )
    content = models.TextField(
        help_text="Article content in Markdown format"
    )
    summary = models.TextField(
        blank=True,
        help_text="Short summary for article cards"
    )
    author = models.CharField(
        max_length=200,
        default="OvaSense Team",
        help_text="Article author"
    )
    read_time_minutes = models.IntegerField(
        default=5,
        help_text="Estimated reading time in minutes"
    )
    thumbnail_url = models.URLField(
        blank=True,
        help_text="Optional thumbnail image URL"
    )
    published = models.BooleanField(
        default=True,
        help_text="Whether article is published and visible"
    )
    publish_date = models.DateField(
        auto_now_add=True,
        help_text="Publication date"
    )
    updated_at = models.DateTimeField(auto_now=True)
    views = models.IntegerField(
        default=0,
        help_text="Number of times article has been viewed"
    )

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-publish_date']
