
import React, { useState } from 'react';
import { getISO } from '../services/supabase';
import { Task, JournalEntry, Post } from '../types';
import { getDailyQuestionByDate, getDailyTask } from '../utils/stoicData';
import { PostCard } from './PostCard';
import { DailyReviewModal } from './DailyReviewModal';

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
    onSaveEntry: (date: string, entry: JournalEntry) => void;
    user: string;
}

export function DayModal({ 
    modalDay, setModalDay, journal, modalTab, setModalTab, 
    modalAgoraFilter, setModalAgoraFilter, loadingDayPosts, dayPosts, handleOpenPost, tasks,
    onSaveEntry, user
}: DayModalProps) {
    const [showChallengeDesc, setShowChallengeDesc] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    if (!modalDay) return null;

    const dateObj = new Date(modalDay);
    const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
    const dayNumber = dateObj.toLocaleDateString(undefined, { day: 'numeric' });
    const monthName = dateObj.toLocaleDateString(undefined, { month: 'long' });
    const year = dateObj.getFullYear();
    
    const entry = journal[modalDay] || { text: '', mood: 0 };
    
    // Reconstruct the question for that specific past date
    const questionText = getDailyQuestionByDate(modalDay);

    // Find challenge description if available, else derive from seed
    let challengeMeta = null;
    if (entry.challenge_title) {
        challengeMeta = tasks?.find((t: Task) => t.title === entry.challenge_title);
    } 
    
    // If no meta found, try to calculate what the daily task was
    if (!challengeMeta) {
        // Calculate offset from today
        const today = new Date();
        const diffTime = dateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        challengeMeta = getDailyTask(tasks, diffDays);
    }

    const handleNavDay = (offset: number) => {
        const d = new Date(modalDay);
        d.setDate(d.getDate() + offset);
        setModalDay(getISO(d));
        setShowChallengeDesc(false);
    };

    const handleSaveAnalysis = (adviceHtml: string) => {
        const newContent = (entry.text || "") + adviceHtml;
        const updatedEntry = { ...entry, text: newContent };
        onSaveEntry(modalDay, updatedEntry);
    };

    const moodColors = ['', 'var(--mood-1)', 'var(--mood-2)', 'var(--mood-3)', 'var(--mood-4)', 'var(--mood-5)'];
    const moodLabels = ['', 'Caos', 'Duda', 'Paz', 'Claridad', 'Areté'];

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={() => setModalDay(null)}>
            <div className="bg-[var(--bg)] w-full max-w-xl rounded-[24px] shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col h-[85vh] animate-slide-up relative" onClick={e => e.stopPropagation()}>
                
                {/* Header Compacto */}
                <div className="relative p-4 pb-3 shrink-0 bg-[var(--card)] border-b border-[var(--border)] z-10">
                    <div className="absolute top-0 right-0 p-3">
                        <button onClick={() => setModalDay(null)} className="w-8 h-8 rounded-full bg-[var(--highlight)] text-[var(--text-sub)] flex items-center justify-center hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors">
                            <i className="ph-bold ph-x text-xs"></i>
                        </button>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-40 mb-0.5">{year}</div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="serif text-3xl font-bold capitalize leading-none text-[var(--text-main)]">{dayNumber}</h3>
                                <span className="serif text-xl opacity-60 capitalize">{monthName}</span>
                            </div>
                            <div className="text-xs font-bold opacity-50 capitalize mt-0.5">{dayName}</div>
                        </div>
                        
                        {/* Mood Badge */}
                        {entry?.mood ? (
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm text-lg" style={{backgroundColor: moodColors[entry.mood]}}>
                                    <i className={`ph-fill ${['', 'ph-cloud-lightning', 'ph-waves', 'ph-minus', 'ph-sun', 'ph-star-four'][entry.mood]}`}></i>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{moodLabels[entry.mood]}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1 opacity-30">
                                <div className="w-10 h-10 rounded-full bg-[var(--highlight)] border border-[var(--border)] flex items-center justify-center text-lg">
                                    <i className="ph-bold ph-question"></i>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest">Sin registro</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation & Tabs Row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex bg-[var(--highlight)] rounded-full p-1 shadow-inner">
                            <button onClick={() => handleNavDay(-1)} className="w-8 h-7 rounded-full hover:bg-[var(--card)] flex items-center justify-center transition-colors text-[var(--text-sub)]"><i className="ph-bold ph-caret-left text-xs"></i></button>
                            <div className="w-[1px] h-3 bg-[var(--border)] self-center"></div>
                            <button onClick={() => handleNavDay(1)} className="w-8 h-7 rounded-full hover:bg-[var(--card)] flex items-center justify-center transition-colors text-[var(--text-sub)]"><i className="ph-bold ph-caret-right text-xs"></i></button>
                        </div>

                        <div className="flex bg-[var(--highlight)] p-1 rounded-full flex-1 max-w-[200px]">
                            <button onClick={() => setModalTab('journal')} className={`flex-1 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${modalTab === 'journal' ? 'bg-[var(--card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-sub)] opacity-60 hover:opacity-100'}`}>
                                Diario
                            </button>
                            <button onClick={() => setModalTab('posts')} className={`flex-1 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${modalTab === 'posts' ? 'bg-[var(--card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-sub)] opacity-60 hover:opacity-100'}`}>
                                Ágora
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-[var(--bg)]">
                    {modalTab === 'journal' ? (
                        <div className="space-y-3">
                            
                            {/* CHALLENGE CARD */}
                            {(entry?.challenge_title || entry?.challenge_status || challengeMeta) && (
                                <div className={`relative overflow-hidden rounded-[16px] border transition-all ${entry.challenge_status === 'success' || entry.challenge_completed ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'}`}>
                                    <div className={`absolute top-0 left-0 w-1 h-full ${entry.challenge_status === 'success' || entry.challenge_completed ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <div className="p-3 pl-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${entry.challenge_status === 'success' || entry.challenge_completed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    <i className={`ph-fill ${entry.challenge_status === 'success' || entry.challenge_completed ? 'ph-trophy' : 'ph-skull'}`}></i>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Reto Diario</span>
                                            </div>
                                            {challengeMeta && (
                                                <button onClick={() => setShowChallengeDesc(!showChallengeDesc)} className="w-5 h-5 rounded-full hover:bg-[var(--highlight)] flex items-center justify-center transition-colors text-[10px]">
                                                    <i className={`ph-bold ${showChallengeDesc ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
                                                </button>
                                            )}
                                        </div>
                                        
                                        <h4 className="serif text-base font-bold leading-tight mb-1">{entry.challenge_title || challengeMeta?.title || "Reto Personal"}</h4>
                                        
                                        {showChallengeDesc && challengeMeta && (
                                            <div className="mb-2 text-xs opacity-70 italic border-l-2 border-current pl-2 py-0.5 animate-fade-in">
                                                "{challengeMeta.description}"
                                            </div>
                                        )}

                                        {entry.challenge_response && (
                                            <div className="mt-1.5 pt-1.5 border-t border-black/5 dark:border-white/5">
                                                <p className="serif-text text-sm opacity-90 leading-relaxed">"{entry.challenge_response.replace(/^\[.*?\]\s*/, '')}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* QUESTION CARD */}
                            {entry?.question_response && (
                                <div className="bg-[var(--card)] rounded-[16px] border border-[var(--border)] p-4 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2 opacity-40">
                                        <i className="ph-bold ph-pencil-simple text-xs"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Pregunta del Día</span>
                                    </div>
                                    <h4 className="serif text-base font-bold mb-2 text-[var(--text-main)] leading-snug">{questionText}</h4>
                                    <div className="pl-2 border-l-2 border-[var(--gold)]/30">
                                        <p className="serif-text text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{entry.question_response}</p>
                                    </div>
                                </div>
                            )}

                            {/* FREE JOURNAL */}
                            {entry?.text && (
                                <div className="bg-[var(--card)] rounded-[16px] border border-[var(--border)] p-4 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2 opacity-40">
                                        <i className="ph-bold ph-book-open-text text-xs"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Reflexión Libre</span>
                                    </div>
                                    <div className="serif text-sm leading-relaxed opacity-90 whitespace-pre-wrap prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: entry.text }}></div>
                                </div>
                            )}

                            {/* MENTOR BUTTON (If entry has sufficient data) - DISCREET VERSION */}
                            {(entry?.text?.length > 10 || entry?.question_response?.length > 5) && (
                                <button 
                                    onClick={() => setIsReviewOpen(true)}
                                    className="w-full py-3 mt-4 text-[var(--gold)] hover:bg-[var(--gold)]/10 rounded-[16px] font-bold uppercase tracking-widest text-[10px] border border-[var(--gold)]/30 transition-all flex items-center justify-center gap-2 opacity-60 hover:opacity-100"
                                >
                                    <i className="ph-fill ph-sparkle text-sm"></i> Invocar Mentor Histórico
                                </button>
                            )}

                            {(!entry?.text && !entry?.question_response) && (
                                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                    <i className="ph-duotone ph-ghost text-3xl mb-2"></i>
                                    <span className="serif text-xs italic">El papel quedó en blanco.</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Filter Chips */}
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mb-1">
                                {['all', 'brief', 'debate', 'essay'].map(f => (
                                    <button key={f} onClick={() => setModalAgoraFilter(f as any)} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${modalAgoraFilter === f ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)]'}`}>
                                        {f === 'all' ? 'Todo' : f === 'brief' ? 'Breves' : f === 'debate' ? 'Debates' : 'Ensayos'}
                                    </button>
                                ))}
                            </div>

                            {loadingDayPosts ? (
                                <div className="py-8 flex justify-center opacity-40"><i className="ph-duotone ph-spinner animate-spin text-xl"></i></div>
                            ) : dayPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                    <i className="ph-duotone ph-chats-teardrop text-3xl mb-1"></i>
                                    <span className="serif text-xs italic">Silencio en el Ágora.</span>
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
