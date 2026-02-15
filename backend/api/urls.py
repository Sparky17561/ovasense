from django.urls import path
from . import views

urlpatterns = [
    path('log/', views.log_symptoms, name='log_symptoms'),
    path('classify/', views.classify_symptoms, name='classify_symptoms'),
    path('history/', views.get_history, name='get_history'),
    path('report/<int:result_id>/', views.download_report, name='download_report'),
    path('voice/', views.process_voice, name='process_voice'),
    path('chat/', views.process_text, name='process_text'),
]
