
import React, { useState } from 'react';
import { getISO } from '../services/supabase';

export function CalendarView({ journal, openDay, user, onNavigateToProfile, onOpenSettings }: any) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today);

    const handlePrev = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNext = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    return (
        <div className="flex flex-col h-full bg-[var(--bg)] animate-fade-in items-center">
            
            {/* Standard Header (Enhanced Translucent) */}
            <div className="w-full max-w-4xl flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg)]/70 backdrop-blur-xl sticky top-0 z-40 transition-all">
                 <div>
                    <h2 className="serif text-2xl font-bold">Calendario</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Registro de Vida</p>
                 </div>
                 <div className="flex items-center gap-3">
                     <button onClick={onNavigateToProfile} className="w-10 h-10 rounded-full bg-[var(--highlight)] flex items-center justify-center border border-[var(--border)] shadow-sm hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors overflow-hidden">
                        <div className="text-sm font-bold">{user && user[0] ? user[0].toUpperCase() : 'E'}</div>
                     </button>
                     <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] shadow-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors">
                        <i className="ph-bold ph-gear"></i>
                     </button>
                 </div>
             </div>

            <div className="w-full max-w-4xl flex flex-col flex-1 px-4 md:px-8 pt-6 pb-24 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="serif text-3xl md:text-4xl font-bold capitalize text-[var(--text-main)] leading-none mb-1">
                            {currentMonth.toLocaleDateString('es-ES', { month: 'long' })}
                        </h2>
                        <span className="text-sm font-bold uppercase tracking-widest opacity-40">{currentMonth.getFullYear()}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrev} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] shadow-sm active:scale-95 transition-transform"><i className="ph-bold ph-caret-left"></i></button>
                        <button onClick={goToToday} className="px-4 h-10 rounded-full bg-[var(--text-main)] text-[var(--bg)] text-xs font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-transform">Hoy</button>
                        <button onClick={handleNext} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] shadow-sm active:scale-95 transition-transform"><i className="ph-bold ph-caret-right"></i></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 md:gap-4 mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                        <div key={d} className="text-center text-xs font-bold uppercase opacity-30 pb-2">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 md:gap-4 auto-rows-fr pb-8">
                    {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                    
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
                        const iso = getISO(date);
                        const entry = journal[iso];
                        const isToday = iso === getISO(today);
                        const mood = entry?.mood || 0;
                        const hasContent = entry?.text || entry?.question_response;
                        const hasChallenge = !!entry?.challenge_completed;

                        return (
                            <div key={iso} onClick={() => openDay(iso)} 
                                className={`aspect-square rounded-[18px] md:rounded-[22px] transition-all cursor-pointer relative overflow-hidden group
                                    ${mood ? 'text-white shadow-sm' : 'bg-[var(--highlight)]/30 hover:bg-[var(--highlight)] text-[var(--text-main)]'}
                                    ${isToday && !mood ? 'bg-[var(--highlight)] ring-2 ring-[var(--gold)] ring-inset' : ''}
                                `}
                                style={mood ? { backgroundColor: `var(--mood-${mood})` } : {}}
                            >
                                <div className={`absolute top-1.5 left-2 md:top-2 md:left-3 text-xs md:text-sm font-semibold ${isToday && !mood ? 'text-[var(--text-main)]' : ''}`}>{dayNum}</div>
                                
                                {hasChallenge && (
                                    <div className={`absolute top-1.5 right-1.5 md:top-2 md:right-2 text-[8px] md:text-[10px] ${mood ? 'text-white/90' : 'text-amber-500'}`}>
                                        <i className="ph-fill ph-sword"></i>
                                    </div>
                                )}

                                {hasContent && (
                                    <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${mood ? 'bg-white/60' : 'bg-[var(--text-sub)]'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
