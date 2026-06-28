import { useState } from 'react';
import type { Cliente } from '../../types/domain';
import { TagsSelector } from './TagsSelector';

interface ClienteFormModalProps {
  cliente?: Cliente | null;
  onClose: () => void;
  onSave: (data: { nombre: string; telefono: string; notasPersonales: string; etiquetas: string[] }) => Promise<void>;
}

export const ClienteFormModal = ({ cliente, onClose, onSave }: ClienteFormModalProps) => {
  const [nombre, setNombre] = useState(cliente?.nombre ?? '');
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '');
  const [notasPersonales, setNotas] = useState(cliente?.notasPersonales ?? '');
  const [etiquetas, setEtiquetas] = useState<string[]>(cliente?.etiquetas ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = !!cliente;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError('Nombre y telefono son obligatorios');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave({ nombre, telefono, notasPersonales, etiquetas });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between">
          <h2 className="font-semibold text-lg">{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre completo</label>
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Ej: Juan Perez"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Telefono / WhatsApp
            </label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="+5491155551234"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas personales</label>
            <textarea
              value={notasPersonales}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
              placeholder="Preferencias, recordatorios, observaciones..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Etiquetas</label>
            <TagsSelector value={etiquetas} onChange={setEtiquetas} />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};