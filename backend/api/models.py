from django.db import models


from django.db import models


class SymptomLog(models.Model):
    """
    Stores user symptom data collected through Baymax assistant.
    Designed for:
    • All 4 PCOS phenotypes
    • Mixed PCOS detection
    • Predictive healthcare
    • LLM explainability
    """

    # =========================================================
    # 1️⃣ MENSTRUAL CYCLE
    # =========================================================
    cycle_gap_days = models.IntegerField(help_text="Days between menstrual cycles")
    periods_regular = models.BooleanField(null=True, blank=True)
    longest_cycle_gap_last_year = models.IntegerField(null=True, blank=True)

    cycle_irregularity_duration_months = models.IntegerField(null=True, blank=True)

    spotting_between_periods = models.BooleanField(null=True, blank=True)

    # =========================================================
    # 2️⃣ ANDROGEN SIGNS
    # =========================================================
    acne = models.BooleanField(null=True, blank=True)
    acne_duration_months = models.IntegerField(null=True, blank=True)

    hair_loss = models.BooleanField(null=True, blank=True)
    facial_hair_growth = models.BooleanField(null=True, blank=True)
    dark_patches = models.BooleanField(null=True, blank=True)  # insulin marker

    # =========================================================
    # 3️⃣ METABOLIC SIGNS
    # =========================================================
    bmi = models.FloatField(null=True, blank=True)
    waist_cm = models.IntegerField(null=True, blank=True)

    weight_gain = models.BooleanField(null=True, blank=True)
    weight_gain_duration_months = models.IntegerField(null=True, blank=True)
    sudden_weight_change = models.BooleanField(null=True, blank=True)

    sugar_cravings = models.BooleanField(null=True, blank=True)
    fatigue_after_meals = models.BooleanField(null=True, blank=True)
    family_diabetes_history = models.BooleanField(null=True, blank=True)

    # =========================================================
    # 4️⃣ LIFESTYLE (Adrenal / Inflammatory PCOS)
    # =========================================================
    stress_level = models.IntegerField(null=True, blank=True)
    sleep_hours = models.FloatField(null=True, blank=True)
    mood_swings = models.BooleanField(null=True, blank=True)

    exercise_days_per_week = models.IntegerField(null=True, blank=True)
    processed_food_intake = models.BooleanField(null=True, blank=True)
    chronic_inflammation_symptoms = models.BooleanField(
        null=True, blank=True,
        help_text="Joint pain, gut issues, bloating, etc."
    )

    # =========================================================
    # 5️⃣ FERTILITY
    # =========================================================
    trying_to_conceive = models.BooleanField(null=True, blank=True)
    miscarriages = models.IntegerField(null=True, blank=True)
    infertility_years = models.IntegerField(null=True, blank=True)

    # =========================================================
    # 6️⃣ MEDICAL HISTORY
    # =========================================================
    pill_usage = models.BooleanField(null=True, blank=True)
    thyroid_history = models.BooleanField(null=True, blank=True)
    recent_major_stress_event = models.BooleanField(null=True, blank=True)
    recent_travel_or_illness = models.BooleanField(null=True, blank=True)

    # =========================================================
    # 7️⃣ RED FLAGS
    # =========================================================
    heavy_bleeding = models.BooleanField(null=True, blank=True)
    severe_pelvic_pain = models.BooleanField(null=True, blank=True)
    possible_pregnancy = models.BooleanField(null=True, blank=True)

    # =========================================================
    # 8️⃣ OPTIONAL LAB VALUES (Future Predictive Layer)
    # =========================================================
    fasting_glucose = models.FloatField(null=True, blank=True)
    fasting_insulin = models.FloatField(null=True, blank=True)
    lh_fsh_ratio = models.FloatField(null=True, blank=True)
    testosterone_level = models.FloatField(null=True, blank=True)
    amh_level = models.FloatField(null=True, blank=True)

    # =========================================================
    # META
    # =========================================================
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"SymptomLog {self.id} - {self.created_at.strftime('%Y-%m-%d')}"



# ============================================================
# ADD THESE TWO FIELDS to your PhenotypeResult model
# ============================================================
#
# Find your PhenotypeResult class in models.py and add:
#
#     ai_explanation = models.TextField(blank=True, null=True)
#     diet_plan      = models.TextField(blank=True, null=True)
#
# Full model should look like this:
# ============================================================

from django.db import models


class PhenotypeResult(models.Model):
    symptom_log         = models.OneToOneField(
                            "SymptomLog",
                            on_delete=models.CASCADE,
                            related_name="result"
                          )
    phenotype           = models.CharField(max_length=255)
    confidence          = models.FloatField(default=0)
    reasons             = models.JSONField(default=list, blank=True)
    data_quality_score  = models.IntegerField(null=True, blank=True)
    rule_version        = models.CharField(max_length=50, blank=True, null=True)
    differential_diagnosis = models.TextField(blank=True, null=True)

    # ✅ NEW FIELDS — add these two lines
    ai_explanation      = models.TextField(blank=True, null=True)
    diet_plan           = models.TextField(blank=True, null=True)

    created_at          = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phenotype} ({self.confidence}%)"


# ============================================================
# NEW MODELS FOR FULL HEALTH COMPANION (Phase 2 Expansion)
# ============================================================

from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    name = models.CharField(max_length=200)
    age = models.IntegerField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    preferences = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username



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


class CycleInsight(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    phase = models.CharField(max_length=50)
    cycle_day = models.IntegerField(null=True)
    risk_score = models.IntegerField()
    main_reason = models.TextField()
    recommendations = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, name=instance.username)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, "profile"):
        instance.profile.save()
