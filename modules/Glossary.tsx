
import React, { useState, useMemo, useEffect } from 'react';
import { GlossaryTerm } from '../types';
import { definePhilosophicalTerm } from '../services/geminiService';

// --- SUB-COMPONENT: STUDY CARD ---
const StudyCard = ({ term, isFlipped, onFlip, onSpeak }: { term: GlossaryTerm, isFlipped: boolean, onFlip: () => void, onSpeak: (e: React.MouseEvent) => void }) => {
    return (
        <div 
            className="relative w-full aspect-[3/4] cursor-pointer group" 
            style={{ perspective: '1000px' }}
            onClick={onFlip}
        >
            <div 
                className="relative w-full h-full transition-transform duration-500 ease-out shadow-xl rounded-[32px]"
                style={{ 
                    transformStyle: 'preserve-3d', 
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                }}
            >
                {/* FRONT */}
                <div 
                    className="absolute inset-0 bg-[var(--card)] border border-[var(--border)] rounded-[32px] flex flex-col items-center justify-center p-8 text-center"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="absolute top-6 right-6 z-20">
                        <button 
                            onClick={onSpeak} 
                            className="w-10 h-10 rounded-full bg-[var(--highlight)] flex items-center justify-center text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors active:scale-90"
                        >
                            <i className="ph-fill ph-speaker-high"></i>
                        </button>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-[var(--highlight)] text-[10px] font-bold uppercase tracking-widest mb-8 opacity-60 border border-[var(--border)]">
                        {term.origin}
                    </span>
                    
                    <h3 className="serif text-3xl sm:text-4xl font-bold text-[var(--text-main)] leading-tight mb-2">
                        {term.term}
                    </h3>
                    
                    <div className="mt-12 flex flex-col items-center gap-2 opacity-30 animate-pulse">
                        <i className="ph-bold ph-hand-tap text-2xl"></i>
                        <span className="text-[9px] uppercase font-bold tracking-widest">Ver significado</span>
                    </div>
                </div>

                {/* BACK */}
                <div 
                    className="absolute inset-0 bg-[var(--text-main)] text-[var(--bg)] rounded-[32px] flex flex-col items-center justify-center p-8 text-center border border-[var(--text-main)]"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="overflow-y-auto no-scrollbar max-h-full flex flex-col items-center justify-center w-full">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4 border-b border-[var(--bg)]/20 pb-2 w-full max-w-[100px]">{term.term}</h4>
                        <p className="serif-text text-lg leading-relaxed font-medium mb-8 opacity-95">
                            {term.definition}
                        </p>
                        <div className="bg-[var(--bg)]/10 p-4 rounded-xl w-full">
                            <p className="text-sm italic opacity-80">"{term.example}"</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: FLASHCARD SESSION ---
const StudySession = ({ terms, onExit }: { terms: GlossaryTerm[], onExit: () => void }) => {
    const [queue, setQueue] = useState<GlossaryTerm[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Session State
    const [stats, setStats] = useState({ learned: 0, review: 0 });
    const [reviewList, setReviewList] = useState<GlossaryTerm[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    
    // Animation State
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

    // Init Session
    useEffect(() => {
        startSession(terms);
    }, [terms]);

    const startSession = (pool: GlossaryTerm[]) => {
        // Shuffle and pick 15
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 15);
        setQueue(shuffled);
        setCurrentIndex(0);
        setIsFinished(false);
        setStats({ learned: 0, review: 0 });
        setReviewList([]);
        setSlideDirection(null);
        setIsFlipped(false);
    };

    const restartWithMistakes = () => {
        if (reviewList.length === 0) return;
        setQueue([...reviewList].sort(() => Math.random() - 0.5));
        setCurrentIndex(0);
        setIsFinished(false);
        setStats({ learned: 0, review: 0 }); // Reset stats for new round
        setReviewList([]); // Clear review list for next pass
        setSlideDirection(null);
        setIsFlipped(false);
    }

    const currentCard = queue[currentIndex];
    const progress = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0;

    const handleNext = (known: boolean) => {
        // 1. Trigger Animation
        setSlideDirection(known ? 'right' : 'left');

        // 2. Logic
        setStats(prev => ({ 
            learned: known ? prev.learned + 1 : prev.learned, 
            review: !known ? prev.review + 1 : prev.review 
        }));

        if (!known) {
            setReviewList(prev => [...prev, currentCard]);
        }

        // 3. Wait for animation then advance
        setTimeout(() => {
            setIsFlipped(false);
            setSlideDirection(null); 
            
            if (currentIndex + 1 >= queue.length) {
                setIsFinished(true);
            } else {
                setCurrentIndex(prev => prev + 1);
            }
        }, 300);
    };

    const handleSpeak = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'es-ES';
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        }
    };

    if (queue.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 opacity-50 gap-4">
            <i className="ph-duotone ph-spinner animate-spin text-2xl"></i>
            <span className="text-xs font-bold uppercase tracking-widest">Preparando mazo...</span>
        </div>
    );

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-sm mx-auto p-6 animate-fade-in text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--highlight)] flex items-center justify-center mb-6 shadow-sm relative">
                    <i className="ph-fill ph-check-circle text-4xl text-emerald-500"></i>
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping-slow"></div>
                </div>
                
                <h3 className="serif text-3xl font-bold mb-2">Sesión Completada</h3>
                <p className="text-sm opacity-60 mb-8">Has repasado {queue.length} conceptos.</p>
                
                <div className="flex gap-4 w-full mb-8">
                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                        <span className="block text-2xl font-bold text-emerald-600">{stats.learned}</span>
                        <span className="text-[9px] uppercase font-bold opacity-60 text-emerald-800 dark:text-emerald-200">Dominados</span>
                    </div>
                    <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                        <span className="block text-2xl font-bold text-amber-600">{stats.review}</span>
                        <span className="text-[9px] uppercase font-bold opacity-60 text-amber-800 dark:text-amber-200">A Repasar</span>
                    </div>
                </div>

                <div className="space-y-3 w-full">
                    {stats.review > 0 && (
                        <button onClick={restartWithMistakes} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            <i className="ph-bold ph-arrows-clockwise"></i> Repasar Errores ({reviewList.length})
                        </button>
                    )}
                    <button onClick={() => startSession(terms)} className="w-full py-4 bg-[var(--card)] border border-[var(--border)] text-[var(--text-main)] rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[var(--highlight)] transition-colors">
                        Estudiar Nuevas
                    </button>
                    <button onClick={onExit} className="w-full py-4 text-[var(--text-sub)] font-bold uppercase tracking-widest text-xs hover:text-[var(--text-main)]">
                        Volver al Índice
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-between h-full w-full max-w-sm mx-auto py-4 px-6 relative overflow-hidden">
            {/* Header & Progress */}
            <div className="w-full flex flex-col gap-2 mb-6">
                <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Progreso</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{currentIndex + 1} / {queue.length}</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--highlight)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--gold)] transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Card Area */}
            <div className="relative w-full aspect-[3/4] flex items-center justify-center">
                {/* Background Stack Illusion */}
                {currentIndex < queue.length - 1 && (
                    <div className="absolute inset-0 bg-[var(--card)] border border-[var(--border)] rounded-[32px] scale-95 translate-y-3 opacity-50 shadow-sm z-0"></div>
                )}
                {currentIndex < queue.length - 2 && (
                    <div className="absolute inset-0 bg-[var(--card)] border border-[var(--border)] rounded-[32px] scale-90 translate-y-6 opacity-30 z-[-1]"></div>
                )}

                {/* Main Card Wrapper for Slide Animation */}
                <div 
                    className="w-full h-full z-10 transition-all duration-300 ease-in-out"
                    style={{
                        transform: slideDirection === 'left' ? 'translateX(-120%) rotate(-10deg)' : 
                                   slideDirection === 'right' ? 'translateX(120%) rotate(10deg)' : 'translateX(0) rotate(0)',
                        opacity: slideDirection ? 0 : 1
                    }}
                >
                    <StudyCard 
                        term={currentCard} 
                        isFlipped={isFlipped} 
                        onFlip={() => setIsFlipped(!isFlipped)} 
                        onSpeak={(e) => handleSpeak(e, currentCard.term)} 
                    />
                </div>
            </div>

            {/* Controls */}
            <div className={`w-full grid grid-cols-2 gap-4 mt-8 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button onClick={() => handleNext(false)} className="py-4 rounded-2xl bg-rose-50 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30 text-rose-600 font-bold text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2">
                    <i className="ph-bold ph-x"></i> Repasar
                </button>
                <button onClick={() => handleNext(true)} className="py-4 rounded-2xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30 text-emerald-600 font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2">
                    <i className="ph-bold ph-check"></i> Lo Sabía
                </button>
            </div>
        </div>
    );
};

export function GlossaryModule({ onBack, terms, onNavigateToSchool, onNavigateToPhilosopher }: { 
    onBack: () => void, 
    terms: GlossaryTerm[], 
    onNavigateToSchool: (schoolName: string) => void,
    onNavigateToPhilosopher: (authorName: string) => void
}) {
    const [view, setView] = useState<'lexicon' | 'practice'>('lexicon');
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOrigin, setFilterOrigin] = useState("Todos");
    
    // AI State
    const [aiDefinition, setAiDefinition] = useState<GlossaryTerm | null>(null);
    const [isDefining, setIsDefining] = useState(false);

    const uniqueOrigins = useMemo(() => ["Todos", ...Array.from(new Set(terms.map(t => t.origin))).sort()], [terms]);

    const filteredTerms = terms.filter(t => {
        const matchSearch = t.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchOrigin = filterOrigin === "Todos" || t.origin === filterOrigin;
        return matchSearch && matchOrigin;
    });

    const handleRelatedClick = (type: 'school' | 'author', value: string) => {
        if(type === 'school') onNavigateToSchool(value);
        if(type === 'author') onNavigateToPhilosopher(value);
    }

    const handleDefineWithAI = async () => {
        if (!searchTerm.trim()) return;
        setIsDefining(true);
        const result = await definePhilosophicalTerm(searchTerm);
        if (result) setAiDefinition(result);
        setIsDefining(false);
    }

    const handleResetFilters = () => {
        setSearchTerm("");
        setFilterOrigin("Todos");
        setAiDefinition(null);
    }

    const hasActiveFilters = searchTerm !== "" || filterOrigin !== "Todos";

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
             <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 z-20 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <h2 className="serif text-2xl font-bold">Léxico</h2>
                </div>
                <div className="flex bg-[var(--card)] p-1 rounded-full border border-[var(--border)]">
                    <button onClick={() => setView('lexicon')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view==='lexicon' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)]'}`}>Lista</button>
                    <button onClick={() => setView('practice')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view==='practice' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)]'}`}>Estudio</button>
                </div>
            </div>

            {view === 'lexicon' ? (
                <>
                    <div className="w-full max-w-2xl px-6 py-4 space-y-4">
                        <div className="flex gap-2">
                            <div className="bg-[var(--card)] p-3 rounded-2xl flex items-center gap-3 border border-[var(--border)] shadow-sm focus-within:border-[var(--text-main)] transition-colors flex-1">
                                <i className="ph-bold ph-magnifying-glass opacity-40 ml-1"></i>
                                <input 
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setAiDefinition(null); }}
                                    placeholder="Buscar concepto..." 
                                    className="bg-transparent outline-none w-full text-sm font-serif"
                                />
                                {searchTerm && <button onClick={() => { setSearchTerm(""); setAiDefinition(null); }}><i className="ph-bold ph-x opacity-40 hover:opacity-100"></i></button>}
                            </div>
                            
                            {hasActiveFilters && (
                                <button onClick={handleResetFilters} className="w-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-900/30 dark:border-rose-900 dark:text-rose-400 flex items-center justify-center shrink-0 active:scale-95 transition-all">
                                    <i className="ph-bold ph-arrow-counter-clockwise"></i>
                                </button>
                            )}
                        </div>

                        {/* Origin Filter Chips */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {uniqueOrigins.map(origin => (
                                <button 
                                    key={origin} 
                                    onClick={() => setFilterOrigin(origin)} 
                                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${filterOrigin === origin ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--highlight)] text-[var(--text-sub)] border-transparent'}`}
                                >
                                    {origin}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-2">
                        <div className="mb-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">
                            {filteredTerms.length} Términos
                        </div>

                        <div className="grid gap-4">
                            {/* Local Results */}
                            {filteredTerms.map((item, i) => (
                                <div key={i} className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <h3 className="serif font-bold text-xl text-[var(--text-main)]">{item.term}</h3>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 bg-[var(--highlight)] px-2 py-1 rounded-full border border-[var(--border)]">{item.origin}</span>
                                    </div>
                                    <p className="serif-text text-sm opacity-80 leading-relaxed mb-4 relative z-10">{item.definition}</p>
                                    <div className="pl-3 border-l-2 border-[var(--gold)]/30 mb-4 relative z-10">
                                        <p className="text-xs italic opacity-60">"{item.example}"</p>
                                    </div>
                                    
                                    {/* Connections */}
                                    {(item.related_school || item.related_author) && (
                                        <div className="flex gap-2 pt-3 border-t border-[var(--border)] relative z-10">
                                            {item.related_school && (
                                                <button 
                                                    onClick={() => handleRelatedClick('school', item.related_school!)}
                                                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--highlight)] flex items-center gap-1 transition-colors"
                                                >
                                                    <i className="ph-bold ph-columns text-[var(--gold)]"></i> {item.related_school}
                                                </button>
                                            )}
                                            {item.related_author && (
                                                <button 
                                                    onClick={() => handleRelatedClick('author', item.related_author!)}
                                                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--highlight)] flex items-center gap-1 transition-colors"
                                                >
                                                    <i className="ph-bold ph-student text-[var(--gold)]"></i> {item.related_author}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* AI Generated Result */}
                            {aiDefinition && (
                                <div className="bg-[#FAF5FF] dark:bg-[#1E1024] p-6 rounded-[24px] border border-purple-200 dark:border-purple-800 shadow-sm animate-fade-in relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><i className="ph-fill ph-sparkle text-6xl text-purple-500"></i></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <h3 className="serif font-bold text-xl text-purple-900 dark:text-purple-100">{aiDefinition.term}</h3>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300">{aiDefinition.origin}</span>
                                    </div>
                                    <p className="serif-text text-sm opacity-90 leading-relaxed mb-3 text-purple-800 dark:text-purple-200 relative z-10">{aiDefinition.definition}</p>
                                    <div className="pl-3 border-l-2 border-purple-400/50 mb-3 relative z-10">
                                        <p className="text-xs italic opacity-70 text-purple-800 dark:text-purple-300">"{aiDefinition.example}"</p>
                                    </div>
                                    <div className="flex gap-2 mt-2 relative z-10">
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                            <i className="ph-fill ph-sparkle"></i> Oráculo Digital
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {filteredTerms.length === 0 && !aiDefinition && searchTerm && (
                            <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
                                <i className="ph-duotone ph-book-open-text text-4xl mb-3 opacity-30"></i>
                                <p className="text-sm opacity-50 mb-6 italic font-serif">El término no está en el archivo.</p>
                                <button 
                                    onClick={handleDefineWithAI}
                                    disabled={isDefining}
                                    className="flex items-center gap-2 px-6 py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    {isDefining ? <><i className="ph-duotone ph-spinner animate-spin"></i> Consultando...</> : <><i className="ph-bold ph-sparkle"></i> Consultar al Oráculo</>}
                                </button>
                            </div>
                        )}
                        
                        {filteredTerms.length === 0 && !searchTerm && (
                            <div className="text-center py-20 opacity-30 italic font-serif">
                                {terms.length === 0 ? "Cargando conocimiento..." : "Explora el léxico."}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 w-full max-w-2xl flex items-center justify-center pb-20 animate-fade-in">
                    <StudySession terms={terms} onExit={() => setView('lexicon')} />
                </div>
            )}
        </div>
    );
}
