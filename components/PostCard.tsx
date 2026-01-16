
import React, { useState } from 'react';
import { Post, ParsedContent, ReactionType, CanvasStyle, SharedItem } from '../types';
import { formatBodyText } from '../utils/textUtils';
import { UserAvatar } from './Shared';

// --- CONSTANTS ---
const REACTIONS: Record<ReactionType, { icon: string, label: string, color: string, bg: string }> = {
    heart: { icon: 'ph-heart', label: 'Sympatheia', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    fire:  { icon: 'ph-fire', label: 'Ignis', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    bulb:  { icon: 'ph-lightbulb', label: 'Logos', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    leaf:  { icon: 'ph-plant', label: 'Ataraxia', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const CANVAS_STYLES: Record<CanvasStyle, string> = {
    classic: 'bg-[var(--card)] text-[var(--text-main)]',
    nebula: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white border-none',
    dawn: 'bg-gradient-to-br from-orange-100 via-rose-100 to-amber-100 text-rose-900 dark:from-orange-900 dark:via-rose-900 dark:to-amber-900 dark:text-orange-50',
    midnight: 'bg-stone-900 text-stone-200 border-none',
    paper: 'bg-[#FDFBF7] text-stone-800 border-stone-200 shadow-inner'
};

const TagBadge = ({ tag }: { tag?: string }) => {
    if (!tag || tag === 'Reflexión') return null;
    
    // Special handling for Daily Debates
    if (tag.startsWith('Diario:')) {
        return (
            <div className="inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest text-purple-700 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 shadow-sm gap-1 font-mono">
                <i className="ph-fill ph-sparkle"></i> Diario
            </div>
        );
    }

    const styles: Record<string, string> = {
        'Debate': 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
        'Victoria': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        'Pregunta': 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        'Cita': 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        'Ensayo': 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    };
    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest font-mono ${styles[tag] || 'text-[var(--text-sub)] bg-[var(--highlight)] border-[var(--border)]'}`}>
            {tag}
        </div>
    );
};

const SharedItemCard = ({ item }: { item: SharedItem }) => {
    const isReading = item.type === 'reading';
    const isChallenge = item.type === 'challenge';
    return (
        <div className={`mt-3 rounded-xl p-3 border border-[var(--border)] relative overflow-hidden ${isReading ? 'bg-[#FFFBEB] dark:bg-[#2C2410] border-amber-100 dark:border-amber-900/30' : 'bg-[var(--card)] shadow-sm'}`}>
            {isReading && <i className="ph-fill ph-quotes absolute top-2 right-2 text-2xl text-amber-500/10"></i>}
            {isChallenge && <i className="ph-fill ph-sword absolute top-2 right-2 text-2xl text-emerald-500/10"></i>}
            <div className="flex items-center gap-2 mb-1">
                <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isReading ? 'bg-amber-100 text-amber-700' : 'bg-[var(--highlight)] text-[var(--text-sub)]'}`}>
                    {isReading ? 'Lectura' : item.type === 'challenge' ? 'Reto' : 'Lección'}
                </span>
            </div>
            <h4 className="serif font-bold text-sm mb-1 leading-tight">{item.title}</h4>
            {item.extra && <p className="text-[9px] uppercase font-bold tracking-widest opacity-50 mb-2">{item.extra}</p>}
            <div className={`serif-text text-xs opacity-90 ${isReading ? 'italic' : ''} line-clamp-3 leading-relaxed`}>
                {item.content}
            </div>
        </div>
    );
};

const QuoteEmbed = ({ post, onClick }: { post: Post, onClick: () => void }) => {
    const c = post.content as ParsedContent;
    return (
        <div className="mt-3 rounded-xl border-l-2 border-[var(--border)] pl-3 py-1 hover:bg-[var(--highlight)]/50 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-bold opacity-60">@{post.user_name}</span>
            </div>
            <p className="serif-text text-xs line-clamp-2 opacity-80 italic">"{c.body}"</p>
        </div>
    );
};

interface PostCardProps {
    post: Post;
    currentUser: string;
    currentUserId?: string;
    isDetail?: boolean;
    isThreadStart?: boolean;
    hasReply?: boolean;
    onSelect: (post: Post) => void;
    onDelete: (id: number) => void;
    onEdit?: (post: Post) => void;
    onReaction: (post: Post, type: ReactionType) => void;
    onQuote: (post: Post) => void;
    onReply: (post: Post) => void;
    onBookmark: (post: Post) => void;
    isBookmarked: boolean;
    onViewProfile: (username: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
    post, currentUser, currentUserId, isDetail, isThreadStart, hasReply, 
    onSelect, onDelete, onEdit, onReaction, onQuote, onReply, onBookmark, isBookmarked, onViewProfile
}) => {
    const [openMenu, setOpenMenu] = useState(false);
    const [openReactions, setOpenReactions] = useState(false);

    const c = post.content as ParsedContent;
    const isMine = post.user_id 
        ? (currentUserId && String(post.user_id) === String(currentUserId))
        : (post.user_name.toLowerCase().trim() === currentUser.toLowerCase().trim());
    
    const isArticle = c.type === 'article';
    const isDebate = c.tag === 'Debate' || c.type === 'debate' || (c.tag && c.tag.startsWith('Diario:'));
    const readTime = Math.ceil((c.body?.length || 0) / 1000) + ' min';

    const dateObj = new Date(post.created_at!);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString(undefined, {month:'short', day:'numeric'});

    const effectiveReactions = { ...(c.reactions || {}) };
    if (!c.reactions && c.likes) c.likes.forEach(u => effectiveReactions[u] = 'heart');
    const myReaction = effectiveReactions[currentUser] as ReactionType | undefined;
    const count = Object.keys(effectiveReactions).length;

    const styleClass = c.canvasStyle && CANVAS_STYLES[c.canvasStyle] ? CANVAS_STYLES[c.canvasStyle] : '';
    const isVisual = !!c.canvasStyle && c.canvasStyle !== 'classic';

    const handleShare = () => {
        const shareText = `"${c.body?.slice(0, 100)}..." - ${post.user_name} en Santuario.`;
        if (navigator.share) {
            navigator.share({ title: 'Santuario', text: shareText, url: window.location.href }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText);
            alert("Texto copiado al portapapeles.");
        }
        setOpenMenu(false);
    };

    const handleDeleteClick = () => {
        if (post.id !== undefined && post.id !== null) {
            onDelete(post.id);
        } else {
            alert("Error: Este post no tiene un ID válido para borrar.");
        }
        setOpenMenu(false);
    }

    const handleEditClick = () => {
        if(onEdit) onEdit(post);
        setOpenMenu(false);
    }

    if (isArticle && !isDetail) {
        return (
            <div onClick={() => onSelect(post)} className="mb-3 bg-[var(--card)] p-4 sm:p-5 rounded-[24px] border border-[var(--border)] shadow-sm cursor-pointer hover:shadow-md transition-all group animate-fade-in relative">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2" onClick={(e) => {e.stopPropagation(); onViewProfile(post.user_name)}}>
                         <UserAvatar name={post.user_name} avatarUrl={c.authorProfile?.avatar} size="sm" />
                         <div className="flex flex-col">
                             <span className="text-[10px] font-bold">{post.user_name}</span>
                             <span className="text-[9px] opacity-40">{dateStr}</span>
                         </div>
                    </div>
                    {isBookmarked && <i className="ph-fill ph-bookmark-simple text-[var(--gold)] text-sm"></i>}
                </div>
                
                <h3 className="serif text-base sm:text-lg font-bold mb-2 leading-tight group-hover:text-[var(--gold)] transition-colors">{c.title || "Sin Título"}</h3>
                <p className="serif-text text-xs opacity-80 line-clamp-3 mb-3 leading-relaxed">
                    {formatBodyText(c.body, onViewProfile)}
                </p>
                
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 mt-2">
                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{readTime}</span>
                     <div className="text-[var(--text-sub)] opacity-40 hover:opacity-100 transition-opacity">
                        <i className="ph-bold ph-arrow-right text-sm"></i>
                     </div>
                </div>
            </div>
        )
    }

    if (isDebate && !isDetail) {
        return (
            <div onClick={() => onSelect(post)} className="mb-3 bg-[var(--card)] p-4 rounded-[20px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all cursor-pointer group animate-fade-in relative">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <UserAvatar name={post.user_name} avatarUrl={c.authorProfile?.avatar} size="sm" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold">{post.user_name}</span>
                            <span className="text-[8px] opacity-40">{dateStr}</span>
                        </div>
                    </div>
                    <TagBadge tag={c.tag} />
                </div>

                <div className="pl-8">
                    {c.title && <h3 className="serif text-sm font-bold mb-1 leading-tight group-hover:text-sky-600 transition-colors line-clamp-1">{c.title}</h3>}
                    <div className="serif-text text-xs opacity-80 line-clamp-2 leading-relaxed mb-2">
                        {formatBodyText(c.body, onViewProfile)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-[var(--text-sub)] opacity-50">
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                            <i className="ph-bold ph-chat-circle"></i>
                            <span>Debatir</span>
                        </div>
                        {count > 0 && (
                            <div className="flex items-center gap-1 text-[10px]">
                                <i className="ph-fill ph-heart text-rose-500"></i>
                                <span>{count}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => !isDetail && onSelect(post)}
            className={`
                border-b border-[var(--border)] transition-colors relative
                ${!isDetail ? 'cursor-pointer hover:bg-[var(--highlight)]/30 py-4 px-4' : 'bg-[var(--bg)] py-6 px-6'}
                ${isThreadStart ? 'pb-0 border-b-0' : ''}
            `}
        >
            <div className="flex gap-3 relative">
                {isThreadStart && hasReply && <div className="absolute left-[16px] top-[40px] bottom-[-24px] w-[2px] bg-[var(--border)] z-0"></div>}

                <div className="shrink-0 cursor-pointer pt-0.5" onClick={(e) => {e.stopPropagation(); onViewProfile(post.user_name)}}>
                    <UserAvatar name={post.user_name} avatarUrl={c.authorProfile?.avatar} size={isDetail && !isThreadStart ? 'md' : 'sm'} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 overflow-hidden cursor-pointer" onClick={(e) => {e.stopPropagation(); onViewProfile(post.user_name)}}>
                            <span className={`font-bold ${isDetail ? 'text-sm' : 'text-xs'} text-[var(--text-main)] truncate hover:underline`}>{post.user_name}</span>
                            <span className="text-[9px] text-[var(--text-sub)] opacity-40 flex-shrink-0">· {isDetail ? `${timeStr} · ${dateStr}` : dateStr}</span>
                        </div>
                        
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setOpenMenu(!openMenu); }} className="text-[var(--text-sub)] hover:bg-[var(--highlight)] w-6 h-6 rounded-full flex items-center justify-center transition-colors">
                                <i className="ph-bold ph-dots-three text-base"></i>
                            </button>
                            {openMenu && (
                                <>
                                <div className="fixed inset-0 z-40" onClick={(e) => {e.stopPropagation(); setOpenMenu(false)}}></div>
                                <div className="absolute top-6 right-0 bg-[var(--card)] shadow-xl border border-[var(--border)] rounded-xl py-1 w-32 z-50 animate-fade-in overflow-hidden">
                                    {isMine && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-[var(--text-main)] hover:bg-[var(--highlight)] flex items-center gap-2 border-b border-[var(--border)]">
                                                <i className="ph-bold ph-pencil-simple"></i> Editar
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-[var(--highlight)] flex items-center gap-2 border-b border-[var(--border)]">
                                                <i className="ph-bold ph-trash"></i> Borrar
                                            </button>
                                        </>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-[var(--text-main)] hover:bg-[var(--highlight)] flex items-center gap-2 border-b border-[var(--border)]">
                                        <i className="ph-bold ph-share"></i> Compartir
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onViewProfile(post.user_name); setOpenMenu(false); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-[var(--text-main)] hover:bg-[var(--highlight)] flex items-center gap-2">
                                        <i className="ph-bold ph-user"></i> Perfil
                                    </button>
                                </div>
                                </>
                            )}
                        </div>
                    </div>

                    {isDetail && c.title && <h1 className="serif text-xl font-bold mb-3 mt-1 leading-tight">{c.title}</h1>}
                    <div className="mb-1"><TagBadge tag={c.tag} /></div>

                    <div className={`${isVisual ? `p-6 rounded-2xl shadow-sm mb-3 ${styleClass} flex flex-col items-center justify-center text-center min-h-[160px]` : ''}`}>
                        {isVisual && <i className="ph-fill ph-quotes text-3xl opacity-30 mb-3"></i>}
                        <div className={`serif-text leading-relaxed whitespace-pre-wrap ${isVisual ? 'text-base font-medium' : `text-xs sm:text-sm text-[var(--text-main)] opacity-90`} ${!isDetail && !isVisual ? 'line-clamp-6' : ''}`}>
                            {formatBodyText(c.body, onViewProfile)}
                        </div>
                    </div>

                    {c.sharedItem && <SharedItemCard item={c.sharedItem} />}
                    {c.quoteOf && <QuoteEmbed post={c.quoteOf} onClick={() => onSelect(c.quoteOf!)} />}

                    <div className="flex items-center justify-between mt-3 max-w-[95%] text-[var(--text-sub)] relative">
                        <button className="flex items-center gap-1 group hover:text-sky-500 transition-colors z-10" onClick={(e) => { e.stopPropagation(); onReply(post); }}>
                            <div className="p-1.5 rounded-full group-hover:bg-sky-500/10 transition-colors"><i className="ph-bold ph-chat-circle text-base"></i></div>
                            {isDebate && !isDetail && <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">Unirse</span>}
                        </button>
                        
                        <button onClick={(e) => { e.stopPropagation(); onQuote(post); }} className="flex items-center gap-1 group hover:text-green-500 transition-colors z-10">
                            <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors"><i className="ph-bold ph-arrows-left-right text-base"></i></div>
                        </button>

                        <div className="relative z-20">
                            {openReactions && (
                               <>
                               <div className="fixed inset-0 z-40" onClick={(e) => {e.stopPropagation(); setOpenReactions(false)}}></div>
                               <div className="absolute bottom-8 -left-10 bg-[var(--card)] shadow-xl border border-[var(--border)] rounded-full p-1.5 flex gap-2 z-50 animate-fade-in origin-bottom-left whitespace-nowrap">
                                   {Object.entries(REACTIONS).map(([k, v]) => (
                                       <button key={k} onClick={(e) => { e.stopPropagation(); onReaction(post, k as ReactionType); setOpenReactions(false); }} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${myReaction === k ? 'bg-[var(--text-main)] text-[var(--bg)]' : 'hover:bg-[var(--highlight)] text-[var(--text-main)]'}`} title={v.label}>
                                           <i className={`ph-fill ${v.icon} text-sm ${myReaction === k ? '' : v.color}`}></i>
                                       </button>
                                   ))}
                               </div>
                               </>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setOpenReactions(!openReactions); }} className={`flex items-center gap-1 group transition-all ${myReaction ? REACTIONS[myReaction].color : 'hover:text-rose-500'}`}>
                                <div className={`p-1.5 rounded-full transition-colors ${myReaction ? REACTIONS[myReaction].bg : 'group-hover:bg-rose-500/10'}`}>
                                    <i className={`ph-${myReaction ? 'fill' : 'bold'} ${myReaction ? REACTIONS[myReaction].icon : 'ph-heart'} text-base ${myReaction ? 'animate-bounce-short' : ''}`}></i>
                                </div>
                                <span className={`text-[9px] font-medium ${count > 0 ? 'opacity-100' : 'opacity-0'} transition-opacity`}>{count > 0 ? count : ''}</span>
                            </button>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); onBookmark(post); }} className={`flex items-center gap-1 group transition-colors z-10 ${isBookmarked ? 'text-[var(--gold)]' : 'hover:text-[var(--gold)]'}`}>
                            <div className="p-1.5 rounded-full group-hover:bg-amber-500/10 transition-colors"><i className={`ph-${isBookmarked?'fill':'bold'} ph-bookmark-simple text-base`}></i></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
