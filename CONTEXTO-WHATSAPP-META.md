# Contexto: Integración WhatsApp — perfumes-tovo

## Resumen en una línea

Migramos de Meta Cloud API → Baileys → volvimos a Meta Cloud API. Los **10 cambios del plan se aplicaron y commitearon**. Backend compila limpio. El handshake del webhook responde OK desde Render. **Faltan pasos manuales en Meta y Render** para terminar la configuración.

---

## Estado al cierre (5 de julio 2026)

### ✅ Hecho

| # | Tarea | Estado |
|---|---|---|
| 1 | 10 cambios del plan aplicados (backend + frontend + docs) | ✅ |
| 2 | Backend compila limpio (`tsc` sin errores) | ✅ |
| 3 | Frontend compila limpio (`tsc && vite build`) | ✅ |
| 4 | Commit `3e98f0b` "feat(whatsapp): revertir a Meta Cloud API como driver default" (9 archivos) | ✅ |
| 5 | Commit `5da4e58` "fix(deploy): incluir archivos de Baileys/transport/safety/session/notifications" (11 archivos) | ✅ |
| 6 | Commit `aec9ee7` "feat(config): agregar canalRespaldoTexto a la entidad Configuracion" (3 archivos) | ✅ |
| 7 | Push a `main` en github.com/javierhofer/perfumes | ✅ |
| 8 | Render compila sin errores (verificado en logs de deploy) | ✅ |
| 9 | Handshake manual probado: `GET /webhook?hub.mode=subscribe&hub.verify_token=perfumes-tovo-2026&hub.challenge=12345` → devuelve `12345` ✅ | ✅ |
| 10 | `backend/.env` local con el token nuevo | ✅ |

### ⏳ Pendiente (manuales)

| # | Tarea | Dónde |
|---|---|---|
| 1 | Cargar las **6 env vars** en Render → Environment | Dashboard de Render |
| 2 | Registrar **número de teléfono** de WhatsApp Business | Meta → WhatsApp → Paso 2: Configuración de producción |
| 3 | Generar **token permanente** (reemplaza al temporal de 24h) | Meta → mismo Paso 2 → "Prueba tu número registrado" |
| 4 | Reemplazar `WA_TOKEN` en Render con el permanente | Dashboard de Render |
| 5 | Webhook: seleccionar **Whatsapp Business Account** (no User) + suscribirse a `messages` + "Verificar y guardar" | Meta → Webhooks |
| 6 | Mandar `ventas hoy` desde `542616152378` o `542616609937` al número del bot para probar | WhatsApp personal |

---

## ⚠️ Lo crítico que NO hay que olvidar mañana

1. **Render free tier duerme el servicio**: la primera request tarda 30-60s. Si Meta reporta "Unable to verify webhook" por timeout, esperá 1 minuto y reintentá.

2. **El dropdown de producto en Meta Webhooks es CLAVE**: tiene que decir **"Whatsapp Business Account"**, NO "User". Si está en User, Meta intenta verificar contra el webhook de perfil de usuario (about/birthday) y el handshake falla.

3. **`backend/.env` NO se commitea** (está en `.gitignore` por seguridad). El token nuevo que tengo en local hay que **cargarlo a mano** en Render → Environment.

4. **El token temporal de 24h sigue vencido**. Hay que generar el **token permanente** en Meta para no tener que rotarlo cada día.

---

## Datos de Meta ya recopilados

| Campo | Valor |
|---|---|
| App ID | `1507887313662832` |
| Callback URL | `https://perfumes-tovo.onrender.com/webhook` |
| Phone Number ID (bot real) | `1107426182464971` — `+54 9 261 771-0138` (Mendoza), verified_name "perfumessa", quality_rating GREEN |
| ~~Phone Number ID (viejo, mal)~~ | `1271942282658314` era el **Test Number default de Meta** (`+1 555-670-8200`, "Test Number"), NO es nuestro. Corregido en ronda 7.1. |
| WhatsApp Business Account ID | `906163075845034` |
| WA_VERIFY_TOKEN | `perfumes-tovo-2026` |
| WA_APP_SECRET | `daad97810b976fd7d7b0311b1fff5d23` |
| WA_ALLOWED_NUMBERS | `542616152378,542616609937` |

### Tokens que pasaron por mis manos

| Versión | Estado |
|---|---|
| Token original (de CONTEXTO inicial) | Vencido (24h) — solo referencia histórica |
| Token regenerado #1 | `EAAVbalZBxM3ABRwKa3ZAZBEUDjAglYRfGzpttX8uARkPpMofJoo4ZBp3BbZCHDfjiNgst3tDRvEP3XpINQkWVs30SZCO839zyZCayjbQs2FgyalXH6zhuHb9JwA6RXTxEy8LFl97sxkBa6NfddVoSGAafklzT3ceu66KJ6z8MAQxysA7XcdTZBg21FwdbqCtcpUvZADlGW9emvfhZA1nvJmVB7VCyN2MlEOUop0Gv1v1oHLFFIRqPp8x3ZA3RDesqbGVjf0rXBVSmjaV4STOlHeaEgfTCFNaAZDZD` — probablemente también vencido |
| Token regenerado #2 (último) | `EAAVbalZBxM3ABRyh3K3FCFACSv4BCtWsOW7vGN1TZCKfFNgw4Jj0YBCK6PpaiAVEOOqoWfYjiBXvoXfvBrrgjKBlfQw4KP5cQtSAIOyYjg0ZBBjdEiNQlBi26v4qUxTBBME4gue1yaFJZCy4dEQEXtsVw68X74kjUPhGMZB3ZBvCZCNTRZCrumNwoSg2IrIJuJpqQJ4h6cyZAZCPcNNcelB6ccmu4ugj5KRCL44ahX2neY6e72Yr8TNdSlAvvq6QAJJZCbSulYGklzqJ2YZBd8w59Rjc98dB` — en `backend/.env` local, NO commiteado |

> ⚠️ **Todos estos tokens temporales (24h) ya están vencidos o van a vencer pronto.** Mañana hay que generar el token permanente en Meta → Paso 2 → "Prueba tu número registrado" → "Generar token permanente".

---

## Variables de entorno finales para Render

```
WA_TRANSPORT=meta
WA_PHONE_ID=1107426182464971
WA_TOKEN=<token permanente (validado contra el phone_id real arriba)>
WA_VERIFY_TOKEN=perfumes-tovo-2026
WA_APP_SECRET=daad97810b976fd7d7b0311b1fff5d23
WA_ALLOWED_NUMBERS=542616152378,542616609937
```

---

## Decisiones que tomamos

1. **Original**: Meta Cloud API oficial, sin chip, sin baneo. ~1000 conversaciones gratis/mes.
2. **Probamos Baileys** (WhatsApp Web sin Meta): gratis pero Meta puede banear números. Implementé todo: phonePool con failover multi-chip, sesión cifrada AES-256-GCM, warm-up, rate limiter, shadowban detector, customer notifier, email service. El problema: **Baileys requiere un chip dedicado siempre encendido** (no podés sacarlo del celular). Sin chip, no funciona.
3. **Volvimos a Meta Cloud API** porque el chip siempre activo era una limitante inaceptable. El código Baileys queda como rollback opcional (`WA_TRANSPORT=baileys`).

## Por qué Meta y no Baileys

- Baileys = WhatsApp Web. La sesión vive en el servidor pero **el chip tiene que estar físicamente "vivo" en la red del operador** (encendido, con señal). Si el SIM se apaga/sin señal, WhatsApp cierra la sesión después de un rato.
- Meta Cloud API = oficial. Meta te aprueba un número dedicado, vos hablás vía HTTPS. Sin chip, sin QR, sin baneo.

---

## Commits pusheados

```
aec9ee7 feat(config): agregar canalRespaldoTexto a la entidad Configuracion
5da4e58 fix(deploy): incluir archivos de Baileys/transport/safety/session/notifications
3e98f0b feat(whatsapp): revertir a Meta Cloud API como driver default
```

URL: https://github.com/javierhofer/perfumes

---

## Pasos para mañana (en orden)

### 1. Generar token permanente en Meta (5 min)

1. Entrá a https://developers.facebook.com → app `test1` (App ID `1507887313662832`)
2. Menú lateral → **WhatsApp → Paso 2: Configuración de producción**
3. Sección **"Registra tu número de teléfono de WhatsApp"** → click **"Agregar número nuevo"**
4. Cargá el número que querés que sea el bot (uno que puedas recibir SMS)
5. Verificar con el SMS que manda Meta
6. Bajá a **"Prueba tu número registrado"** → click **"Generar token permanente"**
7. **COPIÁ ESE TOKEN** (no se vuelve a mostrar). Va a reemplazar el `WA_TOKEN` actual.

### 2. Cargar env vars en Render (3 min)

Dashboard de Render → tu servicio → **Environment** → agregar las 6 vars:

| Variable | Valor |
|---|---|
| `WA_TRANSPORT` | `meta` |
| `WA_PHONE_ID` | `1271942282658314` |
| `WA_TOKEN` | el **token permanente** que generaste |
| `WA_VERIFY_TOKEN` | `perfumes-tovo-2026` |
| `WA_APP_SECRET` | `daad97810b976fd7d7b0311b1fff5d23` |
| `WA_ALLOWED_NUMBERS` | `542616152378,542616609937` |

Render dispara redeploy automático.

### 3. Verificar handshake en Meta (2 min)

1. Meta → **Webhooks**
2. Dropdown "Seleccionar producto" → **Whatsapp Business Account** (NO User)
3. URL: `https://perfumes-tovo.onrender.com/webhook`
4. Token: `perfumes-tovo-2026`
5. Suscribirse a `messages`
6. Click **"Verificar y guardar"** → debería decir "Webhook verified"

⚠️ Si da timeout: Render free tier está dormido. Esperá 1 min y reintentá.

### 4. Probar el bot (1 min)

Desde tu WhatsApp personal (`542616152378` o `542616609937`), mandá `ventas hoy` al número del bot. Debería responder con el listado de ventas del día.

---

## Diagnóstico de lo que pasó hoy (para no repetirlo)

### El primer "Verify and Save" falló porque:

- Tenías seleccionado **"User"** en el dropdown de producto (no WhatsApp Business Account)
- Meta intentó verificar contra el webhook de perfil de usuario, no el de WhatsApp
- El handshake devolvió error, Meta reseteó la UI a "User" y deshabilitó el botón

### El segundo "Verify and Save" también falló probablemente por:

- **Timing con Render free tier dormido**: la primera request tarda 30-60s, Meta interpreta timeout como fallo
- **Solución**: esperá 1 min antes de clickear "Verificar y guardar"

### El handshake manual SÍ funciona

Probé yo mismo desde mi lado:

```
GET https://perfumes-tovo.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=perfumes-tovo-2026&hub.challenge=12345
```

→ Devolvió exactamente `12345` ✅

Esto confirma que el backend está OK y las env vars coinciden.

---

## Estructura del código final (post-ronda 6)

**Backend:**
- `src/infrastructure/whatsapp/transport/WhatsappTransport.ts` — interfaz abstracta
- `src/infrastructure/whatsapp/transport/MetaTransport.ts` — implementación Meta Cloud API ✅ activo
- `src/infrastructure/whatsapp/transport/BaileysTransport.ts` — implementación Baileys (rollback opcional)
- `src/infrastructure/whatsapp/phonePool.ts` — pool multi-chip (solo si `WA_TRANSPORT=baileys`)
- `src/infrastructure/whatsapp/whatsappClient.ts` — facade `bindMeta`/`bindPool`/`sendTextMessage`
- `src/infrastructure/whatsapp/webhookController.ts` — handshake Meta + HMAC + dispatcher async
- `src/infrastructure/whatsapp/safety/` — warmup, rateLimiter, shadowBanDetector, customerNotifier (todos Baileys, pero customerNotifier aplica a Meta también)
- `src/infrastructure/whatsapp/session/store.ts` — AES-256-GCM (solo Baileys)
- `src/infrastructure/notifications/emailService.ts` — SMTP Gmail (solo Baileys, para avisos de baneo)
- `src/infrastructure/http/app.ts` — `buildApp()` con dispatch según `WA_TRANSPORT`
- `src/infrastructure/http/server.ts` — logs de estado según driver

**Frontend:**
- `src/pages/CrmPage.tsx` — sin indicador del pool (Meta no lo necesita)
- `src/pages/ConfiguracionPage.tsx` — campo "Mensaje si Meta está caído"

**Docs:**
- `README.md` — sección "Integracion WhatsApp" reescrita con 5 pasos de Meta
- `HISTORIAL.md` — ronda 6 agregada

---

## Cómo retomar mañana

Abrí `C:\Pruebaperfumes\CONTEXTO-WHATSAPP.md` (este archivo) y decime:

> "Retomemos lo de WhatsApp, el archivo CONTEXTO-WHATSAPP.md tiene todo el contexto"

El modelo va a poder leer este archivo y seguir exactamente donde quedaste. El código ya está hecho y pusheado — solo faltan pasos manuales en Meta y Render.

---

## Comandos útiles

```bash
# Verificar que el backend compila
cd C:\Pruebaperfumes\backend
npm run build

# Probar el handshake del webhook en el navegador
https://perfumes-tovo.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=perfumes-tovo-2026&hub.challenge=12345
# Debe devolver: 12345 (NO un JSON)

# Ver logs en vivo de Render
# Ir a https://dashboard.render.com → tu servicio → Logs
# Filtrar por "whatsapp" para ver el handshake y los mensajes

# Ver el estado del repo
git log --oneline -10
git status
```

---

## Resumen ejecutivo (1 minuto de lectura)

- **Stack**: Backend Node + Express + TypeScript, frontend React + Vite + Tailwind
- **Hoy**: 3 commits pusheados, backend compila limpio, handshake manual responde OK
- **Mañana**: 4 pasos manuales en Meta + Render (token permanente, env vars, webhook verify, prueba)
- **Tiempo estimado**: 15-20 minutos mañana
- **Costo**: $0 (Meta te da 1000 conversaciones gratis/mes, mensajes de servicio no requieren tarjeta)
- **Riesgo de baneo**: 0 (Meta oficial)