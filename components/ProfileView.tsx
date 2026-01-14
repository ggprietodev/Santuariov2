
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Post, ParsedContent, JournalEntry } from '../types';
import { PostCard } from './PostCard';
import { getUserLevel } from '../utils/stoicData';

interface ProfileViewProps {
    username: string;
    currentUser: string;
    onBack: () => void;
    posts: Post[];
    userProfile: UserProfile | null; 
    onUpdateProfile: (p: UserProfile) => void;
    onSelect: (p: Post) => void;
    onDelete: (id: number) => void;
    onEdit?: (p: Post) => void;
    onReaction: (p: Post, t: any) => void;
    onQuote: (p: Post) => void;
    onReply: (p: Post) => void;
    onBookmark: (p: Post) => void;
    isBookmarked: (p: Post) => boolean;
    journal?: Record<string, JournalEntry>;
}

// Helper: Strip HTML
const stripHtml = (html: string) => {
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

export const ProfileView = ({ 
    username, currentUser, onBack, posts, userProfile, onUpdateProfile,
    onSelect, onDelete, onEdit, onReaction, onQuote, onReply, onBookmark, isBookmarked, journal
}: ProfileViewProps) => {
    const isMe = username === currentUser;
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit State
    const [bio, setBio] = useState(userProfile?.bio || "");
    const [avatar, setAvatar] = useState(userProfile?.avatar || "");
    const [banner, setBanner] = useState(userProfile?.banner || "");
    const [website, setWebsite] = useState(userProfile?.website || "");

    useEffect(() => {
        if(userProfile) {
            setBio(userProfile.bio);
            setAvatar(userProfile.avatar);
            setBanner(userProfile.banner);
            setWebsite(userProfile.website || "");
        }
    }, [userProfile]);

    const handleSave = () => {
        const newProfile: UserProfile = {
            username, 
            name: username,
            bio,
            avatar,
            banner,
            website,
            joinedAt: userProfile?.joinedAt || new Date().toISOString()
        };
        onUpdateProfile(newProfile);
        setIsEditing(false);
    };

    // Stats Calculation
    const stats = useMemo(() => {
        let ethics = 0, logic = 0, physics = 0;
        let words = 0;
        
        // Extended Keywords for better categorization
        const ethicKeys = ['ética', 'justicia', 'acción', 'victoria', 'coraje', 'virtud', 'bien', 'mal', 'deber', 'sociedad', 'amigo', 'ayuda', 'política', 'moral', 'comunidad', 'prójimo', 'hábito', 'carácter'];
        const logicKeys = ['lógica', 'mente', 'juicio', 'lección', 'razón', 'verdad', 'conocimiento', 'pensamiento', 'duda', 'opinión', 'percepción', 'análisis', 'aprender', 'estudio', 'entender'];
        const physicsKeys = ['física', 'naturaleza', 'cosmos', 'dios', 'destino', 'muerte', 'tiempo', 'universo', 'cambio', 'átomo', 'fuego', 'pneuma', 'fluir', 'vida', 'mundo', 'energía'];

        const analyzeText = (text: string) => {
            const lower = text.toLowerCase();
            if(ethicKeys.some(k => lower.includes(k))) ethics++;
            else if(logicKeys.some(k => lower.includes(k))) logic++;
            else if(physicsKeys.some(k => lower.includes(k))) physics++;
            // Default distribution for unlabeled content to avoid 0/0/0
            else { ethics += 0.4; logic += 0.3; physics += 0.3; } 
        };

        // Count from posts
        posts.forEach(p => {
            const c = p.content as ParsedContent;
            let text = c.body || "";
            words += text.split(/\s+/).length;
            
            analyzeText((c.title || "") + " " + (c.tag || "") + " " + text);
        });

        // If journal provided (private stats for self), add roughly
        if(journal) {
            Object.values(journal).forEach(e => {
                const text = e.text || "";
                words += text.split(/\s+/).length;
                analyzeText(text + " " + (e.question_response || ""));
            });
        }
        
        const total = ethics + logic + physics || 1;
        return { 
            words, 
            ethics: Math.round(ethics/total*100), 
            logic: Math.round(logic/total*100), 
            physics: Math.round(physics/total*100) 
        };
    }, [posts, journal]);

    // LEVEL CALCULATION (Consistent across apps)
    const entryCount = isMe && journal ? Object.keys(journal).length : posts.length; // Approximate for others
    const userLevel = getUserLevel(entryCount);
    const progressToNext = Math.min(100, Math.round((entryCount / userLevel.next) * 100));

    // Get significant recent posts (Essays or Debates)
    const recentPublicWorks = useMemo(() => {
        return posts
            .filter(p => {
                const c = p.content as ParsedContent;
                return c.type === 'article' || c.type === 'debate';
            })
            .slice(0, 5);
    }, [posts]);

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] relative overflow-hidden">
            {/* Nav */}
            <div className="absolute top-0 left-0 right-0 z-40 p-4 flex justify-between items-center text-white mix-blend-difference pointer-events-none">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-white/20 transition-colors"><i className="ph-bold ph-arrow-left"></i></button>
                {isMe && (
                    <button onClick={() => setIsEditing(true)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-white/20 transition-colors">
                        <i className="ph-bold ph-pencil-simple"></i>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                
                {/* 1. HERO HEADER - IDENTITY CARD STYLE */}
                <div className="relative pt-24 pb-8 px-6 text-center border-b border-[var(--border)]">
                    <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-stone-200 to-[var(--bg)] dark:from-stone-900 dark:to-[var(--bg)] opacity-50 z-0"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full border-4 border-[var(--bg)] shadow-xl overflow-hidden mb-4 bg-stone-300 dark:bg-stone-800 relative group">
                            {avatar ? (
                                <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-serif font-bold opacity-30">
                                    {username[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        <h1 className="serif text-3xl font-bold mb-1">{username}</h1>
                        
                        {/* Level & Badge */}
                        <div className="flex flex-col items-center gap-2 mb-4 w-full max-w-[140px]">
                            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${userLevel.color}`}>
                                <i className={`ph-fill ${userLevel.icon}`}></i>
                                <span>{userLevel.title}</span>
                            </div>
                            <div className="w-full h-1 bg-[var(--highlight)] rounded-full overflow-hidden">
                                <div className={`h-full ${userLevel.color.replace('text-', 'bg-')}`} style={{width: `${progressToNext}%`}}></div>
                            </div>
                        </div>

                        {userProfile?.website && (
                            <a href={userProfile.website} target="_blank" rel="noopener" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:text-[var(--gold)] transition-colors mt-1">
                                {userProfile.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        
                        {/* BIO */}
                        {bio && (
                            <p className="serif text-base italic leading-relaxed opacity-80 max-w-md mx-auto mt-4">"{bio}"</p>
                        )}
                    </div>
                </div>

                {/* 2. STATS GRID (ESSENCE) */}
                <div className="max-w-2xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm flex flex-col items-center">
                            <span className="text-3xl font-serif font-bold text-[var(--text-main)]">{(stats.words / 1000).toFixed(1)}k</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Palabras</span>
                        </div>
                        <div className="bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm flex flex-col items-center">
                            <span className="text-3xl font-serif font-bold text-[var(--text-main)]">{entryCount}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Entradas</span>
                        </div>
                    </div>

                    <div className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="serif text-lg font-bold opacity-90">Arquetipo Filosófico</h3>
                            <div className="group relative">
                                <i className="ph-bold ph-info text-[var(--text-sub)] opacity-40 cursor-help"></i>
                                <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-[var(--text-main)] text-[var(--bg)] text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg border border-[var(--border)]">
                                    Basado en el análisis semántico de tus escritos.
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold uppercase mb-1 opacity-70"><span>Ética (Acción)</span><span>{stats.ethics}%</span></div>
                                <div className="h-2 bg-[var(--highlight)] rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{width: `${stats.ethics}%`}}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold uppercase mb-1 opacity-70"><span>Lógica (Razón)</span><span>{stats.logic}%</span></div>
                                <div className="h-2 bg-[var(--highlight)] rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{width: `${stats.logic}%`}}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold uppercase mb-1 opacity-70"><span>Física (Naturaleza)</span><span>{stats.physics}%</span></div>
                                <div className="h-2 bg-[var(--highlight)] rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{width: `${stats.physics}%`}}></div></div>
                            </div>
                        </div>
                        
                        {/* STOIC COMPASS VISUALIZATION */}
                        <div className="mt-8 border-t border-[var(--border)] pt-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4 text-center">Compás Estoico</h4>
                            <div className="relative w-full aspect-video bg-[var(--highlight)]/30 rounded-xl border border-[var(--border)] overflow-hidden">
                                {/* Axis */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[var(--border)]"></div>
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[var(--border)]"></div>
                                
                                {/* Labels */}
                                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] uppercase font-bold opacity-40">Teoría (Lógica)</span>
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] uppercase font-bold opacity-40">Práctica (Ética)</span>
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] uppercase font-bold opacity-40 -rotate-90">Yo</span>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] uppercase font-bold opacity-40 rotate-90">Cosmos (Física)</span>

                                {/* Dot Position Logic */}
                                {(() => {
                                    // Map stats to X/Y. 
                                    // Y: Theory (Logic) vs Practice (Ethics). Scale -50 to 50.
                                    // Logic pulls UP (negative Y), Ethics pulls DOWN (positive Y).
                                    // X: Self vs Cosmos. Physics implies Cosmos. But wait, Physics is usually 'Nature/God'.
                                    // Let's simplify: 
                                    // Y axis = Logic % vs Ethics %
                                    // X axis = Physics % (Cosmos) vs (100-Physics) (Self/Internal)
                                    
                                    // Normalize percentages to avoid 0 division
                                    const total = stats.ethics + stats.logic + stats.physics || 1;
                                    const yVal = ((stats.ethics - stats.logic) / 100) * 40; // Range approx -40 to 40
                                    const xVal = ((stats.physics - 33) / 100) * 80; // Shift based on Physics dominance relative to 1/3 balance
                                    
                                    return (
                                        <div 
                                            className="absolute w-4 h-4 bg-[var(--text-main)] rounded-full shadow-lg border-2 border-[var(--bg)] transition-all duration-1000"
                                            style={{ 
                                                top: `calc(50% + ${yVal}%)`, 
                                                left: `calc(50% + ${xVal}%)`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <div className="absolute -inset-1 border border-[var(--text-main)] rounded-full opacity-30 animate-ping-slow"></div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* 3. PUBLIC WORKS (Recent Significant Posts) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 opacity-40 px-1">
                            <i className="ph-fill ph-scroll"></i>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Obras Públicas Recientes</span>
                        </div>
                        
                        {recentPublicWorks.length === 0 ? (
                            <div className="text-center py-10 opacity-30 italic font-serif border-2 border-dashed border-[var(--border)] rounded-[24px]">
                                <p>Sin ensayos ni debates públicos.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentPublicWorks.map((post) => (
                                    <div key={post.id} onClick={() => onSelect(post)} className="cursor-pointer transform hover:scale-[1.01] transition-transform">
                                        <PostCard 
                                            post={post} 
                                            currentUser={currentUser}
                                            onSelect={onSelect}
                                            onDelete={onDelete}
                                            onEdit={onEdit}
                                            onReaction={onReaction}
                                            onQuote={onQuote}
                                            onReply={onReply}
                                            onBookmark={onBookmark}
                                            isBookmarked={isBookmarked(post)}
                                            onViewProfile={() => {}} // Already on profile
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in flex flex-col sm:items-center sm:justify-center p-0 sm:p-6">
                    <div className="bg-[var(--card)] w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-[32px] sm:shadow-2xl flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]/50 backdrop-blur-sm">
                            <h2 className="serif text-xl font-bold">Tallar Identidad</h2>
                            <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full hover:bg-[var(--highlight)] flex items-center justify-center transition-colors"><i className="ph-bold ph-x"></i></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-2">Avatar (URL)</label><input value={avatar} onChange={e => setAvatar(e.target.value)} className="w-full bg-[var(--highlight)] p-4 rounded-2xl outline-none text-sm"/></div>
                                <div><label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-2">Biografía</label><textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full h-32 bg-[var(--highlight)] p-4 rounded-2xl outline-none text-base resize-none"/></div>
                                <div><label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-2">Web</label><input value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-[var(--highlight)] p-4 rounded-2xl outline-none text-sm"/></div>
                            </div>
                        </div>
                        <div className="p-8 border-t border-[var(--border)] bg-[var(--bg)]">
                            <button onClick={handleSave} className="w-full py-5 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-[2px] text-xs shadow-lg">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
