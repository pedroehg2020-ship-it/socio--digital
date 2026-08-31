# ---------------------------------------------------------------------------
# Etapa 1 — build do frontend
#
# Antes esta etapa não existia: a imagem copiava o bundle que estivesse
# comitado em frontend/static/js. Bastava esquecer de rodar `npm run build`
# antes do commit para o site publicado ficar servindo uma versão antiga do
# React. Agora o bundle é sempre gerado a partir do código-fonte no deploy.
# ---------------------------------------------------------------------------
FROM node:20-slim AS frontend

WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Etapa 2 — runtime Python
# ---------------------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY . /app

# O bundle recém-compilado substitui o que veio do repositório.
COPY --from=frontend /build/static /app/frontend/static

EXPOSE 8000

# A Render injeta a variável PORT. A versão anterior fixava 8000 no comando e
# ignorava esse valor — se a plataforma escolher outra porta, o serviço sobe
# mas fica inalcançável, e o visitante vê a página de erro da hospedagem em
# vez do site.
CMD ["sh", "-c", "python -m uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
