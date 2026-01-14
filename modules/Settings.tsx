
import React, { useState, useEffect } from 'react';
import { AdminGenerator } from './AdminGenerator';
import { getISO, updateUserPassword } from '../services/supabase';

export function SettingsModule({ user, setUser, theme, setTheme, fontTheme, setFontTheme, fontSize, setFontSize, zenMode, toggleZen, onBack, onLogout, journal, masterSchools, masterPhilosophers }: any) {
    const [nameInput, setNameInput] = useState(user);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    // New Settings State
    const [morningReminder, setMorningReminder] = useState(false);
    const [eveningReminder, setEveningReminder] = useState(false);
    const [soundsEnabled, setSoundsEnabled] = useState(true);

    // Password State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [isSavingPass, setIsSavingPass] = useState(false);

    useEffect(() => {
        setMorningReminder(localStorage.getItem('stoic_notify_morning') === 'true');
        setEveningReminder(localStorage.getItem('stoic_notify_evening') === 'true');
        setSoundsEnabled(localStorage.getItem('stoic_sound') !== 'false');
    }, []);

    const toggleSetting = (key: string, setter: (v: boolean) => void, value: boolean) => {
        const newValue = !value;
        setter(newValue);
        localStorage.setItem(key, String(newValue));
        if (key.includes('notify') && newValue) {
            alert("Notificaciones simuladas activadas. (PWA Feature)");
        }
    }

    const handleSave = () => {
        if(nameInput.trim()) {
            setUser(nameInput.trim());
            localStorage.setItem('stoic_username_override', nameInput.trim());
        }
        onBack();
    }

    const handlePasswordUpdate = async () => {
        if(newPassword.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        setIsSavingPass(true);
        const error = await updateUserPassword(newPassword);
        setIsSavingPass(false);
        if(error) {
            alert("Error al actualizar: " + error.message);
        } else {
            alert("Contraseña actualizada correctamente.");
            setNewPassword("");
            setShowPasswordChange(false);
        }
    }

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(journal, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `santuario_legado_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode); 
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    const handleResetDaily = () => {
        if(confirm("¿Recalcular el destino de hoy? Esto generará nuevo contenido aleatorio.")) {
            const newSalt = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('stoic_salt', newSalt);
            window.location.reload();
        }
    }

    const handleClearCache = () => {
        if(confirm("¿Purgar caché? Esto reseteará preferencias visuales. Tu diario está seguro.")) {
            const themeSave = localStorage.getItem('stoic_theme');
            localStorage.clear();
            if(themeSave) localStorage.setItem('stoic_theme', themeSave);
            window.location.reload();
        }
    }

    if (showAdmin) return <AdminGenerator onBack={() => setShowAdmin(false)} schools={masterSchools} philosophers={masterPhilosophers} />;

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="text-[10px] font-bold uppercase tracking-[3px] opacity-40 mb-4 ml-4 mt-8 first:mt-0">{title}</h3>
    );

    const ToggleRow = ({ icon, label, desc, active, onToggle }: any) => (
        <div onClick={onToggle} className="flex items-center justify-between p-5 bg-[var(--card)] border-b border-[var(--border)] last:border-0 hover:bg-[var(--highlight)]/30 transition-colors cursor-pointer group first:rounded-t-[24px] last:rounded-b-[24px] border-x">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${active ? 'bg-[var(--text-main)] text-[var(--bg)]' : 'bg-[var(--highlight)] text-[var(--text-sub)]'}`}>
                    <i className={`${icon} text-lg`}></i>
                </div>
                <div>
                    <span className="block font-bold text-sm leading-tight">{label}</span>
                    <span className="text-[10px] opacity-50 block mt-0.5">{desc}</span>
                </div>
            </div>
            <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative ${active ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );

    const ActionRow = ({ icon, label, desc, onClick, danger }: any) => (
        <div onClick={onClick} className="flex items-center justify-between p-5 bg-[var(--card)] border-b border-[var(--border)] last:border-0 hover:bg-[var(--highlight)]/30 transition-colors cursor-pointer group first:rounded-t-[24px] last:rounded-b-[24px] border-x">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${danger ? 'bg-rose-100 text-rose-500' : 'bg-[var(--highlight)] text-[var(--text-sub)] group-hover:text-[var(--text-main)]'}`}>
                    <i className={`${icon} text-lg`}></i>
                </div>
                <div>
                    <span className={`block font-bold text-sm leading-tight ${danger ? 'text-rose-600' : ''}`}>{label}</span>
                    <span className="text-[10px] opacity-50 block mt-0.5">{desc}</span>
                </div>
            </div>
            <i className={`ph-bold ph-caret-right opacity-30 group-hover:opacity-100 transition-opacity ${danger ? 'text-rose-400' : ''}`}></i>
        </div>
    );

    const ThemeBubble = ({ id, label, bg, active }: { id: string, label: string, bg: string, active: boolean }) => (
        <button 
            onClick={() => setTheme(id)} // Using setTheme passed from App
            className={`flex flex-col items-center gap-2 transition-all ${active ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
        >
            <div 
                className={`w-14 h-14 rounded-full shadow-sm border-2 flex items-center justify-center relative ${active ? 'border-[var(--text-main)]' : 'border-transparent'}`}
                style={{ background: bg }}
            >
                {active && <div className="w-5 h-5 bg-[var(--text-main)] rounded-full flex items-center justify-center"><i className="ph-bold ph-check text-[var(--bg)] text-xs"></i></div>}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[80] bg-[var(--bg)] flex flex-col items-center justify-center animate-fade-in overflow-hidden">
             <div className="w-full max-w-md h-full flex flex-col relative">
                
                {/* Header */}
                <div className="px-6 py-6 flex items-center justify-between shrink-0 bg-[var(--bg)]/90 backdrop-blur z-10 border-b border-[var(--border)]">
                    <h2 className="serif text-3xl font-bold">Ajustes</h2>
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--highlight)] transition-all shadow-sm active:scale-90"><i className="ph-bold ph-x"></i></button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-20">
                    
                    {/* Identity Input */}
                    <div className="mb-8">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-3 ml-4">Identidad</label>
                        <div className="bg-[var(--card)] p-2 rounded-[24px] border border-[var(--border)] flex items-center shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-[var(--highlight)] flex items-center justify-center text-xl shrink-0">
                                <i className="ph-fill ph-user-circle"></i>
                            </div>
                            <input 
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="w-full bg-transparent p-3 outline-none font-serif text-lg font-bold border-none"
                                placeholder="Tu Nombre"
                            />
                            <button onClick={handleSave} className="px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] rounded-xl text-xs font-bold uppercase tracking-wider mr-1 shadow-sm">
                                Guardar
                            </button>
                        </div>
                    </div>

                    <SectionHeader title="Atmósfera" />
                    
                    {/* THEME SELECTOR - Correctly passing IDs now */}
                    <div className="flex justify-between items-center bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm mb-6 overflow-x-auto no-scrollbar gap-4">
                        <ThemeBubble id="light" label="Día" bg="#FDFBF9" active={theme === 'light'} />
                        <ThemeBubble id="dark" label="Noche" bg="#121212" active={theme === 'dark'} />
                        <ThemeBubble id="forest" label="Bosque" bg="#F1F5F3" active={theme === 'forest'} />
                        <ThemeBubble id="ocean" label="Mar" bg="#F0F5F9" active={theme === 'ocean'} />
                        <ThemeBubble id="sunset" label="Tierra" bg="#FFFBF7" active={theme === 'sunset'} />
                    </div>

                    <div className="shadow-sm rounded-[24px] overflow-hidden mb-2 border border-[var(--border)] bg-[var(--card)]">
                        {/* Font Family Selection Row */}
                        <div className="p-5 border-b border-[var(--border)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-[var(--highlight)] flex items-center justify-center text-[var(--text-sub)]">
                                    <i className="ph-bold ph-text-aa text-lg"></i>
                                </div>
                                <div>
                                    <span className="block font-bold text-sm leading-tight">Tipografía</span>
                                    <span className="text-[10px] opacity-50 block mt-0.5">Estilo de lectura</span>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button onClick={() => setFontTheme('classic')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${fontTheme === 'classic' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    Editorial
                                </button>
                                <button onClick={() => setFontTheme('modern')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all font-sans whitespace-nowrap ${fontTheme === 'modern' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    Moderno
                                </button>
                                <button onClick={() => setFontTheme('humanist')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all font-serif whitespace-nowrap ${fontTheme === 'humanist' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    Suave
                                </button>
                                <button onClick={() => setFontTheme('elegant')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all font-serif whitespace-nowrap ${fontTheme === 'elegant' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    Elegante
                                </button>
                            </div>
                        </div>

                        {/* Font Size Selection Row */}
                        <div className="p-5 border-b border-[var(--border)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-[var(--highlight)] flex items-center justify-center text-[var(--text-sub)]">
                                    <i className="ph-bold ph-text-t text-lg"></i>
                                </div>
                                <div>
                                    <span className="block font-bold text-sm leading-tight">Tamaño</span>
                                    <span className="text-[10px] opacity-50 block mt-0.5">Escala de texto</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setFontSize('small')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${fontSize === 'small' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    Pequeño
                                </button>
                                <button onClick={() => setFontSize('medium')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${fontSize === 'medium' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    Normal
                                </button>
                                <button onClick={() => setFontSize('large')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${fontSize === 'large' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    Grande
                                </button>
                            </div>
                        </div>
                    </div>

                    <SectionHeader title="Experiencia" />
                    <div className="shadow-sm rounded-[24px] overflow-hidden mb-2">
                        <ToggleRow icon="ph-fill ph-speaker-high" label="Sonido Ambiental" desc="Efectos en Ciudadela" active={soundsEnabled} onToggle={() => toggleSetting('stoic_sound', setSoundsEnabled, soundsEnabled)} />
                        <ToggleRow icon="ph-fill ph-plant" label="Modo Zen" desc="Oculta navegación" active={zenMode} onToggle={toggleZen} />
                    </div>

                    <SectionHeader title="Rutina" />
                    <div className="shadow-sm rounded-[24px] overflow-hidden mb-2">
                        <ToggleRow icon="ph-fill ph-sun-horizon" label="Amanecer" desc="Recordatorio matutino" active={morningReminder} onToggle={() => toggleSetting('stoic_notify_morning', setMorningReminder, morningReminder)} />
                        <ToggleRow icon="ph-fill ph-moon-stars" label="Anochecer" desc="Reflexión nocturna" active={eveningReminder} onToggle={() => toggleSetting('stoic_notify_evening', setEveningReminder, eveningReminder)} />
                    </div>

                    <SectionHeader title="Seguridad" />
                    <div className="shadow-sm rounded-[24px] overflow-hidden mb-2">
                        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[24px]">
                            <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="w-full flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--highlight)] text-[var(--text-sub)] group-hover:text-[var(--text-main)] transition-colors">
                                        <i className="ph-bold ph-lock-key text-lg"></i>
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-sm leading-tight">Contraseña</span>
                                        <span className="text-[10px] opacity-50 block mt-0.5">Actualizar credenciales</span>
                                    </div>
                                </div>
                                <i className={`ph-bold ph-caret-down opacity-30 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`}></i>
                            </button>
                            
                            {showPasswordChange && (
                                <div className="mt-4 pt-4 border-t border-[var(--border)] animate-fade-in">
                                    <input 
                                        type="password" 
                                        placeholder="Nueva contraseña (min 6 caracteres)" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-[var(--highlight)] p-3 rounded-xl text-sm mb-3 outline-none border border-transparent focus:border-[var(--text-main)]"
                                    />
                                    <button 
                                        onClick={handlePasswordUpdate}
                                        disabled={isSavingPass || newPassword.length < 6}
                                        className="w-full py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {isSavingPass ? "Actualizando..." : "Confirmar Cambio"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <SectionHeader title="Datos" />
                    <div className="shadow-sm rounded-[24px] overflow-hidden mb-2">
                        <ActionRow icon="ph-bold ph-download-simple" label="Exportar Legado" desc="Descargar JSON" onClick={handleExport} />
                        <ActionRow icon="ph-bold ph-arrows-clockwise" label="Renovar Destino" desc="Recalcular día actual" onClick={handleResetDaily} />
                        <ActionRow icon="ph-bold ph-trash" label="Limpiar Caché" desc="Resetear app local" onClick={handleClearCache} />
                    </div>

                    <SectionHeader title="Sistema" />
                    <div className="shadow-sm rounded-[24px] overflow-hidden mb-8">
                        <ActionRow icon="ph-bold ph-terminal-window" label="Consola de Arconte" desc="Herramientas Admin" onClick={() => setShowAdmin(true)} />
                        <ActionRow icon="ph-bold ph-bug" label="Diagnóstico" desc="Ver estado interno" onClick={() => setShowDebug(!showDebug)} />
                        <ActionRow icon="ph-bold ph-sign-out" label="Cerrar Sesión" desc="Salir del Santuario" onClick={onLogout} danger={true} />
                    </div>

                    {showDebug && (
                        <div className="mb-10 bg-black text-green-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto">
                            <p className="mb-2 font-bold text-white">// DEBUG ({getISO()})</p>
                            <pre>{JSON.stringify(journal[getISO()], null, 2)}</pre>
                        </div>
                    )}

                    <div className="text-center opacity-30 text-[9px] font-bold uppercase tracking-widest pb-4">
                        Santuario v2.9.5 • Stoic OS
                    </div>
                </div>
             </div>
        </div>
    )
}
