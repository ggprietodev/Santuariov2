
import React, { useState, useMemo, useEffect } from 'react';
import { getISO } from '../services/supabase';
import { DichotomyScenario, SharedItem, Task } from '../types';
import { getSeededRandomItem } from '../utils/stoicData';

interface ArenaModuleProps {
    journal: any;
    onUpdateEntry: any;
    onBack: () => void;
    activeChallenge: any;
    onShare: (item: SharedItem) => void;
    tasks: Task[];
    dichotomies: DichotomyScenario[];
    dailyTask: Task;
}

export function ArenaModule({ journal, onUpdateEntry, onBack, activeChallenge, onShare, tasks, dichotomies, dailyTask }: ArenaModuleProps) {
    const [tab, setTab] = useState<'current' | 'history' | 'training' | 'library'>('current');
    
    // No static fallback, rely on DB data
    const safeDichotomies = dichotomies && dichotomies.length > 0 ? dichotomies : [];

    const defaultTaskToUse = dailyTask || { title: "Cargando Reto...", description: "Sincronizando con el destino..." };
    const [overrideTask, setOverrideTask] = useState<Task | null>(null);

    const taskData = overrideTask 
        ? { title: overrideTask.title, description: overrideTask.description }
        : (activeChallenge 
            ? { title: activeChallenge.title, description: activeChallenge.task } 
            : defaultTaskToUse);

    const displayTask = { t: taskData.title, d: taskData.description };
    const today = getISO();
    const entry = journal[today] || {};

    const [viewState, setViewState] = useState<'start' | 'active' | 'completed'>('start');
    const [reflection, setReflection] = useState("");
    const [resultStatus, setResultStatus] = useState<'success' | 'failed' | null>(null);
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

    // NEW: History Date Filter Range
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");

    useEffect(() => {
        if (overrideTask) {
            setViewState('start');
            setResultStatus(null);
            setReflection("");
            return;
        }
        
        const rawResponse = entry.challenge_response || "";
        const cleanResponse = rawResponse.replace(/^\[.*?\]\s*/, '').trim();
        
        // Use new Status field if available, else infer
        const status = entry.challenge_status; 
        const isSuccess = status === 'success' || entry.challenge_completed === true;
        const isFailed = status === 'failed';

        if (isSuccess || isFailed) {
            setViewState('completed');
            setResultStatus(isSuccess ? 'success' : 'failed');
            setReflection(cleanResponse);
        } else if (rawResponse || (entry.challenge_completed === false && !isFailed && rawResponse.length > 0)) {
            setViewState('active');
            setReflection(cleanResponse);
        } else {
            setViewState('start');
        }
    }, [entry, overrideTask, today]);

    const [gameScenario, setGameScenario] = useState<DichotomyScenario | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const history = useMemo(() => {
        return Object.entries(journal)
            .filter(([_, e]: [string, any]) => e.challenge_status || e.challenge_completed === true)
            .sort((a, b) => b[0].localeCompare(a[0]));
    }, [journal]);

    const filteredHistory = useMemo(() => {
        return history.filter(([date]) => {
            if (!filterStart && !filterEnd) return true;
            
            const itemDate = new Date(date);
            itemDate.setHours(0,0,0,0);

            if (filterStart) {
                const start = new Date(filterStart);
                start.setHours(0,0,0,0);
                if (itemDate < start) return false;
            }
            if (filterEnd) {
                const end = new Date(filterEnd);
                end.setHours(23,59,59,999);
                if (itemDate > end) return false;
            }
            return true;
        });
    }, [history, filterStart, filterEnd]);

    const handleAccept = () => {
        setViewState('active');
        if(overrideTask) setReflection(""); 
    };

    const handleFinish = () => {
        if (!resultStatus) return;
        setViewState('completed');
        
        let cleanBody = reflection.trim();
        if (!cleanBody) {
            cleanBody = resultStatus === 'success' ? "Completado sin notas." : "No conseguido.";
        }

        const headerTag = `[${displayTask.t}]`;
        const finalPayload = `${headerTag} ${cleanBody}`; 

        onUpdateEntry({ 
            challenge_response: finalPayload, 
            challenge_completed: resultStatus === 'success', 
            challenge_status: resultStatus,
            challenge_title: displayTask.t 
        });
    };

    const handleShareChallenge = () => {
        if(onShare) {
            onShare({
                type: 'challenge',
                title: displayTask.t,
                content: displayTask.d,
                extra: 'Reto del Día'
            });
        }
    }

    const handleSelectFromLibrary = (task: Task) => {
        setOverrideTask(task);
        setTab('current');
    }

    const nextScenario = () => {
        if(safeDichotomies.length === 0) return;
        const random = safeDichotomies[Math.floor(Math.random() * safeDichotomies.length)];
        setGameScenario(random);
        setFeedback(null);
    };

    // Ensure game starts when tab is opened
    useEffect(() => { 
        if (tab === 'training' && !gameScenario) {
            nextScenario(); 
        }
    }, [tab]);

    const handleGameChoice = (choice: 'internal' | 'external') => {
        if (!gameScenario) return;
        const isCorrect = choice === gameScenario.type;
        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 10);
            setStreak(s => s + 1);
            setTimeout(nextScenario, 600);
        } else {
            setFeedback('wrong');
            setStreak(0);
            setTimeout(nextScenario, 1000);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
             <div className="w-full max-w-2xl flex flex-col px-6 py-4 mb-2 sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] transition-all shrink-0">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <h2 className="serif text-2xl font-bold">La Arena</h2>
                </div>
                <div className="flex bg-[var(--card)] p-1 rounded-full shadow-sm border border-[var(--border)] overflow-x-auto no-scrollbar">
                    <button onClick={() => setTab('current')} className={`flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${tab==='current'?'bg-[var(--text-main)] text-[var(--bg)] shadow-sm':'text-[var(--text-sub)]'}`}>Activo</button>
                    <button onClick={() => setTab('library')} className={`flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${tab==='library'?'bg-[var(--text-main)] text-[var(--bg)] shadow-sm':'text-[var(--text-sub)]'}`}>Catálogo</button>
                    <button onClick={() => setTab('training')} className={`flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${tab==='training'?'bg-[var(--text-main)] text-[var(--bg)] shadow-sm':'text-[var(--text-sub)]'}`}>Entreno</button>
                    <button onClick={() => setTab('history')} className={`flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${tab==='history'?'bg-[var(--text-main)] text-[var(--bg)] shadow-sm':'text-[var(--text-sub)]'}`}>Historial</button>
                </div>
            </div>
            
            <div className="w-full max-w-2xl px-6 pb-32 flex flex-col items-center flex-1 overflow-y-auto no-scrollbar pt-4">
                
                {tab === 'current' && (
                    <>
                    {viewState === 'start' && (
                        <div className="flex flex-col items-center justify-center flex-1 w-full text-center">
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-10 rounded-full"></div>
                                <i className="ph-duotone ph-swords text-8xl text-amber-600 dark:text-amber-400 relative z-10"></i>
                            </div>
                            <h3 className="serif text-3xl font-bold mb-4 text-[var(--text-main)]">Micro-Reto</h3>
                            <div className="bg-[var(--card)] p-8 rounded-[32px] border border-[var(--border)] shadow-lg mb-8 max-w-sm">
                                {(overrideTask || activeChallenge) && <div className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-1 rounded-full inline-block mb-3">Selección Manual</div>}
                                <h4 className="serif text-xl font-bold mb-2 text-amber-600 dark:text-amber-400">{displayTask.t}</h4>
                                <p className="serif-text text-base leading-relaxed opacity-80">{displayTask.d}</p>
                            </div>
                            <button onClick={handleAccept} className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                Aceptar Misión
                            </button>
                        </div>
                    )}

                    {viewState === 'active' && (
                        <div className="w-full flex-1 flex flex-col">
                            <div className="bg-[#FFFBEB] dark:bg-[#2C2410] p-6 rounded-[24px] border border-amber-200 dark:border-amber-900/30 mb-6 flex items-start gap-4 shadow-sm">
                                <i className="ph-fill ph-lightning text-2xl text-amber-500 mt-1 shrink-0"></i>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-200 mb-1">En Curso</div>
                                    <p className="serif font-bold text-lg text-amber-900 dark:text-amber-50 leading-tight mb-1">{displayTask.t}</p>
                                    <p className="text-sm opacity-80 text-amber-900/80 dark:text-amber-100/80 leading-relaxed">{displayTask.d}</p>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="text-center mb-6">
                                    <p className="text-xs uppercase font-bold tracking-widest opacity-50 mb-4">¿Resultado?</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setResultStatus('success')}
                                            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${resultStatus === 'success' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shadow-md' : 'border-[var(--border)] bg-[var(--card)] opacity-60 hover:opacity-100'}`}
                                        >
                                            <i className="ph-fill ph-check-circle text-4xl"></i>
                                            <span className="font-bold text-sm uppercase tracking-widest">Conseguido</span>
                                        </button>
                                        <button 
                                            onClick={() => setResultStatus('failed')}
                                            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${resultStatus === 'failed' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 shadow-md' : 'border-[var(--border)] bg-[var(--card)] opacity-60 hover:opacity-100'}`}
                                        >
                                            <i className="ph-fill ph-x-circle text-4xl"></i>
                                            <span className="font-bold text-sm uppercase tracking-widest">No Pude</span>
                                        </button>
                                    </div>
                                </div>

                                <div className={`transition-all duration-500 flex-1 flex flex-col ${resultStatus ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 pl-2">Nota Breve (Opcional)</div>
                                    <textarea 
                                        value={reflection}
                                        onChange={(e) => setReflection(e.target.value)}
                                        placeholder={resultStatus === 'success' ? "Sensación de victoria..." : "¿Qué te lo impidió? (Se guardará aunque esté vacío)"} 
                                        className="w-full h-32 bg-[var(--card)] p-4 rounded-[24px] outline-none border border-[var(--border)] focus:border-[var(--text-main)] transition-colors serif-text text-sm resize-none shadow-sm mb-6"
                                    />
                                    <button onClick={handleFinish} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-auto">Registrar Resultado</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewState === 'completed' && (
                        <div className="flex flex-col items-center justify-center flex-1 w-full text-center animate-fade-in">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${resultStatus === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/20 text-rose-500'}`}>
                                <i className={`ph-fill ${resultStatus === 'success' ? 'ph-trophy' : 'ph-skull'} text-5xl`}></i>
                            </div>
                            <h3 className="serif text-3xl font-bold mb-2 text-[var(--text-main)]">{resultStatus === 'success' ? 'Victoria' : 'Lección'}</h3>
                            <p className="text-sm opacity-50 mb-8 max-w-xs">{resultStatus === 'success' ? 'Has fortalecido tu carácter.' : 'La intención cuenta. Inténtalo mañana.'}</p>
                            
                            <div className="flex gap-3">
                                <button onClick={handleShareChallenge} className="flex items-center gap-2 px-6 py-3 bg-[var(--highlight)] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors border border-[var(--border)]">
                                    <i className="ph-bold ph-share-network"></i> Compartir
                                </button>
                                <button onClick={() => setTab('library')} className="flex items-center gap-2 px-6 py-3 bg-[var(--card)] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[var(--highlight)] transition-colors border border-[var(--border)]">
                                    <i className="ph-bold ph-list-plus"></i> Otro Reto
                                </button>
                            </div>
                        </div>
                    )}
                    </>
                )}

                {tab === 'library' && (
                    <div className="w-full space-y-4 animate-fade-in">
                        <div className="text-center mb-6 opacity-60"><i className="ph-duotone ph-books text-4xl mb-2"></i><p className="text-xs">Selecciona un reto para realizarlo ahora.</p></div>
                        <div className="grid gap-3">
                            {tasks.length === 0 && <div className="text-center text-xs opacity-40 py-10">No hay retos.</div>}
                            {tasks.map((task, i) => (
                                <div key={i} onClick={() => handleSelectFromLibrary(task)} className="bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between group">
                                    <div><h4 className="serif font-bold text-base mb-1 group-hover:text-[var(--gold)] transition-colors">{task.title}</h4><p className="text-xs opacity-60 line-clamp-1">{task.description}</p></div>
                                    <div className="w-8 h-8 rounded-full bg-[var(--highlight)] flex items-center justify-center shrink-0 text-[var(--text-sub)] group-hover:bg-[var(--text-main)] group-hover:text-[var(--bg)] transition-colors"><i className="ph-bold ph-play"></i></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'training' && (
                    <div className="flex-1 w-full flex flex-col items-center justify-center animate-fade-in pb-10">
                        {gameScenario ? (
                            <div className="w-full max-w-sm flex flex-col items-center">
                                {/* Score Header */}
                                <div className="flex gap-6 mb-8 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-xs">{score}</span>
                                        <span>Puntos</span>
                                    </div>
                                    <div className="h-8 w-[1px] bg-[var(--border)]"></div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-xs text-[var(--gold)]">{streak}</span>
                                        <span>Racha</span>
                                    </div>
                                </div>

                                {/* Game Card */}
                                <div className="relative w-full h-72 mb-8 perspective-1000 group">
                                    <div className={`absolute inset-0 bg-[var(--card)] border rounded-[32px] shadow-xl flex flex-col items-center justify-center p-8 text-center transition-all duration-300 transform ${feedback === 'correct' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : feedback === 'wrong' ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-[var(--border)]'}`}>
                                        
                                        {/* Status Icon Overlay */}
                                        {feedback && (
                                            <div className="absolute top-[-20px] bg-[var(--bg)] rounded-full p-2 border shadow-sm animate-bounce-short">
                                                <i className={`ph-fill text-3xl ${feedback === 'correct' ? 'ph-check-circle text-emerald-500' : 'ph-x-circle text-rose-500'}`}></i>
                                            </div>
                                        )}

                                        <p className="text-[10px] uppercase font-bold tracking-[3px] opacity-40 mb-6 text-[var(--text-main)]">¿Está bajo tu control?</p>
                                        <h3 className="serif text-3xl font-bold leading-tight text-[var(--text-main)]">{gameScenario.text}</h3>
                                        
                                        <div className="mt-8 flex gap-2 justify-center opacity-20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button onClick={() => handleGameChoice('external')} className="py-5 rounded-[24px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 font-bold uppercase tracking-widest text-xs border border-rose-100 dark:border-rose-900/30 active:scale-95 transition-all hover:bg-rose-100 dark:hover:bg-rose-900/40 shadow-sm flex flex-col items-center gap-1 group">
                                        <i className="ph-bold ph-x text-2xl group-hover:scale-110 transition-transform"></i>
                                        <span>No</span>
                                    </button>
                                    <button onClick={() => handleGameChoice('internal')} className="py-5 rounded-[24px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-widest text-xs border border-emerald-100 dark:border-emerald-900/30 active:scale-95 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shadow-sm flex flex-col items-center gap-1 group">
                                        <i className="ph-bold ph-check text-2xl group-hover:scale-110 transition-transform"></i>
                                        <span>Sí</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-40 gap-4">
                                {safeDichotomies.length === 0 ? (
                                    <span className="serif text-sm italic">Genera contenido para practicar.</span>
                                ) : (
                                    <>
                                    <i className="ph-duotone ph-spinner animate-spin text-4xl"></i>
                                    <span className="serif text-sm italic">Preparando Dicotomías...</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="w-full flex flex-col h-full overflow-hidden">
                        {/* Fixed Height Header Row for Consistency */}
                        <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                            <div className="flex gap-2 items-center">
                                <button 
                                    onClick={() => setShowDateFilter(!showDateFilter)} 
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${showDateFilter || (filterStart || filterEnd) ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}
                                >
                                    <i className="ph-bold ph-calendar"></i>
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Registro de Batallas</span>
                            </div>
                        </div>

                        {/* Collapsible Date Filter */}
                        {showDateFilter && (
                            <div className="flex items-center gap-2 mb-4 animate-fade-in bg-[var(--card)] p-3 rounded-2xl border border-[var(--border)] shrink-0">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 block ml-1 mb-1">Desde</label>
                                    <input 
                                        type="date" 
                                        value={filterStart} 
                                        onChange={(e) => setFilterStart(e.target.value)} 
                                        className="w-full bg-[var(--highlight)] rounded-lg px-2 py-1.5 text-xs outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 block ml-1 mb-1">Hasta</label>
                                    <input 
                                        type="date" 
                                        value={filterEnd} 
                                        onChange={(e) => setFilterEnd(e.target.value)} 
                                        className="w-full bg-[var(--highlight)] rounded-lg px-2 py-1.5 text-xs outline-none"
                                    />
                                </div>
                                {(filterStart || filterEnd) && (
                                    <button onClick={() => { setFilterStart(""); setFilterEnd(""); }} className="h-full px-2 flex items-end pb-2 opacity-40 hover:opacity-100">
                                        <i className="ph-bold ph-x"></i>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-3">
                            {filteredHistory.length === 0 && <div className="flex flex-col items-center justify-center py-20 opacity-30"><i className="ph-duotone ph-clock-counter-clockwise text-4xl mb-3"></i><span className="serif text-sm italic">Sin registros.</span></div>}
                            {filteredHistory.map(([date, entry]: [string, any]) => {
                                const isExp = expandedHistory === date;
                                // Prefer explicit status, fallback to completed boolean
                                const isSuccess = entry.challenge_status === 'success' || (entry.challenge_completed === true && entry.challenge_status !== 'failed');
                                
                                // Prefer saved title, fallback to parse, fallback to seed
                                let title = entry.challenge_title;
                                let body = entry.challenge_response || "";
                                
                                let taskDescription = "";

                                if (!title) {
                                    const match = body.match(/^\[(.*?)\](?:\s+)?([\s\S]*)?$/);
                                    if (match) {
                                        title = match[1];
                                        body = match[2] || "";
                                    } else {
                                        const historicalTask = getSeededRandomItem(date, tasks, "task");
                                        title = historicalTask?.title || "Reto del Día";
                                        taskDescription = historicalTask?.description || "";
                                    }
                                }

                                // Try to find description in tasks list if we have a title and missing description
                                if (title && !taskDescription) {
                                    const foundTask = tasks.find(t => t.title === title);
                                    if (foundTask) taskDescription = foundTask.description;
                                }

                                // Clean body display
                                const displayBody = body.replace(/^\[.*?\]\s*/, '').trim();
                                const hasNote = displayBody && displayBody.length > 0;
                                const showExpand = hasNote || !!taskDescription;

                                return (
                                    <div key={date} onClick={() => showExpand && setExpandedHistory(isExp ? null : date)} className={`bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden transition-all active:scale-[0.99] group ${showExpand ? 'cursor-pointer hover:shadow-md' : ''}`}>
                                        <div className="flex items-center p-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 ${isSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'}`}>
                                                <i className={`ph-fill ${isSuccess ? 'ph-check' : 'ph-x'} text-xl`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="serif font-bold text-base truncate pr-2">{title}</h4>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 shrink-0">{new Date(date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${isSuccess ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>{isSuccess ? 'Completado' : 'Lección'}</span>
                                                    {hasNote && <i className="ph-fill ph-note text-xs opacity-40"></i>}
                                                </div>
                                            </div>
                                            {showExpand && <i className={`ph-bold ph-caret-down text-[var(--text-sub)] transition-transform duration-300 ${isExp ? 'rotate-180' : ''} opacity-30 group-hover:opacity-100 ml-2`}></i>}
                                        </div>
                                        
                                        <div className={`transition-all duration-300 ease-in-out bg-[var(--highlight)]/30 ${isExp ? 'max-h-60 py-4 px-4 border-t border-[var(--border)]' : 'max-h-0 py-0 px-4 overflow-hidden border-t-0'}`}>
                                            {taskDescription && (
                                                <p className="text-xs opacity-60 mb-3 leading-relaxed">{taskDescription}</p>
                                            )}
                                            {hasNote && (
                                                <div className="pl-3 border-l-2 border-[var(--text-main)]/20">
                                                    <p className="serif-text text-sm italic opacity-80 leading-relaxed">"{displayBody}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}