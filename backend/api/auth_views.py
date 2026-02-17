from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})


# ---------------- REGISTER ----------------
@api_view(["POST"])
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

        # ✅ IMPORTANT FIX
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "name": name or username,
                "age": int(age) if age else None,
                "height_cm": float(height_cm) if height_cm else None
            }
        )

        login(request, user)
        request.session.save()

        return Response({
            "message": "Registered successfully",
            "username": user.username
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)



# ---------------- LOGIN ----------------
@api_view(["POST"])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)

    login(request, user)
    request.session.save()

    return Response({"message": "Logged in", "username": user.username})


# ---------------- LOGOUT ----------------
from django.contrib.auth import logout
from django.http import JsonResponse
@csrf_exempt
@api_view(["POST"])
def logout_view(request):
    logout(request)

    response = JsonResponse({"message": "Logged out"})
    request.session.flush()

    return response



# ---------------- CHECK SESSION ----------------
@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False})

    return Response({
        "authenticated": True,
        "username": request.user.username,
        "name": request.user.profile.name
    })
