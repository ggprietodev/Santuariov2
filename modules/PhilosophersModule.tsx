
import React, { useState, useEffect, useMemo } from 'react';
import { PhilosopherBio, Reading, Work, GlossaryTerm } from '../types';
import { generateDeepDive, generatePhilosopherProfile, definePhilosophicalTerm } from '../services/geminiService';
import { fetchGlossaryTerm } from '../services/supabase';

export function PhilosophersModule({ onBack, toggleSave, savedReadings, followedPhilosophers, toggleFollowPhilosopher, dailyPhilosopher, philosophers, works, readings, initialSelectedPhilosopherId, onNavigateToSchool }: { 
    onBack: () => void, 
    toggleSave: (r: Reading) => void, 
    savedReadings: Reading[],
    followedPhilosophers: string[],
    toggleFollowPhilosopher: (id: string) => void,
    dailyPhilosopher: PhilosopherBio,
    philosophers: PhilosopherBio[],
    works: Work[],
    readings: Reading[],
    initialSelectedPhilosopherId?: string | null,
    onNavigateToSchool: (name: string) => void
}) {
    const [tab, setTab] = useState<'all' | 'following'>('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("Todas");
    
    const [quoteSearchTerm, setQuoteSearchTerm] = useState("");
    const [quoteTypeFilter, setQuoteTypeFilter] = useState("all");

    const [selectedBio, setSelectedBio] = useState<PhilosopherBio | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<Reading | null>(null);
    
    const [bioWorksContent, setBioWorksContent] = useState<{bio: string, works: {title: string, desc: string}[]} | null>(null);
    
    const [viewQuotes, setViewQuotes] = useState(false);

    // Glossary State
    const [glossaryItem, setGlossaryItem] = useState<GlossaryTerm | null>(null);
    const [loadingGlossary, setLoadingGlossary] = useState(false);
    const [loadingSource, setLoadingSource] = useState<'db'|'ai'>('db');
    const [showGlossaryModal, setShowGlossaryModal] = useState(false);
    const [searchedTerm, setSearchedTerm] = useState("");

    // Deep link logic
    useEffect(() => {
        if(initialSelectedPhilosopherId) {
            const bio = philosophers.find(p => p.id === initialSelectedPhilosopherId);
            if(bio) setSelectedBio(bio);
        }
    }, [initialSelectedPhilosopherId, philosophers]);

    // Extract Unique Schools
    const uniqueSchools = useMemo(() => {
        const schools = new Set(philosophers.map(p => p.school));
        return ["Todas", ...Array.from(schools).sort()];
    }, [philosophers]);

    const filteredBios = philosophers.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.school.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSchool = selectedSchoolFilter === "Todas" || b.school === selectedSchoolFilter;
        
        if (tab === 'following') return matchesSearch && matchesSchool && followedPhilosophers.includes(b.id);
        return matchesSearch && matchesSchool;
    });

    const getQuotesForAuthor = (authorName: string) => {
        let qs = readings.filter(r => r.a && r.a.toLowerCase().includes(authorName.toLowerCase()));
        
        if (quoteSearchTerm) {
            const term = quoteSearchTerm.toLowerCase();
            qs = qs.filter(q => q.q.toLowerCase().includes(term) || q.t.toLowerCase().includes(term));
        }

        if (quoteTypeFilter !== 'all') {
            qs = qs.filter(q => {
                const type = q.type || (q.q.length < 100 ? 'cita' : 'reflexion');
                return type === quoteTypeFilter;
            });
        }

        return qs;
    }

    const handleDeepDive = async () => {
        if(!selectedBio) return;
        setIsGenerating(true);
        const content = await generateDeepDive('Filósofo', selectedBio.name, selectedBio.desc);
        if(content) setGeneratedContent(content);
        setIsGenerating(false);
    }

    const handleBioWorks = async () => {
        if(!selectedBio) return;
        setIsGenerating(true);
        const content = await generatePhilosopherProfile(selectedBio.name, selectedBio.desc);
        if(content) setBioWorksContent(content);
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
                setLoadingSource('ai'); // Update visual state immediately
                const aiData = await definePhilosophicalTerm(term);
                
                if (aiData) {
                    setGlossaryItem({ ...aiData, related_author: selectedBio?.name });
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

    // NEW: Handle searching for a missing philosopher/term via AI directly from the list
    const handleAiLookup = async () => {
        if (!searchTerm) return;
        handleTermClick(searchTerm);
    }

    const handleResetFilters = () => {
        setSearchTerm("");
        setTab('all');
        setSelectedSchoolFilter("Todas");
    };

    const hasActiveFilters = searchTerm !== "" || tab !== 'all' || selectedSchoolFilter !== "Todas";

    const isSaved = (content: Reading) => savedReadings.some((r: Reading) => r.t === content.t);
    const isFollowing = (id: string) => followedPhilosophers.includes(id);

    const closeModal = () => {
        if (initialSelectedPhilosopherId && selectedBio?.id === initialSelectedPhilosopherId) {
            onBack();
        } else {
            setSelectedBio(null);
            setGeneratedContent(null);
            setBioWorksContent(null);
            setViewQuotes(false);
            setQuoteSearchTerm("");
            setQuoteTypeFilter("all");
        }
    }

    const linkedWorks = selectedBio 
        ? works.filter(w => w.philosopher_id === selectedBio.id || w.author.toLowerCase() === selectedBio.name.toLowerCase())
        : [];

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
             {/* Sticky Header - Identical to Library */}
             <div className="w-full max-w-2xl sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] transition-all">
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                        <h2 className="serif text-2xl font-bold">Maestros</h2>
                    </div>
                </div>
                
                {/* Toggle Row - Inside Sticky Header */}
                <div className="px-6 pb-4">
                    <div className="flex bg-[var(--card)] p-1 rounded-xl border border-[var(--border)] w-full">
                        <button onClick={() => setTab('all')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tab==='all' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)]'}`}>Todos</button>
                        <button onClick={() => setTab('following')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tab==='following' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)]'}`}>Mi Círculo</button>
                    </div>
                </div>
            </div>

            {/* Controls (Search + Chips) - Scrollable */}
            <div className="w-full max-w-2xl px-6 mb-2 pt-4 space-y-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <i className="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 opacity-30"></i>
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar filósofo..." 
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

                {/* SCHOOL FILTER CHIPS */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {uniqueSchools.map(school => (
                        <button 
                            key={school} 
                            onClick={() => setSelectedSchoolFilter(school)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all ${selectedSchoolFilter === school ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)]'}`}
                        >
                            {school}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-2">
                {!searchTerm && tab === 'all' && selectedSchoolFilter === 'Todas' && (
                    <div onClick={() => setSelectedBio(dailyPhilosopher)} className="bg-[#FFFBEB] dark:bg-[#2C2410] p-6 rounded-[32px] border border-amber-200 dark:border-amber-900/30 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99] relative overflow-hidden group mb-6">
                        <i className="ph-fill ph-star absolute top-4 right-4 text-amber-500 text-xl animate-pulse"></i>
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-3xl shadow-inner shrink-0">
                                <i className={`ph-fill ${dailyPhilosopher.icon}`}></i>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-200 mb-1">Maestro del Día</div>
                                <h3 className="serif font-bold text-xl leading-tight mb-1 text-amber-900 dark:text-amber-50">{dailyPhilosopher.name}</h3>
                                <div className="text-[8px] opacity-60 text-amber-800/80 dark:text-amber-200/70 line-clamp-1 uppercase tracking-widest">{dailyPhilosopher.school}</div>
                            </div>
                        </div>
                    </div>
                )}

                {filteredBios.length === 0 && searchTerm && (
                    <div className="text-center py-10 animate-fade-in">
                        <i className="ph-duotone ph-magnifying-glass text-4xl mb-4 opacity-30"></i>
                        <p className="text-sm opacity-50 mb-6 italic font-serif">No encontrado en la biblioteca.</p>
                        <button 
                            onClick={handleAiLookup}
                            className="bg-[var(--text-main)] text-[var(--bg)] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform"
                        >
                            <i className="ph-bold ph-sparkle"></i> Consultar al Oráculo
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {filteredBios.map((bio, i) => (
                        <div key={i} onClick={() => setSelectedBio(bio)} className="bg-[var(--card)] p-4 rounded-[24px] border border-[var(--border)] shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center text-center gap-3 group relative overflow-hidden">
                            <div className="absolute top-3 right-3 z-10">
                                {isFollowing(bio.id) && <i className="ph-fill ph-star text-[var(--gold)] text-lg"></i>}
                            </div>
                            <div className="w-16 h-16 rounded-full bg-[var(--highlight)] flex items-center justify-center text-[var(--gold)] text-3xl group-hover:scale-110 transition-transform">
                                <i className={`ph-fill ${bio.icon}`}></i>
                            </div>
                            <div>
                                <h3 className="serif font-bold text-base leading-tight mb-1 truncate w-full px-1">{bio.name}</h3>
                                <div className="text-[8px] font-bold uppercase tracking-widest opacity-50 truncate w-full px-2">{bio.school}</div>
                            </div>
                            <div className="absolute inset-0 border-2 border-[var(--text-main)] rounded-[24px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* GLOSSARY MODAL (Reuse for Search Fallback) */}
            {showGlossaryModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowGlossaryModal(false)}>
                    <div className="bg-[var(--card)] w-full max-w-sm rounded-[24px] p-6 shadow-2xl border border-[var(--border)] relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowGlossaryModal(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)]"><i className="ph-bold ph-x text-lg"></i></button>
                        
                        {loadingGlossary ? (
                            <div className="py-10 flex flex-col items-center justify-center opacity-70">
                                <i className={`ph-duotone ${loadingSource === 'ai' ? 'ph-sparkle' : 'ph-database'} animate-pulse text-4xl mb-3 text-[var(--gold)]`}></i>
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    {loadingSource === 'db' ? "Buscando en Archivo..." : "Consultando al Oráculo..."}
                                </span>
                            </div>
                        ) : glossaryItem ? (
                            <div className="animate-fade-in">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-[var(--highlight)] rounded-lg text-[8px] font-bold uppercase tracking-widest opacity-60">{glossaryItem.origin}</span>
                                </div>
                                <h3 className="serif text-2xl font-bold mb-3 text-[var(--gold)]">{glossaryItem.term}</h3>
                                <p className="serif-text text-base leading-relaxed opacity-90 mb-4">{glossaryItem.definition}</p>
                                <div className="bg-[var(--highlight)] p-4 rounded-xl border border-[var(--border)]">
                                    <p className="text-xs italic opacity-70">"{glossaryItem.example}"</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center animate-fade-in">
                                <i className="ph-duotone ph-book-open-text text-4xl mb-3 opacity-30"></i>
                                <h3 className="serif text-lg font-bold mb-1">Término no encontrado</h3>
                                <p className="text-xs opacity-60">Ni la base de datos ni el Oráculo pudieron definir "{searchedTerm}".</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BIO MODAL - "PROFILE CARD STYLE" */}
            {selectedBio && (
                <div className="fixed inset-0 z-[80] bg-[var(--bg)] flex flex-col p-6 animate-fade-in overflow-y-auto">
                    <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                             <button onClick={closeModal} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm border border-[var(--border)] active:scale-95 transition-transform"><i className="ph-bold ph-x"></i></button>
                             <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{viewQuotes ? 'Archivo de Citas' : 'Perfil'}</div>
                             <button onClick={() => toggleFollowPhilosopher(selectedBio.id)} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border transition-colors ${isFollowing(selectedBio.id) ? 'bg-[var(--gold)] border-[var(--gold)] text-white' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-sub)]'}`}>
                                 <i className={`ph-${isFollowing(selectedBio.id) ? 'fill' : 'bold'} ph-star text-lg`}></i>
                             </button>
                        </div>

                        {viewQuotes ? (
                            <div className="animate-fade-in flex-1">
                                <div className="text-center mb-8">
                                    <h2 className="serif text-3xl font-bold mb-2">{selectedBio.name}</h2>
                                    <p className="text-xs opacity-40 uppercase tracking-[3px]">Citas Seleccionadas</p>
                                </div>
                                    
                                {/* Search & Filter Bar */}
                                <div className="flex gap-2 mb-8 bg-[var(--card)] p-2 rounded-[24px] border border-[var(--border)] shadow-sm">
                                    <div className="flex-1 flex items-center gap-2 px-3">
                                        <i className="ph-bold ph-magnifying-glass opacity-30"></i>
                                        <input 
                                            value={quoteSearchTerm} 
                                            onChange={(e) => setQuoteSearchTerm(e.target.value)} 
                                            placeholder="Buscar en citas..." 
                                            className="bg-transparent w-full text-sm outline-none font-serif placeholder:font-sans placeholder:opacity-30" 
                                        />
                                    </div>
                                    <div className="flex items-center relative border-l border-[var(--border)] pl-2">
                                        <select 
                                            value={quoteTypeFilter}
                                            onChange={(e) => setQuoteTypeFilter(e.target.value)}
                                            className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none appearance-none pr-6 cursor-pointer text-right min-w-[80px]"
                                        >
                                            <option value="all">Todo</option>
                                            <option value="cita">Citas</option>
                                            <option value="reflexion">Reflexiones</option>
                                            <option value="parabola">Parábolas</option>
                                        </select>
                                        <i className="ph-bold ph-caret-down opacity-50 text-xs absolute right-2 pointer-events-none"></i>
                                    </div>
                                </div>

                                <div className="space-y-4 pb-10">
                                    {getQuotesForAuthor(selectedBio.name).length === 0 && <div className="text-center opacity-30 py-20 italic">No hay registros con este filtro.</div>}
                                    {getQuotesForAuthor(selectedBio.name).map((r, i) => (
                                        <div key={i} className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm">
                                            <div className="flex justify-between items-start mb-2 opacity-40 hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-bold uppercase tracking-widest border border-[var(--border)] px-2 py-1 rounded-full">{r.type || 'Cita'}</span>
                                                <button onClick={() => toggleSave(r)} className={`text-lg active:scale-90 transition-transform ${isSaved(r) ? 'text-[var(--gold)]' : 'hover:text-[var(--gold)]'}`}>
                                                    <i className={`ph-${isSaved(r) ? 'fill' : 'bold'} ph-bookmark-simple`}></i>
                                                </button>
                                            </div>
                                            <p className="serif italic text-lg leading-relaxed text-[var(--text-main)] mb-3">"{r.q}"</p>
                                            <span className="text-xs font-bold uppercase tracking-widest opacity-30">{r.t}</span>
                                        </div>
                                    ))}
                                    <button onClick={() => setViewQuotes(false)} className="w-full py-4 mt-8 bg-[var(--highlight)] text-[var(--text-main)] rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors border border-[var(--border)]">Volver al Perfil</button>
                                </div>
                            </div>
                        ) : bioWorksContent ? (
                            <div className="animate-fade-in pb-10">
                                <div className="mb-6 bg-[var(--card)] p-8 rounded-[32px] border border-[var(--border)] shadow-sm">
                                    <div className="border-b border-[var(--border)] pb-6 mb-6">
                                        <h3 className="serif text-2xl font-bold mb-4">Biografía Extendida</h3>
                                        <p className="serif-text text-base leading-loose opacity-90">{bioWorksContent.bio}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2"><i className="ph-bold ph-books"></i> Obras Destacadas</h4>
                                        <div className="space-y-4">
                                            {bioWorksContent.works.map((w, i) => (
                                                <div key={i} className="bg-[var(--highlight)] p-4 rounded-2xl border border-[var(--border)]">
                                                    <h5 className="serif font-bold text-lg mb-1">{w.title}</h5>
                                                    <p className="text-sm opacity-70 leading-relaxed">{w.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setBioWorksContent(null)} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest text-xs">Volver al Perfil</button>
                            </div>
                        ) : !generatedContent ? (
                            <div className="animate-fade-in pb-10 pt-4">
                                {/* 1. HERO PROFILE CARD (Updated) */}
                                <div className="bg-[var(--card)] rounded-[32px] border border-[var(--border)] mb-8 shadow-sm overflow-hidden relative">
                                    {/* Cover Image/Color */}
                                    <div className="h-28 w-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"></div>
                                    
                                    {/* Avatar (Floating) */}
                                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                                        <div className="w-32 h-32 rounded-full border-4 border-[var(--card)] bg-[var(--card)] flex items-center justify-center text-5xl shadow-lg">
                                            <i className={`ph-duotone ${selectedBio.icon}`}></i>
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="pt-16 pb-8 px-6 text-center">
                                        <h2 className="serif text-3xl font-bold text-[var(--text-main)] mb-1">{selectedBio.name}</h2>
                                        <p className="text-sm opacity-50 font-medium mb-4">{selectedBio.role}</p>
                                        
                                        <div className="flex justify-center gap-3 mb-6">
                                            <button 
                                                className="px-4 py-1.5 bg-[var(--highlight)] rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors border border-[var(--border)]"
                                                onClick={() => onNavigateToSchool(selectedBio.school)}
                                            >
                                                {selectedBio.school}
                                            </button>
                                            <span className="px-4 py-1.5 rounded-full border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                {selectedBio.dates}
                                            </span>
                                        </div>

                                        <p  className="text-[8px] font-bold uppercase tracking-widest opacity-50 truncate">{selectedBio.desc}</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    
                                    {/* 2. KEY IDEAS (Chips) */}
                                    <div className="text-center">
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {selectedBio.key_ideas.map((idea, k) => (
                                                <button 
                                                    key={k} 
                                                    onClick={() => handleTermClick(idea)}
                                                    className="bg-[var(--card)] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border border-[var(--border)] hover:border-[var(--text-main)] transition-all shadow-sm active:scale-95 cursor-pointer hover:shadow-md"
                                                >
                                                    {idea}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 4. ACTIONS */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setViewQuotes(true)} className="p-6 rounded-[24px] bg-[var(--text-main)] text-[var(--bg)] shadow-lg hover:opacity-90 transition-all flex flex-col justify-center items-center gap-2 active:scale-95">
                                            <i className="ph-bold ph-quotes text-2xl"></i>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Ver Citas</span>
                                        </button>
                                        <button onClick={handleBioWorks} disabled={isGenerating} className="p-6 rounded-[24px] bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--highlight)] transition-all flex flex-col justify-center items-center gap-2 group active:scale-95 shadow-sm">
                                            {isGenerating ? <i className="ph-duotone ph-spinner animate-spin text-xl"></i> : <i className="ph-bold ph-book-open-text text-xl"></i>}
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{isGenerating ? 'Generando...' : 'Vida y Legado'}</span>
                                        </button>
                                    </div>

                                    {/* 5. AI SECTION */}
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-[24px] border border-purple-100 dark:border-purple-900/30 relative overflow-hidden group">
                                        <i className="ph-duotone ph-sparkle absolute -right-6 -bottom-6 text-9xl text-purple-500/10 group-hover:scale-110 transition-transform"></i>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300">
                                                <i className="ph-bold ph-magic-wand"></i>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Oráculo Digital</span>
                                            </div>
                                            <h3 className="serif text-xl font-bold mb-4">Invocar Sabiduría</h3>
                                            <p className="text-sm opacity-70 mb-6">Genera una lección única basada en los principios de {selectedBio.name}.</p>
                                            
                                            <button onClick={handleDeepDive} disabled={isGenerating} className="w-full py-4 bg-[var(--bg)] text-[var(--text-main)] rounded-2xl font-bold uppercase tracking-widest shadow-sm border border-[var(--border)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md">
                                                {isGenerating ? <><i className="ph-duotone ph-spinner animate-spin text-lg"></i> Conectando...</> : "Generar Lección"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 6. WORKS */}
                                    {linkedWorks.length > 0 && (
                                        <div className="pt-4 border-t border-[var(--border)] mt-4">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4 block text-center">Bibliografía</span>
                                            <div className="flex flex-col gap-3">
                                                {linkedWorks.map((work) => (
                                                    <div key={work.id} className="bg-[var(--card)] p-4 rounded-[20px] border border-[var(--border)] flex justify-between items-center shadow-sm hover:border-[var(--text-main)] transition-all cursor-pointer group" onClick={()=>window.open(work.link_url, '_blank')}>
                                                        <div className="flex items-center gap-4 overflow-hidden">
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--highlight)] text-[var(--text-main)]"><i className="ph-bold ph-book"></i></div>
                                                            <div>
                                                                <h4 className="serif font-bold text-sm leading-none mb-1">{work.title}</h4>
                                                                <span className="text-[10px] uppercase font-bold opacity-40">{work.type}</span>
                                                            </div>
                                                        </div>
                                                        <i className="ph-bold ph-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in pb-10 pt-4">
                                <div className="mb-6 bg-[var(--card)] p-8 rounded-[32px] border border-[var(--border)] shadow-sm">
                                    <h3 className="serif text-2xl font-bold mb-4">{generatedContent.t}</h3>
                                    <div className="w-12 h-[1px] bg-[var(--text-main)] opacity-20 mb-6"></div>
                                    <p className="serif-text text-base leading-relaxed opacity-90 whitespace-pre-wrap">{generatedContent.b}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => toggleSave(generatedContent)} className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all border ${isSaved(generatedContent) ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] text-[var(--text-main)] border-[var(--border)]'}`}>
                                        {isSaved(generatedContent) ? "Guardado" : "Guardar"}
                                    </button>
                                    <button onClick={() => setGeneratedContent(null)} className="flex-1 py-4 text-[var(--text-sub)] font-bold uppercase tracking-widest text-xs hover:text-[var(--text-main)]">Cerrar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
