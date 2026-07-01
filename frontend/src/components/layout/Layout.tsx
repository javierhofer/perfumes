import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthProvider';

export const Layout = () => {
  const { sesion, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto w-full">
        {sesion && (
          <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
                className="md:hidden p-2 -ml-2 text-slate-700 hover:text-slate-900 text-2xl leading-none"
              >
                ☰
              </button>
              <div className="md:hidden text-sm font-semibold text-slate-700">
                Perfumes Manager
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700 leading-tight">
                  {sesion.username}
                </div>
                <div className="text-xs text-slate-500 capitalize">{sesion.rol}</div>
              </div>
              <button
                onClick={logout}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded transition whitespace-nowrap"
              >
                <span className="hidden sm:inline">Cerrar sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </header>
        )}
        <Outlet />
        <footer className="border-t border-slate-200 bg-white px-4 md:px-8 py-4 text-center text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>v1.0 · Perfumes Manager</span>
            <span className="text-slate-300">·</span>
            <Link
              to="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 transition-colors"
            >
              Política de Privacidad
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};
