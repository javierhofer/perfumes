import { buildApp } from './app';

const PORT = Number(process.env.PORT) || 3001;

(async () => {
  const app = await buildApp();
  app.listen(PORT, () => {
    console.log(`[server] API escuchando en http://localhost:${PORT}`);
    console.log(`[server] Endpoints:`);
    console.log(`   GET    /api/health`);
    console.log(`   GET    /api/perfumes`);
    console.log(`   GET    /api/ventas`);
    console.log(`   POST   /api/ventas`);
    console.log(`   GET    /api/clientes`);
    console.log(`   POST   /api/clientes`);
    console.log(`   PUT    /api/clientes/:id`);
    console.log(`   DELETE /api/clientes/:id`);
    console.log(`   GET    /api/clientes/:id/ficha`);
    console.log(`   POST   /api/clientes/:id/pagos`);
    console.log(`   GET    /api/clientes/recontacto`);
    console.log(`   GET    /api/dashboard/metrics`);
    console.log(`   GET    /api/dashboard/alertas-stock`);
    console.log(`   GET    /api/configuracion`);
    console.log(`   PUT    /api/configuracion`);
    console.log(`   GET    /webhook   (WhatsApp handshake + estado)`);
    console.log(`   POST   /webhook   (WhatsApp mensajes)`);

    const transport = (process.env.WA_TRANSPORT ?? 'meta').toLowerCase();
    if (transport === 'meta') {
      const ok = process.env.WA_PHONE_ID && process.env.WA_TOKEN && process.env.WA_VERIFY_TOKEN;
      if (!ok) {
        console.warn(
          '[server] WhatsApp NO configurado: faltan WA_PHONE_ID / WA_TOKEN / WA_VERIFY_TOKEN. El webhook respondara pero no procesara mensajes.'
        );
      } else {
        console.log(`[server] WhatsApp webhook activo (Meta Cloud API) para phone_id=${process.env.WA_PHONE_ID}`);
      }
    } else {
      const phones = process.env.WA_PHONES ?? '';
      if (!phones.trim()) {
        console.warn('[server] WhatsApp driver=baileys pero WA_PHONES vacio. El pool no tendra chips.');
      } else {
        console.log(`[server] WhatsApp driver=baileys, pool=${phones}`);
        console.log(`   GET    /webhook/qr/:phoneId   (QR PNG para escanear con WhatsApp)`);
        console.log(`   GET    /webhook/status        (estado del pool)`);
      }
      if (!process.env.WA_SESSION_KEY) {
        console.warn('[server] WA_SESSION_KEY no seteado. La sesion Baileys NO se cifrara (inseguro en deploys).');
      }
      if (!process.env.WA_ALLOWED_NUMBERS?.trim()) {
        console.warn('[server] WA_ALLOWED_NUMBERS vacio. Todos los mensajes seran rechazados (defensa por default).');
      }
    }
  });
})();