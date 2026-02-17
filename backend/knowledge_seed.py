# -*- coding: utf-8 -*-
"""
Seed data for Knowledge Base articles.
Run with: python knowledge_seed.py
"""

import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovasense_backend.settings')
django.setup()

from api.models import KnowledgeArticle
from django.utils.text import slugify

print("Creating Knowledge Base articles...")

# Article 1
article1, created1 = KnowledgeArticle.objects.get_or_create(
    slug='understanding-pcos-types',
    defaults={
        'title': 'Understanding PCOS Types: Which One Do You Have?',
        'category': 'pcos_types',
        'summary': 'Learn about the 4 main PCOS phenotypes and how to identify yours.',
        'content': '# Understanding PCOS Types\n\nPCOS has 4 main phenotypes:\n\n## 1. Insulin-Resistant PCOS\n- Higher BMI\n- Dark skin patches\n- Sugar cravings\n\n## 2. Lean PCOS\n- Normal BMI\n- Androgen signs\n- Irregular periods\n\n## 3. Inflammatory PCOS\n- Persistent acne\n- Mood swings\n- Fatigue\n\n## 4. Adrenal PCOS\n- High stress\n- Poor sleep\n- Normal BMI',
        'read_time_minutes': 8,
        'author': 'Dr. Sarah Chen',
        'published': True
    }
)
print(f"{'Created' if created1 else 'Exists'}: {article1.title}")

# Article 2
article2, created2 = KnowledgeArticle.objects.get_or_create(
    slug='pcos-friendly-meal-planning',
    defaults={
        'title': 'PCOS-Friendly Meal Planning',
        'category': 'diet',
        'summary': 'Discover foods that help manage PCOS symptoms.',
        'content': '# PCOS-Friendly Meal Planning\n\n## General Principles\n\n**Include:**\n- Lean proteins\n- Complex carbs\n- Healthy fats\n- High-fiber vegetables\n\n**Avoid:**\n- Refined sugars\n- Processed foods\n- Trans fats\n\n## Meal Plans by Phenotype\n\n### Insulin-Resistant\n- Breakfast: Greek yogurt with berries\n- Lunch: Grilled chicken salad\n- Dinner: Baked salmon with vegetables\n\n### Lean PCOS\n- Breakfast: Omelette with avocado\n- Lunch: Turkey wrap\n- Dinner: Lean beef stir-fry',
        'read_time_minutes': 10,
        'author': 'Emma Rodriguez, RD',
        'published': True
    }
)
print(f"{'Created' if created2 else 'Exists'}: {article2.title}")

# Article 3
article3, created3 = KnowledgeArticle.objects.get_or_create(
    slug='exercise-and-pcos',
    defaults={
        'title': 'Exercise and PCOS: Finding What Works',
        'category': 'lifestyle',
        'summary': 'Tailored exercise recommendations for each PCOS phenotype.',
        'content': '# Exercise and PCOS\n\n## Insulin-Resistant PCOS\n- Resistance training 3-4x/week\n- HIIT 2x/week\n- Daily walking\n\n## Lean PCOS\n- Moderate strength training\n- Pilates\n- Swimming\n\n## Inflammatory PCOS\n- Gentle yoga\n- Swimming\n- Walking in nature\n\n## Adrenal PCOS\n- Restorative yoga\n- Light walking\n- Avoid HIIT',
        'read_time_minutes': 7,
        'author': 'Lisa Park, CPT',
        'published': True
    }
)
print(f"{'Created' if created3 else 'Exists'}: {article3.title}")

# Article 4
article4, created4 = KnowledgeArticle.objects.get_or_create(
    slug='when-to-see-doctor-pcos',
    defaults={
        'title': 'When to See a Doctor About PCOS',
        'category': 'symptoms',
        'summary': 'Red flags and symptoms that require immediate medical attention.',
        'content': '# When to See a Doctor\n\n## Seek Immediate Care:\n- Heavy bleeding\n- Severe pelvic pain\n- Signs of pregnancy\n- Severe depression\n\n## Schedule Doctor Visit:\n- Periods stopped for 3+ months\n- Severe acne\n- Rapid hair changes\n- Infertility concerns\n\n## Tests to Request:\n- Hormonal panel (LH, FSH, Testosterone)\n- Metabolic panel (Glucose, Insulin)\n- Pelvic ultrasound',
        'read_time_minutes': 6,
        'author': 'OvaSense Medical Team',
        'published': True
    }
)
print(f"{'Created' if created4 else 'Exists'}: {article4.title}")

# Article 5
article5, created5 = KnowledgeArticle.objects.get_or_create(
    slug='pcos-mental-health',
    defaults={
        'title': 'PCOS and Mental Health',
        'category': 'mental_health',
        'summary': 'Understanding the emotional impact of PCOS and coping strategies.',
        'content': '# PCOS and Mental Health\n\n## Common Challenges\n- Depression and anxiety\n- Body image concerns\n- Fertility worries\n\n## Coping Strategies\n\n### 1. Build Support Network\n- Join PCOS support groups\n- Talk to family/friends\n- Consider therapy\n\n### 2. Self-Compassion\n- PCOS is not your fault\n- Celebrate small victories\n\n### 3. Manage Stress\n- Daily meditation\n- Journaling\n- Deep breathing\n\n### 4. Lifestyle\n- 7-9 hours sleep\n- Regular exercise\n- Mood-supporting foods',
        'read_time_minutes': 5,
        'author': 'Dr. Maya Patel',
        'published': True
    }
)
print(f"{'Created' if created5 else 'Exists'}: {article5.title}")

print(f"\n✅ Knowledge base seeded with 5 articles!")
