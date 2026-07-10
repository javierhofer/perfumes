# Contexto: Bot de WhatsApp (ronda 9) — Migración a Fly.io + Baileys como driver

## Resumen en una linea

Migramos el deploy del backend de Render free tier a **Fly.io** porque Render free duerme cada 15 min y eso rompe el handshake MultiDevice de Baileys (11 reintentos fallidos con `QR refs attempts ended`). Fly.io free no duerme y tiene disco persistente, lo que mantiene viva la sesión Baileys entre redeploys.

> **Archivo historico**: el viejo `CONTEXTO-WHATSAPP.md` (de la ronda 6/7 Meta Cloud API) se renombro a `CONTEXTO-WHATSAPP-META.md`. Si queres volver a Meta, todo lo necesario esta ahi.

---

## Estado al cierre (10 de julio 2026)

### Hecho

| # | Tarea | Estado |
|---|---|---|
| 1 | Round 8: Baileys activado + i18n es/en + SMTP quitado, commiteado a `main` (commits `6ba8a1d`, `aa08a4d`) | ✅ |
| 2 | Round 9a: fixes para handshake QR en Render (backoff exponencial, loadCredsOrReset, hints en logs) — commits `b124885` y anteriores | ✅ |
| 3 | Round 9b: setup Fly.io (Dockerfile multi-stage, .dockerignore, fly.toml, jsonStore usa DATA_DIR, session/store usa DATA_DIR) — commit `fdca048` | ✅ |
| 4 | Backend compila limpio local | ✅ |
| 5 | Smoke test con `DATA_DIR` validado: db.json y auth/ se crean en la ruta custom | ✅ |
| 6 | Push a `main` | ✅ |

### Pendiente (manual, lo haces vos)

| # | Tarea | Donde |
|---|---|---|
| 1 | Instalar Fly CLI en tu PC | https://fly.io/docs/hands-on/install-flyctl/ |
| 2 | `fly auth login` | terminal |
| 3 | `fly launch --name perfumes-tovo --region eze --no-deploy` desde la raiz del repo | terminal |
| 4 | `fly volumes create perfumes_data --size 1 --region eze` | terminal |
| 5 | `fly secrets set WA_TRANSPORT=... WA_PHONES=...` con todas las vars | terminal |
| 6 | `fly deploy` | terminal |
| 7 | Escuchar logs con `fly logs`, abrir `/webhook/qr/chip1`, escanear QR desde WhatsApp del chip | navegador + telefono |
| 8 | Probar `ventas hoy` desde tu línea personal (`542616152378`/`542616609937`) | WhatsApp personal |
| 9 | Apagar el servicio de Render (suspend o delete) | dashboard.render.com |

---

## Datos de la linea exclusiva

| Campo | Valor |
|---|---|
| Numero del chip | `5492617629556` |
| ID interno | `chip1` |
| En `WA_PHONES` | `chip1:5492617629556` |
| Numeros autorizados a usar el bot | `542616152378,542616609937` (vos) |
| Backup contact (si el pool cae) | `542616152378` |
| WhatsApp del bot (`+54 9 261 762-9556`) | Chip dedicado — NO usar para chats personales |

## Variables de entorno (las mismas que Render)

En Fly se cargan con `fly secrets set`:

```
WA_TRANSPORT=baileys
WA_PHONES=chip1:5492617629556
WA_SESSION_KEY=019205c0f8f33332ddc94447c475050b1518d342643a40e53eeeed138865a5d6
WA_ALLOWED_NUMBERS=542616152378,542616609937
WA_MAX_PER_HOUR=30
WA_WARMUP_DAYS=0
WA_SHADOWBAN_THRESHOLD=0.3
WA_BACKUP_CONTACT=542616152378
```

`NODE_ENV=production`, `DATA_DIR=/data`, `PORT=3000` ya estan en el `fly.toml` (env block, no son Secret porque no necesitan ocultarse).

## Por qué Fly y no Render

- **Render free tier**: duerme el servicio cada 15 min sin trafico. Baileys genera QRs cada 60s pero cuando vos escaneabas, WhatsApp mandaba el handshake y Render estaba despertando (30-60s de delay). El handshake MultiDevice tiene un timeout interno que se agota. 11 reintentos fallidos consecutivos.
- **Render plan $7/mes**: sin sleep, pero sin disco persistente. La sesión Baileys se pierde en cada redeploy (no gratuito sin extra config).
- **Fly.io free**:
  - Sin sleep (la maquina queda prendida).
  - Volumen persistente de 1GB gratis (perfumes_data) → sesión Baileys y db.json sobreviven redeploys.
  - Region eze (Ezeiza, Argentina) → baja latencia al chip.

## Avisos de baneo/desconexion: solo en logs

Sin SMTP ni emails. Cuando el chip se banea, se desconecta o reconecta:

| Evento | Prefijo | Nivel |
|---|---|---|
| Chip BANEADO por WhatsApp | `[WHATSAPP-CRITICAL]` | `console.error` |
| Chip deslogeado | `[WHATSAPP-WARN]` | `console.warn` |
| Chip reconectado | `[WHATSAPP-RECOVERED]` | `console.log` |

En Fly: `fly logs` → filtrar por `WHATSAPP`.

## Endpoints utiles

| Endpoint | Para que |
|---|---|
| `GET /api/health` | Health check |
| `GET /webhook` | Estado del pool + driver |
| `GET /webhook/status` | Lista chips con su estado |
| `GET /webhook/qr/:phoneId` | QR PNG para escanear |

URL base: `https://perfumes-tovo.fly.dev`

## Migracion de datos desde Render (opcional)

Si querés copiar tu `db.json` de local al volumen de Fly:

```powershell
fly ssh --command "cat > /data/db.json" - < C:\Pruebaperfumes\backend\data\db.json
```

Si arrancas de cero, el seed crea 10 clientes + 18 ventas demo automáticamente.

## Decisiones tomadas

1. **Driver Baileys**: Gratis, sin tokens Meta, sin baneo probable (uso personal).
2. **Plataforma Fly.io**: Sin sleep, disco persistente, gratis.
3. **Region eze**: Mejor latencia para el chip que esta en Argentina.
4. **Misma WA_SESSION_KEY**: La sesión actual esta vacía (nunca escaneamos), da lo mismo rotar o no.
5. **i18n es/en**: Mantenida de la ronda 8.
6. **Sin SMTP**: Mantenido de la limpieza ronda 8/9. Solo logs.

## URLs a recordar

- **App**: https://perfumes-tovo.fly.dev
- **QR del chip**: https://perfumes-tovo.fly.dev/webhook/qr/chip1
- **Logs**: `fly logs` (o en https://fly.io/apps/perfumes-tovo/monitoring)
- **Dashboard Fly**: https://fly.io/apps/perfumes-tovo

## Como retomar si pasa una semana sin tocar

1. Abrí `C:\Pruebaperfumes\CONTEXTO-WHATSAPP.md` (este archivo).
2. Decime "retomemos lo del bot" y voy a saber donde quedamos.

## Si algo sale mal

- **El bot no responde mensajes**: `fly logs` → filtrar por `Baileys` o `WHATSAPP`.
- **Sesion perdida**: reescanear QR desde `/webhook/qr/chip1`. La sesión Baileys queda en `/data/auth/chip1/creds.bin` (volumen persistente). Solo se pierde si rotaba `WA_SESSION_KEY` o si el volumen se borra manualmente.
- **Render free vuelve a tirar**: ya no aplica — estamos en Fly.
- **Quiero volver a Render**: hay que re-adaptar `jsonStore.ts` y `session/store.ts` para no usar `DATA_DIR`, y eliminar el `Dockerfile` + `.dockerignore` + `fly.toml`. Lleva ~10 min.
