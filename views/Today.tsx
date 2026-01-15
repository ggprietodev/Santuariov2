
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getISO, supabase } from '../services/supabase';
import { JournalEntry, Reading, PhilosopherBio, SharedItem, Meditation, Lesson, Task, UserProfile, Work } from '../types';
import { MoodIcon, UserAvatar } from '../components/Shared';
import { expandReadingAI, generateJournalPrompt } from '../services/geminiService';
import { DailyReviewModal } from '../components/DailyReviewModal';
import { LevelBadge } from '../components/LevelBadge';

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
    userProfile
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

    const [writingFont, setWritingFont] = useState<'serif' | 'mono' | 'sans'>('serif');
    const [writingTheme, setWritingTheme] = useState<'classic' | 'paper' | 'dark' | 'blue'>('classic');
    const editorRef = useRef<HTMLDivElement>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    
    const [hasAwardedWritingXP, setHasAwardedWritingXP] = useState(false);

    useEffect(() => {
        if (journal[today]) {
            setEntry(prev => ({ ...prev, ...journal[today] }));
            if (editorRef.current && editorRef.current.innerHTML !== journal[today].text) {
                if (!editorRef.current.innerHTML || journal[today].text.length > editorRef.current.innerHTML.length + 10) {
                     editorRef.current.innerHTML = journal[today].text || '';
                }
            }
            if ((journal[today].text?.length || 0) > 50) setHasAwardedWritingXP(true);
        } else {
            if (editorRef.current) editorRef.current.innerHTML = '';
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

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const defaultQuestion = dailyQuestion || "¿En qué has puesto tu atención hoy?";
    
    const [expandedContent, setExpandedContent] = useState<string | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);
    const [aiQuestion, setAiQuestion] = useState<string | null>(null);
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

    const isDailySaved = dailyReading ? savedReadings.some((r: Reading) => r.t === dailyReading.t) : false;

    const saveToParent = (data: JournalEntry) => {
        setSaveStatus('saving');
        onSaveEntry(today, data);
        setTimeout(() => setSaveStatus('saved'), 500);
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const timeoutRef = useRef<any>(null);

    const handleDataChange = (field: keyof JournalEntry, value: string | number) => {
        const newEntry = { ...entry, [field]: value };
        setEntry(newEntry);

        if (!hasAwardedWritingXP && (field === 'text' || field === 'question_response')) {
            const textLength = String(value).replace(/<[^>]*>?/gm, '').length; 
            if (textLength > 20) {
                if(onAddXP) onAddXP(1); 
                setHasAwardedWritingXP(true);
            }
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            saveToParent(newEntry);
        }, 800);
    };

    const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML;
        handleDataChange('text', html);
    };

    const handleMoodChange = (m: number) => {
        const newEntry = { ...entry, mood: m };
        setEntry(newEntry);
        saveToParent(newEntry); 
        if(m !== entry.mood && dailyReading) handleGenerateQuestion(m);
    };

    const handleChallengeStatus = (e: React.MouseEvent, status: 'success' | 'failed') => {
        e.stopPropagation(); 
        const newEntry = { 
            ...entry, 
            challenge_completed: status === 'success', 
            challenge_status: status 
        };
        setEntry(newEntry);
        saveToParent(newEntry);
        
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

    const handleGenerateQuestion = async (currentMood: number) => {
        if(isGeneratingQuestion || !dailyReading) return;
        setIsGeneratingQuestion(true);
        const newQ = await generateJournalPrompt(currentMood, dailyReading.t);
        if(newQ) setAiQuestion(newQ);
        setIsGeneratingQuestion(false);
    }

    const handleSaveAnalysis = (adviceHtml: string) => {
        const newContent = (entry.text || "") + adviceHtml;
        if (editorRef.current) editorRef.current.innerHTML = newContent;
        handleDataChange('text', newContent);
        if(onAddXP) onAddXP(2);
    };

    const executeCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const isChallengeDone = entry.challenge_status === 'success';
    const isChallengeFailed = entry.challenge_status === 'failed';

    const themeStyles = {
        classic: 'bg-[var(--card)] text-[var(--text-main)]',
        paper: 'bg-[#FDFBF7] text-[#4a4a4a] border-stone-200',
        dark: 'bg-[#1a1a1a] text-[#e0e0e0] border-stone-800',
        blue: 'bg-[#f0f8ff] text-[#1e3a8a] border-blue-100'
    };

    const fontStyles = {
        serif: 'serif-text', 
        mono: 'font-mono',
        sans: 'font-sans'
    };

    // ROBUST ICON RENDERER (Same as Philosophers Module)
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
                     <LevelBadge xp={userProfile?.xp || 0} />
                     
                     <button onClick={onNavigateToProfile} className="rounded-full shadow-sm hover:scale-105 transition-transform overflow-hidden">
                        <UserAvatar name={user} avatarUrl={userProfile?.avatar} size="md" />
                     </button>
                     <button onClick={onOpenSettings} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] shadow-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"><i className="ph-bold ph-gear"></i></button>
                 </div>
             </div>

             <div className="w-full max-w-2xl flex-1 overflow-y-auto px-4 sm:px-6 pb-40 no-scrollbar pt-4">
                 
                 {/* 2. DAILY WISDOM (Optimized Mobile) */}
                 {dailyReading ? (
                     <div className="relative mb-6 sm:mb-8 group">
                         <div className="relative bg-[var(--card)] p-5 sm:p-8 rounded-[32px] border border-[var(--border)] shadow-sm">
                             <div className="flex justify-between items-start mb-4 sm:mb-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Sabiduría del Día</span>
                                    <h3 className="serif text-lg sm:text-xl font-bold leading-tight line-clamp-2">{dailyReading.t}</h3>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={handleShareDaily} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:bg-[var(--highlight)] text-[var(--text-sub)] active:scale-95">
                                        <i className="ph-bold ph-share-network text-lg"></i>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleSaveQuote(dailyReading); }} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:bg-[var(--highlight)] active:scale-95 ${isDailySaved ? 'text-[var(--gold)]' : 'text-[var(--text-sub)]'}`}>
                                        <i className={`ph-${isDailySaved ? 'fill' : 'bold'} ph-bookmark text-lg`}></i>
                                    </button>
                                </div>
                             </div>
                             
                             <div className="mb-6 relative">
                                 <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--gold)]/30 rounded-full"></div>
                                 <p className={`serif text-base sm:text-xl leading-relaxed pl-5 relative z-10 whitespace-pre-wrap transition-all ${expandedContent ? 'text-[var(--text-main)]' : 'text-[var(--text-main)] opacity-90'}`}>
                                     {expandedContent || dailyReading.q}
                                 </p>
                                 {!expandedContent && dailyReading.b && (
                                     <p className="mt-4 pl-5 serif-text text-sm opacity-60 leading-relaxed">
                                         {dailyReading.b}
                                     </p>
                                 )}
                             </div>

                             <div className="flex justify-between items-center">
                                <div 
                                    className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity group/author bg-[var(--highlight)] pl-1 pr-3 py-1 rounded-full border border-[var(--border)] max-w-[70%]"
                                    onClick={() => dailyPhilosopher && onNavigateToPhilosopher(dailyPhilosopher.id)}
                                >
                                    {dailyPhilosopher && (
                                        <div className="w-6 h-6 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--text-main)] text-sm shadow-sm border border-[var(--border)]">
                                            {renderIcon(dailyPhilosopher.icon)}
                                        </div>
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover/author:text-[var(--gold)] transition-colors truncate">{dailyReading.a}</span>
                                </div>
                                
                                {!expandedContent && (
                                    <button 
                                        onClick={handleExpandReading} 
                                        disabled={isExpanding}
                                        className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--highlight)] hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors opacity-60 hover:opacity-100"
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
                 <div className="mb-6 sm:mb-8">
                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-4 mb-2 block">Estado de Ánimo</span>
                     <div className="flex justify-between items-center bg-[var(--card)] px-4 sm:px-6 py-5 rounded-[32px] border border-[var(--border)] shadow-sm gap-2 overflow-x-auto no-scrollbar">
                         {[1, 2, 3, 4, 5].map((m) => (
                             <MoodIcon key={m} m={m} active={entry.mood === m} onClick={() => handleMoodChange(m)} />
                         ))}
                     </div>
                 </div>

                 {/* 4. DAILY QUESTION */}
                 <div className="mb-6 sm:mb-8">
                     <div className="flex flex-col relative overflow-hidden">
                         <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2 opacity-50">
                                <i className="ph-bold ph-pencil-simple text-base"></i>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Pregunta del Día</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity ${saveStatus === 'saving' || saveStatus === 'saved' ? 'opacity-50' : 'opacity-0'}`}>
                                    {saveStatus === 'saving' ? 'Guardando...' : 'Guardado'}
                                </span>
                                <button onClick={() => handleGenerateQuestion(entry.mood)} disabled={isGeneratingQuestion || !dailyReading} className={`text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1 ${!dailyReading ? 'opacity-50 cursor-not-allowed' : ''}`} title="Nueva pregunta">
                                    {isGeneratingQuestion ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-arrows-clockwise"></i>}
                                    Nueva
                                </button>
                             </div>
                         </div>
                         
                         <h2 className="serif text-lg font-bold leading-relaxed mb-4 text-[var(--text-main)] opacity-90 transition-all animate-fade-in">{aiQuestion || defaultQuestion}</h2>
                         
                         <textarea
                             value={entry.question_response || ''}
                             onChange={(e) => handleDataChange('question_response', e.target.value)}
                             placeholder="Escribe tu respuesta aquí..."
                             className="w-full bg-[var(--card)] border border-[var(--border)] p-5 rounded-2xl resize-none outline-none text-base serif-text leading-loose min-h-[120px] transition-all focus:border-[var(--text-main)] focus:ring-0 placeholder:opacity-40 shadow-sm"
                         />
                     </div>
                 </div>

                 {/* 5. CHALLENGE */}
                 {dailyTask && (
                     <div onClick={onNavigateToChallenge} className="w-full cursor-pointer bg-[#FFFBEB] dark:bg-[#2C2410] p-6 sm:p-8 rounded-[32px] border border-amber-100 dark:border-amber-900/20 shadow-sm transition-all active:scale-[0.99] hover:shadow-md relative overflow-hidden group mb-6 sm:mb-8">
                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i className="ph-duotone ph-sword text-7xl sm:text-8xl text-amber-600 dark:text-amber-400"></i>
                        </div>
                        <div className="relative z-10 flex flex-col justify-between">
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-200 mb-2 block">Reto Diario</span>
                                <h3 className="serif font-bold text-lg sm:text-xl leading-tight text-amber-900 dark:text-amber-50 line-clamp-2 mb-4">{dailyTask.title}</h3>
                                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 line-clamp-2 mb-4">{dailyTask.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={(e) => handleChallengeStatus(e, 'success')} className={`flex-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-3 rounded-full transition-all ${isChallengeDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-2 ring-emerald-500' : 'bg-white/50 dark:bg-black/20 hover:bg-emerald-100/50 text-amber-900 dark:text-amber-100'}`}>
                                    <i className="ph-bold ph-check-circle text-lg"></i> Conseguido
                                </button>
                                <button onClick={(e) => handleChallengeStatus(e, 'failed')} className={`flex-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-3 rounded-full transition-all ${isChallengeFailed ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 ring-2 ring-rose-500' : 'bg-white/50 dark:bg-black/20 hover:bg-rose-100/50 text-amber-900 dark:text-amber-100'}`}>
                                    <i className="ph-bold ph-x-circle text-lg"></i> No Pude
                                </button>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* 6. FREE JOURNAL */}
                 <div className="mb-6 sm:mb-8 relative group">
                    <div className="absolute inset-0 bg-stone-100 dark:bg-stone-900/50 rounded-[32px] transform rotate-1 scale-[1.01] z-0 opacity-50 transition-transform group-hover:rotate-2"></div>
                    
                    <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-[var(--card)] rounded-t-[32px] border-x border-t border-[var(--border)] relative z-10 gap-y-2">
                        <div className="flex items-center gap-2 opacity-40 mr-2">
                            <i className="ph-duotone ph-book-open-text text-xl"></i>
                            <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">Diario Libre</span>
                        </div>
                        
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-full">
                            <div className="flex items-center gap-1 bg-[var(--highlight)] p-1 rounded-lg shrink-0">
                                <button onClick={() => executeCommand('bold')} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--card)] text-[var(--text-main)] transition-colors text-xs font-bold" title="Negrita">B</button>
                                <button onClick={() => executeCommand('italic')} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--card)] text-[var(--text-main)] transition-colors text-xs italic font-serif" title="Cursiva">I</button>
                                <button onClick={() => executeCommand('hiliteColor', '#fef08a')} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--card)] text-[var(--text-main)] transition-colors text-xs" title="Resaltar">
                                    <div className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-400"></div>
                                </button>
                            </div>

                            <div className="w-[1px] h-4 bg-[var(--border)] shrink-0"></div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => setWritingTheme('classic')} className={`w-3 h-3 rounded-full border border-gray-300 bg-white ${writingTheme==='classic'?'ring-1 ring-[var(--text-main)]':''}`}></button>
                                <button onClick={() => setWritingTheme('paper')} className={`w-3 h-3 rounded-full border border-yellow-200 bg-[#FFFDF5] ${writingTheme==='paper'?'ring-1 ring-[var(--text-main)]':''}`}></button>
                                <button onClick={() => setWritingTheme('dark')} className={`w-3 h-3 rounded-full border border-gray-700 bg-[#222] ${writingTheme==='dark'?'ring-1 ring-white':''}`}></button>
                            </div>
                            
                            <div className="w-[1px] h-4 bg-[var(--border)] shrink-0"></div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => setWritingFont('serif')} className={`text-[9px] font-serif font-bold ${writingFont==='serif'?'text-[var(--text-main)]':'opacity-40'}`}>T</button>
                                <button onClick={() => setWritingFont('mono')} className={`text-[9px] font-mono font-bold ${writingFont==='mono'?'text-[var(--text-main)]':'opacity-40'}`}>T</button>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 sm:p-8 rounded-b-[32px] border-x border-b border-[var(--border)] relative z-10 shadow-sm transition-all ${themeStyles[writingTheme]}`}>
                        <div className="flex justify-end mb-2 opacity-40">
                            {saveStatus === 'saving' && <span className="text-[8px] uppercase tracking-widest animate-pulse">Guardando...</span>}
                        </div>
                        
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleEditorInput}
                            className={`w-full h-80 bg-transparent text-base leading-loose outline-none overflow-y-auto empty:before:content-['Tus_pensamientos_fluyen_aquí...'] empty:before:text-gray-400 empty:before:italic ${fontStyles[writingFont]}`}
                            style={{ minHeight: '320px' }}
                        />
                        
                        <div className="absolute bottom-4 right-6 opacity-10 pointer-events-none">
                            <i className="ph-fill ph-pen-nib text-6xl"></i>
                        </div>
                    </div>
                </div>

                 {/* 8. ACTIVE READING SECTION */}
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

                 {/* 9. SECONDARY RESOURCES */}
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Path Card */}
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

                    {/* Meditation Card */}
                    <div 
                        onClick={() => dailyMeditation && onNavigateToMeditation(dailyMeditation)} 
                        className="col-span-1 cursor-pointer bg-[var(--card)] p-5 sm:p-6 rounded-[28px] border border-[var(--border)] shadow-sm transition-all active:scale-[0.98] hover:border-indigo-200 dark:hover:border-indigo-900 group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
                    >
                        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <i className="ph-duotone ph-waves text-7xl sm:text-8xl"></i>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Meditación</span>
                            {dailyMeditation ? (
                                <>
                                    <h3 className="serif font-bold text-base sm:text-lg leading-tight mb-1 line-clamp-2">{dailyMeditation.title}</h3>
                                    <p className="text-[10px] opacity-60 line-clamp-1">{dailyMeditation.category}</p>
                                </>
                            ) : (
                                <h3 className="serif font-bold text-base sm:text-lg leading-tight opacity-50">Explora la Ciudadela</h3>
                            )}
                        </div>
                        {dailyMeditation && (
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                <i className="ph-fill ph-timer text-sm"></i> {dailyMeditation.duration_minutes} min
                            </div>
                        )}
                    </div>
                 </div>

             </div>

             {/* 7. MENTOR TRIGGER (FLOATING ACTION BUTTON) - MINIMALIST */}
             <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
                <button 
                    onClick={() => setIsReviewModalOpen(true)} 
                    className="w-14 h-14 rounded-full bg-[var(--text-main)] text-[var(--bg)] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-[var(--border)]"
                    title="Reflexión Nocturna"
                >
                    <i className="ph-fill ph-moon-stars text-2xl"></i>
                </button>
            </div>

             {/* DAILY REVIEW MODAL */}
             <DailyReviewModal 
                isOpen={isReviewModalOpen} 
                onClose={() => setIsReviewModalOpen(false)}
                entry={entry}
                dailyTask={dailyTask || {title: "Sin Reto", description: ""}}
                onSaveAnalysis={handleSaveAnalysis}
                user={user}
             />
        </div>
    );
}
