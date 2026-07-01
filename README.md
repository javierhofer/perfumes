# Sistema de Gestion de Ventas e Inventario - Perfumes

Sistema web para revendedor de perfumes con Clean Architecture en backend y SPA moderna en frontend.

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
- **Bot de WhatsApp** (Cloud API oficial de Meta) para consultar ventas por mensaje: `ventas 30d`, `ventas hoy`, `ventas mes`, `ayuda`. Ver [seccion WhatsApp](#integracion-whatsapp).
- **Reglas de negocio:** al vender, el stock se descuenta automaticamente; si queda <=3 unidades, se dispara alerta.

## Integracion WhatsApp

Consulta tu negocio enviandole mensajes a un numero de WhatsApp dedicado (NO tu numero personal). Reutiliza el backend ya desplegado en Render como receptor de webhook.

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

### Setup (5 pasos)

1. **Crear app en Meta for Developers** (developers.facebook.com) → tipo Business → agregar producto "WhatsApp".
2. **Activar numero de test** (gratis, sin verificar empresa para empezar) o **migrar un numero dedicado** a la API. Ver [requisitos de numero aqui](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#phone-number).
3. **Copiar credenciales** del numero (panel WhatsApp > API Setup):
   - `Phone number ID` → `WA_PHONE_ID`
   - `Temporary access token` o System User Token → `WA_TOKEN`
   - Settings > Basic > App Secret → `WA_APP_SECRET` (recomendado para validar firma de webhook)
4. **Configurar webhook en Meta**: callback URL = `https://<tu-backend>.onrender.com/webhook`, verify token = el mismo que pongas como `WA_VERIFY_TOKEN` en Render. Suscribirse al evento `messages`.
5. **Cargar variables de entorno en Render** (Environment tab):

   | Variable | Ejemplo | Obligatoria |
   |---|---|---|
   | `WA_PHONE_ID` | `123456789012345` | si |
   | `WA_TOKEN` | `EAAxxxxxxx...` | si |
   | `WA_VERIFY_TOKEN` | un string cualquiera, ej `mi-secreto-123` | si |
   | `WA_APP_SECRET` | `abc123...` del App Secret | recomendada (valida firma) |
   | `WA_ALLOWED_NUMBERS` | tu numero personal en formato `5491145551234` (sin `+`, separar varios con coma) | si (vacio = rechaza todo) |

6. **Agregar tu numero personal** en "manage phone numbers" del panel del numero de test para poder mandarte mensajes.
7. **Redeploy** en Render (pusheando el codigo o haciendo redeploy manual).

### Arquitectura

```
Tu WhatsApp personal
   "ventas 30d"
        |
        v
Numero de test de Meta (WhatsApp Business)
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

### Notas operativas

- **Render free tier duerme el servicio** despues de 15 min sin trafico. El primer webhook tarda varios segundos. Workaround: UptimeRobot o plan pago de Render.
- **Numero de test de Meta**: ~50 mensajes/dia, solo acepta numeros que vos autorices. Las primeras 24h tras activacion hay restricciones de plantillas (no aplican a texto libre como `ventas 30d`).
- **`WA_ALLOWED_NUMBERS` vacio** = todos los mensajes rechazados (defensa en profundidad).
- **Desarrollo local**: usar [ngrok](https://ngrok.com) (`ngrok http 3001`) y apuntar el webhook a la URL que te da, en lugar de Render.