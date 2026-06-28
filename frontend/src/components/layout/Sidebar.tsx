import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../../api/client';
import { esDeudaCritica } from '../../hooks/deudaCritica';
import { useAuth } from '../../contexts/AuthProvider';
import { Rol } from '../../lib/auth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  showCritical?: boolean;
  roles?: Rol[];
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/inventario', label: 'Inventario', icon: '🧴' },
  { to: '/ventas', label: 'Ventas', icon: '💵' },
  { to: '/clientes', label: 'Clientes', icon: '👥', showCritical: true },
  { to: '/crm', label: 'CRM Re-compra', icon: '💬' },
  { to: '/configuracion', label: 'Configuracion', icon: '⚙️', roles: ['admin'] },
];

export const Sidebar = () => {
  const [deudaCriticaCount, setDeudaCriticaCount] = useState(0);
  const { sesion } = useAuth();

  useEffect(() => {
    const cargar = async () => {
      try {
        const clientes = await api.listarClientes();
        setDeudaCriticaCount(clientes.filter((c) => esDeudaCritica(c.saldoDeudor)).length);
      } catch {
        // silencioso
      }
    };
    cargar();
    const interval = setInterval(cargar, 60000);
    return () => clearInterval(interval);
  }, []);

  const visibleItems = items.filter((it) => {
    if (!it.roles) return true;
    return sesion ? it.roles.includes(sesion.rol) : false;
  });

  return (
    <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col py-6 px-4 min-h-screen">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-lg">
          ✨
        </div>
        <div>
          <div className="font-semibold text-sm">Perfumes</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Manager</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {visibleItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{it.icon}</span>
            <span className="flex-1">{it.label}</span>
            {it.showCritical && deudaCriticaCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {deudaCriticaCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6 px-2 text-[10px] text-slate-500">
        v1.0 · Clean Architecture
      </div>
    </aside>
  );
};
