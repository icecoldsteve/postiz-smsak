# SMSAK Social Scheduler — Deploy (10 minuten, 1x klikken)

> **Waarom niet Vercel?** Postiz is een NestJS-backend + Next.js-frontend + achtergrond-workers
> (BullMQ/Temporal). Dat draait **niet** op Vercel serverless — de officiële methode is
> Docker-Compose. De snelste betaalde one-click opties staan hieronder.

## Optie A — Railway (aanbevolen, ±€5-10/maand)

1. Ga naar https://railway.app en log in met GitHub (icecoldsteve).
2. New Project → **Deploy from GitHub repo** → kies `icecoldsteve/postiz-smsak`.
3. Voeg in hetzelfde project toe: **PostgreSQL** en **Redis** (New → Database).
4. Zet bij de app-service deze variables:

```
DATABASE_URL   = ${{Postgres.DATABASE_URL}}
REDIS_URL      = ${{Redis.REDIS_URL}}
JWT_SECRET     = <genereer: openssl rand -base64 32>
ENCRYPTION_SECRET = <genereer: openssl rand -base64 32>
FRONTEND_URL   = https://<jouw-railway-domein>
NEXT_PUBLIC_BACKEND_URL = https://<jouw-railway-domein>/api
BACKEND_INTERNAL_URL = http://localhost:3000
IS_GENERAL     = true
STORAGE_PROVIDER = local
UPLOAD_DIRECTORY = /uploads
NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY = /uploads
```

5. Settings → Networking → **Generate Domain** → vul dat domein in bij `FRONTEND_URL`
   en `NEXT_PUBLIC_BACKEND_URL` hierboven en redeploy.
6. Klaar: eerste registratie = admin-account.

Alternatief: officiële Postiz Railway-template → https://railway.app/template (zoek "Postiz"),
en wijzig daarna de repo naar `icecoldsteve/postiz-smsak` voor de SMSAK-branding.

## Optie B — Elestio (officiële partner, ±€10/maand)

https://elest.io/open-source/postiz → one-click, kies daarna custom image van je fork.

## Optie C — Eigen VPS (Hetzner CX22, €4/maand)

```bash
git clone https://github.com/icecoldsteve/postiz-smsak.git
cd postiz-smsak
cp .env.smsak.template .env   # vul DATABASE_URL/REDIS_URL/secrets in
docker compose up -d
```

## Custom domein

Daarna in DNS van smsak.be: CNAME `app.scheduler` (of `postiz`) → het Railway/Elestio-domein.

## Na de deploy

1. Registreer het eerste account (= admin) met social@smsak.be.
2. Settings → koppel X/LinkedIn/Instagram (API-keys per platform, zie `.env.smsak.template`).
3. Plan een testpost en controleer dat hij gepubliceerd wordt.

© SMSAK | www.smsak.be | KBO BE1035.506.672
