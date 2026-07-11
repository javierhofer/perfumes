import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ClienteRecompra } from '../types/domain';
import { formatearFechaLarga } from '../hooks/formato';

export const CrmPage = () => {
  const [clientes, setClientes] = useState<ClienteRecompra[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await api.getClientesRecontacto();
      setClientes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <header className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800">CRM Re-compra</h1>
          <p className="text-sm text-slate-500 mt-1">
            Clientes sin compras hace mas de 120 dias · {clientes.length} {clientes.length === 1 ? 'oportunidad' : 'oportunidades'}
          </p>
        </div>
        <button
          onClick={cargar}
          className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg"
        >
          ↻ Actualizar
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Buscando clientes inactivos...</div>
        ) : clientes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <div className="font-medium text-slate-800">Todos tus clientes estan al dia!</div>
            <div className="text-sm text-slate-500 mt-1">
              No hay clientes con mas de 120 dias sin comprar.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {clientes.map((c) => (
              <li key={c.clienteId} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {c.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800">{c.nombre}</div>
                    <div className="text-sm text-slate-500">
                      Ultima compra: <span className="text-slate-700">{formatearFechaLarga(c.ultimaCompraFecha)}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Perfume: <span className="text-slate-700">{c.perfumeNombre}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${
                        c.diasSinComprar > 180
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.diasSinComprar} dias sin comprar
                    </div>
                    <div>
                      <a
                        href={c.telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-lg font-medium shadow-sm"
                      >
                        <span>✈️</span> Contactar por Telegram
                      </a>
                      <div className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-tight">
                        Al hacer clic serás redirigido a Telegram. Aplican sus{' '}
                        <Link
                          to="/privacidad"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-brand-600"
                        >
                          políticas
                        </Link>
                        .
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};