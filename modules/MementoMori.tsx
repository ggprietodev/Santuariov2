import React, { useState, useMemo, useEffect } from 'react';
import { updateUserBirthDate } from '../services/supabase';

interface MementoMoriProps {
    onBack: () => void;
    birthDate?: string;
    onUpdateDate: (date: string) => void;
}

export function MementoMori({ onBack, birthDate, onUpdateDate }: MementoMoriProps) {
    // Modo de visualización: 'input' (formulario) o 'view' (calendario)
    const [mode, setMode] = useState<'input' | 'view'>(birthDate ? 'view' : 'input');
    
    // Estado del input, inicializado con la fecha guardada si existe
    const [dateInput, setDateInput] = useState(birthDate || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fecha máxima (hoy)
    const maxDate = new Date().toISOString().split('T')[0];

    // Sincronizar si cambia la prop externa
    useEffect(() => {
        if (birthDate) {
            setDateInput(birthDate);
            setMode('view');
        } else {
            setMode('input');
        }
    }, [birthDate]);

    const EXPECTED_YEARS = 80;
    const WEEKS_PER_YEAR = 52;
    const TOTAL_WEEKS = EXPECTED_YEARS * WEEKS_PER_YEAR;

    const weeksLived = useMemo(() => {
        if (!birthDate && mode === 'input') return 0;
        
        // Usamos birthDate (prop) o dateInput (si estamos previsualizando/calculando)
        const dateToUse = birthDate || dateInput;
        if (!dateToUse) return 0;

        const birth = new Date(dateToUse);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - birth.getTime());
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        return Math.min(diffWeeks, TOTAL_WEEKS); 
    }, [birthDate, dateInput, mode]);

    const percentageLived = Math.min(100, Math.round((weeksLived / TOTAL_WEEKS) * 100));

    const handleSave = async () => {
        setError(null);
        if (!dateInput) return;
        
        if (dateInput > maxDate) {
            setError("El destino aún no ha escrito el futuro.");
            return;
        }

        setLoading(true);
        
        // 1. Actualizar DB
        const err = await updateUserBirthDate(dateInput);
        
        if (!err) {
            // 2. Actualizar estado padre (App.tsx)
            onUpdateDate(dateInput);
            // 3. Cambiar a modo vista localmente (feedback instantáneo)
            setMode('view');
        } else {
            const errorMsg = typeof err === 'string' ? err : err.message;
            setError("Error guardando fecha: " + errorMsg);
        }
        setLoading(false);
    };

    // Simplemente cambia el modo visual, no borra nada todavía
    const handleEditClick = () => {
        setMode('input');
        setError(null);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center relative">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <div>
                        <h2 className="serif text-2xl font-bold">Memento Mori</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">El Tiempo es Vida</p>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-6">
                
                {mode === 'input' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center pb-20 animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-[var(--highlight)] flex items-center justify-center mb-6 border border-[var(--border)]">
                            <i className="ph-duotone ph-hourglass-medium text-4xl opacity-60"></i>
                        </div>
                        <h3 className="serif text-2xl font-bold mb-2">Define tu Origen</h3>
                        <p className="text-sm opacity-60 max-w-xs mb-8 leading-relaxed">
                            Para visualizar tu tiempo en la tierra, necesitamos saber cuándo comenzaste tu viaje.
                        </p>
                        
                        <div className="w-full max-w-xs space-y-4">
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={dateInput}
                                    max={maxDate}
                                    onChange={(e) => {
                                        setDateInput(e.target.value);
                                        setError(null);
                                    }}
                                    className={`w-full p-4 bg-[var(--card)] border rounded-2xl outline-none font-serif text-center uppercase tracking-widest text-sm shadow-sm transition-colors ${error ? 'border-rose-500 text-rose-500' : 'border-[var(--border)] focus:border-[var(--text-main)]'}`}
                                />
                                {error && (
                                    <div className="mt-3 flex items-center justify-center gap-2 text-rose-500 animate-pulse">
                                        <i className="ph-fill ph-warning-circle"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleSave} 
                                disabled={!dateInput || loading}
                                className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <i className="ph-duotone ph-spinner animate-spin text-lg"></i> : "Generar Calendario"}
                            </button>
                            
                            {/* Botón Cancelar si ya existía una fecha antes */}
                            {birthDate && (
                                <button 
                                    onClick={() => setMode('view')} 
                                    className="w-full py-3 text-[var(--text-sub)] font-bold uppercase tracking-widest text-[10px] hover:text-[var(--text-main)] transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in flex flex-col items-center">
                        {/* Stats Header */}
                        <div className="w-full bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm mb-8 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-3xl font-serif font-bold text-[var(--text-main)]">{weeksLived}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Semanas Vividas</span>
                            </div>
                            <div className="h-10 w-[1px] bg-[var(--border)]"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-serif font-bold text-[var(--text-main)]">{TOTAL_WEEKS - weeksLived}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Semanas Restantes (Est.)</span>
                            </div>
                        </div>

                        {/* The Grid */}
                        <div className="w-full mb-8 relative">
                            {/* Grid Container */}
                            <div className="flex flex-wrap gap-[2px] justify-center" style={{ maxWidth: '100%' }}>
                                {Array.from({ length: TOTAL_WEEKS }).map((_, i) => {
                                    const isPast = i < weeksLived;
                                    const isCurrent = i === weeksLived;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-[1px] transition-all duration-500
                                                ${isPast ? 'bg-stone-400 dark:bg-stone-600' : isCurrent ? 'bg-rose-500 animate-pulse scale-150 shadow-[0_0_8px_rgba(244,63,94,0.6)] z-10' : 'bg-[var(--highlight)] border-[0.5px] border-[var(--border)]'}
                                            `}
                                            title={isCurrent ? "Semana Actual" : undefined}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full mb-10">
                            <div className="flex justify-between items-end mb-2 px-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Vida Consumida</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{percentageLived}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--highlight)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div 
                                    className="h-full bg-stone-500 dark:bg-stone-400 transition-all duration-1000"
                                    style={{ width: `${percentageLived}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Footer Quote */}
                        <div className="text-center max-w-sm mx-auto opacity-60 mb-8 px-4">
                            <i className="ph-fill ph-quotes text-xl mb-2 block opacity-50"></i>
                            <p className="serif text-sm italic leading-relaxed">
                                "No es que tengamos poco tiempo, sino que perdemos mucho. La vida es lo bastante larga..."
                            </p>
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-2 block">— Séneca</span>
                        </div>
                        
                        <button 
                            onClick={handleEditClick} 
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--card)] border border-[var(--border)] text-[9px] font-bold uppercase tracking-widest text-[var(--text-sub)] hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition-all shadow-sm active:scale-95 mb-8"
                        >
                            <i className="ph-bold ph-pencil-simple"></i> Corregir Fecha
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}