from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        from .models import KnowledgeArticle
        articles = [
            # ... your articles dicts
        ]
        for a in articles:
            try:
                KnowledgeArticle.objects.get_or_create(slug=a["slug"], defaults=a)
            except Exception as e:
                print(f"Seed warning: {e}")