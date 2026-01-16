
import React, { useState } from 'react';
import { getISO } from '../services/supabase';
import { Task, JournalEntry, Post } from '../types';
import { getDailyQuestionByDate, getDailyTask } from '../utils/stoicData';
import { PostCard } from './PostCard';
import { DailyReviewModal } from './DailyReviewModal';
import { JournalModule } from '../modules/Journal';

interface DayModalProps {
    modalDay: string | null;
    setModalDay: (d: string | null) => void;
    journal: Record<string, JournalEntry>;
    modalTab: 'journal' | 'posts';
    setModalTab: (t: 'journal' | 'posts') => void;
    modalAgoraFilter: 'all' | 'brief' | 'debate' | 'essay';
    setModalAgoraFilter: (f: any) => void;
    loadingDayPosts: boolean;
    dayPosts: Post[];
    handleOpenPost: (p: Post) => void;
    tasks: Task[];
    onSaveEntry: (date: string, entry: JournalEntry, title?: string, tags?: string[], structured_answers?: any) => void;
    user: string;
}

// HELPER: Reconstruct Journal Content sequentially
const rebuildJournalContent = (existingHtml: string, newEntryHtml: string) => {
    const isMorning = newEntryHtml.includes('ritual-block-morning');
    const isEvening = newEntryHtml.includes('ritual-block-evening');
    
    const morningRegex = /<div class="ritual-block ritual-block-morning".*?<\/div>/s;
    const eveningRegex = /<div class="ritual-block ritual-block-evening".*?<\/div>/s;

    let morningBlock = existingHtml.match(morningRegex)?.[0] || "";
    let eveningBlock = existingHtml.match(eveningRegex)?.[0] || "";
    
    let otherContent = existingHtml
        .replace(morningBlock, '')
        .replace(eveningBlock, '')
        .trim();

    if (isMorning) {
        morningBlock = newEntryHtml;
    } else if (isEvening) {
        eveningBlock = newEntryHtml;
    } else {
        otherContent += (otherContent ? "<br/><br/>" : "") + newEntryHtml;
    }

    let finalHtml = "";
    if (morningBlock) finalHtml += morningBlock;
    if (otherContent) finalHtml += (finalHtml ? "<br/>" : "") + otherContent;
    if (eveningBlock) finalHtml += (finalHtml ? "<br/><br/>" : "") + eveningBlock;

    return finalHtml;
};

// HELPER: Parse Content for Display
const processEntryContent = (text: string) => {
    const morningMatch = text.match(/<div class="ritual-block ritual-block-morning"[^>]*>([\s\S]*?)<\/div>/);
    const eveningMatch = text.match(/<div class="ritual-block ritual-block-evening"[^>]*>([\s\S]*?)<\/div>/);
    
    let morningContent = morningMatch ? morningMatch[1] : null;
    let eveningContent = eveningMatch ? eveningMatch[1] : null;
    
    let freeContent = text
        .replace(/<div class="ritual-block ritual-block-morning"[\s\S]*?>[\s\S]*?<\/div>/, '')
        .replace(/<div class="ritual-block ritual-block-evening"[\s\S]*?>[\s\S]*?<\/div>/, '')
        .trim();

    // Clean HTML for display
    const cleanHtml = (html: string) => {
        return html
            .replace(/style="[^"]*"/g, "") 
            .replace(/<h4[^>]*>.*?<\/h4>/g, "")
            .replace(/<p[^>]*>\s*<\/p>/g, "");
    };

    return {
        morning: morningContent ? cleanHtml(morningContent) : null,
        evening: eveningContent ? cleanHtml(eveningContent) : null,
        free: freeContent
    };
};

export function DayModal({ 
    modalDay, setModalDay, journal, modalTab, setModalTab, 
    modalAgoraFilter, setModalAgoraFilter, loadingDayPosts, dayPosts, handleOpenPost, tasks,
    onSaveEntry, user
}: DayModalProps) {
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isWriting, setIsWriting] = useState(false);
    const [writeMode, setWriteMode] = useState<'morning' | 'evening' | 'free' | null>(null);

    if (!modalDay) return null;

    const dateObj = new Date(modalDay);
    const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
    const dayNumber = dateObj.toLocaleDateString(undefined, { day: 'numeric' });
    const monthName = dateObj.toLocaleDateString(undefined, { month: 'long' });
    const year = dateObj.getFullYear();
    
    const entry = journal[modalDay] || { text: '', mood: 0 };
    const hasContent = (entry.text && entry.text.length > 0) || (entry.question_response && entry.question_response.length > 0);
    
    const { morning, evening, free } = processEntryContent(entry.text || "");

    // Challenge Logic
    let challengeMeta = null;
    if (entry.challenge_title) {
        challengeMeta = tasks?.find((t: Task) => t.title === entry.challenge_title);
    } 
    if (!challengeMeta) {
        challengeMeta = getDailyTask(tasks, dateObj.getDate());
    }

    const handleNavDay = (offset: number) => {
        const d = new Date(modalDay);
        d.setDate(d.getDate() + offset);
        setModalDay(getISO(d));
        setIsWriting(false); 
    };

    const handleSaveAnalysis = (adviceHtml: string) => {
        const newContent = (entry.text || "") + adviceHtml;
        const updatedEntry = { ...entry, text: newContent };
        onSaveEntry(modalDay, updatedEntry);
    };

    const handleJournalSave = (date: string, newEntry: JournalEntry, title?: string, tags?: string[], structured?: any) => {
        const mergedText = rebuildJournalContent(entry.text || "", newEntry.text || "");
        const finalEntry = { ...entry, ...newEntry, text: mergedText };
        onSaveEntry(date, finalEntry, title, tags, structured);
        setIsWriting(false);
    };

    const startWriting = (mode: 'morning' | 'evening' | 'free') => {
        setWriteMode(mode);
        setIsWriting(true);
    };

    const moodColors = ['', '#F43F5E', '#F59E0B', '#A8A29E', '#0EA5E9', '#14B8A6'];
    const moodIcons = ["", "ph-cloud-lightning", "ph-waves", "ph-minus", "ph-sun", "ph-star-four"];

    // --- RENDER WRITING MODULE IF ACTIVE ---
    if (isWriting) {
        return (
            <div className="fixed inset-0 z-[110]">
                <JournalModule 
                    initialDate={modalDay}
                    initialMode={writeMode}
                    onClose={() => setIsWriting(false)}
                    onSave={handleJournalSave}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-stone-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={() => setModalDay(null)}>
            <div className="bg-[var(--bg)] w-full max-w-xl rounded-[32px] shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col h-[85vh] animate-slide-up relative" onClick={e => e.stopPropagation()}>
                
                {/* Header Dramático */}
                <div className="relative p-6 pb-4 shrink-0 bg-[var(--bg)] z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[4px] opacity-40 mb-1">{year}</div>
                            <div className="flex items-baseline gap-3">
                                <h3 className="serif text-5xl font-bold capitalize leading-none text-[var(--text-main)]">{dayNumber}</h3>
                                <div className="flex flex-col">
                                    <span className="serif text-2xl opacity-80 capitalize leading-none">{monthName}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 leading-none mt-1">{dayName}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => setModalDay(null)} className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--text-sub)] flex items-center justify-center hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors active:scale-95">
                                <i className="ph-bold ph-x text-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Navigation & Mood Strip */}
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                        <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-full p-1 shadow-sm">
                            <button onClick={() => handleNavDay(-1)} className="w-9 h-8 rounded-full hover:bg-[var(--highlight)] flex items-center justify-center transition-colors text-[var(--text-sub)]"><i className="ph-bold ph-caret-left"></i></button>
                            <div className="w-[1px] h-4 bg-[var(--border)] self-center"></div>
                            <button onClick={() => handleNavDay(1)} className="w-9 h-8 rounded-full hover:bg-[var(--highlight)] flex items-center justify-center transition-colors text-[var(--text-sub)]"><i className="ph-bold ph-caret-right"></i></button>
                        </div>

                        {/* Mood Stamp */}
                        {entry?.mood ? (
                            <div className="flex items-center gap-3 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-full shadow-sm">
                                <i className={`ph-fill ${moodIcons[entry.mood]} text-xl`} style={{color: moodColors[entry.mood]}}></i>
                                <div className="h-4 w-[1px] bg-[var(--border)]"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Registro Vital</span>
                            </div>
                        ) : (
                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest opacity-30 bg-[var(--highlight)] rounded-full">
                                Sin Registro
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-[var(--bg)] pt-2">
                    {modalTab === 'journal' ? (
                        <div className="space-y-8 pb-20">
                            
                            {hasContent ? (
                                <>
                                    {/* MORNING RITUAL CARD - Warm & Hopeful */}
                                    {morning && (
                                        <div className="relative group overflow-hidden rounded-[24px] bg-gradient-to-br from-[#FFFBEB] to-[#FFF7ED] dark:from-[#2C2410] dark:to-[#1a1610] border border-amber-100 dark:border-amber-900/30 p-6 shadow-sm">
                                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                                                <i className="ph-fill ph-sun-horizon text-8xl text-amber-900 dark:text-amber-100"></i>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-lg shadow-sm border border-amber-200/50 dark:border-amber-800">
                                                    <i className="ph-fill ph-sun-horizon"></i>
                                                </div>
                                                <div>
                                                    <h4 className="serif font-bold text-lg text-amber-900 dark:text-amber-50">Amanecer</h4>
                                                    <span className="text-[9px] font-bold uppercase tracking-[2px] text-amber-800/60 dark:text-amber-200/60">Propósito & Gratitud</span>
                                                </div>
                                                <button onClick={() => startWriting('morning')} className="ml-auto w-8 h-8 rounded-full hover:bg-amber-200/50 dark:hover:bg-amber-800/50 flex items-center justify-center text-amber-700 dark:text-amber-300 transition-colors">
                                                    <i className="ph-bold ph-pencil-simple text-sm"></i>
                                                </button>
                                            </div>
                                            
                                            <div className="serif-text text-base leading-loose text-amber-950/90 dark:text-amber-100/90 space-y-4 ritual-content [&>p]:mb-2">
                                                <div dangerouslySetInnerHTML={{ __html: morning }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* FREE WRITING - Clean Book Style */}
                                    {free && (
                                        <div className="relative pl-6 border-l-2 border-[var(--border)] group">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--bg)] border-2 border-[var(--border)]"></div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Diario Libre</span>
                                                <button onClick={() => startWriting('free')} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                                                    <i className="ph-bold ph-pencil-simple"></i>
                                                </button>
                                            </div>
                                            <div className="prose dark:prose-invert max-w-none serif text-base leading-loose opacity-90 text-justify">
                                                <div dangerouslySetInnerHTML={{ __html: free }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EVENING RITUAL CARD - Cool & Deep (Includes Daily Question) */}
                                    {(evening || (!evening && entry.question_response)) && (
                                        <div className="relative group overflow-hidden rounded-[24px] bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] dark:from-[#0F172A] dark:to-[#1E1B4B] border border-indigo-100 dark:border-indigo-900/30 p-6 shadow-sm">
                                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                                                <i className="ph-fill ph-moon-stars text-8xl text-indigo-900 dark:text-indigo-100"></i>
                                            </div>

                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg shadow-sm border border-indigo-200/50 dark:border-indigo-800">
                                                    <i className="ph-fill ph-moon-stars"></i>
                                                </div>
                                                <div>
                                                    <h4 className="serif font-bold text-lg text-indigo-900 dark:text-indigo-50">Anochecer</h4>
                                                    <span className="text-[9px] font-bold uppercase tracking-[2px] text-indigo-800/60 dark:text-indigo-200/60">Examen & Cierre</span>
                                                </div>
                                                <button onClick={() => startWriting('evening')} className="ml-auto w-8 h-8 rounded-full hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 transition-colors">
                                                    <i className="ph-bold ph-pencil-simple text-sm"></i>
                                                </button>
                                            </div>
                                            
                                            {evening ? (
                                                <div className="serif-text text-base leading-loose text-indigo-950/90 dark:text-indigo-100/90 space-y-4 ritual-content [&>p]:mb-2">
                                                    <div dangerouslySetInnerHTML={{ __html: evening }}></div>
                                                </div>
                                            ) : (
                                                // Legacy fallback: Integrated Question Response
                                                <div className="space-y-4">
                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Pregunta del Día</p>
                                                        <p className="serif text-base italic opacity-90 mb-3 text-indigo-900 dark:text-indigo-100">"{getDailyQuestionByDate(modalDay)}"</p>
                                                        <p className="serif-text text-base leading-relaxed text-indigo-950/90 dark:text-indigo-100/90">{entry.question_response}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* CHALLENGE CARD - Compact */}
                                    {(entry?.challenge_title || entry?.challenge_status || challengeMeta) && (
                                        <div className={`relative overflow-hidden rounded-[24px] border transition-all flex items-center p-1 ${entry.challenge_status === 'success' || entry.challenge_completed ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'}`}>
                                            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl shrink-0 ${entry.challenge_status === 'success' || entry.challenge_completed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                <i className={`ph-fill ${entry.challenge_status === 'success' || entry.challenge_completed ? 'ph-trophy' : 'ph-skull'}`}></i>
                                            </div>
                                            <div className="px-4 py-2 flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Reto Diario</span>
                                                    {entry.challenge_status === 'success' && <i className="ph-fill ph-check-circle text-emerald-500"></i>}
                                                </div>
                                                <h4 className="serif text-sm font-bold leading-tight line-clamp-1">{entry.challenge_title || challengeMeta?.title}</h4>
                                                {entry.challenge_response && <p className="text-[10px] opacity-70 mt-1 italic line-clamp-1">"{entry.challenge_response.replace(/^\[.*?\]\s*/, '')}"</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* ADD MISSING BLOCKS BUTTONS */}
                                    <div className="flex justify-center gap-3 pt-6 opacity-60 hover:opacity-100 transition-opacity">
                                        {!morning && (
                                            <button onClick={() => startWriting('morning')} className="px-4 py-2 rounded-full border border-[var(--border)] text-[9px] font-bold uppercase tracking-widest hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-colors flex items-center gap-1">
                                                <i className="ph-bold ph-plus"></i> Amanecer
                                            </button>
                                        )}
                                        {!evening && (
                                            <button onClick={() => startWriting('evening')} className="px-4 py-2 rounded-full border border-[var(--border)] text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                                <i className="ph-bold ph-plus"></i> Anochecer
                                            </button>
                                        )}
                                        <button onClick={() => startWriting('free')} className="px-4 py-2 rounded-full border border-[var(--border)] text-[9px] font-bold uppercase tracking-widest hover:bg-[var(--highlight)] transition-colors flex items-center gap-1">
                                            <i className="ph-bold ph-pen-nib"></i> Escribir
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* EMPTY STATE - Time Travel */
                                <div className="h-full flex flex-col items-center justify-center text-center pb-10 pt-10">
                                    <div className="w-20 h-20 rounded-full bg-[var(--highlight)] flex items-center justify-center mb-6 opacity-50 border border-[var(--border)]">
                                        <i className="ph-duotone ph-hourglass-medium text-4xl"></i>
                                    </div>
                                    <h3 className="serif text-2xl font-bold mb-2">Página en Blanco</h3>
                                    <p className="text-sm opacity-50 mb-8 max-w-xs mx-auto leading-relaxed">
                                        El pasado está escrito en piedra, pero siempre puedes añadir notas al margen de la historia.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 w-full gap-3 px-4">
                                        <button onClick={() => startWriting('morning')} className="w-full py-4 bg-amber-50 dark:bg-[#2C2410] border border-amber-200 dark:border-amber-800 rounded-[24px] flex items-center px-6 gap-4 group transition-all hover:scale-[1.02]">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-200 text-xl"><i className="ph-fill ph-sun-horizon"></i></div>
                                            <div className="text-left">
                                                <span className="block font-bold text-amber-900 dark:text-amber-100 text-sm">Ritual del Amanecer</span>
                                            </div>
                                        </button>

                                        <button onClick={() => startWriting('evening')} className="w-full py-4 bg-indigo-50 dark:bg-[#151030] border border-indigo-200 dark:border-indigo-800 rounded-[24px] flex items-center px-6 gap-4 group transition-all hover:scale-[1.02]">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-200 text-xl"><i className="ph-fill ph-moon-stars"></i></div>
                                            <div className="text-left">
                                                <span className="block font-bold text-indigo-900 dark:text-indigo-100 text-sm">Ritual del Anochecer</span>
                                            </div>
                                        </button>
                                        
                                        <button onClick={() => startWriting('free')} className="w-full py-4 bg-[var(--card)] border border-[var(--border)] rounded-[24px] flex items-center px-6 gap-4 group transition-all hover:scale-[1.02] hover:bg-[var(--highlight)]">
                                            <div className="w-10 h-10 rounded-full bg-[var(--highlight)] flex items-center justify-center text-[var(--text-sub)] text-xl"><i className="ph-bold ph-pen-nib"></i></div>
                                            <div className="text-left">
                                                <span className="block font-bold text-[var(--text-main)] text-sm">Escritura Libre</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* POSTS TAB */
                        <div className="space-y-3 pb-20">
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mb-4">
                                {['all', 'brief', 'debate', 'essay'].map(f => (
                                    <button key={f} onClick={() => setModalAgoraFilter(f as any)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${modalAgoraFilter === f ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)]'}`}>
                                        {f === 'all' ? 'Todo' : f === 'brief' ? 'Breves' : f === 'debate' ? 'Debates' : 'Ensayos'}
                                    </button>
                                ))}
                            </div>

                            {loadingDayPosts ? (
                                <div className="py-20 flex justify-center opacity-40"><i className="ph-duotone ph-spinner animate-spin text-3xl"></i></div>
                            ) : dayPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                    <i className="ph-duotone ph-chats-teardrop text-4xl mb-2"></i>
                                    <span className="serif text-sm italic">Silencio en el Ágora este día.</span>
                                </div>
                            ) : (
                                dayPosts
                                .filter((p: any) => {
                                    if(modalAgoraFilter === 'all') return true;
                                    const c = p.content;
                                    if(modalAgoraFilter === 'essay') return c.type === 'article';
                                    if(modalAgoraFilter === 'debate') return c.type === 'debate' || (c.tag && ['Ética','Lógica','Física','Política','Cotidiano'].includes(c.tag));
                                    return c.type === 'log';
                                })
                                .map((p: any) => (
                                    <div key={p.id} onClick={() => handleOpenPost(p)} className="cursor-pointer transform hover:scale-[1.01] transition-transform">
                                        <PostCard 
                                            post={p} 
                                            currentUser=""
                                            onSelect={() => handleOpenPost(p)}
                                            onDelete={() => {}}
                                            onReaction={() => {}}
                                            onQuote={() => {}}
                                            onReply={() => {}}
                                            onBookmark={() => {}}
                                            isBookmarked={false}
                                            onViewProfile={() => {}}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* INTEGRATED REVIEW MODAL FOR PAST DATES */}
            <DailyReviewModal 
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                entry={entry}
                dailyTask={challengeMeta || {title: "Reto", description: ""}}
                onSaveAnalysis={handleSaveAnalysis}
                user={user}
            />
        </div>
    );
}
