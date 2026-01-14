
import React, { useState, useRef } from 'react';
import { generateWisdom } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { Reading, SharedItem, PhilosopherBio, PhilosophySchool } from '../types';

interface OracleProps {
    toggleSave: (r: Reading) => void;
    savedReadings: Reading[];
    onBack: () => void;
    onShare?: (item: SharedItem) => void;
    philosophers?: PhilosopherBio[];
    schools?: PhilosophySchool[]; 
}

export function OracleModule({ toggleSave, savedReadings, onBack, onShare, philosophers = [], schools = [] }: OracleProps) {
    const [topic, setTopic] = useState("");
    const [contextMode, setContextMode] = useState<'universal' | 'master' | 'school'>('universal');
    const [selectedGuideId, setSelectedGuideId] = useState<string>("universal"); 
    const [customGuideName, setCustomGuideName] = useState("");
    const [genResult, setGenResult] = useState<Reading | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSavingToDb, setIsSavingToDb] = useState(false);
    
    // Scroll ref
    const guidesRef = useRef<HTMLDivElement>(null);

    // Dynamic Lists based on Mode
    const featuredIds = ['maurelio', 'seneca', 'epicteto', 'nietzsche', 'buda', 'laotse', 'confucius', 'musashi'];
    
    const mastersList = [
        ...philosophers.filter(p => featuredIds.includes(p.id)).map(p => ({ id: p.id, name: p.name.split(' ')[0], icon: p.icon })),
        ...philosophers.filter(p => !featuredIds.includes(p.id)).map(p => ({ id: p.id, name: p.name.split(' ')[0], icon: p.icon })),
        { id: 'custom', name: 'Otro', icon: 'ph-user-focus' }
    ];

    // Safely map schools from DB. 
    // IMPORTANT: Fallback to empty array if no schools passed, to prevent showing fake data.
    const schoolsList = schools?.map(s => ({ 
        id: s.name, 
        name: s.name, 
        icon: s.icon || "ph-columns" 
    })) || [];

    const currentList = contextMode === 'master' ? mastersList : contextMode === 'school' ? schoolsList : [];

    const handleGenerate = async () => {
        setLoading(true);
        const effectiveTopic = topic.trim() || "Una lección filosófica aleatoria y profunda para mi vida hoy";
        
        let authorContext = undefined;
        
        if (contextMode === 'master') {
            if (selectedGuideId === 'custom') {
                if (customGuideName.trim()) authorContext = customGuideName;
            } else {
                const guide = philosophers.find(p => p.id === selectedGuideId);
                if (guide) authorContext = guide.name;
            }
        } else if (contextMode === 'school') {
             // Pass school name as "author" context to Gemini
             authorContext = selectedGuideId;
        }

        try {
            const res = await generateWisdom(effectiveTopic, authorContext);
            if(res) {
                const completeReading: Reading = {
                    ...res,
                    type: 'reflexion',
                    id: res.id || `oracle-${Date.now()}`
                };
                setGenResult(completeReading);
            }
        } catch (e) {
            console.error("Oracle generation failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReading = async () => {
        if (!genResult) return;
        setIsSavingToDb(true);

        try {
            const { data, error } = await supabase.from('content_readings').upsert({
                title: genResult.t,
                quote: genResult.q,
                body: genResult.b,
                author: genResult.a,
                tags: genResult.k,
                philosophy: genResult.philosophy,
                type: 'reflexion',
                created_at: new Date().toISOString()
            }, { onConflict: 'quote' }).select().single();

            if (error) console.error("Error saving to DB:", error);

            const readingToSave = data ? { ...genResult, id: data.id } : genResult;
            toggleSave(readingToSave);

        } catch (e) {
            console.error(e);
            toggleSave(genResult);
        } finally {
            setIsSavingToDb(false);
        }
    };

    const isSaved = (r: Reading) => savedReadings.some(saved => saved.t === r.t || saved.q === r.q);

    const handleShare = () => {
        if (genResult && onShare) {
            onShare({
                type: 'reading',
                title: genResult.t,
                content: genResult.q,
                subtitle: genResult.a,
                extra: 'Revelación del Oráculo',
                data: genResult
            });
        }
    };

    // Helper to render icon safely
    const renderIcon = (iconStr: string) => {
        if (!iconStr) return <i className="ph-fill ph-sparkle"></i>;
        let clean = iconStr.trim().replace(/^ph-/, '').replace(/^ph /, '').replace(/^Ph/, '');
        clean = clean.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); 
        const map: Record<string, string> = {
            'flower-lotus': 'lotus', 'mountain': 'mountains', 'lazi': 'wind', 'confucius': 'scroll', 'buda': 'lotus', 'balance': 'scales', 'temple': 'bank'
        };
        if (map[clean]) clean = map[clean];
        return <i className={`ph-fill ph-${clean}`}></i>; 
    };

    const scrollGuides = (direction: 'left' | 'right') => {
        if (guidesRef.current) {
            const scrollAmount = 150;
            guidesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const SUGGESTED_TOPICS = ["Ansiedad", "Ira", "Muerte", "Amor", "Disciplina", "Ego", "Soledad", "Caos"];

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center relative overflow-hidden">
            
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <h2 className="serif text-2xl font-bold">Oráculo</h2>
                </div>
            </div>

            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-6 relative z-10 flex flex-col">
                
                {!genResult ? (
                    <div className="flex flex-col animate-fade-in">
                         
                         {/* Mode Selector */}
                         <div className="flex bg-[var(--card)] p-1 rounded-2xl border border-[var(--border)] mb-6 shadow-sm">
                             <button onClick={() => { setContextMode('universal'); setSelectedGuideId('universal'); }} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${contextMode==='universal' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-md' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Universal</button>
                             <button onClick={() => { setContextMode('master'); setSelectedGuideId(mastersList[0]?.id || 'universal'); }} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${contextMode==='master' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-md' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Maestros</button>
                             <button onClick={() => { setContextMode('school'); setSelectedGuideId(schoolsList[0]?.id || 'universal'); }} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${contextMode==='school' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-md' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Corrientes</button>
                         </div>

                         {/* Guide Selector Area (Only for Master/School) */}
                         {contextMode !== 'universal' && (
                             <div className="mb-8 relative group">
                                 <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 ml-1 text-center">
                                     {contextMode === 'master' ? 'Selecciona un Guía' : 'Selecciona una Escuela'}
                                 </h4>
                                 
                                 <div className="relative">
                                     <button onClick={() => scrollGuides('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--text-main)] -ml-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden sm:flex">
                                         <i className="ph-bold ph-caret-left"></i>
                                     </button>

                                     <div ref={guidesRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-6 px-1 snap-x snap-mandatory w-full scroll-smooth">
                                        {currentList.length === 0 && (
                                            <div className="w-full text-center py-4 opacity-40 text-xs italic bg-[var(--highlight)] rounded-xl border border-[var(--border)]">
                                                No se encontraron registros. <br/> 
                                                <span className="text-[9px] opacity-60">Revisa la conexión o genera contenido en Ajustes.</span>
                                            </div>
                                        )}
                                        {currentList.map(guide => (
                                            <button 
                                                key={guide.id}
                                                onClick={() => setSelectedGuideId(guide.id)}
                                                className={`flex flex-col items-center gap-2 min-w-[72px] group/item transition-all duration-300 snap-center shrink-0 ${selectedGuideId === guide.id ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'}`}
                                            >
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm border-2 transition-all ${selectedGuideId === guide.id ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)] shadow-md' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-main)]'}`}>
                                                    {renderIcon(guide.icon)}
                                                </div>
                                                <span className="text-[9px] font-bold uppercase tracking-wider truncate w-full text-center max-w-[80px]">{guide.name}</span>
                                            </button>
                                        ))}
                                        <div className="min-w-[20px] shrink-0"></div>
                                     </div>

                                     <button onClick={() => scrollGuides('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--text-main)] -mr-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                                         <i className="ph-bold ph-caret-right"></i>
                                     </button>
                                 </div>

                                 {/* Custom Guide Input */}
                                 <div className={`transition-all duration-300 overflow-hidden ${selectedGuideId === 'custom' ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                    <div className="bg-[var(--card)] p-3 rounded-2xl border border-[var(--border)] flex items-center gap-3">
                                        <i className="ph-bold ph-user-pen opacity-40 ml-1"></i>
                                        <input 
                                            value={customGuideName}
                                            onChange={(e) => setCustomGuideName(e.target.value)}
                                            placeholder="Nombre del filósofo o guía..."
                                            className="bg-transparent w-full text-sm outline-none font-serif placeholder:font-sans placeholder:opacity-40"
                                            autoFocus={selectedGuideId === 'custom'}
                                        />
                                    </div>
                                 </div>
                             </div>
                         )}

                         {/* Topic Input */}
                         <div className="mb-12">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 ml-1 text-center">Tu Inquietud</h4>
                            <div className="bg-[var(--card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm">
                                <input 
                                    value={topic} 
                                    onChange={e=>setTopic(e.target.value)} 
                                    placeholder="¿Qué perturba tu paz?" 
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-3 outline-none font-serif text-xl placeholder:opacity-30 focus:border-[var(--text-main)] transition-colors mb-6 text-center"
                                />
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {SUGGESTED_TOPICS.map(t => (
                                        <button key={t} onClick={() => setTopic(t)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${topic === t ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--highlight)] border-transparent text-[var(--text-sub)] hover:border-[var(--border)]'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                         </div>

                         {/* Stylized Action Button */}
                         <div className="flex justify-center">
                             <button 
                                onClick={handleGenerate} 
                                disabled={loading}
                                className="group relative px-10 py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-full font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    {loading ? <i className="ph-duotone ph-spinner animate-spin text-lg"></i> : <i className="ph-bold ph-sparkle text-lg"></i>}
                                    <span>{loading ? "Consultando..." : "Revelar Sabiduría"}</span>
                                </div>
                            </button>
                         </div>
                    </div>
                ) : (
                    <div className="animate-fade-in w-full max-w-md mx-auto pt-4">
                        {/* Result Card - Standard Clean Style */}
                        <div className="bg-[var(--card)] p-8 rounded-[32px] border border-[var(--border)] shadow-lg relative overflow-hidden mb-8 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--highlight)] rounded-bl-[100px] opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <div className="mb-8 flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-bold uppercase tracking-[3px] opacity-40 bg-[var(--highlight)] px-3 py-1 rounded-full border border-[var(--border)]">
                                    {genResult.philosophy || 'Sabiduría'}
                                </span>
                                <div className="w-10 h-10 rounded-full bg-[var(--highlight)] flex items-center justify-center border border-[var(--border)] text-[var(--text-sub)]">
                                    <i className="ph-fill ph-quotes text-lg"></i>
                                </div>
                            </div>

                            <h3 className="serif text-2xl font-bold mb-6 text-[var(--text-main)] leading-tight relative z-10">
                                {genResult.t}
                            </h3>

                            <div className="mb-8 relative pl-6 border-l-2 border-[var(--gold)]/50">
                                <p className="serif-text text-xl leading-relaxed text-[var(--text-main)] italic opacity-90">
                                    "{genResult.q}"
                                </p>
                            </div>

                            <p className="serif-text text-sm opacity-80 leading-loose whitespace-pre-wrap mb-8">
                                {genResult.b}
                            </p>

                            <div className="flex items-center gap-3 pt-6 border-t border-[var(--border)]">
                                <div className="w-8 h-8 rounded-full bg-[var(--text-main)] flex items-center justify-center text-[var(--bg)] text-xs">
                                    <i className="ph-bold ph-pen-nib"></i>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest opacity-60">{genResult.a}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button onClick={() => setGenResult(null)} className="py-4 rounded-full border border-[var(--border)] text-[var(--text-sub)] font-bold uppercase tracking-widest text-xs hover:bg-[var(--highlight)] transition-colors bg-[var(--card)]">
                                Nueva Consulta
                            </button>
                            <button 
                                onClick={handleSaveReading}
                                disabled={isSavingToDb}
                                className={`py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-sm ${isSaved(genResult) ? 'bg-[var(--gold)] text-white' : 'bg-[var(--text-main)] text-[var(--bg)]'}`}
                            >
                                {isSavingToDb ? (
                                    <i className="ph-duotone ph-spinner animate-spin text-lg"></i>
                                ) : isSaved(genResult) ? (
                                    <><i className="ph-fill ph-bookmark-simple text-lg"></i> Guardado</>
                                ) : (
                                    <><i className="ph-bold ph-bookmark-simple text-lg"></i> Guardar</>
                                )}
                            </button>
                        </div>
                        
                        <div className="flex justify-center">
                             <button onClick={handleShare} className="text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors p-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100">
                                <i className="ph-bold ph-share-network text-lg"></i> Compartir Hallazgo
                             </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
