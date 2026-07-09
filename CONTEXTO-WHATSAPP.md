# Contexto: Bot de WhatsApp (ronda 8) — Baileys como driver

## Resumen en una linea

Migramos el driver de WhatsApp de **Meta Cloud API a Baileys**. Es 100% gratis, no requiere tokens ni App ID de Meta, y todo el codigo estaba commiteado en `ronda 5/6/7.1` (esperando a ser activado). Solo hubo que tocar vars de entorno y la i18n del bot.

> **Archivo historico**: el viejo `CONTEXTO-WHATSAPP.md` (de la ronda 6/7 Meta Cloud API) se renombro a `CONTEXTO-WHATSAPP-META.md`. Si algun dia queres volver a Meta, todo lo necesario esta ahi.

---

## Estado al cierre (9 de julio 2026)

### Hecho

| # | Tarea | Estado |
|---|---|---|
| 1 | `backend/.env` migrado a Baileys (sin vars Meta, sin SMTP) | ✅ |
| 2 | `WA_PHONES=chip1:5492617629556` (linea exclusiva nueva) | ✅ |
| 3 | `WA_SESSION_KEY` AES-256-GCM generado y guardado en `.env` | ✅ |
| 4 | `npm run build` (backend) sin errores | ✅ |
| 5 | `tsc --noEmit` (frontend) sin errores | ✅ |
| 6 | `npm run dev` local arranca Baileys, genera QR, expone `/webhook/qr/chip1` | ✅ |
| 7 | i18n es/en implementada en `commandParser`, `commandHandlers`, `templates`, `webhookController` | ✅ |
| 8 | Selector "Idioma del Bot" agregado a `ConfiguracionPage` | ✅ |
| 9 | Seccion WhatsApp de `README.md` reescrita para Baileys | ✅ |
| 10 | `HISTORIAL.md` con la ronda 8 documentada | ✅ |
| 11 | `CONTEXTO-WHATSAPP-META.md` renombrado (historico) | ✅ |
| 12 | `backend/.env.example` con Baileys como seccion default | ✅ |
| 13 | Sacar SMTP/Gmail: baneos y desconexiones se loguean por consola | ✅ |

### Pendiente (cuando estes listo para usar el bot en vivo)

| # | Tarea | Donde |
|---|---|---|
| 1 | Deploy del backend a Render (git push + esperar compilar) | nube |
| 2 | Cargar las env vars en Render → Environment (sin `WA_SESSION_KEY` viejo: generar uno nuevo) | dashboard de Render |
| 3 | Esperar el primer arranque y abrir `https://perfumes-tovo.onrender.com/webhook/qr/chip1` | navegador |
| 4 | Escanear el QR desde el WhatsApp del chip nuevo (otro telefono con senal/WiFi) | telefono |
| 5 | Confirmar en log: `[Baileys:chip1] Conectado.` | dashboard Render → Logs |
| 6 | Probar funcional: mandar `ventas hoy` desde `542616152378` o `542616609937` | WhatsApp personal |

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

## Generacion de `WA_SESSION_KEY`

Comando para generar uno nuevo si necesitas rotar:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
El actual esta en `backend/.env` (no commiteado). Si lo rotas, **tambien se pierde la sesion** (creds cifrados quedan ilegibles). Hay que re-escanear QR.

## Avisos de baneo/desconexion: solo en logs

No usamos SMTP ni emails. Cuando un chip se banea, se desconecta o se reconecta, el backend lo loguea con prefijo segun corresponda:

| Evento | Prefijo | Nivel |
|---|---|---|
| Chip BANEADO por WhatsApp | `[WHATSAPP-CRITICAL]` | `console.error` (visible en rojo en Render) |
| Chip deslogeado (logout) | `[WHATSAPP-WARN]` | `console.warn` |
| Chip desconectado mientras estaba operativo | `[WHATSAPP-WARN]` | `console.warn` |
| Chip reconectado despues de una caida | `[WHATSAPP-RECOVERED]` | `console.log` |

En Render: `Logs` → filtrar por `WHATSAPP` para ver solo eventos del chip.

---

## Endpoints utiles

| Endpoint | Para que |
|---|---|
| `GET /webhook` | Estado general (driver, si hay transporte activo) |
| `GET /webhook/status` | Lista chips del pool con su estado individual |
| `GET /webhook/qr/chip1` | QR PNG si hay uno pendiente (escanealo desde WhatsApp) |

En local: `http://localhost:3001/webhook/qr/chip1`
En Render: `https://perfumes-tovo.onrender.com/webhook/qr/chip1`

---

## Decisiones

1. **Por que Baileys y no Meta**: Meta Cloud API exige App ID, token, App Secret, webhook firmado, etc. Baileys usa una sesion de WhatsApp Web. Setup: tener una linea exclusiva + escanear QR. Costo: $0. Riesgo: baneo si haces spam (no es el caso, el bot solo responde consultas a vos).
2. **Por que i18n**: el chip `5492617629556` puede recibirte de viaje o desde otro pais (vos o un asistente que hable ingles). El bot autodetecta por palabras (`ventas`/`sales`, `hoy`/`today`, etc.). Configurable desde Configuracion > "Idioma del Bot".
3. **Por que solo logs y no SMTP**: mas simple. Render guarda logs por 30 dias en plan free. Si se llega a banear el chip, los logs `[WHATSAPP-CRITICAL]` quedan para revisarlos despues.

## Cosas a NO olvidar

1. **No uses la linea `+54 9 261 762-9556` para chats personales** — los contactos que la tengan de antes te van a escribir ahi y el bot les va a responder con el mensaje de "no entendido". O reseteas el chip o lo cambias por una linea 100% virgen.
2. **El chip tiene que estar siempre con senal y encendido**. Si lo guardas en un cajon un dia, WhatsApp te cierra la sesion. Recomendacion: dejarlo en un telefono secundario enchufado con WiFi.
3. **Render free tier duerme despues de 15 min sin trafico**. Al despertar puede que Baileys haya perdido la conexion (queda logueado con `[WHATSAPP-WARN]`). Workaround: UptimeRobot free pegandole a `/api/health` cada 5 min.
4. **`WA_SESSION_KEY` no se commitea y no se rota sin consecuencia**: si lo cambias, tenes que escanear QR de nuevo.
5. **Si el chip se llega a banear**: lee los logs. La salida sera algo asi:
   ```
   [WHATSAPP-CRITICAL] [Perfumes Bot] Chip chip1 BANEADO
     Tu chip chip1 (5492617629556) fue baneado por WhatsApp.
     ...
   ```

## Migrar la sesion de local a Render (atajo)

Si ya configuraste el chip en tu maquina local y queres que Render lo herede sin escanear de nuevo:

1. Local: `npm run dev`, escanear QR, esperar `[Baileys:chip1] Conectado.`.
2. Apaga el server local.
3. Copiar `backend/data/sessions/chip1/` desde tu maquina a Render.
   - Render free tier no tiene disk persistente entre deploys, asi que esta opcion **no funciona en free tier** — hay que escanear QR en Render si o si.
   - Funciona si usas Render con Persistent Disk ($1/mes) o cualquier VPS.

---

## Como retomar si pasa una semana sin tocar

Abrí `C:\Pruebaperfumes\CONTEXTO-WHATSAPP.md` (este archivo). Decime "retomemos lo del bot" y voy a saber donde quedamos.
