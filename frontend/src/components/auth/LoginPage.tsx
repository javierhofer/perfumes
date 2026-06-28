import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Perfumes Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-800"
            required
            autoFocus
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-800"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-slate-800 text-white py-2.5 rounded font-medium hover:bg-slate-700 transition"
        >
          Iniciar sesión
        </button>

        <div className="mt-5 p-3 bg-slate-50 rounded text-xs text-slate-500">
          <p className="font-medium mb-1">Credenciales de demo:</p>
          <p>admin / admin → rol administrador</p>
          <p>vendedor / vendedor → rol vendedor</p>
        </div>
      </form>
    </div>
  );
};
