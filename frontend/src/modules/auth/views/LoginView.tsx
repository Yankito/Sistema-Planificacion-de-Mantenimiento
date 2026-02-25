// Página de Login - Autenticación con credenciales Oracle
// Fondo claro con logo PF Alimentos
import { useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginView = () => {
  const { login, isLoading, error } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!usuario.trim() || !contrasena.trim()) {
      setLocalError('Ingrese usuario y contraseña');
      return;
    }

    try {
      await login(usuario.trim().toLowerCase(), contrasena);
    } catch {
      // Error ya manejado en el contexto
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-pf-neutral-50"
      style={{ background: 'linear-gradient(135deg, var(--color-pf-neutral-50) 0%, var(--color-pf-neutral-100) 40%, var(--color-pf-neutral-200) 100%)' }}
    >
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Círculos decorativos suaves */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(254, 13, 1, 0.06) 0%, transparent 70%)' }}
        />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(254, 13, 1, 0.04) 0%, transparent 70%)' }}
        />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(100, 116, 139, 0.04) 0%, transparent 70%)' }}
        />

        {/* Grid sutil */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100,116,139,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,116,139,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Línea decorativa diagonal */}
        <div className="absolute top-0 left-0 w-full h-1"
          style={{ background: 'linear-gradient(90deg, transparent, var(--color-pf-red-500) 50%, transparent)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">

        {/* Logo y título */}
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <img
              src="./Logo_PF_Alimentos.png"
              alt="PF Alimentos"
              className="h-20 object-contain mx-auto drop-shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-black text-pf-neutral-800 tracking-tighter uppercase">
            Sistema de Planificación de Mantenimiento
          </h1>
          <p className="text-pf-neutral-400 text-sm font-medium mt-1.5 tracking-wide">
            Planificación y Control Industrial
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/50">

          {/* Línea roja decorativa superior */}
          <div className="w-12 h-1 bg-pf-red rounded-full mb-6" />

          <div className="mb-6">
            <h2 className="text-lg font-black text-pf-neutral-800 uppercase tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-pf-neutral-400 text-xs font-medium mt-1">
              Ingrese sus credenciales Oracle EAM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Usuario */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-pf-neutral-500 uppercase tracking-widest">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pf-neutral-400">
                  <User size={18} />
                </div>
                <input
                  id="login-usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="ej. jperez"
                  autoComplete="username"
                  className="w-full pl-12 pr-4 py-3.5 bg-pf-neutral-50 border border-pf-neutral-200 rounded-2xl
                    text-pf-neutral-800 text-sm font-medium placeholder-pf-neutral-400
                    focus:outline-none focus:ring-2 focus:ring-pf-red/30 focus:border-pf-red/40 focus:bg-white
                    transition-all duration-300 hover:border-pf-neutral-300"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-pf-neutral-500 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pf-neutral-400">
                  <Lock size={18} />
                </div>
                <input
                  id="login-contrasena"
                  type={showPassword ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-pf-neutral-50 border border-pf-neutral-200 rounded-2xl
                    text-pf-neutral-800 text-sm font-medium placeholder-pf-neutral-400
                    focus:outline-none focus:ring-2 focus:ring-pf-red/30 focus:border-pf-red/40 focus:bg-white
                    transition-all duration-300 hover:border-pf-neutral-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pf-neutral-400 hover:text-pf-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <div className="flex items-center gap-2 p-3.5 bg-pf-red-50 border border-pf-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={16} className="text-pf-red flex-shrink-0" />
                <span className="text-pf-red-700 text-xs font-semibold">{displayError}</span>
              </div>
            )}

            {/* Botón Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-pf-red text-white font-black text-sm
                uppercase tracking-wider rounded-2xl
                hover:bg-pf-red-hover hover:shadow-lg hover:shadow-pf-red/20
                active:scale-[0.98] transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-5 border-t border-pf-neutral-100 text-center">
            <p className="text-pf-neutral-400 text-[10px] font-bold uppercase tracking-wider">
              Autenticación vía Oracle EAM
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-pf-neutral-400 text-[10px] mt-8 font-bold uppercase tracking-widest">
          PF Alimentos
        </p>
      </div>
    </div>
  );
};
