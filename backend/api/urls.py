from django.urls import path
from . import views, health_views,auth_views

urlpatterns = [
    # Original PCOS Assessment APIs
    path('log/', views.log_symptoms, name='log_symptoms'),
    path('classify/', views.classify_symptoms, name='classify_symptoms'),
    # path('voice/', views.process_voice, name='process_voice'),
    path('report/<int:result_id>/', views.download_report, name='download_report'),
    path('history/', views.get_history, name='get_history'),
    path('text/', views.process_text, name='process_text'),
    path('chat/', views.process_text, name='process_text_chat'),


    
    # Period Tracking
    path('cycle/log/', health_views.log_cycle, name='log_cycle'),
    path('cycle/list/', health_views.list_cycles, name='list_cycles'),
    path('cycle/predict/', health_views.predict_cycle, name='predict_cycle'),
    
    # Health Metrics & Trends
    path('health/metric/', health_views.log_health_metric, name='log_health_metric'),
    path('health/trends/', health_views.health_trends, name='health_trends'),
    path('health/summary/', health_views.health_summary, name='health_summary'),
    path('insights/cycle-aware/', health_views.cycle_ai_insight),
    
    # Knowledge Base
    path('articles/', health_views.list_articles, name='list_articles'),
    path('articles/<int:article_id>/', health_views.get_article, name='get_article'),
    path('faqs/', health_views.get_faqs, name='get_faqs'),

    #Auth
    path("auth/register/", auth_views.register),
    path("auth/login/", auth_views.login_view),
    path("auth/logout/", auth_views.logout_view),
    path("auth/me/", auth_views.me),
    path("auth/csrf/", auth_views.csrf),


]

