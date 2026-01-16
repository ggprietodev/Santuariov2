
import React, { useState, useEffect, useMemo } from 'react';
import { getISO, supabase, saveJournalLog } from '../services/supabase';
import { JournalEntry, Reading, PhilosopherBio, SharedItem, Meditation, Lesson, Task, UserProfile, Work } from '../types';
import { MoodIcon, UserAvatar } from '../components/Shared';
import { expandReadingAI } from '../services/geminiService';
import { DailyReviewModal } from '../components/DailyReviewModal';
import { LevelBadge } from '../components/LevelBadge';
import { JournalModule } from '../modules/Journal';

// HELPER: Reconstruct Journal Content sequentially
const rebuildJournalContent = (existingHtml: string, newEntryHtml: string) => {
    // 1. Identify parts in NEW entry
    const isMorning = newEntryHtml.includes('ritual-block-morning');
    const isEvening = newEntryHtml.includes('ritual-block-evening');
    
    // 2. Separate EXISTING parts
    const morningRegex = /<div class="ritual-block ritual-block-morning".*?<\/div>/s;
    const eveningRegex = /<div class="ritual-block ritual-block-evening".*?<\/div>/s;

    let morningBlock = existingHtml.match(morningRegex)?.[0] || "";
    let eveningBlock = existingHtml.match(eveningRegex)?.[0] || "";
    
    // Everything else is considered "Free/Other" content
    let otherContent = existingHtml
        .replace(morningBlock, '')
        .replace(eveningBlock, '')
        .trim();

    // 3. Update with NEW content
    if (isMorning) {
        morningBlock = newEntryHtml; // Replace/Set Morning
    } else if (isEvening) {
        eveningBlock = newEntryHtml; // Replace/Set Evening
    } else {
        // Assume it's free text -> Append to "Other"
        otherContent += (otherContent ? "<br/><br/>" : "") + newEntryHtml;
    }

    // 4. Reconstruct in STRICT ORDER: Morning -> Other -> Evening
    let finalHtml = "";
    if (morningBlock) finalHtml += morningBlock;
    if (otherContent) finalHtml += (finalHtml ? "<br/>" : "") + otherContent;
    if (eveningBlock) finalHtml += (finalHtml ? "<br/><br/>" : "") + eveningBlock;

    return finalHtml;
};

interface TodayViewProps {
    journal: Record<string, JournalEntry>;
    onSaveEntry: (date: string, entry: JournalEntry) => void;
    onOpenSettings: () => void;
    onNavigateToProfile: () => void;
    onNavigateToArena: () => void;
    onToggleSaveQuote: (r: Reading) => void;
    savedReadings: Reading[];
    onNavigateToMasters: () => void;
    onNavigateToPath: () => void;
    dailyReading: Reading | null; 
    dailyPhilosopher: PhilosopherBio | null; 
    isPhilosopherMatch?: boolean;
    dailyMeditation?: Meditation | null; 
    dailyTask: Task | null; 
    dailyQuestion?: string;
    onNavigateToChallenge: () => void; 
    onNavigateToMeditation: (m: Meditation) => void; 
    onNavigateToPhilosopher: (id: string) => void;
    onShare?: (item: SharedItem) => void;
    user: string;
    currentReads?: Work[];
    onAddXP: (amount: number) => void; 
    userProfile: UserProfile | null;
    onOpenSearch?: () => void; 
}

export function TodayView({ 
    journal, 
    onSaveEntry, 
    onOpenSettings, 
    onNavigateToProfile,
    onNavigateToArena, 
    onToggleSaveQuote, 
    savedReadings, 
    onNavigateToMasters, 
    onNavigateToPath,
    dailyReading,
    dailyPhilosopher,
    isPhilosopherMatch,
    dailyMeditation,
    dailyTask,
    dailyQuestion,
    onNavigateToChallenge,
    onNavigateToMeditation,
    onNavigateToPhilosopher,
    onShare,
    user,
    currentReads = [],
    onAddXP,
    userProfile,
    onOpenSearch
}: TodayViewProps) {
    const today = getISO();
    
    const [entry, setEntry] = useState<JournalEntry>({ 
        text: '', 
        mood: 0, 
        question_response: '', 
        challenge_response: '',
        challenge_completed: false,
        challenge_status: undefined
    });

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isJournalModuleOpen, setIsJournalModuleOpen] = useState(false);
    const [journalMode, setJournalMode] = useState<'morning' | 'evening' | 'free' | null>(null);
    const [expandedContent, setExpandedContent] = useState<string | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);

    // CHECK COMPLETION STATUS
    const isMorningDone = useMemo(() => (entry.text || "").includes("ritual-block-morning"), [entry.text]);
    const isEveningDone = useMemo(() => (entry.text || "").includes("ritual-block-evening"), [entry.text]);
    const hasAnyContent = (entry.text && entry.text.length > 10) || (entry.question_response && entry.question_response.length > 0);

    const isDailySaved = dailyReading ? savedReadings.some((r: Reading) => r.t === dailyReading.t) : false;

    useEffect(() => {
        if (journal[today]) {
            setEntry(prev => ({ ...prev, ...journal[today] }));
        }
    }, [journal, today]);

    // --- NEXT LESSON LOGIC ---
    const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
    const [nextLessonModuleTitle, setNextLessonModuleTitle] = useState<string>("");

    useEffect(() => {
        const findNextLesson = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: progress } = await supabase.from('user_progress').select('lesson_id').eq('user_id', user.id);
            const completedIds = new Set(progress?.map(p => p.lesson_id) || []);

            const { data: modules } = await supabase.from('content_modules').select('*, lessons:content_lessons(*)').order('sort_order', { ascending: true });
            
            if (modules) {
                for (const mod of modules) {
                    if (mod.lessons) {
                        const sortedLessons = mod.lessons.sort((a: any, b: any) => a.sort_order - b.sort_order);
                        for (const lesson of sortedLessons) {
                            if (!completedIds.has(lesson.id)) {
                                setNextLesson(lesson);
                                setNextLessonModuleTitle(mod.title);
                                return; 
                            }
                        }
                    }
                }
            }
        };
        findNextLesson();
    }, []);

    const handleJournalModuleSave = async (date: string, newEntry: JournalEntry, title?: string, tags?: string[], structured_answers?: any) => {
        // STRICT REORDERING: Morning -> Free -> Evening
        const mergedText = rebuildJournalContent(entry.text || "", newEntry.text || "");

        const finalEntry = { ...entry, ...newEntry, text: mergedText };
        setEntry(finalEntry);
        
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            await saveJournalLog(user.id, date, finalEntry, title, tags, structured_answers);
        }
        
        onSaveEntry(date, finalEntry);
        if (title && onAddXP) onAddXP(5); 
    };

    const handleMoodChange = (m: number) => {
        const newEntry = { ...entry, mood: m };
        setEntry(newEntry);
        onSaveEntry(today, newEntry);
        
        // Also save to DB
        supabase.auth.getUser().then(({data}) => {
            if(data.user) {
                saveJournalLog(data.user.id, today, newEntry, undefined, undefined, undefined);
            }
        });
    };

    const handleChallengeStatus = (e: React.MouseEvent, status: 'success' | 'failed') => {
        e.stopPropagation(); 
        const newEntry = { 
            ...entry, 
            challenge_completed: status === 'success', 
            challenge_status: status 
        };
        setEntry(newEntry);
        onSaveEntry(today, newEntry);
        
        supabase.auth.getUser().then(({data}) => {
            if(data.user) {
                saveJournalLog(data.user.id, today, newEntry, undefined, undefined, undefined);
            }
        });
        
        if (status === 'success' && onAddXP) {
            onAddXP(3);
        }
    }

    const handleShareDaily = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(onShare && dailyReading) {
            onShare({
                type: 'reading',
                title: dailyReading.t,
                content: expandedContent || dailyReading.q,
                subtitle: dailyReading.a,
                extra: 'Lectura Diaria',
                data: dailyReading
            });
        }
    }

    const handleExpandReading = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if(expandedContent || !dailyReading) return; 
        setIsExpanding(true);
        const newText = await expandReadingAI(dailyReading.t, dailyReading.q, dailyReading.a || "Filósofo Estoico");
        if(newText) setExpandedContent(newText);
        setIsExpanding(false);
    }

    const handleSaveAnalysis = (adviceHtml: string) => {
        const newContent = (entry.text || "") + adviceHtml;
        const newEntry = { ...entry, text: newContent };
        setEntry(newEntry);
        onSaveEntry(today, newEntry);
        if(onAddXP) onAddXP(2);
    };

    const isChallengeDone = entry.challenge_status === 'success';
    const isChallengeFailed = entry.challenge_status === 'failed';

    const renderIcon = (iconStr: string) => {
        if (!iconStr) return <i className="ph-fill ph-student"></i>;
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
        return <i className={`ph-fill ph-${clean}`}></i>;
    };

    const openJournal = (mode: 'morning' | 'evening' | 'free') => {
        setJournalMode(mode);
        setIsJournalModuleOpen(true);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
             
             {/* 1. HEADER */}
             <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--border)] transition-all">
                 <div>
                    <h2 className="serif text-2xl font-bold">Hoy</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                        {new Date().toLocaleDateString(undefined, {weekday: 'long', day: 'numeric'})}
                    </p>
                 </div>
                 <div className="flex items-center gap-3">
                     <LevelBadge xp={userProfile?.xp || 0} showLabel={false} />
                     
                     <button onClick={onOpenSearch} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] shadow-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors">
                        <i className="ph-bold ph-magnifying-glass"></i>
                     </button>

                     <button onClick={onNavigateToProfile} className="rounded-full shadow-sm hover:scale-105 transition-transform overflow-hidden">
                        <UserAvatar name={user} avatarUrl={userProfile?.avatar} size="md" />
                     </button>
                     <button onClick={onOpenSettings} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] shadow-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"><i className="ph-bold ph-gear"></i></button>
                 </div>
             </div>

             <div className="w-full max-w-2xl flex-1 overflow-y-auto px-4 sm:px-6 pb-40 no-scrollbar pt-4">
                 
                 {/* 2. DAILY WISDOM (ORANGE THEME) */}
                 {dailyReading ? (
                     <div className="relative mb-6 sm:mb-8 group">
                         <div className="relative bg-orange-50 dark:bg-orange-900/10 p-5 sm:p-8 rounded-[32px] border border-orange-100 dark:border-orange-900/30 shadow-sm">
                             <div className="flex justify-between items-start mb-4 sm:mb-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-orange-900/50 dark:text-orange-200/50 mb-1">Sabiduría del Día</span>
                                    <h3 className="serif text-lg sm:text-xl font-bold leading-tight line-clamp-2 text-orange-900 dark:text-orange-50">{dailyReading.t}</h3>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={handleShareDaily} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-800 dark:text-orange-200 active:scale-95">
                                        <i className="ph-bold ph-share-network text-lg"></i>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleSaveQuote(dailyReading); }} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:bg-orange-100 dark:hover:bg-orange-900/40 active:scale-95 ${isDailySaved ? 'text-orange-600' : 'text-orange-800 dark:text-orange-200'}`}>
                                        <i className={`ph-${isDailySaved ? 'fill' : 'bold'} ph-bookmark text-lg`}></i>
                                    </button>
                                </div>
                             </div>
                             
                             <div className="mb-6 relative">
                                 <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-300 dark:bg-orange-700 rounded-full"></div>
                                 <p className={`serif text-base sm:text-xl leading-relaxed pl-5 relative z-10 whitespace-pre-wrap transition-all ${expandedContent ? 'text-orange-900 dark:text-orange-100' : 'text-orange-900 dark:text-orange-100 opacity-90'}`}>
                                     {expandedContent || dailyReading.q}
                                 </p>
                                 {!expandedContent && dailyReading.b && (
                                     <p className="mt-4 pl-5 serif-text text-sm opacity-60 leading-relaxed text-orange-900 dark:text-orange-100">
                                         {dailyReading.b}
                                     </p>
                                 )}
                             </div>

                             <div className="flex justify-between items-center">
                                {/* AUTHOR PILL (SKY THEME) */}
                                <div 
                                    className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity group/author bg-sky-50 dark:bg-sky-900/20 pl-1 pr-3 py-1 rounded-full border border-sky-100 dark:border-sky-800/30 max-w-[70%]"
                                    onClick={() => dailyPhilosopher && onNavigateToPhilosopher(dailyPhilosopher.id)}
                                >
                                    {dailyPhilosopher && (
                                        <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-200 text-sm shadow-sm">
                                            {renderIcon(dailyPhilosopher.icon)}
                                        </div>
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300 truncate">{dailyReading.a}</span>
                                </div>
                                
                                {!expandedContent && (
                                    <button 
                                        onClick={handleExpandReading} 
                                        disabled={isExpanding}
                                        className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-800/50 text-orange-800 dark:text-orange-200 transition-colors opacity-80 hover:opacity-100"
                                    >
                                        {isExpanding ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-bold ph-sparkle"></i>}
                                        {isExpanding ? '...' : 'Profundizar'}
                                    </button>
                                )}
                             </div>
                         </div>
                     </div>
                 ) : (
                     <div className="mb-6 sm:mb-8 bg-[var(--card)] p-8 rounded-[32px] border-2 border-dashed border-[var(--border)] text-center opacity-60 flex flex-col items-center gap-2">
                         <i className="ph-duotone ph-cloud-slash text-4xl mb-1"></i>
                         <h3 className="serif font-bold text-lg">Bibliotecas Vacías</h3>
                         <p className="text-xs max-w-xs">La base de datos no tiene contenido. Usa el <span className="font-bold cursor-pointer underline" onClick={onOpenSettings}>Admin Generator</span> para poblar el mundo.</p>
                     </div>
                 )}

                 {/* 3. MOOD TRACKER */}
                 <div className="mb-6">
                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-4 mb-2 block">Estado de Ánimo</span>
                     <div className="flex justify-between items-center bg-[var(--card)] px-4 sm:px-6 py-5 rounded-[32px] border border-[var(--border)] shadow-sm gap-2 overflow-x-auto no-scrollbar">
                         {[1, 2, 3, 4, 5].map((m) => (
                             <MoodIcon key={m} m={m} active={entry.mood === m} onClick={() => handleMoodChange(m)} />
                         ))}
                     </div>
                 </div>

                 {/* 4. RITUAL CARDS & JOURNALING (REPLACES OLD EDITOR) */}
                 <div className="mb-8">
                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-4 mb-2 block">El Diario</span>
                     
                     <div className="grid grid-cols-2 gap-3 mb-3">
                         {/* MORNING CARD */}
                         <button 
                             onClick={() => openJournal('morning')}
                             className={`p-5 rounded-[24px] border flex flex-col justify-between items-start text-left min-h-[120px] shadow-sm transition-all group relative overflow-hidden ${isMorningDone ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' : 'bg-[#FFF8E1] dark:bg-[#1a1610] border-amber-100 dark:border-amber-900/40'}`}
                         >
                             <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <i className="ph-fill ph-sun-horizon text-6xl text-amber-500"></i>
                             </div>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2 z-10 ${isMorningDone ? 'bg-amber-200 text-amber-700' : 'bg-white/50 text-amber-600'}`}>
                                 <i className={`ph-fill ${isMorningDone ? 'ph-check' : 'ph-sun-horizon'}`}></i>
                             </div>
                             <div className="z-10">
                                 <h3 className="serif font-bold text-base text-amber-900 dark:text-amber-50">Amanecer</h3>
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60 dark:text-amber-200/60 mt-1">
                                     {isMorningDone ? 'Completado' : 'Propósito del Día'}
                                 </p>
                             </div>
                         </button>

                         {/* EVENING CARD */}
                         <button 
                             onClick={() => openJournal('evening')}
                             className={`p-5 rounded-[24px] border flex flex-col justify-between items-start text-left min-h-[120px] shadow-sm transition-all group relative overflow-hidden ${isEveningDone ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-[#EEF2FF] dark:bg-[#0F172A] border-indigo-100 dark:border-indigo-900/40'}`}
                         >
                             <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <i className="ph-fill ph-moon-stars text-6xl text-indigo-500"></i>
                             </div>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2 z-10 ${isEveningDone ? 'bg-indigo-200 text-indigo-700' : 'bg-white/50 text-indigo-600'}`}>
                                 <i className={`ph-fill ${isEveningDone ? 'ph-check' : 'ph-moon-stars'}`}></i>
                             </div>
                             <div className="z-10">
                                 <h3 className="serif font-bold text-base text-indigo-900 dark:text-indigo-50">Anochecer</h3>
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-800/60 dark:text-indigo-200/60 mt-1">
                                     {isEveningDone ? 'Completado' : 'Examen y Pregunta'}
                                 </p>
                             </div>
                         </button>
                     </div>

                     {/* FREE WRITING BUTTON */}
                     <button 
                        onClick={() => openJournal('free')}
                        className="w-full py-4 bg-[var(--card)] border border-[var(--border)] rounded-[24px] flex items-center justify-center gap-2 text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--highlight)] transition-all shadow-sm text-xs font-bold uppercase tracking-widest"
                     >
                         <i className="ph-bold ph-pen-nib text-lg"></i> Escritura Libre
                     </button>
                 </div>

                 {/* 5. JOURNAL CONTENT DISPLAY (READ ONLY) */}
                 {hasAnyContent && (
                     <div className="mb-8 animate-fade-in relative group">
                         <div className="absolute -inset-1 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 rounded-[26px] opacity-50 blur-sm group-hover:opacity-70 transition-opacity"></div>
                         <div className="relative bg-[#FDFBF7] dark:bg-[#1C1917] p-6 sm:p-8 rounded-[24px] border border-stone-200 dark:border-stone-800 shadow-sm text-stone-800 dark:text-stone-300">
                             <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                                 <div className="flex items-center gap-2 opacity-50">
                                     <i className="ph-fill ph-book-open-text"></i>
                                     <span className="text-[10px] font-bold uppercase tracking-[2px]">Tus Registros</span>
                                 </div>
                                 <span className="serif italic text-xs opacity-40">Hoy</span>
                             </div>
                             
                             <div className="serif text-base leading-loose opacity-90 whitespace-pre-wrap prose dark:prose-invert max-w-none journal-content" dangerouslySetInnerHTML={{ __html: entry.text || "" }}></div>
                             
                             {entry.question_response && (
                                 <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
                                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 block mb-2 text-indigo-500">Respuesta a la Pregunta</span>
                                     <p className="serif italic text-sm opacity-80">{entry.question_response}</p>
                                 </div>
                             )}

                             <div className="flex justify-center mt-8">
                                 <button onClick={() => openJournal('free')} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 flex items-center gap-1 transition-opacity">
                                     <i className="ph-bold ph-pencil-simple"></i> Continuar escribiendo
                                 </button>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* 6. CHALLENGE (ROSE THEME) */}
                 {dailyTask && (
                     <div onClick={onNavigateToChallenge} className="w-full cursor-pointer bg-rose-50 dark:bg-rose-900/10 p-6 sm:p-8 rounded-[32px] border border-rose-100 dark:border-rose-900/30 shadow-sm transition-all active:scale-[0.99] hover:shadow-md relative overflow-hidden group mb-6 sm:mb-8">
                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i className="ph-duotone ph-sword text-7xl sm:text-8xl text-rose-600 dark:text-rose-400"></i>
                        </div>
                        <div className="relative z-10 flex flex-col justify-between">
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-rose-800 dark:text-rose-200 mb-2 block">Reto Diario</span>
                                <h3 className="serif font-bold text-lg sm:text-xl leading-tight text-rose-900 dark:text-rose-50 line-clamp-2 mb-4">{dailyTask.title}</h3>
                                <p className="text-sm text-rose-800/80 dark:text-rose-200/80 line-clamp-2 mb-4">{dailyTask.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={(e) => handleChallengeStatus(e, 'success')} className={`flex-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-3 rounded-full transition-all ${isChallengeDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-2 ring-emerald-500' : 'bg-white/50 dark:bg-black/20 hover:bg-emerald-100/50 text-rose-900 dark:text-rose-100'}`}>
                                    <i className="ph-bold ph-check-circle text-lg"></i> Conseguido
                                </button>
                                <button onClick={(e) => handleChallengeStatus(e, 'failed')} className={`flex-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-3 rounded-full transition-all ${isChallengeFailed ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 ring-2 ring-rose-500' : 'bg-white/50 dark:bg-black/20 hover:bg-rose-100/50 text-rose-900 dark:text-rose-100'}`}>
                                    <i className="ph-bold ph-x-circle text-lg"></i> No Pude
                                </button>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* 7. ACTIVE READING SECTION */}
                 {currentReads.length > 0 && (
                     <div className="mb-6 sm:mb-8 border-t border-[var(--border)] pt-6">
                         <div className="flex items-center gap-2 mb-3 px-1 opacity-60">
                             <i className="ph-fill ph-bookmark-simple text-sm"></i>
                             <span className="text-[10px] font-bold uppercase tracking-widest">En Curso</span>
                         </div>
                         <div className="flex flex-col gap-3">
                             {currentReads.map((work) => (
                                 <div key={work.id} onClick={() => window.open(work.link_url, '_blank')} className="w-full bg-[var(--card)] p-4 rounded-[20px] border border-[var(--border)] shadow-sm flex items-center gap-4 cursor-pointer hover:border-[var(--text-main)] transition-all group">
                                     <div className={`w-10 h-14 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)] bg-amber-50 dark:bg-amber-900/20 relative overflow-hidden`}>
                                         <div className="absolute left-1 top-0 bottom-0 w-[2px] bg-black/10"></div>
                                         <i className={`ph-duotone ${work.type === 'audio' ? 'ph-headphones' : 'ph-book'} text-amber-600 text-lg`}></i>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-start">
                                             <h4 className="serif font-bold text-sm leading-tight truncate text-[var(--text-main)] mb-1">{work.title}</h4>
                                             <i className="ph-bold ph-arrow-up-right text-xs opacity-0 group-hover:opacity-50 transition-opacity"></i>
                                         </div>
                                         <p className="text-[10px] opacity-50 uppercase tracking-widest truncate">{work.author}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div onClick={onNavigateToPath} className="col-span-1 cursor-pointer bg-[#FAF5FF] dark:bg-[#1E1024] p-5 sm:p-6 rounded-[28px] border border-purple-100 dark:border-purple-900/20 shadow-sm transition-all active:scale-[0.99] hover:shadow-md relative overflow-hidden group flex flex-col justify-between min-h-[160px]">
                        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i className="ph-duotone ph-path text-7xl sm:text-8xl text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-purple-800 dark:text-purple-200 mb-2 block">Tu Camino</span>
                            {nextLesson ? (
                                <>
                                    <div className="text-[10px] opacity-60 mb-1 font-medium truncate">{nextLessonModuleTitle}</div>
                                    <h3 className="serif font-bold text-base sm:text-lg leading-tight text-purple-900 dark:text-purple-50 line-clamp-2">{nextLesson.title}</h3>
                                </>
                            ) : (
                                <h3 className="serif font-bold text-base sm:text-lg leading-tight text-purple-900 dark:text-purple-50">Curso Completado</h3>
                            )}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300">
                            <i className="ph-fill ph-play-circle text-sm"></i> <span>Continuar</span>
                        </div>
                    </div>

                    <div 
                        onClick={() => dailyMeditation && onNavigateToMeditation(dailyMeditation)} 
                        className="col-span-1 cursor-pointer bg-slate-50 dark:bg-slate-900/10 p-5 sm:p-6 rounded-[28px] border border-slate-100 dark:border-slate-800/30 shadow-sm transition-all active:scale-[0.98] hover:shadow-md group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
                    >
                        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <i className="ph-duotone ph-waves text-7xl sm:text-8xl text-slate-500"></i>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-2 block">Meditación</span>
                            {dailyMeditation ? (
                                <>
                                    <h3 className="serif font-bold text-base sm:text-lg leading-tight mb-1 line-clamp-2 text-slate-900 dark:text-slate-50">{dailyMeditation.title}</h3>
                                    <p className="text-[10px] text-slate-700 dark:text-slate-300 opacity-60 line-clamp-1">{dailyMeditation.category}</p>
                                </>
                            ) : (
                                <h3 className="serif font-bold text-base sm:text-lg leading-tight opacity-50 text-slate-900 dark:text-slate-50">Explora la Ciudadela</h3>
                            )}
                        </div>
                        {dailyMeditation && (
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 opacity-60">
                                <i className="ph-fill ph-timer text-sm"></i> {dailyMeditation.duration_minutes} min
                            </div>
                        )}
                    </div>
                 </div>

             </div>

             {/* MENTOR TRIGGER (FLOATING ACTION BUTTON) */}
             {(hasAnyContent || isEveningDone) && (
                 <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
                    <button 
                        onClick={() => setIsReviewModalOpen(true)} 
                        className="w-14 h-14 rounded-full bg-[var(--text-main)] text-[var(--bg)] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-[var(--border)]"
                    >
                        <i className="ph-fill ph-moon-stars text-2xl"></i>
                    </button>
                 </div>
             )}

             <DailyReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                entry={entry}
                dailyTask={dailyTask || {title: "Reto", description: ""}}
                onSaveAnalysis={handleSaveAnalysis}
                user={user}
             />

             {isJournalModuleOpen && (
                 <JournalModule 
                    onClose={() => { setIsJournalModuleOpen(false); setJournalMode(null); }}
                    onSave={handleJournalModuleSave}
                    initialMode={journalMode}
                 />
             )}
        </div>
    );
}
