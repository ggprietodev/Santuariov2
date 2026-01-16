
import React, { useState, useEffect, useMemo } from 'react';
import { savePremeditatio, fetchPremeditatioLogs, deletePremeditatioLog } from '../services/supabase';
import { generatePremeditatioGuidance, generateStoicMantra } from '../services/geminiService';
import { PremeditatioLog } from '../types';

interface PremeditatioProps {
    onBack: () => void;
}

export function Premeditatio({ onBack }: PremeditatioProps) {
    const [view, setView] = useState<'create' | 'list'>('create');
    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");

    const [formData, setFormData] = useState<Omit<PremeditatioLog, 'id' | 'created_at' | 'user_id'>>({
        event_context: '',
        worst_case: '',
        prevention: '',
        virtue_response: ''
    });

    const [confidence, setConfidence] = useState(5);
    const [generatedMantra, setGeneratedMantra] = useState("");
    const [isGeneratingMantra, setIsGeneratingMantra] = useState(false);

    const [logs, setLogs] = useState<PremeditatioLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // DELETE CONFIRMATION STATE
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        if (view === 'list') {
            loadHistory();
        }
    }, [view]);

    const loadHistory = async () => {
        setLoadingLogs(true);
        const data = await fetchPremeditatioLogs();
        setLogs(data);
        setLoadingLogs(false);
    };

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
        setAiSuggestion(null);
    };
    
    const handleBack = () => {
        setStep(prev => prev - 1);
        setAiSuggestion(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const finalPayload: any = {
            ...formData,
            confidence_score: confidence,
            mantra: generatedMantra
        };

        const error = await savePremeditatio(finalPayload);
        setIsSaving(false);
        if (error) {
            alert("Error al guardar: " + error.message);
        } else {
            setView('list'); 
            setStep(0);
            setFormData({ event_context: '', worst_case: '', prevention: '', virtue_response: '' });
            setGeneratedMantra("");
            setConfidence(5);
        }
    };

    // TWO-STEP DELETE HANDLER
    const requestDelete = (id: string) => {
        if (deleteConfirmId === id) {
            // Confirmed
            handleExecuteDelete(id);
            setDeleteConfirmId(null);
        } else {
            // First click
            setDeleteConfirmId(id);
            // Auto-cancel after 3s
            setTimeout(() => {
                setDeleteConfirmId(prev => prev === id ? null : prev);
            }, 3000);
        }
    };

    const handleExecuteDelete = async (id: string) => {
        console.log("Ejecutando borrado para:", id);
        
        // 1. Optimistic UI Update
        const previousLogs = [...logs];
        setLogs(prev => prev.filter(l => l.id !== id));

        // 2. Call DB
        const error = await deletePremeditatioLog(id);
        
        // 3. Rollback if error
        if (error) {
            console.error("Delete failed in DB", error);
            alert("Error al eliminar: " + (error.message || "Error desconocido"));
            setLogs(previousLogs);
        }
    };

    const handleCopyMantra = (mantra: string) => {
        navigator.clipboard.writeText(mantra);
        alert("Mantra copiado.");
    };

    const handleGetAiHelp = async (currentStep: 'worst_case' | 'prevention' | 'virtue') => {
        if (!formData.event_context) return;
        setIsAiLoading(true);
        const suggestion = await generatePremeditatioGuidance(formData.event_context, currentStep);
        setAiSuggestion(suggestion);
        setIsAiLoading(false);
    };

    const handleGenerateMantra = async () => {
        if (!formData.event_context) return;
        setIsGeneratingMantra(true);
        const mantra = await generateStoicMantra(formData.event_context);
        setGeneratedMantra(mantra);
        setIsGeneratingMantra(false);
    };

    const useSuggestion = () => {
        if (!aiSuggestion) return;
        const fieldMap = { 2: 'worst_case', 3: 'prevention', 4: 'virtue_response' };
        const field = fieldMap[step as 2|3|4] as keyof typeof formData;
        if(field) updateField(field, aiSuggestion);
        setAiSuggestion(null);
    };

    const filteredLogs = useMemo(() => {
        let result = logs;

        if (filterStart || filterEnd) {
            result = result.filter(log => {
                if (!log.created_at) return false;
                const logDate = new Date(log.created_at);
                logDate.setHours(0,0,0,0);

                if (filterStart) {
                    const start = new Date(filterStart);
                    start.setHours(0,0,0,0);
                    if (logDate < start) return false;
                }
                if (filterEnd) {
                    const end = new Date(filterEnd);
                    end.setHours(23,59,59,999);
                    if (logDate > end) return false;
                }
                return true;
            });
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(log => 
                log.event_context.toLowerCase().includes(lowerTerm) ||
                log.worst_case?.toLowerCase().includes(lowerTerm) ||
                log.prevention?.toLowerCase().includes(lowerTerm) ||
                log.virtue_response?.toLowerCase().includes(lowerTerm) ||
                log.mantra?.toLowerCase().includes(lowerTerm)
            );
        }

        return result;
    }, [logs, searchTerm, filterStart, filterEnd]);

    const getConfidenceColor = (score: number) => {
        if (score >= 8) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
        if (score >= 5) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
    };

    // --- LIST VIEW ---
    if (view === 'list') {
        return (
            <div className="flex flex-col h-full bg-[var(--bg)] animate-fade-in">
                <div className="w-full max-w-2xl mx-auto flex items-center justify-between px-6 py-5 z-20 sticky top-0 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)]">
                    <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors border border-[var(--border)] shadow-sm">
                        <i className="ph-bold ph-arrow-left"></i>
                    </button>
                    <div>
                        <h2 className="serif text-xl font-bold text-center">Premeditatio</h2>
                    </div>
                    <button onClick={() => { setView('create'); setStep(0); }} className="w-9 h-9 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center shadow-md transition-transform hover:scale-105 border border-[var(--border)]">
                        <i className="ph-bold ph-plus"></i>
                    </button>
                </div>

                <div className="w-full max-w-2xl mx-auto px-6 pt-4 pb-2 bg-[var(--bg)] z-10 space-y-3">
                    <div className="flex gap-2">
                        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] flex items-center gap-3 px-3 py-2 transition-colors focus-within:border-[var(--text-main)] shadow-sm flex-1">
                            <i className="ph-bold ph-magnifying-glass opacity-30 text-sm"></i>
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar en archivos..." 
                                className="bg-transparent outline-none w-full text-xs font-serif placeholder:font-sans placeholder:opacity-30"
                            />
                            {searchTerm && <button onClick={() => setSearchTerm("")}><i className="ph-bold ph-x opacity-40 hover:opacity-100 text-sm"></i></button>}
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`w-10 rounded-xl border flex items-center justify-center transition-colors ${showFilters || filterStart || filterEnd ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}
                        >
                            <i className="ph-bold ph-calendar"></i>
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex items-center gap-2 animate-fade-in bg-[var(--card)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                            <div className="flex-1">
                                <label className="text-[8px] font-bold uppercase tracking-widest opacity-40 block ml-1 mb-1">Desde</label>
                                <input 
                                    type="date" 
                                    value={filterStart} 
                                    onChange={(e) => setFilterStart(e.target.value)} 
                                    className="w-full bg-[var(--highlight)] rounded-lg px-2 py-1.5 text-[10px] outline-none border border-transparent focus:border-[var(--text-main)]"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[8px] font-bold uppercase tracking-widest opacity-40 block ml-1 mb-1">Hasta</label>
                                <input 
                                    type="date" 
                                    value={filterEnd} 
                                    onChange={(e) => setFilterEnd(e.target.value)} 
                                    className="w-full bg-[var(--highlight)] rounded-lg px-2 py-1.5 text-[10px] outline-none border border-transparent focus:border-[var(--text-main)]"
                                />
                            </div>
                            {(filterStart || filterEnd) && (
                                <button onClick={() => { setFilterStart(""); setFilterEnd(""); }} className="h-full px-2 flex items-end pb-2 opacity-40 hover:opacity-100 text-rose-500">
                                    <i className="ph-bold ph-x"></i>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-20 max-w-2xl mx-auto w-full no-scrollbar space-y-6 pt-4">
                    {loadingLogs && <div className="text-center py-10 opacity-50"><i className="ph-duotone ph-spinner animate-spin text-2xl"></i></div>}
                    {!loadingLogs && filteredLogs.length === 0 && (
                        <div className="text-center py-20 opacity-30 flex flex-col items-center">
                            <i className="ph-duotone ph-scroll text-3xl mb-3"></i>
                            <p className="serif text-xs italic">{searchTerm || filterStart ? "No se encontraron coincidencias." : "La mente está despejada."}</p>
                        </div>
                    )}
                    
                    {filteredLogs.map((log) => (
                        <div key={log.id} className="relative group bg-[var(--card)] rounded-[32px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col isolate">
                            
                            {/* Card Header Row */}
                            <div className="flex justify-between items-start p-6 pb-2">
                                {/* Date Badge */}
                                <div className="flex flex-col pr-4">
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1 flex items-center gap-1">
                                        <i className="ph-bold ph-calendar-blank"></i>
                                        {new Date(log.created_at!).toLocaleDateString(undefined, {month:'long', day:'numeric', year:'numeric'})}
                                    </span>
                                    <h3 className="serif text-xl sm:text-2xl font-bold leading-tight text-[var(--text-main)] mb-2 line-clamp-2">{log.event_context}</h3>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <button 
                                        type="button"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if(log.id) requestDelete(log.id);
                                        }}
                                        className={`h-8 rounded-full border transition-all shadow-sm cursor-pointer flex items-center justify-center ${deleteConfirmId === log.id ? 'w-20 bg-rose-500 text-white border-rose-600' : 'w-8 bg-[var(--bg)] border-[var(--border)] text-[var(--text-sub)] hover:bg-rose-50 hover:text-rose-500'}`}
                                    >
                                        {deleteConfirmId === log.id ? (
                                            <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><i className="ph-bold ph-trash"></i> Borrar</span>
                                        ) : (
                                            <i className="ph-bold ph-trash"></i>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Mantra Highlight */}
                            {log.mantra && (
                                <div className="px-6 mb-4">
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center text-amber-500 shrink-0 shadow-sm border border-amber-100 dark:border-amber-800/30">
                                            <i className="ph-fill ph-lightning text-lg"></i>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 block opacity-60 mb-0.5">Mantra de Poder</span>
                                            <p className="serif font-bold text-sm text-amber-900 dark:text-amber-100 italic leading-snug">"{log.mantra}"</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tri-Grid Content */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[var(--border)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)] bg-[var(--highlight)]/20">
                                
                                <div className="p-5 flex flex-col gap-2 hover:bg-[var(--card)] transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xs shadow-sm">
                                            <i className="ph-fill ph-skull"></i>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Lo Peor</span>
                                    </div>
                                    <p className="serif-text text-sm opacity-80 leading-relaxed">{log.worst_case}</p>
                                </div>

                                <div className="p-5 flex flex-col gap-2 hover:bg-[var(--card)] transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 text-xs shadow-sm">
                                            <i className="ph-fill ph-shield"></i>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Defensa</span>
                                    </div>
                                    <p className="serif-text text-sm opacity-80 leading-relaxed">{log.prevention}</p>
                                </div>

                                <div className="p-5 flex flex-col gap-2 hover:bg-[var(--card)] transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs shadow-sm">
                                            <i className="ph-fill ph-sparkle"></i>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Virtud</span>
                                    </div>
                                    <p className="serif-text text-sm opacity-80 leading-relaxed">{log.virtue_response}</p>
                                </div>

                            </div>
                            
                            {/* Footer: Confidence Score */}
                            <div className="bg-[var(--card)] px-6 py-3 border-t border-[var(--border)] flex justify-between items-center">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Preparación Mental</span>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getConfidenceColor(log.confidence_score || 5)}`}>
                                    <i className="ph-fill ph-chart-bar"></i> {log.confidence_score || 5} / 10
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- CREATE MODE (UNCHANGED) ---
    return (
        <div className="flex flex-col h-full bg-[var(--bg)] animate-fade-in relative overflow-hidden">
            <div className="w-full max-w-2xl mx-auto flex items-center justify-between px-6 py-6 z-20 shrink-0">
                <button onClick={() => setView('list')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors border border-[var(--border)] shadow-sm">
                    <i className="ph-bold ph-list"></i>
                </button>
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${step >= idx ? 'w-6 bg-[var(--text-main)]' : 'w-1.5 bg-[var(--border)]'}`}></div>
                    ))}
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 w-full max-w-xl mx-auto px-8 pb-6 overflow-y-auto no-scrollbar flex flex-col relative pt-6">
                {step === 0 && (
                    <div className="text-center animate-fade-in space-y-6 flex flex-col justify-center flex-1">
                        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--highlight)] flex items-center justify-center mb-2 shadow-inner border border-[var(--border)]">
                            <i className="ph-duotone ph-skull text-4xl opacity-50"></i>
                        </div>
                        <div>
                            <h2 className="serif text-2xl font-bold mb-2 text-[var(--text-main)]">Premeditatio Malorum</h2>
                            <p className="serif-text text-xs opacity-60 leading-relaxed max-w-xs mx-auto italic">
                                "Lo inesperado golpea más fuerte. Anticipa el golpe y le quitarás su poder."
                            </p>
                        </div>
                        <button 
                            onClick={handleNext} 
                            className="px-8 py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-full font-bold uppercase tracking-[2px] text-[10px] shadow-lg hover:scale-105 transition-transform mx-auto"
                        >
                            Comenzar
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <div className="animate-slide-up flex flex-col flex-1 h-full">
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block shrink-0 text-indigo-500">Paso 1</span>
                        <h3 className="serif text-xl font-bold leading-tight text-[var(--text-main)] mb-6">¿Qué situación futura te inquieta?</h3>
                        
                        <div className="relative flex-1 flex flex-col min-h-[150px] mb-4 bg-indigo-50/20 dark:bg-indigo-900/5 rounded-2xl border-l-2 border-indigo-200 dark:border-indigo-900/30 p-1">
                            <textarea 
                                autoFocus
                                value={formData.event_context}
                                onChange={(e) => updateField('event_context', e.target.value)}
                                placeholder="Ej: La reunión de mañana..."
                                className="w-full h-full bg-transparent p-4 serif-text text-sm leading-loose outline-none resize-none placeholder:opacity-30 text-[var(--text-main)] border-none"
                            />
                        </div>
                        
                        <div className="flex justify-end mt-auto pt-2">
                            <button onClick={handleNext} disabled={!formData.event_context.trim()} className="w-12 h-12 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center shadow-lg disabled:opacity-30 hover:scale-110 transition-all border border-[var(--border)]">
                                <i className="ph-bold ph-arrow-right text-lg"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up flex flex-col flex-1 h-full">
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block shrink-0 text-rose-500">Paso 2</span>
                        <h3 className="serif text-xl font-bold mb-4 leading-tight text-[var(--text-main)] shrink-0">Describe el peor escenario posible.</h3>
                        
                        <div className="relative flex-1 flex flex-col min-h-[150px] mb-4 bg-rose-50/20 dark:bg-rose-900/5 rounded-2xl border-l-2 border-rose-200 dark:border-rose-900/30 p-1">
                            <textarea 
                                autoFocus
                                value={formData.worst_case}
                                onChange={(e) => updateField('worst_case', e.target.value)}
                                placeholder="Sé crudo y realista..."
                                className="w-full h-full bg-transparent p-4 serif-text text-sm leading-loose outline-none resize-none placeholder:opacity-30 text-[var(--text-main)] border-none"
                            />
                            
                            {aiSuggestion && (
                                <div className="absolute inset-0 bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-xl animate-fade-in overflow-y-auto z-10 flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[9px] font-bold uppercase text-[var(--gold)] flex items-center gap-1"><i className="ph-fill ph-sparkle"></i> Oráculo</span>
                                        <button onClick={() => setAiSuggestion(null)}><i className="ph-bold ph-x"></i></button>
                                    </div>
                                    <p className="serif-text text-xs leading-relaxed mb-4 flex-1 opacity-90">{aiSuggestion}</p>
                                    <button onClick={useSuggestion} className="w-full py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-xl font-bold uppercase text-[9px] tracking-widest">Usar</button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center shrink-0 pb-safe pt-2">
                            <button onClick={() => handleGetAiHelp('worst_case')} disabled={isAiLoading} className="px-3 py-2 rounded-lg hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                {isAiLoading ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-bold ph-sparkle text-[var(--gold)]"></i>} Ayuda
                            </button>
                            <button onClick={handleNext} disabled={!formData.worst_case.trim()} className="w-12 h-12 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center shadow-lg disabled:opacity-30 hover:scale-110 transition-all border border-[var(--border)]">
                                <i className="ph-bold ph-arrow-right text-lg"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-slide-up flex flex-col flex-1 h-full">
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block shrink-0 text-stone-500">Paso 3</span>
                        <h3 className="serif text-xl font-bold mb-4 leading-tight text-[var(--text-main)] shrink-0">¿Qué acciones están bajo tu control?</h3>

                        <div className="relative flex-1 flex flex-col min-h-[150px] mb-4 bg-stone-50/20 dark:bg-stone-900/5 rounded-2xl border-l-2 border-stone-200 dark:border-stone-800/30 p-1">
                            <textarea 
                                autoFocus
                                value={formData.prevention}
                                onChange={(e) => updateField('prevention', e.target.value)}
                                placeholder="Preparación concreta..."
                                className="w-full h-full bg-transparent p-4 serif-text text-sm leading-loose outline-none resize-none placeholder:opacity-30 text-[var(--text-main)] border-none"
                            />
                            {aiSuggestion && (
                                <div className="absolute inset-0 bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-xl animate-fade-in overflow-y-auto z-10 flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[9px] font-bold uppercase text-[var(--gold)] flex items-center gap-1"><i className="ph-fill ph-sparkle"></i> Oráculo</span>
                                        <button onClick={() => setAiSuggestion(null)}><i className="ph-bold ph-x"></i></button>
                                    </div>
                                    <p className="serif-text text-xs leading-relaxed mb-4 flex-1 opacity-90">{aiSuggestion}</p>
                                    <button onClick={useSuggestion} className="w-full py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-xl font-bold uppercase text-[9px] tracking-widest">Usar</button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center shrink-0 pb-safe pt-2">
                            <button onClick={() => handleGetAiHelp('prevention')} disabled={isAiLoading} className="px-3 py-2 rounded-lg hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                {isAiLoading ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-bold ph-sparkle text-[var(--gold)]"></i>} Ayuda
                            </button>
                            <button onClick={handleNext} disabled={!formData.prevention.trim()} className="w-12 h-12 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center shadow-lg disabled:opacity-30 hover:scale-110 transition-all border border-[var(--border)]">
                                <i className="ph-bold ph-arrow-right text-lg"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-slide-up flex flex-col flex-1 h-full">
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block shrink-0 text-emerald-500">Paso 4</span>
                        <h3 className="serif text-xl font-bold mb-4 leading-tight text-[var(--text-main)] shrink-0">Si ocurre lo peor, ¿cómo responderás con virtud?</h3>
                        
                        <div className="relative mb-6 flex-1 flex flex-col min-h-[120px] bg-emerald-50/20 dark:bg-emerald-900/5 rounded-2xl border-l-2 border-emerald-200 dark:border-emerald-900/30 p-1">
                            <textarea 
                                autoFocus
                                value={formData.virtue_response}
                                onChange={(e) => updateField('virtue_response', e.target.value)}
                                placeholder="Coraje, Templanza, Sabiduría..."
                                className="w-full h-full bg-transparent p-4 serif-text text-sm leading-loose outline-none resize-none placeholder:opacity-30 text-[var(--text-main)] border-none"
                            />
                            {aiSuggestion && (
                                <div className="absolute inset-0 bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-xl animate-fade-in overflow-y-auto z-10 flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[9px] font-bold uppercase text-[var(--gold)] flex items-center gap-1"><i className="ph-fill ph-sparkle"></i> Oráculo</span>
                                        <button onClick={() => setAiSuggestion(null)}><i className="ph-bold ph-x"></i></button>
                                    </div>
                                    <p className="serif-text text-xs leading-relaxed mb-4 flex-1 opacity-90">{aiSuggestion}</p>
                                    <button onClick={useSuggestion} className="w-full py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-xl font-bold uppercase text-[9px] tracking-widest">Usar</button>
                                </div>
                            )}
                        </div>

                        <div className="py-4 border-t border-[var(--border)] mb-4">
                            <div className="flex justify-between mb-3">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Nivel de Confianza</span>
                                <span className="text-xs font-bold text-[var(--text-main)]">{confidence}/10</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" max="10" 
                                value={confidence} 
                                onChange={(e) => setConfidence(parseInt(e.target.value))} 
                                className="w-full accent-[var(--text-main)] h-2 bg-[var(--highlight)] rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>

                        <div className="flex justify-between items-center shrink-0 pb-safe">
                            <button onClick={() => handleGetAiHelp('virtue')} disabled={isAiLoading} className="px-3 py-2 rounded-lg hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                {isAiLoading ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-bold ph-sparkle text-[var(--gold)]"></i>} Ayuda
                            </button>
                            <button onClick={handleNext} disabled={!formData.virtue_response.trim()} className="w-12 h-12 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center shadow-lg disabled:opacity-30 hover:scale-110 transition-all border border-[var(--border)]">
                                <i className="ph-bold ph-check text-lg"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="animate-fade-in flex flex-col flex-1 pb-safe pt-4">
                        <div className="text-center mb-6 shrink-0">
                            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 border border-[var(--border)] bg-[var(--highlight)]">
                                <i className="ph-fill ph-shield-check text-2xl text-[var(--text-main)]"></i>
                            </div>
                            <h3 className="serif text-xl font-bold mb-1 text-[var(--text-main)]">Pacto Sellado</h3>
                            <p className="text-[9px] opacity-50 uppercase tracking-widest">Estás preparado.</p>
                        </div>

                        <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-1">
                            <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 block mb-1">Escenario</span>
                                <p className="serif-text text-sm opacity-90 leading-relaxed text-[var(--text-main)]">{formData.worst_case}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 block mb-1 text-stone-500">Control</span>
                                    <p className="serif-text text-xs opacity-90 leading-relaxed">{formData.prevention}</p>
                                </div>
                                <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 block mb-1 text-emerald-500">Respuesta</span>
                                    <p className="serif-text text-xs opacity-90 leading-relaxed">{formData.virtue_response}</p>
                                </div>
                            </div>

                            {generatedMantra ? (
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl text-center mt-4 border border-amber-100 dark:border-amber-900/20">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 block">Mantra</span>
                                    <h4 className="serif text-base font-bold text-[var(--text-main)] italic mb-2">"{generatedMantra}"</h4>
                                    <button onClick={() => handleCopyMantra(generatedMantra)} className="text-[8px] opacity-50 hover:opacity-100 uppercase font-bold tracking-widest mt-1 flex items-center justify-center gap-1 mx-auto">
                                        <i className="ph-bold ph-copy"></i> Copiar
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleGenerateMantra} 
                                    disabled={isGeneratingMantra}
                                    className="w-full py-3 border border-[var(--border)] rounded-2xl text-[var(--text-sub)] text-[9px] font-bold uppercase tracking-widest hover:border-[var(--text-main)] transition-colors flex items-center justify-center gap-2 mt-4 bg-[var(--card)]"
                                >
                                    {isGeneratingMantra ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-bold ph-lightning"></i>}
                                    Generar Mantra
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3 shrink-0 mt-auto">
                            <button onClick={handleBack} className="flex-1 py-3 text-[var(--text-sub)] font-bold uppercase tracking-widest text-[9px] hover:text-[var(--text-main)] border border-[var(--border)] rounded-2xl bg-[var(--card)]">
                                Editar
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="flex-[2] py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest text-[9px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-[var(--border)]"
                            >
                                {isSaving ? <i className="ph-duotone ph-spinner animate-spin text-lg"></i> : "Guardar"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
