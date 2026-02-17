# ---- Base Image ----
FROM python:3.11-slim

# ---- Environment Variables ----
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ---- Working Directory ----
WORKDIR /app

# ---- System Dependencies ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# ---- Python Dependencies ----
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Copy Project ----
COPY . .

# ---- Collect Static Files ----
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# ---- Expose Port ----
EXPOSE 8000

# ---- Run Migrations + Start Gunicorn ----
CMD python manage.py migrate --noinput && gunicorn ovasense_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
