import { ReactNode, useState } from 'react';

interface SeccionConfigProps {
  titulo: string;
  icono: string;
  descripcion?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export const SeccionConfig = ({ titulo, icono, descripcion, children, defaultOpen = true }: SeccionConfigProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-xl">{icono}</span>
        <div className="flex-1 text-left">
          <div className="font-semibold text-slate-800 dark:text-slate-100">{titulo}</div>
          {descripcion && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{descripcion}</div>}
        </div>
        <span
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>
      {open && <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 space-y-4">{children}</div>}
    </div>
  );
};

interface CampoProps {
  label: string;
  descripcion?: string;
  children: ReactNode;
}

export const Campo = ({ label, descripcion, children }: CampoProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</label>
    {descripcion && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{descripcion}</p>}
    {children}
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  descripcion?: string;
}

export const Toggle = ({ checked, onChange, label, descripcion }: ToggleProps) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer">
    <div className="flex-1">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
      {descripcion && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{descripcion}</div>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  </label>
);

interface BotonGuardarProps {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
}

export const BotonGuardar = ({ saving, saved, onClick, label = 'Guardar cambios' }: BotonGuardarProps) => (
  <button
    onClick={onClick}
    disabled={saving}
    className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
  >
    {saving ? '⏳ Guardando...' : saved ? '✓ Guardado' : label}
  </button>
);