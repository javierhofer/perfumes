import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthProvider';

export const Layout = () => {
  const { sesion, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {sesion && (
          <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-end gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">{sesion.username}</div>
              <div className="text-xs text-slate-500 capitalize">{sesion.rol}</div>
            </div>
            <button
              onClick={logout}
              className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded transition"
            >
              Cerrar sesión
            </button>
          </header>
        )}
        <Outlet />
      </main>
    </div>
  );
};
