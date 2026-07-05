# Sistema de Gestion de Ventas e Inventario - Perfumes

Sistema web para revendedor de perfumes con Clean Architecture en backend y SPA moderna en frontend.

<!-- webhook deployment trigger -->

## Stack

- **Backend:** Node.js + TypeScript + Express (Clean Architecture en 3 capas: Domain / Application / Infrastructure).
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Recharts.
- **Persistencia:** JSON file en `backend/data/db.json` (sobrevive reinicios).

## Estructura

```
.
├── backend/   API REST - arquitectura limpia
└── frontend/  SPA React
```

## Como correr

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Levanta en `http://localhost:3001`. La primera vez crea `data/db.json` con datos de seed (15 perfumes, 8 clientes, 14 ventas historicas).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Levanta en `http://localhost:5173`. El proxy de Vite redirige `/api/*` al backend.

### 3. Resetear datos

```bash
cd backend
npm run seed -- --force
```

O eliminar `backend/data/db.json` y reiniciar.

## Funcionalidades

- **Dashboard** con metricas (ventas totales, ganancia neta, stock, cuentas por cobrar), grafico de flujo de ventas y panel de alertas criticas.
- **Inventario** con busqueda, filtro por marca, columna de margen calculado y modal de "registro rapido" de venta.
- **CRM Re-compra** que detecta clientes sin compras hace >120 dias y genera link a WhatsApp con mensaje plantilla pre-redactado.
- **Bot de WhatsApp** (Baileys / WhatsApp Web, sin Meta) para consultar ventas por mensaje: `ventas 30d`, `ventas hoy`, `ventas mes`, `ayuda`. Ver [seccion WhatsApp](#integracion-whatsapp).
- **Reglas de negocio:** al vender, el stock se descuenta automaticamente; si queda <=3 unidades, se dispara alerta.

## Integracion WhatsApp

Consulta tu negocio enviandole mensajes a un numero de WhatsApp dedicado (NO tu numero personal). Usa Meta Cloud API oficial — sin QR, sin chips, sin riesgo de baneo. 1000 conversaciones gratis por mes.

### Comandos disponibles

| Comando | Que hace |
|---|---|
| `ventas` / `ventas 30d` | Lista de ventas de los ultimos 30 dias |
| `ventas 7d` / `15d` / `90d` | Ventas de los ultimos N dias (max 365) |
| `ventas hoy` | Solo ventas del dia actual |
| `ventas mes` | Ventas del mes calendario en curso |
| `ayuda` | Muestra los comandos disponibles |
| cualquier otra cosa | Mensaje "no entendido" + ayuda |

Los mensajes no distinguen mayusculas, tildes ni espacios dobles.

### Setup en Meta (5 pasos)

1. **Crear app en Meta for Developers** (developers.facebook.com) → tipo Business → agregar producto "WhatsApp".

2. **Copiar credenciales** del numero (panel WhatsApp > API Setup):
   - `Phone number ID` → `WA_PHONE_ID`
   - `Temporary access token` o System User Token → `WA_TOKEN`
   - Settings > Basic > App Secret → `WA_APP_SECRET` (recomendado para validar firma de webhook)

3. **Configurar webhook en Meta**: callback URL = `https://<tu-backend>.onrender.com/webhook`, verify token = el mismo que pongas como `WA_VERIFY_TOKEN` en Render. Suscribirse al evento `messages`.

4. **Cargar variables de entorno en Render**:

   | Variable | Ejemplo | Obligatoria |
   |---|---|---|
   | `WA_TRANSPORT` | `meta` | si |
   | `WA_PHONE_ID` | `1271942282658314` | si |
   | `WA_TOKEN` | `EAAxxxxxxx...` | si |
   | `WA_VERIFY_TOKEN` | un string cualquiera, ej `perfumes-tovo-2026` | si |
   | `WA_APP_SECRET` | `abc123...` del App Secret | recomendada (valida firma) |
   | `WA_ALLOWED_NUMBERS` | tus numeros personales en formato `542616152378,542616609937` (sin `+`, separar varios con coma) | si (vacio = rechaza todo) |

5. **Agregar tu numero personal** en "manage phone numbers" del panel del numero de test para poder mandarte mensajes. Meta te manda un codigo SMS de verificacion.

### Arquitectura

```
Tu WhatsApp personal
   "ventas 30d"
        |
        v
Numero de Meta (WhatsApp Business)
        |
        v
Cloud API
        |
        v
POST https://<tu-backend>.onrender.com/webhook
        |
        +-> Validacion HMAC (si WA_APP_SECRET esta seteado)
        +-> Whitelist (WA_ALLOWED_NUMBERS)
        +-> commandParser.parseCommand()
        +-> handleVentas() -> ListarVentasUseCase -> formatVentasList()
        +-> POST graph.facebook.com/{phoneId}/messages  (respuesta)
```

### Seguridad implementada

- **Whitelist de numeros**: rechaza cualquier emisor que no este en `WA_ALLOWED_NUMBERS`.
- **Validacion de firma HMAC SHA256** del header `X-Hub-Signature-256` con `WA_APP_SECRET` (recomendado en produccion).
- **Webhook responde 200 inmediato** y procesa en background para evitar reintentos de Meta.
- Tokens y App Secret **solo en variables de entorno** (Render Environment), nunca en codigo ni en `.env` del repo.

### Rollback a Baileys (opcional)

Si queres cambiar a Baileys (WhatsApp Web sin Meta), edita `backend/.env`:
```
WA_TRANSPORT=baileys
WA_PHONES=chip1:54911XXXXXXXX
WA_SESSION_KEY=<hex-32-bytes>
WA_ALLOWED_NUMBERS=5491199999999
```
El codigo Baileys sigue disponible, solo cambia el driver.

### Notas operativas

- **Costo**: 1000 conversaciones gratis/mes. Despues ~$0.005-$0.10 por mensaje segun pais.
- **Numero de test de Meta**: ~50 mensajes/dia, solo acepta numeros que vos autorices.
- **Render free tier duerme el servicio** despues de 15 min sin trafico. El primer webhook tarda varios segundos. Workaround: UptimeRobot o plan pago de Render.
- **Desarrollo local**: usar [ngrok](https://ngrok.com) (`ngrok http 3001`) y apuntar el webhook a la URL que te da.