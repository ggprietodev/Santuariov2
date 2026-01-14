
import React, { useState } from 'react';
import { PhilosophySchool, PhilosopherBio, Work, Reading, GlossaryTerm } from '../types';
import { generateDeepDive, generateSchoolSchematic, definePhilosophicalTerm } from '../services/geminiService';
import { fetchGlossaryTerm } from '../services/supabase';

export function SchoolsModule({ onBack, schools, philosophers, works, toggleSave, savedReadings, readings, onNavigateToPhilosopher }: { 
    onBack: () => void, 
    schools: PhilosophySchool[], 
    philosophers: PhilosopherBio[], 
    works: Work[],
    toggleSave: (r: Reading) => void,
    savedReadings: Reading[],
    readings: Reading[],
    onNavigateToPhilosopher: (id: string) => void
}) {
    const [selectedSchool, setSelectedSchool] = useState<PhilosophySchool | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Quote Archive State
    const [quoteSearchTerm, setQuoteSearchTerm] = useState(""); 
    const [quoteTypeFilter, setQuoteTypeFilter] = useState("all");

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<Reading | null>(null);
    // NEW: State for Schematic
    const [schematicContent, setSchematicContent] = useState<{origin: string, dogmas: string[], practices: string[], legacy: string} | null>(null);
    
    const [viewQuotes, setViewQuotes] = useState(false);

    // Glossary State
    const [glossaryItem, setGlossaryItem] = useState<GlossaryTerm | null>(null);
    const [loadingGlossary, setLoadingGlossary] = useState(false);
    const [loadingSource, setLoadingSource] = useState<'db'|'ai'>('db');
    const [showGlossaryModal, setShowGlossaryModal] = useState(false);
    const [searchedTerm, setSearchedTerm] = useState("");

    const filteredSchools = schools.filter(s => {
        const term = searchTerm.toLowerCase();
        // Match School Name or Principle
        const matchSchool = s.name.toLowerCase().includes(term) || s.core_principle.toLowerCase().includes(term);
        // Match Associated Philosophers
        const matchPhilosopher = philosophers.some(p => p.school === s.name && p.name.toLowerCase().includes(term));
        
        return matchSchool || matchPhilosopher;
    });

    const getPhilosophersForSchool = (schoolName: string) => {
        return philosophers.filter(p => p.school.toLowerCase().includes(schoolName.toLowerCase()) || schoolName.toLowerCase().includes(p.school.toLowerCase()));
    }

    const getWorksForSchool = (schoolName: string) => {
        const schoolPhilosopherIds = philosophers.filter(p => p.school.toLowerCase().includes(schoolName.toLowerCase())).map(p => p.id);
        
        return works.filter(w => {
            if (w.philosopher_id && schoolPhilosopherIds.includes(w.philosopher_id)) return true;
            return philosophers.some(p => p.school.toLowerCase() === schoolName.toLowerCase() && w.author.toLowerCase() === p.name.toLowerCase());
        });
    }

    const getQuotesForSchool = (schoolName: string) => {
        let qs = readings.filter(r => r.philosophy === schoolName || (r.k && r.k.includes(schoolName)));
        
        // Text Filter
        if (quoteSearchTerm) {
            const term = quoteSearchTerm.toLowerCase();
            qs = qs.filter(q => q.q.toLowerCase().includes(term) || q.t.toLowerCase().includes(term) || (q.a && q.a.toLowerCase().includes(term)));
        }
        
        // Type Filter
        if (quoteTypeFilter !== 'all') {
            qs = qs.filter(q => {
                const type = q.type || (q.q.length < 100 ? 'cita' : 'reflexion');
                return type === quoteTypeFilter;
            });
        }

        return qs;
    }

    const handleDeepDive = async () => {
        if(!selectedSchool) return;
        setIsGenerating(true);
        const content = await generateDeepDive('Escuela Filosófica', selectedSchool.name, selectedSchool.description);
        if(content) setGeneratedContent(content);
        setIsGenerating(false);
    }

    const handleSchematic = async () => {
        if(!selectedSchool) return;
        setIsGenerating(true);
        const content = await generateSchoolSchematic(selectedSchool.name, selectedSchool.description);
        if(content) setSchematicContent(content);
        setIsGenerating(false);
    }

    const handleTermClick = async (term: string) => {
        setSearchedTerm(term);
        setGlossaryItem(null); 
        setLoadingGlossary(true);
        setLoadingSource('db');
        setShowGlossaryModal(true); 

        try {
            // 1. Try DB
            const data = await fetchGlossaryTerm(term);
            
            if (data) {
                setGlossaryItem(data);
                setLoadingGlossary(false);
            } else {
                // 2. Force AI if DB miss
                setLoadingSource('ai');
                const aiData = await definePhilosophicalTerm(term);
                
                if (aiData) {
                    setGlossaryItem(aiData);
                }
                setLoadingGlossary(false);
            }
        } catch (e) {
            console.error("Glossary Error, falling back to AI", e);
            setLoadingSource('ai');
            const aiData = await definePhilosophicalTerm(term);
            if(aiData) setGlossaryItem(aiData);
            setLoadingGlossary(false);
        }
    };

    // NEW: Handle missing school lookup via AI
    const handleAiLookup = async () => {
        if (!searchTerm) return;
        handleTermClick(searchTerm);
    }

    const handleResetFilters = () => {
        setSearchTerm("");
    };

    const hasActiveFilters = searchTerm !== "";

    const isSaved = (content: Reading) => savedReadings.some((r: Reading) => r.t === content.t);

    const closeModal = () => {
        setSelectedSchool(null);
        setGeneratedContent(null);
        setSchematicContent(null);
        setViewQuotes(false);
        setQuoteSearchTerm("");
        setQuoteTypeFilter("all");
    }

    const resetQuoteFilters = () => {
        setQuoteSearchTerm("");
        setQuoteTypeFilter("all");
    }

    // ROBUST ICON RENDERER
    const renderIcon = (iconStr: string, weight: 'duotone' | 'fill' | 'bold' = 'duotone') => {
        if (!iconStr) return <i className={`ph-${weight} ph-columns`}></i>;
        
        let clean = iconStr.trim().replace(/^ph-/, '').replace(/^ph /, '').replace(/^Ph/, ''); 
        clean = clean.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

        const map: Record<string, string> = {
            'flower-lotus': 'lotus',
            'mountain': 'mountains',
            'balance': 'scales',
            'temple': 'bank', 
            'lazi': 'wind',
            'confucius': 'scroll',
            'buda': 'lotus'
        };
        
        if (map[clean]) clean = map[clean];

        return <i className={`ph-${weight} ph-${clean}`}></i>;
    };

    if (selectedSchool) {
        if(viewQuotes) {
            const schoolQuotes = getQuotesForSchool(selectedSchool.name);
            const hasActiveQuoteFilters = quoteSearchTerm !== "" || quoteTypeFilter !== "all";

            return (
                <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)]">
                    <div className="w-full max-w-2xl mx-auto flex items-center justify-between px-6 py-4">
                        <button onClick={() => setViewQuotes(false)} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Archivo de Citas</div>
                        <div className="w-10"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 pb-20 max-w-2xl mx-auto w-full no-scrollbar pt-2">
                        <div className="text-center mb-6">
                            <h2 className="serif text-2xl font-bold mb-1">{selectedSchool.name}</h2>
                            <p className="text-xs opacity-50">{schoolQuotes.length} Resultados</p>
                        </div>

                        {/* FILTERS BAR */}
                        <div className="flex gap-2 mb-6 bg-[var(--card)] p-2 rounded-[20px] border border-[var(--border)] shadow-sm">
                            <div className="flex-1 flex items-center gap-2 px-3">
                                <i className="ph-bold ph-magnifying-glass opacity-30"></i>
                                <input 
                                    value={quoteSearchTerm} 
                                    onChange={(e) => setQuoteSearchTerm(e.target.value)} 
                                    placeholder="Buscar en archivo..." 
                                    className="bg-transparent w-full text-sm outline-none font-serif placeholder:font-sans placeholder:opacity-30" 
                                />
                                {quoteSearchTerm && <button onClick={() => setQuoteSearchTerm("")}><i className="ph-bold ph-x opacity-40 hover:opacity-100"></i></button>}
                            </div>
                            <div className="flex items-center relative border-l border-[var(--border)] pl-2">
                                <select 
                                    value={quoteTypeFilter}
                                    onChange={(e) => setQuoteTypeFilter(e.target.value)}
                                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none appearance-none pr-6 cursor-pointer text-right min-w-[70px] py-2"
                                >
                                    <option value="all">Todo</option>
                                    <option value="cita">Citas</option>
                                    <option value="reflexion">Reflexión</option>
                                    <option value="ejercicio">Ejercicio</option>
                                    <option value="parabola">Parábola</option>
                                </select>
                                <i className="ph-bold ph-caret-down opacity-50 text-xs absolute right-2 pointer-events-none"></i>
                            </div>
                        </div>
                        
                        {hasActiveQuoteFilters && (
                            <div className="flex justify-end mb-4">
                                <button onClick={resetQuoteFilters} className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] flex items-center gap-1 hover:opacity-80">
                                    <i className="ph-bold ph-arrow-counter-clockwise"></i> Resetear Filtros
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {schoolQuotes.length === 0 && (
                                <div className="text-center py-20 opacity-30 italic font-serif">
                                    <p>No se encontraron registros con estos criterios.</p>
                                </div>
                            )}
                            {schoolQuotes.map((r, i) => (
                                <div key={i} className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm animate-fade-in">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[9px] font-bold uppercase tracking-widest border border-[var(--border)] px-2 py-1 rounded-full">{r.type || 'Cita'}</span>
                                        <button onClick={() => toggleSave(r)} className={`text-xl transition-all active:scale-90 ${isSaved(r) ? 'text-[var(--gold)]' : 'text-[var(--text-sub)] hover:text-[var(--gold)] opacity-40 hover:opacity-100'}`}>
                                            <i className={`ph-${isSaved(r) ? 'fill' : 'bold'} ph-bookmark-simple`}></i>
                                        </button>
                                    </div>
                                    <p className="serif text-lg leading-relaxed mb-3 text-[var(--text-main)]">"{r.q}"</p>
                                    <div className="flex items-center gap-2 opacity-40">
                                        <i className="ph-bold ph-pen-nib text-xs"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{r.a}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }

        const schoolPhilosophers = getPhilosophersForSchool(selectedSchool.name);
        const schoolWorks = getWorksForSchool(selectedSchool.name);

        return (
            <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)]">
                <div className="w-full max-w-2xl mx-auto flex items-center justify-between px-6 py-4">
                    <button onClick={closeModal} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Doctrina</div>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-20 max-w-2xl mx-auto w-full no-scrollbar">
                    
                    {schematicContent ? (
                        <div className="animate-fade-in pt-4 pb-10">
                            {/* SCHEMATIC VIEW */}
                            
                            <div className="text-center mb-10 px-2 relative">
                                <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-[32px] mb-6 bg-gradient-to-br from-[var(--highlight)] to-[var(--card)] shadow-lg border border-[var(--border)] text-3xl md:text-4xl text-[var(--gold)] transform rotate-3`}>
                                    {renderIcon(selectedSchool.icon, 'duotone')}
                                </div>
                                <h3 className="serif text-3xl md:text-4xl font-bold mb-2 text-[var(--text-main)] tracking-tight">{selectedSchool.name}</h3>
                                <div className="flex justify-center mb-6">
                                    <span className="bg-[var(--highlight)] text-[var(--text-sub)] px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[3px] border border-[var(--border)]">Orígenes</span>
                                </div>
                                <p className="serif-text text-base md:text-lg leading-loose opacity-90 italic max-w-md mx-auto">
                                    "{schematicContent.origin}"
                                </p>
                            </div>

                            <div className="relative px-2 sm:px-6">
                                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[var(--border)] via-[var(--text-main)]/10 to-transparent -translate-x-1/2 z-0"></div>

                                <div className="relative z-10 mb-10">
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-[var(--card)] px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-[var(--border)] rounded-full shadow-sm z-10 flex items-center gap-2">
                                            <i className="ph-fill ph-scroll text-[var(--gold)]"></i> Dogmas
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {schematicContent.dogmas.map((d, i) => (
                                            <div key={i} className="bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm text-center relative hover:scale-[1.02] transition-transform">
                                                <p className="serif font-bold text-base md:text-lg text-[var(--text-main)] leading-tight">{d}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative z-10 mb-10">
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-[var(--card)] px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-[var(--border)] rounded-full shadow-sm z-10 flex items-center gap-2">
                                            <i className="ph-fill ph-hand-fist text-emerald-500"></i> Práctica
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-[var(--highlight)] to-[var(--card)] p-6 rounded-[32px] border border-[var(--border)] shadow-inner">
                                        <ul className="space-y-4">
                                            {schematicContent.practices.map((p, i) => (
                                                <li key={i} className="flex gap-4 items-start">
                                                    <div className="w-6 h-6 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-[var(--text-sub)]">
                                                        <span className="text-[9px] font-bold">{i+1}</span>
                                                    </div>
                                                    <span className="text-sm opacity-90 leading-relaxed font-medium pt-0.5">{p}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-[var(--card)] px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-[var(--border)] rounded-full shadow-sm z-10 flex items-center gap-2">
                                            <i className="ph-fill ph-hourglass text-purple-500"></i> Legado
                                        </div>
                                    </div>
                                    <div className="text-center bg-[var(--card)] p-8 rounded-[32px] border border-[var(--border)] shadow-md relative overflow-hidden">
                                        <i className="ph-duotone ph-globe text-9xl absolute -right-6 -bottom-6 opacity-5"></i>
                                        <p className="serif italic text-base md:text-lg leading-relaxed opacity-80 relative z-10">{schematicContent.legacy}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 mt-12">
                                <button onClick={() => setSchematicContent(null)} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">
                                    Cerrar Archivo
                                </button>
                            </div>
                        </div>
                    ) : !generatedContent ? (
                        <div className="animate-fade-in">
                            {/* 1. HERO */}
                            <div className="bg-[var(--card)] p-8 md:p-12 rounded-[40px] border border-[var(--border)] shadow-sm mb-8 text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[var(--highlight)] to-transparent opacity-50"></div>
                                
                                <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-3xl flex items-center justify-center text-4xl md:text-5xl mb-6 bg-[var(--highlight)] shadow-inner border border-[var(--border)] relative z-10 text-[var(--gold)]`}>
                                    {renderIcon(selectedSchool.icon)}
                                </div>
                                
                                <h2 className="serif text-3xl md:text-5xl font-bold mb-4 tracking-tight text-[var(--text-main)] relative z-10">{selectedSchool.name}</h2>
                                <p className="serif-text text-lg md:text-xl leading-relaxed font-medium opacity-80 px-4 mt-2 max-w-lg mx-auto relative z-10">"{selectedSchool.core_principle}"</p>
                                
                                <div className="mt-8 pt-6 border-t border-[var(--border)] text-sm opacity-60 font-serif leading-loose relative z-10">
                                    {selectedSchool.description}
                                </div>
                            </div>

                            {/* 4. AI SECTION */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-[24px] border border-amber-100 dark:border-amber-900/30 mb-8 relative overflow-hidden group">
                                <i className="ph-duotone ph-scroll absolute -right-6 -bottom-6 text-9xl text-amber-500/10 group-hover:scale-110 transition-transform"></i>
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300">
                                        <i className="ph-bold ph-lightbulb"></i>
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Profundizar</span>
                                    </div>
                                    
                                    <button onClick={handleSchematic} disabled={isGenerating} className="w-full py-4 bg-[var(--bg)] text-[var(--text-main)] rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-sm border border-[var(--border)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md">
                                        {isGenerating ? <i className="ph-duotone ph-spinner animate-spin text-lg"></i> : <i className="ph-bold ph-tree-structure text-lg"></i>} 
                                        Ver Esquema y Origen
                                    </button>

                                    <button onClick={handleDeepDive} disabled={isGenerating} className="w-full py-4 bg-[var(--bg)] text-[var(--text-main)] rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-sm border border-[var(--border)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md">
                                        {isGenerating ? <i className="ph-duotone ph-spinner animate-spin text-lg"></i> : <i className="ph-bold ph-sparkle text-lg"></i>} 
                                        Generar Lección
                                    </button>
                                </div>
                            </div>

                            {/* 5. QUOTES BUTTON */}
                            <button onClick={() => setViewQuotes(true)} className="w-full py-4 mb-8 bg-[var(--card)] text-[var(--text-main)] rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                                <i className="ph-bold ph-quotes"></i> Explorar Citas
                            </button>

                            {/* 6. REPRESENTATIVES */}
                            {schoolPhilosophers.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-4 mb-4 opacity-40">
                                        <div className="h-[1px] flex-1 bg-[var(--text-main)]"></div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Maestros</span>
                                        <div className="h-[1px] flex-1 bg-[var(--text-main)]"></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {schoolPhilosophers.map((p, i) => (
                                            <div key={i} onClick={() => onNavigateToPhilosopher(p.id)} className="bg-[var(--card)] p-4 rounded-[24px] border border-[var(--border)] flex flex-col items-center text-center gap-2 shadow-sm cursor-pointer hover:bg-[var(--highlight)] transition-colors active:scale-95">
                                                <div className="w-12 h-12 rounded-full bg-[var(--highlight)] flex items-center justify-center text-[var(--text-main)] text-xl border border-[var(--border)]">
                                                    {renderIcon(p.icon, 'fill')}
                                                </div>
                                                <div>
                                                    <h4 className="serif font-bold text-sm leading-tight mb-0.5">{p.name}</h4>
                                                    <span className="text-[8px] opacity-50 uppercase tracking-widest">{p.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 7. WORKS */}
                            <div>
                                <div className="flex items-center gap-4 mb-4 opacity-40">
                                    <div className="h-[1px] flex-1 bg-[var(--text-main)]"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Obras Registradas</span>
                                    <div className="h-[1px] flex-1 bg-[var(--text-main)]"></div>
                                </div>
                                {schoolWorks.length > 0 ? (
                                    <div className="grid gap-3">
                                        {schoolWorks.map((work) => (
                                            <div key={work.id} className="bg-[var(--card)] p-4 rounded-[24px] border border-[var(--border)] flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className={`w-10 h-14 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)] relative overflow-hidden ${work.type==='audio' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                                                        <div className="absolute left-1 top-0 bottom-0 w-[2px] bg-black/10"></div>
                                                        <i className={`ph-duotone ${work.type === 'audio' ? 'ph-headphones text-purple-500' : 'ph-book text-orange-600'} text-lg`}></i>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="serif font-bold text-sm leading-none mb-1 truncate">{work.title}</h4>
                                                        <span className="text-[10px] uppercase font-bold opacity-40 truncate block">{work.author}</span>
                                                    </div>
                                                </div>
                                                <a href={work.link_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center hover:opacity-80 transition-opacity shrink-0">
                                                    <i className="ph-bold ph-arrow-right"></i>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed border-[var(--border)] rounded-[24px] opacity-40">
                                        <i className="ph-duotone ph-books text-3xl mb-2"></i>
                                        <p className="text-xs">No hay obras vinculadas en la biblioteca.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in pb-10 pt-4">
                            <div className="mb-6 bg-[var(--highlight)]/30 p-6 rounded-[24px] border border-[var(--border)]">
                                <div className="flex items-center gap-2 mb-4 opacity-50">
                                    <i className="ph-fill ph-book-open text-[var(--text-main)]"></i>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Lección Generada</span>
                                </div>
                                <h3 className="serif text-2xl font-bold mb-4">{generatedContent.t}</h3>
                                <div className="pl-4 border-l-2 border-[var(--text-main)]/20 mb-4">
                                    <p className="serif italic opacity-90 text-base leading-relaxed">"{generatedContent.q}"</p>
                                </div>
                                <p className="serif-text text-sm leading-loose opacity-90 whitespace-pre-wrap">{generatedContent.b}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {generatedContent.k?.map((k, i) => (
                                        <span key={i} className="text-[9px] font-bold uppercase tracking-widest bg-[var(--card)] px-2 py-1 rounded-full opacity-60">{k}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => toggleSave(generatedContent)} 
                                className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isSaved(generatedContent) ? 'bg-[var(--gold)] text-white' : 'bg-[var(--card)] border border-[var(--text-main)] text-[var(--text-main)]'}`}
                            >
                                {isSaved(generatedContent) ? <><i className="ph-fill ph-bookmark-simple text-xl"></i> Guardado en Biblioteca</> : <><i className="ph-bold ph-bookmark-simple text-xl"></i> Guardar en Biblioteca</>}
                            </button>
                            <button onClick={() => setGeneratedContent(null)} className="w-full py-4 mt-4 text-[var(--text-sub)] font-bold uppercase tracking-widest text-xs">Volver a Escuela</button>
                        </div>
                    )}
                </div>

                {/* GLOSSARY MODAL */}
                {showGlossaryModal && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowGlossaryModal(false)}>
                        <div className="bg-[var(--card)] w-full max-w-sm p-8 rounded-[28px] shadow-2xl relative border border-[var(--border)]" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowGlossaryModal(false)} className="absolute top-4 right-4 opacity-40 hover:opacity-100"><i className="ph-bold ph-x text-lg"></i></button>
                            {loadingGlossary ? <span className="text-xs font-bold uppercase tracking-widest opacity-50">Consultando...</span> : glossaryItem ? (
                                <div className="animate-fade-in text-center">
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-4 block bg-[var(--highlight)] border border-[var(--border)] inline-block px-3 py-1 rounded-full">{glossaryItem.origin}</span>
                                    <h3 className="serif text-3xl font-bold mb-6">{glossaryItem.term}</h3>
                                    <p className="serif-text text-lg leading-relaxed opacity-90 mb-8">{glossaryItem.definition}</p>
                                    <p className="text-sm italic opacity-60">"{glossaryItem.example}"</p>
                                </div>
                            ) : <span className="text-xs opacity-50">No encontrado.</span>}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // --- VIEW: MAIN LIST (HORIZONTAL LIST CARDS) ---
    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
             <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <h2 className="serif text-2xl font-bold">Escuelas</h2>
                </div>
            </div>

            <div className="w-full max-w-2xl px-6 mb-6 flex gap-2">
                <div className="bg-[var(--card)] p-3 rounded-[20px] flex-1 flex items-center gap-3 border border-[var(--border)] shadow-sm focus-within:border-[var(--text-main)] transition-colors">
                    <i className="ph-bold ph-magnifying-glass opacity-30 ml-2"></i>
                    <input 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Buscar escuela..." 
                        className="bg-transparent outline-none w-full text-base serif placeholder:font-sans placeholder:opacity-30 placeholder:text-sm"
                    />
                    {searchTerm && <button onClick={() => setSearchTerm("")}><i className="ph-bold ph-x opacity-40 hover:opacity-100"></i></button>}
                </div>
                
                {hasActiveFilters && (
                    <button onClick={handleResetFilters} className="w-12 rounded-[20px] bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-900/30 dark:border-rose-900 dark:text-rose-400 flex items-center justify-center shrink-0 active:scale-95 transition-all">
                        <i className="ph-bold ph-arrow-counter-clockwise"></i>
                    </button>
                )}
            </div>

            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                {/* NEW HORIZONTAL LIST DESIGN */}
                <div className="flex flex-col gap-4">
                    {filteredSchools.map((school, i) => (
                        <div key={i} onClick={() => setSelectedSchool(school)} className="bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-6 active:scale-[0.98]">
                            
                            {/* Colorful Icon Bubble - Left */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-[var(--border)] bg-[var(--highlight)] text-[var(--gold)] group-hover:scale-105 transition-transform shrink-0`}>
                                {renderIcon(school.icon)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="serif font-bold text-lg md:text-xl leading-none text-[var(--text-main)] mb-1.5">{school.name}</h3>
                                <p className="text-[8px] font-bold uppercase tracking-widest opacity-50 truncate">{school.core_principle}</p>
                            </div>

                            {/* Arrow */}
                            <i className="ph-bold ph-caret-right opacity-30 group-hover:opacity-100 transition-opacity"></i>
                        </div>
                    ))}
                </div>
                {filteredSchools.length === 0 && !searchTerm && (
                    <div className="text-center py-20 opacity-30 italic font-serif">No se encontraron escuelas.</div>
                )}
            </div>
        </div>
    );
}
