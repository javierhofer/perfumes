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

### 4. Deploy en Fly.io (recomendado para Baileys)

Render free tier duerme cada 15 min y rompe el handshake MultiDevice de WhatsApp. **Fly.io free tier es compatible**: no duerme, tiene disco persistente gratis, baja latencia. Pasos:

```bash
# Instalar CLI: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly launch --name perfumes-tovo --region eze --no-deploy
fly volumes create perfumes_data --size 1 --region eze
fly secrets set WA_TRANSPORT=baileys WA_PHONES=chip1:5492617629556 WA_SESSION_KEY=<tu-clave-32-bytes-hex> WA_ALLOWED_NUMBERS=542616152378,542616609937
fly deploy
fly logs
```

URL de la app: `https://perfumes-tovo.fly.dev`. Detalles completos en `CONTEXTO-WHATSAPP.md`.

## Funcionalidades

- **Dashboard** con metricas (ventas totales, ganancia neta, stock, cuentas por cobrar), grafico de flujo de ventas y panel de alertas criticas.
- **Inventario** con busqueda, filtro por marca, columna de margen calculado y modal de "registro rapido" de venta.
- **CRM Re-compra** que detecta clientes sin compras hace >120 dias y genera link a WhatsApp con mensaje plantilla pre-redactado.
- **Bot de WhatsApp** (Baileys / WhatsApp Web, 100% gratis, sin Meta) para consultar ventas por mensaje: `ventas 30d`, `ventas hoy`, `ventas mes`, `top`, `ayuda` — disponible en espanol e ingles. Ver [seccion WhatsApp](#integracion-whatsapp).
- **i18n**: el bot detecta el idioma del mensaje o respeta un override fijo (Auto / Espanol / English) configurable desde la UI.
- **Reglas de negocio:** al vender, el stock se descuenta automaticamente; si queda <=3 unidades, se dispara alerta.

## Integracion WhatsApp

El bot usa **Baileys** (cliente WhatsApp Web no-oficial). Es 100% gratis y no necesitas dar de alta nada en Meta for Developers. A cambio, Meta podria banear el numero si lo usas de mala manera (spoof, spam). Por eso el bot esta pensado para uso personal: la linea que pongas en `WA_PHONES` se usa como receptor de tus consultas, no para mandar mensajes a terceros.

### Comandos disponibles (es/en)

| Comando (ES) | Comando (EN) | Que hace |
|---|---|---|
| `ventas`, `ventas 30d` | `sales`, `sales 30d` | Lista de ventas de los ultimos 30 dias |
| `ventas 7d` / `15d` / `90d` | `sales 7d` / `15d` / `90d` | Ventas de los ultimos N dias (max 365) |
| `ventas hoy`, `ventas mes` | `sales today`, `sales month` | Solo ventas del dia actual o del mes calendario |
| `top`, `top 10`, `top 5 7d` | `top`, `best`, `bestsellers` | Top 5 perfumes mas vendidos (default: 30d) |
| `ayuda` / `comandos` | `help` / `commands` | Lista de comandos en el idioma detectado |
| cualquier otra cosa | cualquier otra cosa | Mensaje "no entendido" en el idioma del usuario |

Los mensajes no distinguen mayusculas, tildes ni espacios dobles. La autodeteccion se puede forzar desde Configuracion > "Idioma del Bot de WhatsApp".

### Setup (5 pasos)

1. **Conseguir una linea exclusiva** (un chip/SIM que no uses para nada mas). Es importante: si el numero tiene historial activo en WhatsApp personal, los contactos existentes van a seguir viendo ese chip con tu foto/nombre y podes recibir mensajes que no son del bot. La linea va en `WA_PHONES=chip1:<NUMERO>`.

2. **Generar `WA_SESSION_KEY`** (32 bytes hex para cifrar la sesion Baileys en disco):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Configurar `backend/.env`**:
   ```
   WA_TRANSPORT=baileys
   WA_PHONES=chip1:5492617629556
   WA_SESSION_KEY=<la-que-generaste-arriba>
   WA_ALLOWED_NUMBERS=542616152378,542616609937
   WA_MAX_PER_HOUR=30
   WA_WARMUP_DAYS=0
   WA_SHADOWBAN_THRESHOLD=0.3
   WA_BACKUP_CONTACT=542616152378
   ```
   Si el chip se llega a banear/desconectar, los eventos quedan logueados automaticamente (no usamos SMTP ni emails). Filtrar logs de Render por `[WHATSAPP-CRITICAL]` o `[WHATSAPP-WARN]`.

4. **Arrancar el backend**:
   ```bash
   cd backend
   npm run dev
   ```
   Al primer arranque el pool levantara Baileys y generara un QR. Veras en log:
   ```
   [phonePool] Telefono chip1 (5492617629556) registrado en estado warming_up.
   [Baileys:chip1] QR generado, esperando escaneo.
   [phonePool] chip1 QR pendiente. Visitar GET /webhook/qr/chip1
   ```

5. **Escanear el QR** desde el WhatsApp de tu linea exclusiva:
   - En el mismo backend local: abrí `http://localhost:3001/webhook/qr/chip1` → PNG del QR.
   - En Render: una vez deployado, `https://perfumes-tovo.onrender.com/webhook/qr/chip1` (si falla vas a verlo en los logs de Render con prefijo `[WHATSAPP-WARN]` / `[WHATSAPP-CRITICAL]`).
   - En el telefono: WhatsApp > ⋮ menu > Dispositivos vinculados > Vincular un dispositivo > escanear.

   El log va a mostrar:
   ```
   [Baileys:chip1] Conectado.
   ```
   La sesion queda cifrada en disco (`backend/data/sessions/chip1/creds.bin`).

### Arquitectura

```
Tu WhatsApp personal                  Linea exclusiva (chip1)
   "sales today"                         |
        |                                v
        +--------- cualquier numero --- Baileys socket (QR)
                                         |
                                         v
                              commandParser.parseCommand()
                                         |
                                         v
                              ListarVentasUseCase / ListarTop
                                         |
                                         v
                              formatVentasList() / formatTopList()
                                         |
                                         v
                              sendTextMessage (round-robin en pool)
```

### Seguridad implementada

- **Whitelist de numeros** (`WA_ALLOWED_NUMBERS`): rechaza cualquier emisor que no figure alli. Vacio = rechaza todo.
- **Sesion cifrada AES-256-GCM** con `WA_SESSION_KEY`. Sin la clave, el archivo `creds.bin` es inutilizable.
- **Rate limiter** por chip (`WA_MAX_PER_HOUR=30`): evita envios masivos accidentales.
- **ShadowBan detector**: mide el ratio respuestas/enviados. Si cae bajo `WA_SHADOWBAN_THRESHOLD`, marca el chip como `degraded`.
- **Customer notifier**: si el pool entero cae, responde al usuario con `WA_BACKUP_CONTACT` (canal de respaldo configurable).
- **Avisos del chip en logs**: cuando un chip se banea, se desconecta o vuelve a conectarse, el backend lo loguea con prefijo `[WHATSAPP-CRITICAL]` / `[WHATSAPP-WARN]` / `[WHATSAPP-RECOVERED]` segun corresponda. Filtrar por esos prefijos en los logs de Render para enterarte sin chequear el dashboard.
- **`creds.update`/`connection.update` listeners**: re-conexion automatica si Baileys se cierra momentaneamente.

### Variables de entorno (referencia)

| Variable | Ejemplo | Obligatoria | Default |
|---|---|---|---|
| `WA_TRANSPORT` | `baileys` | si | — |
| `WA_PHONES` | `chip1:5492617629556` | si (vacio = pool sin telefonos) | — |
| `WA_SESSION_KEY` | 64 hex chars | si (sin ella no cifra) | — |
| `WA_ALLOWED_NUMBERS` | `542616152378,542616609937` | si | (vacio = rechaza todo) |
| `WA_MAX_PER_HOUR` | `30` | no | `30` |
| `WA_WARMUP_DAYS` | `0` | no | `14` (dias de "calentamiento" para chips nuevos) |
| `WA_SHADOWBAN_THRESHOLD` | `0.3` | no | `0.3` |
| `WA_BACKUP_CONTACT` | `542616152378` | no | (vacio = no responde si cae el pool) |

### Diagnostico

| Endpoint | Que hace |
|---|---|
| `GET /webhook` | Estado del pool + driver + `active`. |
| `GET /webhook/status` | Lista los chips del pool con su estado individual (`warming_up`, `open`, `degraded`, `close`, `logged_out`, `banned`). |
| `GET /webhook/qr/:phoneId` | Devuelve el QR en PNG (320x320) si hay uno pendiente. Si ya esta conectado, devuelve `{ ready: true, status: ... }`. |

### Rollback a Meta Cloud API (legacy)

El codigo de Meta sigue en el repo. Para volver:
1. Editar `backend/.env`: `WA_TRANSPORT=meta` + cargar `WA_PHONE_ID`, `WA_TOKEN`, `WA_VERIFY_TOKEN`, `WA_APP_SECRET`.
2. Configurar el webhook en Meta for Developers.
3. Reiniciar el backend.

### Notas operativas

- **Costo**: $0. WhatsApp es gratis y Baileys no cobra nada. La unica limitante es evitar spam para que Meta no te banee.
- **Linea "caliente"**: el chip tiene que estar fisicamente encendido y con senal. Si lo apagás o queda sin bateria por mucho tiempo, WhatsApp cierra la sesion y tenes que re-escanear el QR. Ideal: dejarlo en un telefono viejo siempre enchufado, con WiFi.
- **Render free tier duerme el servicio** despues de 15 min sin trafico. La sesion Baileys se conserva en el disco *mientras el proceso vive*; al despertar puede que la conexion se haya cerrado (vas a verlo en logs: `[WHATSAPP-WARN] ... Desconectado ...`). Workaround: UptimeRobot free pegandole a `/api/health` cada 5 minutos.
- **Migrar entre proveedores**: como Baileys guarda `creds.bin` cifrado en disco, podes copiar `backend/data/sessions/chip1/` de la maquina local a Render despues del primer emparejamiento. Asi no hace falta escanear QR de nuevo.
- **Baneo**: si WhatsApp te banea el chip, queda logueado como `[WHATSAPP-CRITICAL] ... Chip X BANEADO` y se sigue respondiendo a los usuarios con el `WA_BACKUP_CONTACT`. Para reemplazarlo: conseguir una linea nueva, cambiar `WA_PHONES` y reiniciar.
- **Desarrollo local**: arrancar con `npm run dev`, abrir `http://localhost:3001/webhook/qr/chip1`. Para conectar un bot desde afuera (ej: probar el webhook desde internet) usar [ngrok](https://ngrok.com) sobre el puerto 3001.