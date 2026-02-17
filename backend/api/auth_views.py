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
