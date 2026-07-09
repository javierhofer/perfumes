# Sistema de Gestión de Ventas e Inventario - Perfumes

## 📋 Resumen Ejecutivo

Sistema web completo para revendedores de perfumes con:
- **Backend:** Node.js + TypeScript + Express, Clean Architecture (Domain / Application / Infrastructure).
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Recharts.
- **Persistencia:** JSON file en `backend/data/db.json` (sobrevive reinicios).
- **Stack:** TypeScript end-to-end, modo claro/oscuro, soporte multi-moneda.

## 🚀 Cómo correrlo

### Backend
```bash
cd backend
npm install
npm run dev   # http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### Resetear datos
```bash
cd backend
npm run seed -- --force
```

## 🏗️ Arquitectura Backend (Clean Architecture)

```
backend/src/
├── domain/
│   ├── entities/         # Perfume, Cliente, Venta, Pago, Configuracion
│   └── repositories/     # Interfaces IRepository (sin deps)
├── application/
│   ├── use-cases/        # Lógica de negocio
│   └── dtos/             # Objetos de transferencia
├── infrastructure/
│   ├── persistence/      # JsonRepositories + jsonStore
│   ├── http/             # Express + rutas + middleware
│   └── seed/             # Datos iniciales (15 perfumes, 10 clientes, 18 ventas)
└── shared/
    └── container.ts      # DI manual
```

## 📡 Endpoints API

| Método | Ruta | Uso |
|--------|------|-----|
| GET | /api/health | Health check |
| GET | /api/perfumes?busqueda=&marca= | Listar/buscar perfumes |
| GET | /api/ventas | Historial de ventas |
| POST | /api/ventas | Registrar venta (body: clienteId, productoId, cantidad, tipoPago) |
| GET | /api/clientes | Listar clientes activos |
| GET | /api/clientes?conDeuda=true | Solo con deuda |
| GET | /api/clientes?incluirInactivos=true | Incluir dados de baja |
| POST | /api/clientes | Crear cliente |
| PUT | /api/clientes/:id | Editar cliente |
| DELETE | /api/clientes/:id | Soft delete (marca activo=false) |
| GET | /api/clientes/:id/ficha | Ficha completa: cliente + ventas + pagos + saldo |
| POST | /api/clientes/:id/pagos | Registrar pago (FIFO, body: monto, nota?) |
| GET | /api/clientes/recontacto | Clientes inactivos según días configurados |
| GET | /api/dashboard/metrics | Métricas del dashboard |
| GET | /api/dashboard/alertas-stock | Stock crítico |
| GET | /api/configuracion | Config global |
| PUT | /api/configuracion | Actualizar config (merge parcial) |

## 🎨 Vistas Frontend

| Ruta | Vista |
|------|-------|
| / | Dashboard (métricas, gráfico, alertas) |
| /inventario | Tabla perfumes con búsqueda/filtros, modal venta rápida |
| /ventas | Tabla ventas con 5 filtros + exportar CSV |
| /clientes | Tabla clientes con etiquetas, filtro, deuda crítica |
| /clientes?conDeuda=true | Filtro automático a con deuda |
| /crm | CRM re-compra con WhatsApp template |
| /configuracion | 12 secciones colapsables |

## ⚙️ Configuración (12 secciones en /configuracion)

1. **Stock Crítico** — umbral de alerta (default 3)
2. **Deuda Crítica** — monto (default $100.000)
3. **CRM Re-compra** — días (default 120)
4. **Datos del Negocio** — nombre, teléfono, email, dirección, CUIT
5. **Etiquetas de Cliente** — CRUD con colores customizables
6. **Plantilla WhatsApp** — texto con variables {nombre}, {dias}, {perfume}
7. **Moneda** — ARS / USD / EUR + símbolo
8. **Tema Visual** — modo claro/oscuro
9. **Idioma** — ES / EN (selector)
10. **Notificaciones** — toggle + permiso del navegador
11. **Numeración de Tickets** — prefijo + siguiente (ej: V-0001)
12. **Backup** — descarga JSON completo

## 🔧 Reglas de Negocio Implementadas

- **Margen dinámico** = precioVenta - precioCosto
- **Descuento automático de stock** al registrar venta
- **Alerta crítica** cuando stock ≤ umbral configurado
- **Estado de pago automático**: CuentaCorriente → Pendiente, otros → Pagado
- **Pagos FIFO**: se aplican a ventas pendientes más antiguas primero
- **Pagos parciales**: estado "Parcial" cuando se paga algo pero no el total
- **Detección de recompra**: cliente inactivo > días configurados
- **Soft delete**: clientes dados de baja mantienen historial
- **Validación de teléfono duplicado**: error 409 si ya existe

## 📁 Archivos Clave

### Backend
- `src/domain/entities/Configuracion.ts` — config con defaults
- `src/application/use-cases/RegistrarVentaUseCase.ts` — valida + descuenta + alerta
- `src/application/use-cases/RegistrarPagoClienteUseCase.ts` — FIFO
- `src/application/use-cases/ObtenerAlertasStockUseCase.ts` — usa config.umbralStockCritico
- `src/application/use-cases/ObtenerClientesParaRecompraUseCase.ts` — usa config.diasRecompra + plantillaWhatsapp
- `src/infrastructure/persistence/jsonStore.ts` — incluye `configuracion`
- `src/infrastructure/seed/seedData.ts` — 15 perfumes, 10 clientes con etiquetas, 18 ventas, 2 pagos

### Frontend
- `src/contexts/ConfigContext.tsx` + `ConfigProvider.tsx` — contexto global
- `src/hooks/formato.ts` — formatearARS() con moneda configurable
- `src/hooks/deudaCritica.ts` — esDeudaCritica() con umbral de config
- `src/utils/csv.ts` — generador CSV + descarga via Blob
- `src/index.css` — CSS variables para tema claro/oscuro
- `src/components/clientes/ClienteDrawer.tsx` — ficha completa + imprimir + exportar CSV
- `src/components/clientes/TagsSelector.tsx` — chips con sugerencias
- `src/components/clientes/EliminarClienteModal.tsx` — modal robusto
- `src/components/configuracion/SeccionConfig.tsx` — Sección colapsable + Toggle + BotonGuardar
- `src/pages/ConfiguracionPage.tsx` — 12 secciones
- `src/pages/VentasPage.tsx` — tabla con filtros + exportar

## 🐛 Decisiones Técnicas Tomadas

1. **Persistencia**: JSON en disco (elegido por el usuario)
2. **Cantidad de seed**: Set realista (15 perfumes, 10 clientes)
3. **Stack**: Node + React + Vite + Tailwind
4. **Imputación de pagos**: FIFO
5. **Baja de cliente**: Soft delete con flag `activo`
6. **Pagos parciales**: Sí permitidos
7. **Config persistente**: Backend en db.json (compartida entre dispositivos)
8. **Datos del negocio**: Form simple de texto
9. **Tema oscuro**: CSS variables + clase `dark`
10. **Notificaciones**: Permiso del navegador con fallback
11. **Webhook WhatsApp**: handshake responde 200 inmediato y procesa async para evitar reintentos de Meta
12. **Validacion firma HMAC**: opt-in via `WA_APP_SECRET`; si esta seteada, sin firma = 401. Si no, deja pasar (warning)
13. **Whitelist por numero**: `WA_ALLOWED_NUMBERS` vacio = rechaza todo (defensa por default)

## 📲 Integracion WhatsApp (agregado en ronda 4)

- **Comandos**: `ventas`, `ventas 7d`/`15d`/`30d`/`90d`, `ventas hoy`, `ventas mes`, `ayuda`
- **Stack**: Cloud API oficial de Meta, sin dependencias extra salvo `axios`
- **Archivos nuevos**:
  - `src/infrastructure/whatsapp/whatsappClient.ts` — POST a graph.facebook.com con retry
  - `src/infrastructure/whatsapp/commandParser.ts` — parsea comandos con normalizacion (tildes, mayusculas)
  - `src/infrastructure/whatsapp/commandHandlers.ts` — wrappea `ListarVentasUseCase` y aplica filtro de fecha
  - `src/infrastructure/whatsapp/templates.ts` — formato plain text (WhatsApp no renderiza markdown)
  - `src/infrastructure/whatsapp/webhookController.ts` — Express router: GET handshake, POST con firma + whitelist + dispatch
- **Archivos extra**: `src/shared/monedaHelper.ts` (cache TTL de `simboloMoneda`)
- **Archivos modificados**:
  - `src/infrastructure/http/app.ts` — monta el router del webhook **antes** de `express.json()` para conservar `raw body` para HMAC
  - `src/infrastructure/http/server.ts` — loguea endpoints del webhook + warn si faltan envs
  - `package.json` — +`axios`, +`dotenv`
- **Test de humo** (validado local):
  - `GET /webhook?hub.verify_token=...` -> 200 con echo del `hub.challenge`
  - Token incorrecto -> 403
  - `POST /webhook` con payload simulado `ventas 30d` -> 200, listado generado con 8 ventas del mes
- **Reutiliza**: `ListarVentasUseCase` (sin cambios), repositorios JSON, configuracion

## 🔄 Regenerar dependencias desde cero

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 🔄 Migración WhatsApp Meta → Baileys (ronda 5)

- **Driver intercambiable**: nueva interfaz `WhatsappTransport` (`backend/src/infrastructure/whatsapp/transport/WhatsappTransport.ts`). El codigo Meta viejo vive en `MetaTransport.ts` y se activa con `WA_TRANSPORT=meta` (rollback).
- **Baileys / WhatsApp Web**: nueva implementacion `BaileysTransport.ts` usando `@whiskeysockets/baileys`. Conexion por QR, sin Meta Cloud API, sin firmas HMAC, sin plantillas HSM.
- **Sesion cifrada AES-256-GCM**: `backend/src/infrastructure/whatsapp/session/store.ts` cifra `creds.bin` por chip con clave `WA_SESSION_KEY`. Persiste entre reinicios.
- **phonePool con failover**: `backend/src/infrastructure/whatsapp/phonePool.ts` maneja N chips, round-robin entre sanos, estados `warming_up / open / degraded / close / logged_out / banned`.
- **Warm-up gradual**: `safety/warmup.ts` con `WA_WARMUP_DAYS=14` (cap mensajes/dia sube progresivamente desde `WA_WARMUP_START` hasta `WA_WARMUP_END`).
- **Rate limiter**: `safety/rateLimiter.ts` con `WA_MAX_PER_HOUR` por chip + cooldown por destinatario (`WA_RECIPIENT_COOLDOWN_MS`).
- **ShadowBan detector**: `safety/shadowBanDetector.ts` mide ratio respuestas/enviados, marca `degraded` si cae bajo `WA_SHADOWBAN_THRESHOLD`.
- **Customer notifier**: `safety/customerNotifier.ts` responde con el `canalRespaldoTexto` configurable cuando el pool entero cae, asi el cliente no se queda sin derivacion.
- **Email service**: `infrastructure/notifications/emailService.ts` SMTP nativo (sin deps) para Gmail. Dispara email al admin cuando un chip se banea / desconecta / reconecta. (En la ronda 8 fue reemplazado por `console.error`/`warn`/`log` con prefijo `[WHATSAPP-*]` — sin dependencias externas.)
- **Endpoints admin**: `GET /webhook/status`, `GET /webhook/qr/:id`, `POST /api/phones`, `DELETE /api/phones/:id`, `POST /api/phones/:id/replace`.
- **UI**: indicador de estado de chips en `CrmPage.tsx`; campo `canalRespaldoTexto` editable en `ConfiguracionPage.tsx`.
- **Variables de entorno**: `WA_PHONES`, `WA_SESSION_KEY`, `WA_TRANSPORT`, `WA_MAX_PER_HOUR`, `WA_WARMUP_*`, `WA_SHADOWBAN_THRESHOLD`, `SMTP_*`, `WA_BACKUP_CONTACT`. Las vars Meta (`WA_PHONE_ID`, `WA_TOKEN`, etc) quedan en `.env.example` como referencia para rollback. *(Nota: `SMTP_*` se elimino en una ronda posterior — los avisos ahora se loguean por consola con prefijo `[WHATSAPP-*]`.)*

## 🔄 Reersion a Meta Cloud API (ronda 6)

- **Driver por env var**: `WA_TRANSPORT=meta` (default) o `baileys` (rollback). Todo el codigo de Baileys queda disponible pero no se usa por default.
- **MetaTransport funcional**: handshake `hub.mode=subscribe` + `hub.verify_token` + `hub.challenge`, validacion HMAC SHA-256 con `WA_APP_SECRET`, dispatcher async para evitar reintentos de Meta.
- **Codigo Baileys preservado**: `transport/BaileysTransport.ts`, `phonePool.ts`, `safety/*` siguen en el repo. Para activar: `WA_TRANSPORT=baileys` + `WA_PHONES` + `WA_SESSION_KEY`.
- **Frontend**: removido el indicador del pool en `CrmPage.tsx` (no aplica a Meta). El campo `canalRespaldoTexto` sigue editable en Configuracion, ahora titulado "Mensaje si Meta esta caido".
- **Variables de entorno**: `WA_TRANSPORT` (default `meta`), `WA_PHONE_ID`, `WA_TOKEN`, `WA_VERIFY_TOKEN`, `WA_APP_SECRET`, `WA_ALLOWED_NUMBERS`. Vars Baileys (`WA_PHONES`, `WA_SESSION_KEY`, etc) quedan en `.env.example` como referencia para rollback.

## 🔧 Correccion `WA_PHONE_ID` (ronda 7.1)

- **Hallazgo**: el `WA_PHONE_ID=1271942282658314` que estaba en el repo y en `CONTEXTO-WHATSAPP.md` correspondía al **Test Number default de Meta** (`+1 555-670-8200`, "Test Number"), no a un numero real. Confirmado con `GET /v25.0/1271942282658314?fields=display_phone_number,verified_name`.
- **Phone ID real**: `1107426182464971` → `+54 9 261 771-0138` (Mendoza), verified_name = "perfumessa", quality_rating = GREEN. Ese fue el que respondio al curl outbound con `200 OK` y `message_status: accepted`.
- **Token validado**: el que termina en `...ZAW4lNkwZDZD` (empieza con `EAAVbalZBxM3ABR6`) tiene permisos sobre el phone_id real.
- **Cambios**:
  - `backend/.env` → `WA_PHONE_ID=1107426182464971` (no se commitea)
  - `CONTEXTO-WHATSAPP.md` → tabla de "Datos de Meta ya recopilados" corregida, con nota aclaratoria
  - Este `HISTORIAL.md` → ronda 7.1 documentada
- **Sin cambios de codigo**: el codigo del backend ya leia `WA_PHONE_ID` de env var, solo la config local estaba mal.

## 🆕 Comando `top` / `mas vendido` (ronda 7)

- **Sintaxis**: `top`, `top N`, `top N Nd` (ej: `top`, `top 10`, `top 5 7d`). Acepta variante `mas vendido` / `mas vendidos` / con acentos (`Más vendido` → parser normaliza con `stripAccents`).
- **Comportamiento**: agrupa todas las ventas del período por nombre de producto, suma `cantidad` y `total`, ordena descendente por unidades (desempate por total facturado) y devuelve los N primeros.
- **Defaults**: cantidad=5, ventana=últimos 30 días. Límite: 20 items por mensaje.
- **Reutiliza**: `getDateRange()` (commandParser.ts:49) y `ListarVentasUseCase` (sin tocar). `filtrarPorRango` (commandHandlers.ts) compartido con `handleVentas`.
- **Archivos modificados**:
  - `src/infrastructure/whatsapp/commandParser.ts` — `TopArgs` interface + `parseTopArgs` + ramas en `parseCommand`
  - `src/infrastructure/whatsapp/commandHandlers.ts` — `handleTop(args)` que agrupa y rankea
  - `src/infrastructure/whatsapp/templates.ts` — `TopItem` interface + `formatTopList()` + ayuda actualizada
  - `src/infrastructure/whatsapp/webhookController.ts` — rama `'top'` en `handleIncoming`
- **Sin nuevas dependencias**. Backend compila limpio.

## 📝 Próximas Mejoras Identificadas (no implementadas)

- Módulo de facturación/comprobantes usando la numeración de tickets
- i18n masivo (solo está el selector, no traducido todo)
- Upload de backup (restaurar JSON)
- Sonidos de alerta
- PWA / instalable
- Multi-usuario con autenticación
- Sincronización en la nube (actualmente local)
- Gráfico de ventas por perfume (top sellers)
- Vista de catálogo imprimible con QR WhatsApp

## 💾 Backup recomendado antes de apagar la PC

### Opción rápida (PowerShell)
```powershell
# Backup completo excluyendo node_modules
$exclude = Get-Content -Path "exclude.txt" -ErrorAction SilentlyContinue
if (-not $exclude) { Set-Content -Path "exclude.txt" -Value "node_modules`r`n*.log`r`n.env" }

Compress-Archive -Path "C:\Pruebaperfumes\*" -DestinationPath "D:\backup-perfumes-$(Get-Date -Format 'yyyy-MM-dd').zip" -Force
Copy-Item "C:\Pruebaperfumes\backend\data\db.json" -Destination "D:\backup-db-$(Get-Date -Format 'yyyy-MM-dd').json"
```

### Archivo `exclude.txt` (crear en C:\Pruebaperfumes)
```
node_modules
*.log
.env
dist
build
.vite
.tsbuildinfo
```

## 🚦 Estado al cierre

- ✅ Backend corriendo en :3001 con seed (10 clientes, 18 ventas, 2 pagos)
- ✅ Frontend corriendo en :5173 con HMR
- ✅ TypeScript compila limpio (backend + frontend)
- ✅ Todas las features de las 3 rondas de mejoras implementadas
- ✅ Módulo de Configuración funcional con persistencia

## 🔄 Migracion final a Baileys como driver (ronda 8)

- **Decision**: abandonar la API oficial de Meta (costaba tiempo de setup, tokens temporales, App ID, webhooks firmados) y usar Baileys como driver por default. Es 100% gratis y solo requiere una linea exclusiva.
- **Cambios de `backend/.env`**:
  - Borradas: `WA_PHONE_ID`, `WA_TOKEN`, `WA_VERIFY_TOKEN`, `WA_APP_SECRET`.
  - Agregadas: `WA_TRANSPORT=baileys`, `WA_PHONES=chip1:5492617629556`, `WA_SESSION_KEY=<hex-32-bytes>`, `WA_MAX_PER_HOUR=30`, `WA_WARMUP_DAYS=0`, `WA_SHADOWBAN_THRESHOLD=0.3`, `WA_BACKUP_CONTACT=542616152378`. Sin vars de SMTP/email — los avisos del chip se loguean con prefijo `[WHATSAPP-*]`.
- **Cambios de codigo**:
  - `domain/entities/Configuracion.ts` — nueva opcion `idiomaBot: 'auto' | 'es' | 'en'` en la config.
  - `infrastructure/whatsapp/commandParser.ts` — agrega `Lang = 'es' | 'en'`, autodeteccion via diccionario castellano/ingles, comandos `sales`/`top best`/`help`/`commands` en ingles, y soporte de `days` ademas de `dias`/`d`/`day`.
  - `infrastructure/whatsapp/commandHandlers.ts` — `handleVentas/handleTop/handleAyuda/handleComandoInvalido/handleDefault` aceptan `lang`.
  - `infrastructure/whatsapp/templates.ts` — `formatAyuda/formatComandoInvalido/formatError` traducidos a ambos idiomas. `formatVentasList` traduce `Cobrado`/`Pendiente`/`Collected`/`Pending`, iconos de pago (`OK`/`MED`/`PND`/`PTE`) y fechas (`dd/mm` vs `mm/dd`). `formatTopList` traduce `units`/`unidades`.
  - `infrastructure/whatsapp/webhookController.ts` — antes del dispatcher, lee la config del `db.json` y fuerza el idioma si esta seteado en `auto`. Si falla la lectura, autodetecta.
  - `infrastructure/http/server.ts` — los logs de arranque ahora muestran los endpoints `/webhook/qr/:phoneId` y `/webhook/status` cuando el driver es Baileys, y avisa si faltan `WA_SESSION_KEY` o `WA_ALLOWED_NUMBERS`.
- **Frontend**:
  - `frontend/src/pages/ConfiguracionPage.tsx` — nueva seccion colapsable "Idioma del Bot de WhatsApp" con 3 opciones (Auto, Espanol, English). Cambios se persisten via `PUT /api/configuracion`.
  - `frontend/src/types/domain.ts` y `frontend/src/config/defaults.ts` — agregado `idiomaBot: 'auto' | 'es' | 'en'` con default `auto`.
- **Docs**:
  - `backend/.env.example` — Baileys es la seccion por default, Meta queda como bloque "LEGACY" comentado.
  - `README.md` — seccion "Integracion WhatsApp" reescrita de cero para Baileys: 5 pasos (linea exclusiva, generar `WA_SESSION_KEY`, configurar `.env`, arrancar backend, escanear QR). Documenta seguridad (whitelist, AES-256-GCM, rate limiter, shadowban detector, customer notifier) y notas operativas (sleep de Render, "linea caliente", migracion de `creds.bin` entre maquinas). Los avisos del chip se ven en logs con prefijo `[WHATSAPP-CRITICAL]` / `[WHATSAPP-WARN]` / `[WHATSAPP-RECOVERED]`.
  - `CONTEXTO-WHATSAPP-META.md` — renombrado desde el viejo `CONTEXTO-WHATSAPP.md`; conserva los credenciales Meta por si se quiere volver.
  - `CONTEXTO-WHATSAPP.md` (nuevo) — contexto operativo de la ronda 8 (ver archivo).
- **Verificado**:
  - `npm run build` (backend): sin errores.
  - `tsc --noEmit` (frontend): sin errores.
  - `npm run dev` (backend) con `WA_TRANSPORT=baileys` + `WA_PHONES=chip1:5492617629556`: el pool registra el chip en estado `warming_up`, Baileys se conecta a WhatsApp y genera el QR. Log:
    ```
    [phonePool] Telefono chip1 (5492617629556) registrado en estado warming_up.
    [Baileys:chip1] QR generado, esperando escaneo.
    [phonePool] chip1 QR pendiente. Visitar GET /webhook/qr/chip1
    ```

## 📝 Próximas Mejoras Identificadas (no implementadas)

- Módulo de facturación/comprobantes usando la numeración de tickets
- i18n masivo (solo está el selector, no traducido todo)
- Upload de backup (restaurar JSON)
- Sonidos de alerta
- PWA / instalable
- Multi-usuario con autenticación
- Sincronización en la nube (actualmente local)
- Gráfico de ventas por perfume (top sellers)
- Vista de catálogo imprimible con QR WhatsApp
- **Guardar `creds.bin` cifrado en S3/GCS** (para producción) — hoy se guarda en el disco del backend; en Render free tier se pierde si el disco rota.