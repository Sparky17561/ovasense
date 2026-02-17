from django.contrib import admin
from .models import (
    SymptomLog, PhenotypeResult,
    UserProfile, CycleRecord, HealthMetric, KnowledgeArticle
)


@admin.register(SymptomLog)
class SymptomLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'cycle_gap_days', 'bmi', 'stress_level', 'created_at']
    list_filter = ['created_at', 'acne']
    search_fields = ['id']


@admin.register(PhenotypeResult)
class PhenotypeResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'phenotype', 'confidence', 'created_at']
    list_filter = ['phenotype', 'created_at']
    search_fields = ['phenotype']


# ============================================================
# NEW ADMIN REGISTRATIONS (Phase 2)
# ============================================================

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'name', 'age', 'last_phenotype', 'created_at']
    search_fields = ['user_id', 'name']
    list_filter = ['created_at']


@admin.register(CycleRecord)
class CycleRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'start_date', 'end_date', 'flow_intensity', 'predicted']
    list_filter = ['predicted', 'start_date', 'flow_intensity']
    search_fields = ['user__name', 'user__user_id']
    date_hierarchy = 'start_date'


@admin.register(HealthMetric)
class HealthMetricAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'date', 'metric_type', 'value']
    list_filter = ['metric_type', 'date']
    search_fields = ['user__name', 'user__user_id']
    date_hierarchy = 'date'


@admin.register(KnowledgeArticle)
class KnowledgeArticleAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category', 'author', 'published', 'publish_date', 'views']
    list_filter = ['category', 'published', 'publish_date']
    search_fields = ['title', 'content', 'author']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'publish_date'
