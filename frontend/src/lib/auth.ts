export type Rol = 'admin' | 'vendedor';

export interface Sesion {
  username: string;
  rol: Rol;
  loggedInAt: number;
}

interface UsuarioHardcodeado {
  username: string;
  password: string;
  rol: Rol;
}

const USERS_HARDCODED: UsuarioHardcodeado[] = [
  { username: 'admin', password: 'admin', rol: 'admin' },
  { username: 'vendedor', password: 'vendedor', rol: 'vendedor' },
];

const STORAGE_KEY = 'auth';

export const login = (username: string, password: string): Sesion | null => {
  const match = USERS_HARDCODED.find(
    (u) => u.username === username && u.password === password
  );
  if (!match) return null;
  const sesion: Sesion = {
    username: match.username,
    rol: match.rol,
    loggedInAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  return sesion;
};

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getSesion = (): Sesion | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
};
