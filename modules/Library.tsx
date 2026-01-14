
import React, { useState, useMemo } from 'react';
import { Reading, SharedItem, PhilosophySchool, PhilosopherBio } from '../types';
import { expandReadingAI } from '../services/geminiService';

const ReadingCard: React.FC<{ r: Reading, toggleSave: (r: Reading) => void, isSaved: boolean, onShare?: (item: SharedItem) => void }> = ({ r, toggleSave, isSaved, onShare }) => {
    const [expandedContent, setExpandedContent] = useState<string | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);
    const [showContext, setShowContext] = useState(false);

    const isLong = r.b.length > 150;

    const handleExpandAI = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (expandedContent) {
            setExpandedContent(null);
            return;
        }
        setIsExpanding(true);
        const explanation = await expandReadingAI(r.t, r.q, r.a || "Filósofo");
        if (explanation) setExpandedContent(explanation);
        setIsExpanding(false);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(onShare) {
            onShare({
                type: 'reading',
                title: r.t,
                subtitle: r.a,
                content: r.q,
                extra: r.philosophy,
                data: r
            });
        }
    }

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`"${r.q}" — ${r.a}`);
    }

    return (
        <div className="bg-[var(--card)] p-5 sm:p-6 rounded-[28px] shadow-sm border border-[var(--border)] relative group transition-all hover:shadow-md animate-fade-in flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 bg-[var(--highlight)] px-2 py-1 rounded-full border border-[var(--border)]">{r.philosophy || 'Sabiduría'}</span>
                    {r.k && r.k.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[9px] font-bold uppercase tracking-widest opacity-40 border border-[var(--border)] px-2 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleCopy} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors" title="Copiar">
                        <i className="ph-bold ph-copy"></i>
                    </button>
                    <button onClick={handleShare} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors" title="Compartir">
                        <i className="ph-bold ph-share-network"></i>
                    </button>
                </div>
            </div>
            
            <h4 className="serif font-bold text-lg mb-3 leading-tight text-[var(--text-main)]">{r.t}</h4>
            
            <div className="pl-4 border-l-2 border-[var(--gold)]/50 mb-4">
                <p className="serif text-sm sm:text-lg leading-relaxed text-[var(--text-main)] opacity-90">"{r.q}"</p>
            </div>
            
            {/* Original Context Toggle */}
            <div className={`relative transition-all duration-500 ease-in-out overflow-hidden ${showContext ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                <p className="serif-text text-xs sm:text-sm opacity-80 leading-loose pt-2">{r.b}</p>
            </div>

            {/* AI Expansion Area */}
            {expandedContent && (
                <div className="bg-[var(--highlight)]/30 p-4 rounded-xl border border-[var(--border)] mb-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                        <i className="ph-fill ph-sparkle text-xs"></i>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Profundización</span>
                    </div>
                    <p className="serif-text text-sm leading-relaxed opacity-90 whitespace-pre-wrap">{expandedContent}</p>
                </div>
            )}

            <div className="flex justify-between items-center mt-auto pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <i className="ph-fill ph-pen-nib text-xs opacity-40"></i>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{r.a}</span>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleExpandAI}
                        disabled={isExpanding}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1 ${expandedContent ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}
                    >
                        {isExpanding ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-bold ph-sparkle"></i>}
                        {expandedContent ? 'Cerrar IA' : 'Profundizar'}
                    </button>

                    {isLong && (
                        <button onClick={() => setShowContext(!showContext)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--highlight)] text-[var(--text-sub)] transition-colors">
                            <i className={`ph-bold ${showContext ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
                        </button>
                    )}
                    
                    <button onClick={(e) => {e.stopPropagation(); toggleSave(r);}} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${isSaved ? 'text-[var(--gold)] bg-[var(--gold)]/10' : 'text-[var(--text-sub)] hover:text-[var(--gold)]'}`}>
                        <i className={`ph-${isSaved?'fill':'bold'} ph-bookmark-simple`}></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export function LibraryModule({ user, readings, savedReadings, toggleSave, onBack, onShare, schools, philosophers }: {
    user: any, 
    readings: Reading[], 
    savedReadings: Reading[], 
    toggleSave: (r: Reading) => void, 
    onBack: () => void, 
    onShare: any,
    schools: PhilosophySchool[],
    philosophers: PhilosopherBio[]
}) {
    const [sub, setSub] = useState<'explore' | 'saved'>('explore');
    const [filterMode, setFilterMode] = useState<'school' | 'topic'>('school');
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("Todos");
    
    // Serendipity Modal State
    const [showRandomModal, setShowRandomModal] = useState(false);
    const [randomQuote, setRandomQuote] = useState<Reading | null>(null);
    
    // Derived Lists
    const activeList = sub === 'explore' ? readings : savedReadings;

    // Use actual school names for the filter list if available
    const uniqueSchools = useMemo(() => {
        if (schools && schools.length > 0) {
            return ["Todos", ...schools.map(s => s.name).sort()];
        }
        // Fallback to extraction if no schools prop
        return ["Todos", ...Array.from(new Set([...readings].map((r: Reading) => r.philosophy || 'Universal'))).sort()];
    }, [readings, schools]);
    
    const uniqueTopics = useMemo(() => {
        const tags = new Set<string>();
        readings.forEach((r: Reading) => {
            if(r.k) r.k.forEach(k => tags.add(k));
        });
        return ["Todos", ...Array.from(tags).sort()];
    }, [readings]);

    const filteredList = useMemo(() => {
        return activeList.filter((r: Reading) => {
            const matchSearch = searchTerm === "" || 
                r.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                r.t.toLowerCase().includes(searchTerm.toLowerCase()) || 
                r.a?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.b?.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchFilter = true;
            if (activeFilter !== "Todos") {
                if (filterMode === 'school') {
                    // Check strict philosophy match OR author's school match
                    const authorSchool = r.a ? philosophers.find(p => p.name === r.a)?.school : null;
                    
                    matchFilter = r.philosophy === activeFilter || 
                                  (!!authorSchool && authorSchool === activeFilter) || 
                                  (!r.philosophy && !authorSchool && activeFilter === 'Universal');
                } else {
                    matchFilter = r.k ? r.k.includes(activeFilter) : false;
                }
            }
            
            return matchSearch && matchFilter;
        });
    }, [activeList, searchTerm, activeFilter, filterMode, philosophers]);

    const handleRandom = () => {
        if (activeList.length === 0) return;
        const random = activeList[Math.floor(Math.random() * activeList.length)];
        setRandomQuote(random);
        setShowRandomModal(true);
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setActiveFilter("Todos");
    };

    const hasActiveFilters = searchTerm !== "" || activeFilter !== "Todos";

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
            {/* Header Sticky */}
            <div className="w-full max-w-2xl sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] transition-all">
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                        <h2 className="serif text-2xl font-bold">Biblioteca</h2>
                    </div>
                    <button onClick={handleRandom} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] text-[var(--text-sub)] hover:text-purple-500 transition-colors shadow-sm active:scale-90" title="Serendipia">
                        <i className="ph-bold ph-dice-five text-lg"></i>
                    </button>
                </div>
                
                {/* Toggle Row */}
                <div className="px-6 pb-4">
                    <div className="flex bg-[var(--card)] p-1 rounded-xl border border-[var(--border)] w-full">
                        <button onClick={() => setSub('explore')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${sub==='explore' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)]'}`}>Todo</button>
                        <button onClick={() => setSub('saved')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${sub==='saved' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)]'}`}>Archivo</button>
                    </div>
                </div>
            </div>
            
            {/* Controls */}
            <div className="w-full max-w-2xl px-6 mb-2 pt-4 space-y-4">
                
                {/* Search Bar + Reset (Responsive Row) */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <i className="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 opacity-30"></i>
                        <input 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Buscar en sabiduría..." 
                            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl py-3 pl-10 pr-4 outline-none font-serif text-sm focus:border-[var(--text-main)] transition-colors placeholder:opacity-40 shadow-sm"
                        />
                        {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"><i className="ph-bold ph-x"></i></button>}
                    </div>
                    {hasActiveFilters && (
                        <button onClick={handleResetFilters} className="w-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-900/30 dark:border-rose-900 dark:text-rose-400 flex items-center justify-center shrink-0 active:scale-95 transition-all">
                            <i className="ph-bold ph-arrow-counter-clockwise"></i>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {/* Filter Mode Toggle */}
                    <div className="flex bg-[var(--highlight)] p-1 rounded-xl shrink-0">
                        <button onClick={() => { setFilterMode('school'); setActiveFilter('Todos'); }} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${filterMode==='school'?'bg-[var(--card)] shadow-sm text-[var(--text-main)]':'text-[var(--text-sub)] opacity-60'}`}>Escuelas</button>
                        <button onClick={() => { setFilterMode('topic'); setActiveFilter('Todos'); }} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${filterMode==='topic'?'bg-[var(--card)] shadow-sm text-[var(--text-main)]':'text-[var(--text-sub)] opacity-60'}`}>Temas</button>
                    </div>

                    {/* Dynamic Filter Chips */}
                    {(filterMode === 'school' ? uniqueSchools : uniqueTopics).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setActiveFilter(f)} 
                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === f ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] text-[var(--text-sub)] border-[var(--border)]'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-2">
                <div className="space-y-4">
                    {filteredList.length === 0 && (
                        <div className="text-center opacity-30 py-20 font-serif italic flex flex-col items-center">
                            <i className="ph-duotone ph-books text-4xl mb-3"></i>
                            {searchTerm ? "No hay coincidencias." : sub === 'saved' ? "Tu archivo está vacío." : "Nada por aquí."}
                        </div>
                    )}
                    
                    {filteredList.map((r: Reading, i: number) => (
                        <ReadingCard 
                            key={`${r.t}-${i}`} 
                            r={r} 
                            toggleSave={toggleSave} 
                            isSaved={sub === 'saved' || savedReadings.some((sv:Reading) => sv.q === r.q)} 
                            onShare={onShare}
                        />
                    ))}
                </div>
            </div>

            {/* SERENDIPITY MODAL */}
            {showRandomModal && randomQuote && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowRandomModal(false)}>
                    <div className="bg-[var(--card)] w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative border border-[var(--border)] flex flex-col items-center text-center animate-slide-up" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowRandomModal(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)]"><i className="ph-bold ph-x text-xl"></i></button>
                        
                        <div className="mb-6 opacity-30">
                            <i className="ph-fill ph-dice-five text-6xl"></i>
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 bg-[var(--highlight)] px-3 py-1 rounded-full mb-6">
                            {randomQuote.philosophy || 'Destino'}
                        </span>

                        <h3 className="serif text-3xl font-bold mb-6 text-[var(--text-main)] leading-tight">{randomQuote.t}</h3>
                        
                        <div className="relative mb-8">
                            <i className="ph-fill ph-quotes text-4xl text-[var(--gold)] absolute -top-4 -left-4 opacity-20"></i>
                            <p className="serif-text text-xl opacity-90 leading-relaxed px-4">"{randomQuote.q}"</p>
                        </div>

                        <div className="flex items-center gap-2 opacity-60 mb-8">
                            <i className="ph-fill ph-pen-nib"></i>
                            <span className="text-xs font-bold uppercase tracking-widest">{randomQuote.a}</span>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button onClick={() => { handleRandom(); }} className="flex-1 py-4 bg-[var(--highlight)] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors">
                                Otra
                            </button>
                            <button onClick={() => { toggleSave(randomQuote); setShowRandomModal(false); }} className="flex-1 py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-colors">
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}