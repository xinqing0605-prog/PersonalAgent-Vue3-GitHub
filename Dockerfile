FROM node:22-slim AS frontend-build
WORKDIR /frontend-vue
COPY frontend-vue/package.json frontend-vue/package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com
COPY frontend-vue/ ./
RUN npm run build

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    APP_DEBUG=false \
    AGENT_ROOT_DIR=/app \
    AGENT_RUNTIME_DIR=/var/lib/personal-agent/data \
    AUTH_DB_PATH=/var/lib/personal-agent/auth.db \
    AGENT_USER_DATA_ROOT=/var/lib/personal-agent/users \
    AGENT_LEGACY_USER_ID=0 \
    SESSION_COOKIE_SECURE=true \
    SMS_PROVIDER=disabled \
    SMS_DEV_MODE=false \
    ALLOW_SHARED_MODEL_CREDENTIALS=false

WORKDIR /app
COPY backend/requirements.txt /tmp/requirements.txt
RUN python -m pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r /tmp/requirements.txt \
    && useradd --uid 1000 --create-home --shell /usr/sbin/nologin agent
COPY backend ./backend
COPY --from=frontend-build /frontend-vue/dist ./frontend
# The API imports the shared desktop account exception; native UI dependencies are not needed.
COPY desktop/instance_guard.py ./desktop/instance_guard.py
COPY deploy/container_entrypoint.py ./deploy/container_entrypoint.py

EXPOSE 8000 7860
# Initialize mounted directories, then drop privileges before starting the application.
CMD ["python", "-B", "deploy/container_entrypoint.py"]
