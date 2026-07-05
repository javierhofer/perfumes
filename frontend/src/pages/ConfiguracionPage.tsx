import { useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { SeccionConfig, Campo, Toggle, BotonGuardar } from '../components/configuracion/SeccionConfig';

const colorMap: Record<string, string> = {
  brand: 'bg-brand-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
  blue: 'bg-blue-500',
  rose: 'bg-rose-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
};

const coloresDisponibles = Object.keys(colorMap);

interface DraftStock { umbralStockCritico: number }
interface DraftDeuda { umbralDeudaCritica: number }
interface DraftCrm { diasRecompra: number }
interface DraftNegocio { nombre: string; telefono: string; email: string; direccion: string; cuit: string }
interface DraftEtiquetas { lista: { nombre: string; color: string }[] }
interface DraftWhatsapp { plantillaWhatsapp: string; canalRespaldoTexto: string }
interface DraftMoneda { moneda: string; simboloMoneda: string }
interface DraftTema { temaVisual: string }
interface DraftIdioma { idioma: string }
interface DraftNotifs { notificacionesActivas: boolean }
interface DraftTickets { prefijo: string; siguiente: number }

interface SeccionState<T> {
  draft: T;
  setDraft: (v: Partial<T> | ((prev: T) => Partial<T>)) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  saved: boolean;
  setSaved: (v: boolean) => void;
}

const useSeccion = <T,>(initial: T): SeccionState<T> => {
  const [draft, setDraftState] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const setDraft = (v: Partial<T> | ((prev: T) => Partial<T>)) => {
    if (typeof v === 'function') {
      setDraftState((prev) => ({ ...prev, ...(v as (prev: T) => Partial<T>)(prev) }));
    } else {
      setDraftState((prev) => ({ ...prev, ...v }));
    }
  };
  return { draft, setDraft, saving, setSaving, saved, setSaved };
};

export const ConfiguracionPage = () => {
  const { config, update, refresh } = useConfig();

  const stock = useSeccion<DraftStock>({ umbralStockCritico: config.umbralStockCritico });
  const deuda = useSeccion<DraftDeuda>({ umbralDeudaCritica: config.umbralDeudaCritica });
  const crm = useSeccion<DraftCrm>({ diasRecompra: config.diasRecompra });
  const negocio = useSeccion<DraftNegocio>({ ...config.datosNegocio });
  const etiquetas = useSeccion<DraftEtiquetas>({ lista: config.etiquetasPersonalizadas });
  const whatsapp = useSeccion<DraftWhatsapp>({
    plantillaWhatsapp: config.plantillaWhatsapp,
    canalRespaldoTexto: config.canalRespaldoTexto ?? '',
  });
  const moneda = useSeccion<DraftMoneda>({ moneda: config.moneda, simboloMoneda: config.simboloMoneda });
  const tema = useSeccion<DraftTema>({ temaVisual: config.temaVisual });
  const idioma = useSeccion<DraftIdioma>({ idioma: config.idioma });
  const notifs = useSeccion<DraftNotifs>({ notificacionesActivas: config.notificacionesActivas });
  const tickets = useSeccion<DraftTickets>({ ...config.numeracionTickets });

  const guardar = async <T,>(seccion: SeccionState<T>, payload: Record<string, unknown>) => {
    seccion.setSaving(true);
    try {
      await update(payload);
      seccion.setSaved(true);
      setTimeout(() => seccion.setSaved(false), 2000);
    } finally {
      seccion.setSaving(false);
    }
  };

  const solicitarPermisoNotifs = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      notifs.setDraft({ notificacionesActivas: true });
      await guardar(notifs, { notificacionesActivas: true });
      new Notification('Perfumes Manager', { body: 'Notificaciones activadas.' });
    } else {
      notifs.setDraft({ notificacionesActivas: false });
    }
  };

  const descargarBackup = async () => {
    const [clientes, perfumes, ventas, configuracion] = await Promise.all([
      fetch('/api/clientes').then((r) => r.json()),
      fetch('/api/perfumes').then((r) => r.json()),
      fetch('/api/ventas').then((r) => r.json()),
      fetch('/api/configuracion').then((r) => r.json()),
    ]);
    const backup = {
      version: '1.0',
      fecha: new Date().toISOString(),
      clientes, perfumes, ventas, configuracion,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perfumes-backup-${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
      <header className="mb-4 md:mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Configuracion</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Parametriza las reglas de negocio y personaliza el sistema.
        </p>
      </header>

      <SeccionConfig titulo="Stock Critico" icono="⚠️" descripcion="Umbral para alertas de reposicion">
        <Campo label="Unidades minimas" descripcion="Se dispara la alerta cuando un perfume tenga este stock o menos.">
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={stock.draft.umbralStockCritico}
              onChange={(e) => stock.setDraft({ umbralStockCritico: Number(e.target.value) })}
              className="w-32 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
            <BotonGuardar
              saving={stock.saving}
              saved={stock.saved}
              onClick={() => guardar(stock, { umbralStockCritico: stock.draft.umbralStockCritico })}
            />
          </div>
        </Campo>
      </SeccionConfig>

      <SeccionConfig titulo="Deuda Critica" icono="🚨" descripcion="Umbral para marcar clientes con deuda critica">
        <Campo label="Monto minimo ($)">
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step={1000}
              value={deuda.draft.umbralDeudaCritica}
              onChange={(e) => deuda.setDraft({ umbralDeudaCritica: Number(e.target.value) })}
              className="w-40 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
            <BotonGuardar
              saving={deuda.saving}
              saved={deuda.saved}
              onClick={() => guardar(deuda, { umbralDeudaCritica: deuda.draft.umbralDeudaCritica })}
            />
          </div>
        </Campo>
      </SeccionConfig>

      <SeccionConfig titulo="CRM Re-compra" icono="💬" descripcion="Cuando considerar a un cliente inactivo">
        <Campo label="Dias sin comprar" descripcion="Si el cliente supero este tiempo, aparece en el CRM para re-contactar.">
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={crm.draft.diasRecompra}
              onChange={(e) => crm.setDraft({ diasRecompra: Number(e.target.value) })}
              className="w-32 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
            <BotonGuardar
              saving={crm.saving}
              saved={crm.saved}
              onClick={() => guardar(crm, { diasRecompra: crm.draft.diasRecompra })}
            />
          </div>
        </Campo>

        <Campo label="Plantilla de WhatsApp" descripcion="Variables disponibles: {nombre}, {dias}, {perfume}">
          <textarea
            value={whatsapp.draft.plantillaWhatsapp}
            onChange={(e) => whatsapp.setDraft({ plantillaWhatsapp: e.target.value })}
            rows={4}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <div className="mt-3">
            <Campo label="Mensaje si Meta esta caido" descripcion="Texto que se envia al cliente si el bot no puede responder por una caida de Meta.">
              <input
                value={whatsapp.draft.canalRespaldoTexto}
                onChange={(e) => whatsapp.setDraft({ canalRespaldoTexto: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                placeholder="Escribime tambien a hola@tuempresa.com"
              />
            </Campo>
          </div>
          <div className="mt-2">
            <BotonGuardar
              saving={whatsapp.saving}
              saved={whatsapp.saved}
              onClick={() => guardar(whatsapp, {
                plantillaWhatsapp: whatsapp.draft.plantillaWhatsapp,
                canalRespaldoTexto: whatsapp.draft.canalRespaldoTexto,
              })}
              label="Guardar plantilla"
            />
          </div>
        </Campo>
      </SeccionConfig>

      <SeccionConfig titulo="Datos del Negocio" icono="🏪" descripcion="Aparecen en comprobantes y la marca del sistema">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Campo label="Nombre del negocio">
            <input
              value={negocio.draft.nombre}
              onChange={(e) => negocio.setDraft({ ...negocio.draft, nombre: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="Telefono">
            <input
              value={negocio.draft.telefono}
              onChange={(e) => negocio.setDraft({ ...negocio.draft, telefono: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="Email">
            <input
              type="email"
              value={negocio.draft.email}
              onChange={(e) => negocio.setDraft({ ...negocio.draft, email: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="CUIT / RFC">
            <input
              value={negocio.draft.cuit}
              onChange={(e) => negocio.setDraft({ ...negocio.draft, cuit: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="Direccion">
            <input
              value={negocio.draft.direccion}
              onChange={(e) => negocio.setDraft({ ...negocio.draft, direccion: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm md:col-span-2"
            />
          </Campo>
        </div>
        <BotonGuardar
          saving={negocio.saving}
          saved={negocio.saved}
          onClick={() => guardar(negocio, { datosNegocio: negocio.draft })}
        />
      </SeccionConfig>

      <SeccionConfig titulo="Etiquetas de Cliente" icono="🏷️" descripcion="Personaliza las etiquetas disponibles al crear/editar clientes" defaultOpen={false}>
        <div className="space-y-2">
          {etiquetas.draft.lista.map((et: { nombre: string; color: string }, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={et.color}
                onChange={(e) => {
                  const nueva = [...etiquetas.draft.lista];
                  nueva[idx] = { ...nueva[idx], color: e.target.value };
                  etiquetas.setDraft({ lista: nueva });
                }}
                className="text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded px-2 py-1.5"
              >
                {coloresDisponibles.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className={`w-3 h-3 rounded-full ${colorMap[et.color] || 'bg-slate-400'}`} />
              <input
                value={et.nombre}
                onChange={(e) => {
                  const nueva = [...etiquetas.draft.lista];
                  nueva[idx] = { ...nueva[idx], nombre: e.target.value };
                  etiquetas.setDraft({ lista: nueva });
                }}
                className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => {
                  etiquetas.setDraft({ lista: etiquetas.draft.lista.filter((_, i) => i !== idx) });
                }}
                className="text-rose-600 hover:text-rose-800 px-2"
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              etiquetas.setDraft({
                lista: [...etiquetas.draft.lista, { nombre: 'Nueva', color: 'slate' }],
              })
            }
            className="text-xs border border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-500 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg w-full"
          >
            + Agregar etiqueta
          </button>
        </div>
        <BotonGuardar
          saving={etiquetas.saving}
          saved={etiquetas.saved}
          onClick={() => guardar(etiquetas, { etiquetasPersonalizadas: etiquetas.draft.lista })}
        />
      </SeccionConfig>

      <SeccionConfig titulo="Moneda" icono="💰" descripcion="Formato de los precios en toda la app" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Codigo">
            <select
              value={moneda.draft.moneda}
              onChange={(e) => moneda.setDraft({ ...moneda.draft, moneda: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ARS">ARS - Peso argentino</option>
              <option value="USD">USD - Dolar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </Campo>
          <Campo label="Simbolo">
            <input
              value={moneda.draft.simboloMoneda}
              onChange={(e) => moneda.setDraft({ ...moneda.draft, simboloMoneda: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </Campo>
        </div>
        <BotonGuardar
          saving={moneda.saving}
          saved={moneda.saved}
          onClick={() => guardar(moneda, { moneda: moneda.draft.moneda, simboloMoneda: moneda.draft.simboloMoneda })}
        />
      </SeccionConfig>

      <SeccionConfig titulo="Tema Visual" icono="🎨" descripcion="Apariencia de la interfaz" defaultOpen={false}>
        <Toggle
          checked={tema.draft.temaVisual === 'oscuro'}
          onChange={(v: boolean) => {
            const nuevo = v ? 'oscuro' : 'claro';
            tema.setDraft({ temaVisual: nuevo });
            guardar(tema, { temaVisual: nuevo });
          }}
          label="Modo oscuro"
          descripcion="Interfaz con fondo oscuro para reducir fatiga visual."
        />
      </SeccionConfig>

      <SeccionConfig titulo="Idioma" icono="🌐" descripcion="Idioma de la interfaz (menu y titulos)" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          {(['es', 'en'] as const).map((lng) => (
            <button
              key={lng}
              onClick={() => {
                idioma.setDraft({ idioma: lng });
                guardar(idioma, { idioma: lng });
              }}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                idioma.draft.idioma === lng
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-brand-400'
              }`}
            >
              {lng === 'es' ? '🇪🇸 Espanol' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </SeccionConfig>

      <SeccionConfig titulo="Notificaciones" icono="🔔" descripcion="Alertas del navegador cuando hay stock critico" defaultOpen={false}>
        <Toggle
          checked={notifs.draft.notificacionesActivas}
          onChange={(v: boolean) => {
            if (v) {
              solicitarPermisoNotifs();
            } else {
              notifs.setDraft({ notificacionesActivas: false });
              guardar(notifs, { notificacionesActivas: false });
            }
          }}
          label="Activar notificaciones"
          descripcion="Recibir alertas en el navegador cuando un perfume llegue a stock critico."
        />
      </SeccionConfig>

      <SeccionConfig titulo="Numeracion de Tickets" icono="🎫" descripcion="Prefijo para comprobantes (futuro modulo de facturacion)" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Prefijo">
            <input
              value={tickets.draft.prefijo}
              onChange={(e) => tickets.setDraft({ ...tickets.draft, prefijo: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </Campo>
          <Campo label="Siguiente numero">
            <input
              type="number"
              min={1}
              value={tickets.draft.siguiente}
              onChange={(e) => tickets.setDraft({ ...tickets.draft, siguiente: Number(e.target.value) })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </Campo>
        </div>
        <BotonGuardar
          saving={tickets.saving}
          saved={tickets.saved}
          onClick={() => guardar(tickets, { numeracionTickets: tickets.draft })}
        />
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Proximo comprobante: <span className="font-mono font-semibold">{tickets.draft.prefijo}{String(tickets.draft.siguiente).padStart(4, '0')}</span>
        </div>
      </SeccionConfig>

      <SeccionConfig titulo="Backup y Restaurar" icono="💾" descripcion="Exporta o importa toda tu base de datos" defaultOpen={false}>
        <div className="space-y-2">
          <button
            onClick={descargarBackup}
            className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm border border-slate-200 dark:border-slate-600"
          >
            <div className="font-medium text-slate-800 dark:text-slate-100">📥 Descargar backup completo</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Genera un archivo JSON con todos los datos del sistema.</div>
          </button>
          <button
            onClick={refresh}
            className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm border border-slate-200 dark:border-slate-600"
          >
            <div className="font-medium text-slate-800 dark:text-slate-100">🔄 Recargar configuracion desde el servidor</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Si varios dispositivos estan en uso, sincroniza la config manualmente.</div>
          </button>
        </div>
      </SeccionConfig>
    </div>
  );
};