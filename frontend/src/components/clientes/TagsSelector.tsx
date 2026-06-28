import { useState, KeyboardEvent } from 'react';

export const ETIQUETAS_SUGERIDAS = [
  'VIP',
  'Frecuente',
  'Fiable',
  'Nuevo',
  'Cta cte',
  'Solo efectivo',
  'Solo transferencia',
  'Cumpleanos pronto',
];

interface TagsSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagsSelector = ({ value, onChange, placeholder = 'Agregar etiqueta...' }: TagsSelectorProps) => {
  const [input, setInput] = useState('');

  const agregar = (tag: string) => {
    const limpia = tag.trim();
    if (!limpia || value.includes(limpia)) return;
    onChange([...value, limpia]);
    setInput('');
  };

  const quitar = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      agregar(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      quitar(value[value.length - 1]);
    }
  };

  const disponibles = ETIQUETAS_SUGERIDAS.filter((t) => !value.includes(t));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => quitar(tag)}
                className="hover:text-brand-900 leading-none text-base"
                aria-label={`Quitar ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && agregar(input)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
      />
      {disponibles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider self-center mr-1">
            Sugeridas:
          </span>
          {disponibles.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => agregar(s)}
              className="text-xs px-2 py-0.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TagsReadonly = ({ tags, max = 3 }: { tags: string[]; max?: number }) => {
  if (!tags || tags.length === 0) return <span className="text-xs text-slate-400 italic">—</span>;
  const visibles = tags.slice(0, max);
  const resto = tags.length - visibles.length;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibles.map((t) => (
        <span
          key={t}
          className="inline-block text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
        >
          {t}
        </span>
      ))}
      {resto > 0 && <span className="text-[10px] text-slate-500">+{resto}</span>}
    </div>
  );
};