
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export function AuthView({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const translateError = (msg: string) => {
        if (msg.includes("Password should be at least 6 characters")) return "La contraseña debe tener al menos 6 caracteres.";
        if (msg.includes("User already registered")) return "Este correo ya está registrado. Por favor inicia sesión.";
        if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
        return msg;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            setLoading(false);
            return;
        }

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { display_name: username }
                    }
                });
                if (error) throw error;
                if (data.user) {
                    // Crear perfil inicial
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: data.user.id,
                        username: username || email.split('@')[0],
                        avatar: '',
                        bio: 'Un nuevo estudiante de la filosofía.'
                    });
                    
                    // Si el perfil ya existe (caso raro de race condition o re-signup), no fallar fatalmente
                    if (profileError && profileError.code !== '23505') { 
                        console.error("Error creating profile:", profileError);
                    }

                    alert("Registro exitoso. ¡Bienvenido al Santuario!");
                    onLoginSuccess();
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                onLoginSuccess();
            }
        } catch (err: any) {
            console.error(err);
            setError(translateError(err.message || "Error de autenticación"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full items-center justify-center bg-[var(--bg)] p-6 animate-fade-in relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--gold)]/5 rounded-full blur-3xl"></div>
            
            <div className="w-full max-w-sm z-10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-[var(--text-main)] text-[var(--bg)] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl">
                        <i className="ph-fill ph-columns"></i>
                    </div>
                    <h1 className="serif text-4xl font-bold mb-2">Santuario</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[4px] opacity-40">Disciplina • Razón • Comunidad</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="bg-[var(--card)] px-4 py-3 rounded-2xl border border-[var(--border)] flex items-center gap-3">
                            <i className="ph-bold ph-user opacity-30"></i>
                            <input 
                                type="text" 
                                placeholder="Nombre de Usuario (Público)" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="bg-transparent outline-none w-full font-serif text-sm placeholder:font-sans"
                                required={mode === 'signup'}
                            />
                        </div>
                    )}

                    <div className="bg-[var(--card)] px-4 py-3 rounded-2xl border border-[var(--border)] flex items-center gap-3">
                        <i className="ph-bold ph-envelope opacity-30"></i>
                        <input 
                            type="email" 
                            placeholder="Correo Electrónico" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="bg-transparent outline-none w-full font-serif text-sm placeholder:font-sans"
                            required
                        />
                    </div>

                    <div className="bg-[var(--card)] px-4 py-3 rounded-2xl border border-[var(--border)] flex items-center gap-3">
                        <i className="ph-bold ph-lock opacity-30"></i>
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="bg-transparent outline-none w-full font-serif text-sm placeholder:font-sans"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold text-xs uppercase tracking-[2px] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <i className="ph-duotone ph-spinner animate-spin text-lg"></i> : (mode === 'signin' ? 'Entrar al Pórtico' : 'Unirse a la Stoa')}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs opacity-50 mb-2">{mode === 'signin' ? '¿Aún no eres miembro?' : '¿Ya tienes cuenta?'}</p>
                    <button 
                        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                        className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] hover:text-[var(--text-main)] transition-colors"
                    >
                        {mode === 'signin' ? 'Regístrate aquí' : 'Inicia Sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
}
