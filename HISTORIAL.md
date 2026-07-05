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
- **Email service**: `infrastructure/notifications/emailService.ts` SMTP nativo (sin deps) para Gmail. Dispara email al admin cuando un chip se banea / desconecta / reconecta.
- **Endpoints admin**: `GET /webhook/status`, `GET /webhook/qr/:id`, `POST /api/phones`, `DELETE /api/phones/:id`, `POST /api/phones/:id/replace`.
- **UI**: indicador de estado de chips en `CrmPage.tsx`; campo `canalRespaldoTexto` editable en `ConfiguracionPage.tsx`.
- **Variables de entorno**: `WA_PHONES`, `WA_SESSION_KEY`, `WA_TRANSPORT`, `WA_MAX_PER_HOUR`, `WA_WARMUP_*`, `WA_SHADOWBAN_THRESHOLD`, `SMTP_*`, `WA_BACKUP_CONTACT`. Las vars Meta (`WA_PHONE_ID`, `WA_TOKEN`, etc) quedan en `.env.example` como referencia para rollback.

## 🔄 Reersion a Meta Cloud API (ronda 6)

- **Driver por env var**: `WA_TRANSPORT=meta` (default) o `baileys` (rollback). Todo el codigo de Baileys queda disponible pero no se usa por default.
- **MetaTransport funcional**: handshake `hub.mode=subscribe` + `hub.verify_token` + `hub.challenge`, validacion HMAC SHA-256 con `WA_APP_SECRET`, dispatcher async para evitar reintentos de Meta.
- **Codigo Baileys preservado**: `transport/BaileysTransport.ts`, `phonePool.ts`, `safety/*` siguen en el repo. Para activar: `WA_TRANSPORT=baileys` + `WA_PHONES` + `WA_SESSION_KEY`.
- **Frontend**: removido el indicador del pool en `CrmPage.tsx` (no aplica a Meta). El campo `canalRespaldoTexto` sigue editable en Configuracion, ahora titulado "Mensaje si Meta esta caido".
- **Variables de entorno**: `WA_TRANSPORT` (default `meta`), `WA_PHONE_ID`, `WA_TOKEN`, `WA_VERIFY_TOKEN`, `WA_APP_SECRET`, `WA_ALLOWED_NUMBERS`. Vars Baileys (`WA_PHONES`, `WA_SESSION_KEY`, etc) quedan en `.env.example` como referencia para rollback.

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