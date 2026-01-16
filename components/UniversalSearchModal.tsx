
import React, { useState, useEffect, useRef } from 'react';
import { searchGlobalContent } from '../services/supabase';
import { UserAvatar } from './Shared';
import { Post, ParsedContent } from '../types';
import { calculateLevel } from '../utils/gamification';

interface UniversalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToProfile: (username: string) => void;
    onNavigateToPost: (post: Post) => void;
    onNavigateToPhilosopher: (id: string) => void;
    onNavigateToSchool: (name: string) => void;
    onNavigateToReading: (reading: any) => void; // Could navigate to Library filter or similar
}

export function UniversalSearchModal({ 
    isOpen, 
    onClose, 
    onNavigateToProfile, 
    onNavigateToPost,
    onNavigateToPhilosopher,
    onNavigateToSchool,
    onNavigateToReading 
}: UniversalSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any>({ users: [], philosophers: [], schools: [], readings: [], posts: [] });
    const [loading, setLoading] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeout = useRef<any>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setResults({ users: [], philosophers: [], schools: [], readings: [], posts: [] });
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const performSearch = async (q: string) => {
        if (q.length < 2) return;
        setLoading(true);
        try {
            const data = await searchGlobalContent(q);
            if (data) setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        if (val.length >= 2) {
            setLoading(true);
            searchTimeout.current = setTimeout(() => performSearch(val), 400); 
        } else {
            setResults({ users: [], philosophers: [], schools: [], readings: [], posts: [] });
            setLoading(false);
        }
    };

    // Helper for post previews
    const getPostPreview = (post: Post) => {
        const c = post.content as ParsedContent;
        const text = c.body || "";
        return text.length > 50 ? text.substring(0, 50) + "..." : text;
    };

    if (!isOpen) return null;

    const hasAnyResults = results.users.length > 0 || results.philosophers.length > 0 || results.schools.length > 0 || results.readings.length > 0 || results.posts.length > 0;

    return (
        <div className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-xl flex flex-col shadow-2xl animate-slide-up rounded-2xl overflow-hidden ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                
                {/* Search Header - Spotlight Style */}
                <div className="bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)] p-4 flex items-center gap-4 relative z-20">
                    <i className={`ph-bold ${loading ? 'ph-spinner animate-spin text-[var(--gold)]' : 'ph-eye text-[var(--text-sub)]'} text-xl transition-colors`}></i>
                    <input 
                        ref={inputRef}
                        value={query}
                        onChange={handleInput}
                        placeholder="El Ojo que todo lo ve..."
                        className="flex-1 bg-transparent text-xl outline-none font-serif placeholder:text-[var(--text-sub)]/30 text-[var(--text-main)] h-8"
                        autoComplete="off"
                    />
                    {query && (
                        <button onClick={() => { setQuery(""); setResults({ users: [], philosophers: [], schools: [], readings: [], posts: [] }); inputRef.current?.focus(); }} className="w-6 h-6 rounded-full bg-[var(--highlight)] text-[var(--text-sub)] flex items-center justify-center hover:text-[var(--text-main)] transition-colors">
                            <i className="ph-bold ph-x text-xs"></i>
                        </button>
                    )}
                </div>

                {/* Results Area */}
                <div className="bg-[var(--bg)]/90 backdrop-blur-xl max-h-[60vh] overflow-y-auto no-scrollbar flex flex-col">
                    
                    {!hasAnyResults && !loading && query.length >= 2 && (
                        <div className="py-12 text-center opacity-40">
                            <i className="ph-duotone ph-wind text-3xl mb-2"></i>
                            <p className="text-xs font-bold uppercase tracking-widest">Nada en el horizonte</p>
                        </div>
                    )}

                    {/* 1. USERS (Almas) */}
                    {results.users.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-sub)] opacity-50 flex items-center gap-2">
                                <i className="ph-fill ph-users"></i> Almas
                            </div>
                            {results.users.map((u: any) => (
                                <button 
                                    key={u.id} 
                                    onClick={() => { onNavigateToProfile(u.username); onClose(); }}
                                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors group cursor-pointer"
                                >
                                    <div className="shrink-0">
                                        <UserAvatar name={u.username} avatarUrl={u.avatar} size="sm" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <span className="font-bold text-sm block leading-none mb-0.5">{u.username}</span>
                                        <span className="text-[9px] uppercase tracking-widest opacity-50 group-hover:opacity-80">{calculateLevel(u.xp).title}</span>
                                    </div>
                                    <i className="ph-bold ph-caret-right opacity-30 group-hover:opacity-100 text-xs"></i>
                                </button>
                            ))}
                        </div>
                    )}

                    {(results.philosophers.length > 0 || results.schools.length > 0) && <div className="h-[1px] bg-[var(--border)] mx-4 opacity-50"></div>}

                    {/* 2. WISDOM (Maestros / Escuelas) */}
                    {(results.philosophers.length > 0 || results.schools.length > 0) && (
                        <div className="py-2">
                            <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-sub)] opacity-50 flex items-center gap-2">
                                <i className="ph-fill ph-columns"></i> Sabiduría
                            </div>
                            
                            {results.schools.map((s: any) => (
                                <button key={s.id} onClick={() => { onNavigateToSchool(s.name); onClose(); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors group">
                                    <div className="w-6 h-6 rounded bg-[var(--highlight)] text-[var(--text-main)] flex items-center justify-center text-xs group-hover:bg-white/20 group-hover:text-white border border-[var(--border)]">
                                        <i className="ph-fill ph-bank"></i>
                                    </div>
                                    <span className="font-bold text-sm flex-1 text-left">{s.name}</span>
                                    <span className="text-[8px] uppercase opacity-50 group-hover:opacity-80">Escuela</span>
                                </button>
                            ))}

                            {results.philosophers.map((p: any) => (
                                <button key={p.id} onClick={() => { onNavigateToPhilosopher(p.id); onClose(); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors group">
                                    <div className="w-6 h-6 rounded-full bg-[var(--highlight)] text-[var(--text-main)] flex items-center justify-center text-xs group-hover:bg-white/20 group-hover:text-white border border-[var(--border)]">
                                        <i className="ph-fill ph-student"></i>
                                    </div>
                                    <span className="font-bold text-sm flex-1 text-left">{p.name}</span>
                                    <span className="text-[8px] uppercase opacity-50 group-hover:opacity-80">Maestro</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {(results.readings.length > 0) && <div className="h-[1px] bg-[var(--border)] mx-4 opacity-50"></div>}

                    {/* 3. LIBRARY (Citas) */}
                    {results.readings.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-sub)] opacity-50 flex items-center gap-2">
                                <i className="ph-fill ph-books"></i> Biblioteca
                            </div>
                            {results.readings.map((r: any, i: number) => (
                                <button key={i} onClick={() => { onClose(); }} className="w-full px-4 py-2.5 flex flex-col gap-1 hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors group text-left">
                                    <span className="font-serif italic text-sm opacity-90 line-clamp-1">"{r.quote}"</span>
                                    <span className="text-[9px] uppercase tracking-widest opacity-50 group-hover:opacity-80">{r.author}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {(results.posts.length > 0) && <div className="h-[1px] bg-[var(--border)] mx-4 opacity-50"></div>}

                    {/* 4. SCROLLS (Pergaminos / Posts) */}
                    {results.posts.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-sub)] opacity-50 flex items-center gap-2">
                                <i className="ph-fill ph-scroll"></i> Pergaminos
                            </div>
                            {results.posts.map((p: Post) => {
                                const c = p.content as ParsedContent;
                                const isArticle = c.type === 'article';
                                return (
                                    <button 
                                        key={p.id} 
                                        onClick={() => { onNavigateToPost(p); onClose(); }}
                                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors group cursor-pointer"
                                    >
                                        <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs border border-[var(--border)] group-hover:border-white/20 ${isArticle ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' : 'bg-[var(--highlight)] text-[var(--text-sub)] group-hover:bg-white/20 group-hover:text-white'}`}>
                                            <i className={`ph-fill ${isArticle ? 'ph-article' : 'ph-quotes'}`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-serif font-bold text-sm truncate">{c.title || "Reflexión"}</span>
                                                <span className="text-[8px] opacity-40 uppercase tracking-wide group-hover:opacity-70">@{p.user_name}</span>
                                            </div>
                                            <p className="text-xs opacity-60 line-clamp-1 group-hover:opacity-90 font-serif leading-relaxed">
                                                {getPostPreview(p)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Footer Tip */}
                    {hasAnyResults && (
                        <div className="px-4 py-2 bg-[var(--highlight)]/30 border-t border-[var(--border)] text-[9px] text-center opacity-40 font-bold uppercase tracking-widest">
                            Navega con sabiduría
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
