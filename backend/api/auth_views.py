from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import UserProfile
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# ---------------- REGISTER ----------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username")
    password = request.data.get("password")
    name = request.data.get("name")
    age = request.data.get("age")
    height_cm = request.data.get("height_cm")

    if not username or not password:
        return Response({"error": "username & password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    try:
        user = User.objects.create_user(username=username, password=password)

        # Profile Creation
        try:
            profile_name = name or username
            profile_age = int(age) if age and str(age).isdigit() else None
            profile_height = float(height_cm) if height_cm and str(height_cm).replace('.', '', 1).isdigit() else None

            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    "name": profile_name,
                    "age": profile_age,
                    "height_cm": profile_height
                }
            )
        except Exception as prof_e:
            print(f"⚠️ [REGISTER] Profile creation warning: {prof_e}")

        # Generate Token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "message": "Registered successfully",
            "token": token.key,
            "username": user.username
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

# ---------------- LOGIN ----------------
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "message": "Logged in", 
        "token": token.key,
        "username": user.username
    })

# ---------------- LOGOUT ----------------
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({"message": "Logged out"})

# ---------------- CHECK SESSION ----------------
@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    try:
        name = request.user.profile.name
    except:
        name = request.user.username

    return Response({
        "authenticated": True,
        "username": request.user.username,
        "name": name
    })


# ---------------- CSRF ----------------
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})


from .models import KnowledgeArticle

@api_view(["POST"])
@permission_classes([AllowAny])
def seed_knowledge(request):
    from .models import KnowledgeArticle
    articles = [
        {
            "slug": "understanding-pcos-types",
            "title": "Understanding PCOS Types: Which One Do You Have?",
            "category": "pcos_types",
            "summary": "Learn about the 4 main PCOS phenotypes and how to identify yours.",
            "content": "# Understanding PCOS Types\n\nPCOS has 4 main phenotypes:\n\n## 1. Insulin-Resistant PCOS\n- Higher BMI\n- Dark skin patches\n- Sugar cravings\n\n## 2. Lean PCOS\n- Normal BMI\n- Androgen signs\n- Irregular periods\n\n## 3. Inflammatory PCOS\n- Persistent acne\n- Mood swings\n- Fatigue\n\n## 4. Adrenal PCOS\n- High stress\n- Poor sleep\n- Normal BMI",
            "read_time_minutes": 8,
            "author": "Dr. Sarah Chen",
            "published": True
        },
        {
            "slug": "pcos-friendly-meal-planning",
            "title": "PCOS-Friendly Meal Planning",
            "category": "diet",
            "summary": "Discover foods that help manage PCOS symptoms.",
            "content": "# PCOS-Friendly Meal Planning\n\n## General Principles\n\n**Include:**\n- Lean proteins\n- Complex carbs\n- Healthy fats\n- High-fiber vegetables\n\n**Avoid:**\n- Refined sugars\n- Processed foods\n- Trans fats\n\n## Meal Plans by Phenotype\n\n### Insulin-Resistant\n- Breakfast: Greek yogurt with berries\n- Lunch: Grilled chicken salad\n- Dinner: Baked salmon with vegetables\n\n### Lean PCOS\n- Breakfast: Omelette with avocado\n- Lunch: Turkey wrap\n- Dinner: Lean beef stir-fry",
            "read_time_minutes": 10,
            "author": "Emma Rodriguez, RD",
            "published": True
        },
        {
            "slug": "exercise-and-pcos",
            "title": "Exercise and PCOS: Finding What Works",
            "category": "lifestyle",
            "summary": "Tailored exercise recommendations for each PCOS phenotype.",
            "content": "# Exercise and PCOS\n\n## Insulin-Resistant PCOS\n- Resistance training 3-4x/week\n- HIIT 2x/week\n- Daily walking\n\n## Lean PCOS\n- Moderate strength training\n- Pilates\n- Swimming\n\n## Inflammatory PCOS\n- Gentle yoga\n- Swimming\n- Walking in nature\n\n## Adrenal PCOS\n- Restorative yoga\n- Light walking\n- Avoid HIIT",
            "read_time_minutes": 7,
            "author": "Lisa Park, CPT",
            "published": True
        },
        {
            "slug": "when-to-see-doctor-pcos",
            "title": "When to See a Doctor About PCOS",
            "category": "symptoms",
            "summary": "Red flags and symptoms that require immediate medical attention.",
            "content": "# When to See a Doctor\n\n## Seek Immediate Care:\n- Heavy bleeding\n- Severe pelvic pain\n- Signs of pregnancy\n- Severe depression\n\n## Schedule Doctor Visit:\n- Periods stopped for 3+ months\n- Severe acne\n- Rapid hair changes\n- Infertility concerns\n\n## Tests to Request:\n- Hormonal panel (LH, FSH, Testosterone)\n- Metabolic panel (Glucose, Insulin)\n- Pelvic ultrasound",
            "read_time_minutes": 6,
            "author": "OvaSense Medical Team",
            "published": True
        },
        {
            "slug": "pcos-mental-health",
            "title": "PCOS and Mental Health",
            "category": "mental_health",
            "summary": "Understanding the emotional impact of PCOS and coping strategies.",
            "content": "# PCOS and Mental Health\n\n## Common Challenges\n- Depression and anxiety\n- Body image concerns\n- Fertility worries\n\n## Coping Strategies\n\n### 1. Build Support Network\n- Join PCOS support groups\n- Talk to family/friends\n- Consider therapy\n\n### 2. Self-Compassion\n- PCOS is not your fault\n- Celebrate small victories\n\n### 3. Manage Stress\n- Daily meditation\n- Journaling\n- Deep breathing\n\n### 4. Lifestyle\n- 7-9 hours sleep\n- Regular exercise\n- Mood-supporting foods",
            "read_time_minutes": 5,
            "author": "Dr. Maya Patel",
            "published": True
        },
    ]

    count = 0
    for a in articles:
        _, created = KnowledgeArticle.objects.get_or_create(slug=a["slug"], defaults=a)
        if created:
            count += 1

    return Response({"message": f"Seeded {count} new articles, skipped existing."})