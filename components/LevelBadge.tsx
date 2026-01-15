
import React, { useMemo } from 'react';
import { calculateLevel } from '../utils/gamification';

interface LevelBadgeProps {
    xp: number;
    showLabel?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ xp, showLabel = true }) => {
    const { title, level, progress } = useMemo(() => calculateLevel(xp || 0), [xp]);

    // Lógica de colores premium (Gradientes)
    const getLevelStyle = (lvl: number) => {
        if (lvl === 1) return { text: 'text-stone-500', bar: 'from-stone-400 to-stone-600', bg: 'bg-stone-200' };
        if (lvl === 2) return { text: 'text-sky-600', bar: 'from-sky-400 to-blue-600', bg: 'bg-sky-100' };
        if (lvl === 3) return { text: 'text-emerald-600', bar: 'from-emerald-400 to-teal-600', bg: 'bg-emerald-100' };
        if (lvl === 4) return { text: 'text-purple-600', bar: 'from-purple-400 to-indigo-600', bg: 'bg-purple-100' };
        return { text: 'text-amber-600', bar: 'from-amber-300 via-[var(--gold)] to-amber-600', bg: 'bg-amber-100' }; // Sabio
    };

    const style = getLevelStyle(level);

    return (
        <div className="flex flex-col items-end select-none group relative cursor-help">
            <div className="flex items-center gap-1.5">
                {showLabel && <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Nvl {level}</span>}
                <span className={`text-[10px] font-bold ${style.text}`}>{title}</span>
            </div>
            
            {/* Barra de Progreso con Brillo */}
            <div className={`w-20 h-1.5 ${style.bg} rounded-full mt-1 overflow-hidden border border-[var(--border)] relative`}>
                <div 
                    className={`h-full bg-gradient-to-r ${style.bar} transition-all duration-1000 ease-out relative`} 
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-[pulse_2s_infinite]"></div>
                </div>
            </div>

            {/* XP Tooltip Flotante */}
            <div className="absolute right-0 top-full mt-2 bg-[var(--card)] border border-[var(--border)] px-3 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[100px] flex flex-col items-end">
                <span className="text-[10px] font-bold text-[var(--text-main)]">{xp} XP Total</span>
                <span className="text-[8px] opacity-50 uppercase tracking-widest">Siguiente: {Math.round(100 - progress)}%</span>
            </div>
        </div>
    );
};
