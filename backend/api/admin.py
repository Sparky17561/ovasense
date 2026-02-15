from django.contrib import admin
from .models import SymptomLog, PhenotypeResult


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
