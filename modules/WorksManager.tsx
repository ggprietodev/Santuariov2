
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, updateWorkStatus, updateWorkRating } from '../services/supabase';
import { extractTextFromFile } from '../services/fileProcessor';
import { analyzeBookContent } from '../services/geminiService';
import { Work, PhilosopherBio, Reading, WorkStatus, WorkInteraction } from '../types';

interface WorksManagerProps {
    works: Work[];
    philosophers: PhilosopherBio[];
    onBack: () => void;
    onWorkAdded?: (work: Work) => void;
    onWorkDeleted?: (id: number) => void;
    userInteractions: Record<number, WorkInteraction>;
    onInteractionUpdate: (workId: number, interaction: WorkInteraction) => void;
}

interface WorkCardProps {
    work: Work;
    interaction?: WorkInteraction;
    onStatusChange: (status: WorkStatus) => void;
    onRatingChange: (rating: number) => void;
    onAnalyze: () => void;
    onDelete: () => void;
}

// --- SUB-COMPONENT: WORK CARD (Enhanced Visuals) ---
const WorkCard: React.FC<WorkCardProps> = ({ 
    work, 
    interaction, 
    onStatusChange, 
    onRatingChange, 
    onAnalyze, 
    onDelete 
}) => {
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const rating = interaction?.rating || 0;
    const status = interaction?.status || 'to_read';

    const statusConfig = {
        'to_read': { label: 'Por Leer', icon: 'ph-hourglass', color: 'text-stone-500', bg: 'bg-stone-100 dark:bg-stone-800' },
        'reading': { label: 'En Curso', icon: 'ph-book-open', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        'completed': { label: 'Terminado', icon: 'ph-check-circle', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
    };

    const currentStatus = statusConfig[status || 'to_read'];

    const typeMeta = {
        'text': { icon: 'ph-article', color: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400' },
        'epub': { icon: 'ph-book-bookmark', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' },
        'pdf':  { icon: 'ph-file-pdf', color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
        'audio':{ icon: 'ph-headphones', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' },
        'video':{ icon: 'ph-video', color: 'bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400' }
    }[work.type] || { icon: 'ph-file', color: 'bg-gray-100' };

    return (
        <div className="bg-[var(--card)] rounded-[24px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full animate-fade-in">
            {/* Status Strip */}
            <div className={`h-1.5 w-full ${status === 'completed' ? 'bg-emerald-500' : status === 'reading' ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
            
            <div className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start gap-3 mb-3">
                    <div className={`w-12 h-16 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)] shadow-inner relative overflow-hidden ${typeMeta.color}`}>
                        <div className="absolute left-1 top-0 bottom-0 w-[2px] bg-black/10"></div>
                        <i className={`ph-duotone ${typeMeta.icon} text-2xl`}></i>
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                        <h4 className="serif font-bold text-base leading-tight text-[var(--text-main)] mb-1 line-clamp-2" title={work.title}>{work.title}</h4>
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-50 truncate">
                            <i className="ph-fill ph-pen-nib"></i>
                            <span>{work.author}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <a href={work.link_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-sub)] hover:bg-[var(--highlight)] transition-colors border border-[var(--border)]">
                            <i className="ph-bold ph-arrow-up-right text-xs"></i>
                        </a>
                        <button onClick={onAnalyze} className="w-8 h-8 rounded-full flex items-center justify-center text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border border-[var(--border)]" title="Analizar con IA">
                            <i className="ph-bold ph-sparkle text-xs"></i>
                        </button>
                    </div>
                </div>

                <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <button 
                        onClick={() => onStatusChange(status === 'reading' ? 'completed' : status === 'to_read' ? 'reading' : 'to_read')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${currentStatus.bg} ${currentStatus.color}`}
                    >
                        <i className={`ph-fill ${currentStatus.icon}`}></i>
                        {currentStatus.label}
                    </button>

                    <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(null)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => onRatingChange(star)}
                                className="focus:outline-none p-0.5 transition-transform active:scale-90"
                            >
                                <i className={`text-xs ${star <= (hoverRating ?? rating) ? 'ph-fill ph-star text-[var(--gold)]' : 'ph-bold ph-star text-[var(--border)]'}`}></i>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <button onClick={(e) => {e.stopPropagation(); onDelete();}} className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                <i className="ph-bold ph-trash"></i>
            </button>
        </div>
    );
};

export function WorksManager({ works, philosophers, onBack, onWorkAdded, onWorkDeleted, userInteractions, onInteractionUpdate }: WorksManagerProps) {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [searchTerm, setSearchTerm] = useState("");
    
    // Filters
    const [filterStatus, setFilterStatus] = useState<'all' | 'reading' | 'to_read' | 'completed'>('all');
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'title'>('recent');
    
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Add Work State
    const [newTitle, setNewTitle] = useState("");
    const [newAuthor, setNewAuthor] = useState("");
    const [newLink, setNewLink] = useState("");
    const [newType, setNewType] = useState<Work['type']>('text');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Analysis State
    const [analyzingWork, setAnalyzingWork] = useState<Work | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<Reading[]>([]);
    const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) setCurrentUserId(user.id);
        };
        load();
    }, []);

    // Extract Stats
    const stats = useMemo(() => {
        let reading = 0, completed = 0, to_read = 0;
        works.forEach(w => {
            const s = userInteractions[w.id!]?.status;
            if(s === 'reading') reading++;
            else if(s === 'completed') completed++;
            else to_read++;
        });
        return { reading, completed, to_read };
    }, [works, userInteractions]);

    const handleStatusChange = async (workId: number, status: WorkStatus) => {
        if(!currentUserId || !workId) return;
        const newInteraction = { ...userInteractions[workId], work_id: workId, status };
        onInteractionUpdate(workId, newInteraction);
        await updateWorkStatus(currentUserId, workId, status);
    };

    const handleRatingChange = async (workId: number, rating: number) => {
        if(!currentUserId || !workId) return;
        const newInteraction = { ...userInteractions[workId], work_id: workId, rating };
        onInteractionUpdate(workId, newInteraction);
        await updateWorkRating(currentUserId, workId, rating);
    };

    const handleAddWork = async () => {
        const titleTrimmed = newTitle.trim();
        const linkTrimmed = newLink.trim();
        if(!titleTrimmed || !linkTrimmed) { alert("Título y enlace requeridos."); return; }
        if(!currentUserId) { alert("Debes iniciar sesión."); return; }

        setIsSubmitting(true);
        const philosopherMatch = philosophers.find(p => p.name.toLowerCase() === newAuthor.toLowerCase());
        
        const payload: any = { 
            title: titleTrimmed, 
            author: newAuthor.trim(), 
            link_url: linkTrimmed, 
            type: newType, 
            philosopher_id: philosopherMatch ? philosopherMatch.id : null,
            user_id: currentUserId,
            created_at: new Date().toISOString() 
        };

        const { data, error } = await supabase.from('content_works').insert(payload).select();
        setIsSubmitting(false);

        if(!error) {
            if (data && data[0] && onWorkAdded) onWorkAdded(data[0] as Work);
            setView('list'); setNewTitle(""); setNewAuthor(""); setNewLink("");
        } else {
            alert("Error: " + error.message);
        }
    };

    const handleDeleteWork = async (id: number) => {
        if(confirm("¿Eliminar esta obra de la biblioteca?")) {
            if (onWorkDeleted) onWorkDeleted(id);
            await supabase.from('content_works').delete().eq('id', id);
        }
    };

    const handleAnalyze = async () => {
        if(!file || !analyzingWork) return;
        setIsProcessing(true);
        try {
            const text = await extractTextFromFile(file);
            const readings = await analyzeBookContent(text, analyzingWork.author);
            const enrichedReadings = readings.map((r, idx) => ({ ...r, source_work_id: analyzingWork.id, type: 'cita' as const, _tempId: idx }));
            setAnalysisResults(enrichedReadings);
            setSelectedResults(new Set(enrichedReadings.map((_, i) => i)));
        } catch (e: any) { alert(e.message); } finally { setIsProcessing(false); }
    };

    const handleSaveSelectedReadings = async () => {
        const toSave = analysisResults.filter((_, i) => selectedResults.has(i));
        if (toSave.length === 0) return;

        const dbPayload = toSave.map(r => ({ 
            title: r.t, 
            quote: r.q, 
            body: r.b, 
            author: r.a, 
            tags: r.k, 
            type: r.type, 
            philosophy: r.philosophy, 
            source_work_id: r.source_work_id, 
            created_at: new Date().toISOString() 
        }));

        const { error } = await supabase.from('content_readings').upsert(dbPayload, { onConflict: 'quote', ignoreDuplicates: true });
        if(!error) { 
            alert(`${toSave.length} citas guardadas.`); 
            setAnalyzingWork(null); 
            setAnalysisResults([]); 
            setFile(null); 
        } else {
            alert("Error al guardar: " + error.message);
        }
    };

    // --- FILTER LOGIC ---
    const filteredWorks = works.filter(w => {
        const matchSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) || w.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || (userInteractions[w.id!]?.status || 'to_read') === filterStatus;
        const matchType = filterType === 'all' || w.type === filterType;
        return matchSearch && matchStatus && matchType;
    }).sort((a, b) => (sortBy === 'title' ? a.title.localeCompare(b.title) : sortBy === 'rating' ? (userInteractions[b.id!]?.rating || 0) - (userInteractions[a.id!]?.rating || 0) : new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));

    // ANALYSIS MODAL RENDER
    if (analyzingWork) {
        return (
            <div className="fixed inset-0 z-[100] bg-[var(--bg)] flex flex-col items-center animate-fade-in">
                <div className="w-full max-w-2xl h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <h3 className="serif text-2xl font-bold">Extracción de Sabiduría</h3>
                        <button onClick={() => { setAnalyzingWork(null); setAnalysisResults([]); setFile(null); }} className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--highlight)]"><i className="ph-bold ph-x"></i></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {!analysisResults.length ? (
                            <div className="h-full flex flex-col justify-center">
                                <div className="text-center mb-8">
                                    <h4 className="serif text-xl font-bold mb-2">{analyzingWork.title}</h4>
                                    <p className="text-xs opacity-50 uppercase tracking-widest">{analyzingWork.author}</p>
                                </div>

                                <div className="border-2 border-dashed border-[var(--border)] rounded-[32px] p-10 cursor-pointer relative group hover:border-[var(--text-main)] transition-colors bg-[var(--card)]">
                                    <input type="file" accept=".txt,.epub" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div className="flex flex-col items-center gap-4">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-[var(--highlight)] text-[var(--text-sub)]'}`}>
                                            <i className={`ph-duotone ${file ? 'ph-file-text' : 'ph-upload-simple'} text-4xl`}></i>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{file ? file.name : "Sube el archivo (EPUB / TXT)"}</p>
                                            {!file && <p className="text-xs opacity-50 mt-1">La IA extraerá las mejores citas.</p>}
                                        </div>
                                    </div>
                                </div>
                                
                                <button onClick={handleAnalyze} disabled={!file || isProcessing} className="w-full py-5 bg-[var(--text-main)] text-[var(--bg)] rounded-[24px] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 mt-8 transition-all hover:scale-[1.01]">
                                    {isProcessing ? <><i className="ph-duotone ph-spinner animate-spin text-xl"></i> Leyendo...</> : <><i className="ph-bold ph-sparkle text-xl"></i> Iniciar Análisis</>}
                                </button>
                            </div>
                        ) : (
                            <div className="pb-24">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">{selectedResults.size} seleccionadas</span>
                                    <button onClick={() => setSelectedResults(new Set(selectedResults.size === analysisResults.length ? [] : analysisResults.map((_, i) => i)))} className="text-xs font-bold text-[var(--gold)]">
                                        {selectedResults.size === analysisResults.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {analysisResults.map((r, i) => {
                                        const isSelected = selectedResults.has(i);
                                        return (
                                            <div key={i} onClick={() => setSelectedResults(prev => { const n = new Set(prev); if(n.has(i)) n.delete(i); else n.add(i); return n; })} className={`p-6 rounded-[24px] border cursor-pointer transition-all ${isSelected ? 'bg-[var(--card)] border-[var(--text-main)] shadow-md' : 'bg-transparent border-[var(--border)] opacity-60 hover:opacity-100'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg)]' : 'border-[var(--text-sub)]'}`}>
                                                        {isSelected && <i className="ph-bold ph-check text-xs"></i>}
                                                    </span>
                                                    <span className="text-[9px] uppercase font-bold tracking-widest opacity-40">{r.k?.join(' • ')}</span>
                                                </div>
                                                <p className="serif italic text-base opacity-90 mb-3">"{r.q}"</p>
                                                <p className="text-xs opacity-60 leading-relaxed">{r.b}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    {analysisResults.length > 0 && (
                        <div className="absolute bottom-6 left-6 right-6">
                            <button onClick={handleSaveSelectedReadings} disabled={selectedResults.size === 0} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-[24px] font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]">
                                <i className="ph-bold ph-floppy-disk text-lg"></i> Guardar en Biblioteca
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm border border-[var(--border)] active:scale-95 transition-transform"><i className="ph-bold ph-arrow-left"></i></button>
                    <h2 className="serif text-2xl font-bold">Obras</h2>
                </div>
                <button onClick={() => setView(view === 'list' ? 'add' : 'list')} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-[var(--border)] transition-colors ${view === 'add' ? 'bg-[var(--text-main)] text-[var(--bg)]' : 'bg-[var(--card)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>
                    <i className={`ph-bold ${view === 'list' ? 'ph-plus' : 'ph-list'}`}></i>
                </button>
            </div>

            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-2">
                {view === 'add' ? (
                    <div className="bg-[var(--card)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm space-y-4 animate-fade-in">
                        <h3 className="serif text-xl font-bold mb-6">Registrar Obra</h3>
                        <div className="space-y-4">
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-[var(--highlight)] p-4 rounded-2xl outline-none font-serif text-lg border border-transparent focus:border-[var(--text-main)]" placeholder="Título" />
                            <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} className="w-full bg-[var(--highlight)] p-4 rounded-2xl outline-none font-serif text-lg border border-transparent focus:border-[var(--text-main)]" placeholder="Autor" list="philosophers-list" />
                            <datalist id="philosophers-list">{philosophers.map(p => <option key={p.id} value={p.name} />)}</datalist>
                            <input value={newLink} onChange={e => setNewLink(e.target.value)} className="w-full bg-[var(--highlight)] p-4 rounded-2xl outline-none text-sm font-mono opacity-80 border border-transparent focus:border-[var(--text-main)]" placeholder="Enlace (URL)" />
                            <div className="flex gap-2 flex-wrap">
                                {['text', 'epub', 'pdf', 'audio'].map((t:any) => (
                                    <button key={t} onClick={() => setNewType(t)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${newType === t ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] text-[var(--text-sub)] border-[var(--border)]'}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleAddWork} disabled={isSubmitting} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest mt-4 shadow-lg">{isSubmitting ? "Guardando..." : "Guardar en Estantería"}</button>
                    </div>
                ) : (
                    <>
                        {/* Stats Dashboard */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-[24px] border border-amber-100 dark:border-amber-900/20 text-center">
                                <span className="block text-2xl font-serif font-bold text-amber-700 dark:text-amber-400">{stats.reading}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800/60 dark:text-amber-200/60">Leyendo</span>
                            </div>
                            <div className="bg-stone-50 dark:bg-stone-900/40 p-4 rounded-[24px] border border-stone-100 dark:border-stone-800 text-center">
                                <span className="block text-2xl font-serif font-bold text-stone-600 dark:text-stone-400">{stats.to_read}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500/60">Pendientes</span>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-[24px] border border-emerald-100 dark:border-emerald-900/20 text-center">
                                <span className="block text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">{stats.completed}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-800/60 dark:text-emerald-200/60">Fin</span>
                            </div>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className="bg-[var(--card)] p-2 rounded-[20px] border border-[var(--border)] shadow-sm mb-6 flex flex-col gap-2">
                            <div className="flex items-center gap-3 px-3 py-1">
                                <i className="ph-bold ph-magnifying-glass opacity-30"></i>
                                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar obra o autor..." className="bg-transparent text-sm font-serif outline-none w-full placeholder:opacity-40" />
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                                {['all', 'reading', 'to_read', 'completed'].map((st:any) => (
                                    <button 
                                        key={st} 
                                        onClick={() => setFilterStatus(st)} 
                                        className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all ${filterStatus===st ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--highlight)] text-[var(--text-sub)] border-transparent'}`}
                                    >
                                        {st === 'all' ? 'Todo' : st === 'reading' ? 'En Curso' : st === 'to_read' ? 'Pendiente' : 'Terminado'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {filteredWorks.map((work) => (
                                <WorkCard key={work.id} work={work} interaction={userInteractions[work.id!]} onStatusChange={(s) => handleStatusChange(work.id!, s)} onRatingChange={(r) => handleRatingChange(work.id!, r)} onAnalyze={() => setAnalyzingWork(work)} onDelete={() => work.id && handleDeleteWork(work.id)} />
                            ))}
                            {filteredWorks.length === 0 && <div className="text-center opacity-30 py-10 italic font-serif col-span-full">Tu estantería está vacía o no hay coincidencias.</div>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
