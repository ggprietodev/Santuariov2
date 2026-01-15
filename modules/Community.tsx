
import React, { useState, useEffect, useRef } from 'react';
import { supabase, getISO } from '../services/supabase';
import { Post, ParsedContent, ReactionType, CanvasStyle, UserProfile, SharedItem, JournalEntry } from '../types';
import { parsePost } from '../utils/stoicData';
import { PostCard } from '../components/PostCard';
import { Composer } from '../components/Composer';
import { ProfileView } from '../components/ProfileView';
import { LevelBadge } from '../components/LevelBadge'; // IMPORTAR BADGE

interface CommunityHubProps {
    user: string;
    userId?: string; 
    selectedDebate: Post | null;
    setSelectedDebate: (p: Post | null) => void;
    onBack: () => void;
    bookmarkedPosts: Post[];
    toggleBookmarkPost: (p: Post) => void;
    initialSharedItem?: SharedItem | null; 
    onClearSharedItem?: () => void;
    initialViewMode?: 'feed' | 'profile'; 
    initialProfileTarget?: string | null; 
    onOpenSettings: () => void;
    onNavigateToProfile: (username: string) => void;
    journal?: Record<string, JournalEntry>;
    dailyTopic: string;
    userProfile?: UserProfile | null; // Añadido
    onAddXP?: (amount: number) => void; // NEW: XP Reward
}

const DEBATE_CATEGORIES = ["Todo", "Ética", "Lógica", "Física", "Política", "Cotidiano"];
const SHORT_TAGS = ["Reflexión", "Pregunta", "Victoria", "Cita", "Consejo"];
const DEBATE_TAGS = ["Ética", "Lógica", "Física", "Política", "Cotidiano"];

export function CommunityHub({ 
    user, 
    userId, 
    selectedDebate, 
    setSelectedDebate, 
    onBack, 
    bookmarkedPosts, 
    toggleBookmarkPost, 
    initialSharedItem, 
    onClearSharedItem, 
    initialViewMode = 'feed',
    initialProfileTarget,
    onOpenSettings,
    onNavigateToProfile,
    journal,
    dailyTopic,
    userProfile,
    onAddXP
}: CommunityHubProps) {
    // --- ESTADOS ---
    const [subView, setSubView] = useState<'feed' | 'essays' | 'debates' | 'mine' | 'bookmarks'>('feed');
    const [viewMode, setViewMode] = useState<'feed' | 'profile'>(initialViewMode);
    const [profileUsername, setProfileUsername] = useState<string>(initialProfileTarget || user); 
    const [debateCategory, setDebateCategory] = useState("Todo");

    // NEW: Sort/Filter State
    const [filterMode, setFilterMode] = useState<'recent' | 'top' | 'saved'>('recent');

    // NEW: Date Filter States
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [dateFilterStart, setDateFilterStart] = useState("");
    const [dateFilterEnd, setDateFilterEnd] = useState("");

    const [posts, setPosts] = useState<Post[]>([]);
    const [debateReplies, setDebateReplies] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Composer State
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [composerMode, setComposerMode] = useState<'thought' | 'article'>('thought');
    const [composerInitialTitle, setComposerInitialTitle] = useState("");
    const [composerInitialTag, setComposerInitialTag] = useState("Reflexión");
    const [composerAvailableTags, setComposerAvailableTags] = useState<string[]>(SHORT_TAGS);

    // FAB State
    const [fabOpen, setFabOpen] = useState(false);

    const [quotingPost, setQuotingPost] = useState<Post | null>(null);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [sharedItem, setSharedItem] = useState<SharedItem | null>(null);

    // Perfil
    const [myProfile, setMyProfile] = useState<UserProfile>({ username: user, bio: "", avatar: "", banner: "" });
    const replyInputRef = useRef<HTMLTextAreaElement>(null);

    // --- EFECTOS ---

    useEffect(() => {
        if(userId) fetchMyProfile(userId);
    }, [userId]);

    useEffect(() => {
        if(initialSharedItem) {
            setSharedItem(initialSharedItem);
            handleOpenGenericComposer(); // Opens with default settings for sharing
            if(onClearSharedItem) onClearSharedItem(); 
        }
    }, [initialSharedItem]);

    useEffect(() => {
        if (initialProfileTarget) {
            setProfileUsername(initialProfileTarget);
            setViewMode('profile');
        } else if (initialViewMode === 'profile') {
            setProfileUsername(user);
            setViewMode('profile');
        } else {
            setViewMode('feed');
        }
    }, [initialViewMode, initialProfileTarget, user]);

    useEffect(() => { 
        if(viewMode === 'feed' && !selectedDebate) {
            fetchPosts(); 
        }
    }, [subView, selectedDebate, viewMode]);

    useEffect(() => {
        if (selectedDebate) {
            fetchReplies();
            setTimeout(() => replyInputRef.current?.focus(), 100);
        }
    }, [selectedDebate]);

    // --- FUNCIONES DE CARGA DE DATOS ---

    const fetchMyProfile = async (uid: string) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (data) setMyProfile(data);
    }

    const fetchPosts = async () => {
        setLoading(true);
        if (subView === 'bookmarks') {
            setPosts(bookmarkedPosts);
            setLoading(false);
            return;
        }

        let query = supabase.from('forum_posts').select('*').order('created_at', { ascending: false }).limit(100);
        
        if (subView === 'mine') {
            if (userId) query = query.eq('user_id', userId);
            else query = query.eq('user_name', user);
        }

        const { data, error } = await query;
        
        if (data && !error) {
            let parsed = data.map((p: any) => ({ ...p, content: parsePost(p.content) }));
            
            parsed = parsed.filter((p: Post) => {
                const c = p.content as ParsedContent;
                if (c.replyToId) return false;
                if (c.type === 'deleted' || c.deleted === true) return false;

                if (subView === 'essays') return c.type === 'article';
                
                if (subView === 'debates') {
                    // Muestra tipo 'debate' O tags de debate O diarios
                    const isDebate = c.type === 'debate' || c.tag === 'Debate' || (c.tag && c.tag.startsWith('Diario:')) || DEBATE_TAGS.includes(c.tag || '');
                    return isDebate;
                }
                
                return true; 
            });
            setPosts(parsed);
        }
        setLoading(false);
    };

    const fetchReplies = async () => {
        if(!selectedDebate?.id) return;
        const { data } = await supabase.from('forum_posts')
            .select('*')
            .eq('content->>replyToId', String(selectedDebate.id))
            .order('created_at', { ascending: true });
            
        if(data) {
            const parsed = data.map((p: any) => ({ ...p, content: parsePost(p.content) }))
                               .filter((p: Post) => {
                                   const c = p.content as ParsedContent;
                                   return c.type !== 'deleted' && c.deleted !== true;
                               });
            setDebateReplies(parsed);
        } else {
            setDebateReplies([]);
        }
    };

    const updateRemoteProfile = async (p: UserProfile) => {
        setMyProfile(p);
        const {data: {user: authUser}} = await supabase.auth.getUser();
        if(authUser) {
            // Use update instead of upsert to protect XP fields from being nulled
            await supabase.from('profiles').update({
                bio: p.bio,
                avatar: p.avatar,
                banner: p.banner,
                website: p.website
            }).eq('id', authUser.id);
        }
    };

    // --- ACCIONES DE USUARIO ---

    const handlePublish = async (text: string, title: string, tag: string, mode: 'thought'|'article', style: CanvasStyle, quoteOf?: Post, share?: SharedItem) => {
        let uid = userId;
        if(!uid) {
             const {data} = await supabase.auth.getUser();
             uid = data.user?.id;
        }

        // Auto-detect Debate Type
        const isDebateTag = DEBATE_TAGS.includes(tag) || tag.startsWith('Diario:');
        const finalType = mode === 'article' ? 'article' : (isDebateTag ? 'debate' : 'log');

        const contentPayload: ParsedContent = { 
            type: finalType,
            tag: mode === 'article' ? 'Ensayo' : tag as any,
            body: text,
            title: title || undefined,
            likes: [], 
            reactions: {},
            quoteOf: quoteOf,
            sharedItem: share, 
            canvasStyle: style !== 'classic' ? style : undefined,
            authorProfile: { avatar: myProfile.avatar, bio: myProfile.bio }
        };

        const { error } = await supabase.from('forum_posts').insert({ 
            user_name: user,
            user_id: uid, 
            content: contentPayload,
        });

        if (!error) {
            // REWARD: Low XP for posting (2 XP)
            if (onAddXP) await onAddXP(2); 
            setQuotingPost(null);
            setSharedItem(null); 
            await fetchPosts();
        } else {
            alert("Error al publicar: " + error.message);
        }
    };

    const handleUpdatePost = async (postId: number, text: string, title: string, tag: string, style: CanvasStyle) => {
        const postToEdit = posts.find(p => p.id === postId) || debateReplies.find(p => p.id === postId);
        if (!postToEdit) return;

        const currentContent = postToEdit.content as ParsedContent;
        const updatedContent: ParsedContent = {
            ...currentContent,
            body: text,
            title: title || currentContent.title,
            tag: tag as any,
            canvasStyle: style
        };

        setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: updatedContent } : p));
        setDebateReplies(prev => prev.map(p => p.id === postId ? { ...p, content: updatedContent } : p));
        if (selectedDebate?.id === postId) setSelectedDebate({ ...selectedDebate, content: updatedContent });

        const { error } = await supabase.from('forum_posts').update({ content: updatedContent }).eq('id', postId);

        if (error) alert("Error guardando edición: " + error.message);
        else setEditingPost(null);
    };

    const handleReply = async () => {
        if (!replyInputRef.current?.value.trim() || !selectedDebate) return;
        const text = replyInputRef.current.value;
        let uid = userId;
        if(!uid) {
             const {data} = await supabase.auth.getUser();
             uid = data.user?.id;
        }
        
        const contentPayload: ParsedContent = { 
            type: 'reply', 
            body: text, 
            replyToId: selectedDebate.id,
            likes: [],
            reactions: {},
            authorProfile: { avatar: myProfile.avatar }
        };
        
        replyInputRef.current.value = "";
        replyInputRef.current.style.height = 'auto';

        const { error } = await supabase.from('forum_posts').insert({ 
            user_name: user,
            user_id: uid,
            content: contentPayload
        });

        if (!error) {
            // REWARD: Very Low XP for reply (1 XP)
            if (onAddXP) await onAddXP(1); 
            await fetchReplies();
        }
        else alert("Error al responder: " + error.message);
    };

    const handleDelete = async (postId: number) => {
        const prevPosts = [...posts];
        const prevReplies = [...debateReplies];

        setPosts(prev => prev.filter(p => p.id !== postId));
        setDebateReplies(prev => prev.filter(p => p.id !== postId));
        if (selectedDebate?.id === postId) setSelectedDebate(null);

        try {
            const { error } = await supabase
                .from('forum_posts')
                .delete()
                .eq('id', postId);

            if (error) {
                console.error("Error RLS o Red:", error);
                setPosts(prevPosts); 
                setDebateReplies(prevReplies);
                alert("Error al borrar: " + error.message);
            }
        } catch (e: any) {
            console.error(e);
            setPosts(prevPosts);
        }
    };

    const handleReaction = async (post: Post, type: ReactionType) => {
        const c = post.content as ParsedContent;
        let currentReactions = { ...(c.reactions || {}) };
        if (!c.reactions && c.likes) c.likes.forEach(u => currentReactions[u] = 'heart');

        const existing = currentReactions[user];
        if (existing === type) delete currentReactions[user];
        else currentReactions[user] = type;

        const updatedContent = { ...c, reactions: currentReactions, likes: Object.keys(currentReactions) };
        const updatedPost = { ...post, content: updatedContent };
        
        setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
        setDebateReplies(prev => prev.map(p => p.id === post.id ? updatedPost : p));
        if (selectedDebate?.id === post.id) setSelectedDebate(updatedPost);

        await supabase.from('forum_posts').update({ content: updatedContent }).eq('id', post.id);
    };

    const handleQuote = (post: Post) => {
        setQuotingPost(post);
        setEditingPost(null);
        setComposerInitialTitle("");
        setComposerInitialTag("Reflexión");
        setComposerAvailableTags(SHORT_TAGS);
        setIsComposerOpen(true);
    };

    const handleEdit = (post: Post) => {
        setEditingPost(post);
        setQuotingPost(null);
        setComposerInitialTitle("");
        setComposerInitialTag("Reflexión");
        setComposerAvailableTags(SHORT_TAGS); // Default fallback for edit
        setIsComposerOpen(true);
    };

    const handleReplyClick = (post: Post) => {
        if(selectedDebate) {
            replyInputRef.current?.focus();
        } else {
            setSelectedDebate(post);
        }
    };

    const handleViewProfile = (username: string) => {
        if (initialProfileTarget) {
            setProfileUsername(username);
            setViewMode('profile');
        } else {
            onNavigateToProfile(username);
        }
    };

    const handleOpenDailyDebate = () => {
        const todayTag = `Diario:${getISO()}`;
        
        const existingDebate = posts.find(p => {
            const c = p.content as ParsedContent;
            return c.tag === todayTag;
        });

        if (existingDebate) {
            setSelectedDebate(existingDebate);
        } else {
            // Updated logic for Daily Debate creation
            setComposerInitialTitle(dailyTopic); // Pre-fill title with the daily question passed from props
            setComposerInitialTag(todayTag);
            setComposerMode('thought'); // Will be detected by Composer as having a 'Diario:' tag to show title
            setComposerAvailableTags([todayTag]); // Lock tag
            setEditingPost(null);
            setIsComposerOpen(true);
        }
    };

    const handleOpenGenericComposer = () => {
        setComposerInitialTitle("");
        setComposerInitialTag("Reflexión");
        setComposerMode('thought');
        setComposerAvailableTags(SHORT_TAGS);
        setEditingPost(null);
        setIsComposerOpen(true);
    };

    // --- NEW COMPOSER HANDLERS (FAB) ---
    const handleComposeShort = () => {
        setComposerInitialTitle("");
        setComposerInitialTag("Reflexión");
        setComposerMode('thought');
        setComposerAvailableTags(SHORT_TAGS);
        setEditingPost(null);
        setFabOpen(false);
        setIsComposerOpen(true);
    }

    const handleComposeDebate = () => {
        setComposerInitialTitle("");
        setComposerInitialTag("Ética");
        setComposerMode('thought');
        setComposerAvailableTags(DEBATE_TAGS);
        setEditingPost(null);
        setFabOpen(false);
        setIsComposerOpen(true);
    }

    const handleComposeEssay = () => {
        setComposerInitialTitle("");
        setComposerInitialTag("Ensayo");
        setComposerMode('article');
        setComposerAvailableTags([]); // No tags needed for essay mode in UI usually
        setEditingPost(null);
        setFabOpen(false);
        setIsComposerOpen(true);
    }

    // --- RENDER ---

    if(viewMode === 'profile') {
        const profilePosts = posts.filter(p => p.user_name === profileUsername); 
        
        let displayProfile = myProfile;
        
        if(profileUsername !== user) {
            const lastPost = profilePosts.find(p => (p.content as ParsedContent).authorProfile);
            const meta = (lastPost?.content as ParsedContent).authorProfile;
            displayProfile = {
                username: profileUsername,
                bio: meta?.bio || "",
                avatar: meta?.avatar || "",
                banner: ""
            };
        }

        return (
            <ProfileView 
                username={profileUsername}
                currentUser={user}
                onBack={() => {
                    if(initialProfileTarget) onBack(); 
                    else setViewMode('feed'); 
                }}
                posts={profilePosts}
                userProfile={displayProfile}
                onUpdateProfile={updateRemoteProfile}
                onSelect={setSelectedDebate}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onReaction={handleReaction}
                onQuote={handleQuote}
                onReply={handleReplyClick}
                onBookmark={toggleBookmarkPost}
                isBookmarked={(p) => bookmarkedPosts.some((bp: Post) => bp.id === p.id)}
                journal={journal} 
            />
        );
    }

    if (!selectedDebate) {
        return (
            <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] relative">
                {/* Header Feed - UPDATED STYLE */}
                <div className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] transition-all">
                    <div className="w-full max-w-3xl mx-auto">
                        <div className="flex px-6 pt-5 pb-3 items-center justify-between">
                             <h2 className="serif text-3xl font-bold tracking-tight">Ágora</h2>
                             <div className="flex items-center gap-3">
                                {/* Level Badge Here */}
                                <LevelBadge xp={userProfile?.xp || 0} showLabel={false} />
                                
                                <button onClick={() => handleViewProfile(user)} className="w-9 h-9 rounded-full bg-[var(--highlight)] flex items-center justify-center text-[var(--text-sub)] hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors overflow-hidden border border-[var(--border)]">
                                    {myProfile.avatar && !myProfile.avatar.startsWith('ph-') ? (
                                        <img src={myProfile.avatar} className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="text-sm font-bold">{user && user[0] ? user[0].toUpperCase() : 'E'}</div>
                                    )}
                                </button>
                                <button onClick={() => { if(onOpenSettings) onOpenSettings(); }} className="w-9 h-9 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors">
                                    <i className="ph-bold ph-gear"></i>
                                </button>
                             </div>
                        </div>
                        <div className="flex px-6 gap-8 overflow-x-auto no-scrollbar">
                            {['feed', 'essays', 'debates', 'mine', 'bookmarks'].map(t => (
                                <button key={t} onClick={() => setSubView(t as any)} className={`py-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap relative ${subView===t?'text-[var(--text-main)]':'text-[var(--text-sub)] opacity-50 hover:opacity-100'}`}>
                                    {t === 'feed' ? 'Muro' : t === 'essays' ? 'Ensayos' : t === 'debates' ? 'Debates' : t === 'mine' ? 'Mis Escritos' : 'Guardados'}
                                    {subView===t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-main)]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar w-full max-w-3xl mx-auto px-0 sm:px-4">
                    
                    {/* --- FILTER BAR (NEW) --- */}
                    {(subView === 'feed' || subView === 'essays' || subView === 'debates') && (
                        <div className="px-6 sm:px-2 py-4 flex gap-2 overflow-x-auto no-scrollbar items-center">
                            <button onClick={() => setFilterMode('recent')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filterMode==='recent' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>
                                Recientes
                            </button>
                            <button onClick={() => setFilterMode('top')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filterMode==='top' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>
                                Destacados
                            </button>
                            <button onClick={() => setFilterMode('saved')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filterMode==='saved' ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>
                                Guardados
                            </button>
                        </div>
                    )}

                    {/* DAILY DEBATE BUTTON (In Feed) */}
                    {subView === 'feed' && (
                        <div className="mx-6 sm:mx-2 py-5 px-6 border border-purple-100 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/10 rounded-2xl flex items-center justify-between group cursor-pointer hover:shadow-md transition-all mb-4" onClick={handleOpenDailyDebate}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                        <i className="ph-fill ph-sparkle"></i> Debate Diario
                                    </span>
                                </div>
                                <p className="serif text-lg font-bold text-[var(--text-main)] leading-tight">{dailyTopic}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                                <i className="ph-bold ph-pencil-simple"></i>
                            </div>
                        </div>
                    )}

                    {/* CATEGORY & DATE FILTER (In Debates) */}
                    {subView === 'debates' && (
                        <div className="sticky top-0 z-20 bg-[var(--bg)] pt-2 pb-2 px-6 sm:px-0 border-b border-[var(--border)] sm:border-none">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-2">
                                {/* Date Toggle Button */}
                                <button 
                                    onClick={() => setShowDateFilter(!showDateFilter)} 
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${showDateFilter || (dateFilterStart || dateFilterEnd) ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}
                                >
                                    <i className="ph-bold ph-calendar"></i>
                                </button>

                                {DEBATE_CATEGORIES.map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setDebateCategory(cat)} 
                                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${debateCategory === cat ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)] shadow-sm' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:border-[var(--text-main)]'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                                {debateCategory !== "Todo" && (
                                    <button onClick={() => setDebateCategory("Todo")} className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shrink-0 hover:bg-[var(--highlight)] text-[var(--text-sub)] hover:text-rose-500 transition-colors">
                                        <i className="ph-bold ph-arrow-counter-clockwise"></i>
                                    </button>
                                )}
                            </div>

                            {/* Collapsible Date Inputs */}
                            {showDateFilter && (
                                <div className="flex items-center gap-2 mb-2 animate-fade-in bg-[var(--card)] p-2 rounded-xl border border-[var(--border)]">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 block ml-1 mb-1">Desde</label>
                                        <input 
                                            type="date" 
                                            value={dateFilterStart} 
                                            onChange={(e) => setDateFilterStart(e.target.value)} 
                                            className="w-full bg-[var(--highlight)] rounded-lg px-2 py-1 text-xs outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 block ml-1 mb-1">Hasta</label>
                                        <input 
                                            type="date" 
                                            value={dateFilterEnd} 
                                            onChange={(e) => setDateFilterEnd(e.target.value)} 
                                            className="w-full bg-[var(--highlight)] rounded-lg px-2 py-1 text-xs outline-none"
                                        />
                                    </div>
                                    {(dateFilterStart || dateFilterEnd) && (
                                        <button onClick={() => { setDateFilterStart(""); setDateFilterEnd(""); }} className="h-full px-2 flex items-end pb-2 opacity-40 hover:opacity-100">
                                            <i className="ph-bold ph-x"></i>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20 opacity-30"><i className="ph-duotone ph-spinner animate-spin text-3xl"></i></div>
                    ) : posts.length === 0 ? (
                        <div className="text-center opacity-30 py-32 flex flex-col items-center">
                            <i className="ph-duotone ph-wind text-5xl mb-4"></i>
                            <span className="serif text-xl italic">{subView === 'mine' ? 'Aún no has escrito nada.' : 'El silencio reina en el Ágora.'}</span>
                        </div>
                    ) : (
                        <div className="animate-fade-in pb-32">
                            {(() => {
                                // Filter posts for View logic
                                let visiblePosts = posts.filter(p => {
                                    const c = p.content as ParsedContent;
                                    
                                    // Custom Filters
                                    if (subView === 'essays') return c.type === 'article';
                                    if (subView === 'debates') {
                                        const isDebate = c.type === 'debate' || c.tag === 'Debate' || (c.tag && c.tag.startsWith('Diario:')) || DEBATE_TAGS.includes(c.tag || '');
                                        
                                        // Category Filter
                                        if (debateCategory !== 'Todo') {
                                            if (!(isDebate && (c.tag === debateCategory || (c.tag && c.tag.startsWith('Diario:') && debateCategory === 'Cotidiano')))) return false;
                                        }

                                        // Date Filter
                                        if (dateFilterStart || dateFilterEnd) {
                                            const postDate = new Date(p.created_at || "");
                                            // Reset hours for pure date comparison
                                            postDate.setHours(0,0,0,0);
                                            
                                            if (dateFilterStart) {
                                                const start = new Date(dateFilterStart);
                                                start.setHours(0,0,0,0);
                                                if (postDate < start) return false;
                                            }
                                            if (dateFilterEnd) {
                                                const end = new Date(dateFilterEnd);
                                                end.setHours(23,59,59,999);
                                                if (postDate > end) return false;
                                            }
                                        }

                                        return isDebate;
                                    }
                                    return true;
                                });

                                // --- APPLY NEW FILTERS (Recent, Top, Saved) ---
                                if (filterMode === 'saved') {
                                    visiblePosts = visiblePosts.filter(p => bookmarkedPosts.some(bp => bp.id === p.id));
                                } else if (filterMode === 'top') {
                                    visiblePosts = visiblePosts.sort((a, b) => {
                                        const countA = (a.content as ParsedContent).likes?.length || 0;
                                        const countB = (b.content as ParsedContent).likes?.length || 0;
                                        return countB - countA;
                                    });
                                }
                                // 'recent' is default (already sorted by fetch)

                                // --- DEBATES VIEW: SPLIT DAILY & REST ---
                                if (subView === 'debates') {
                                    const todayTag = `Diario:${getISO()}`;
                                    // Only show Daily Hero if no date filters are active (or if today is in range)
                                    const showHero = !dateFilterStart && !dateFilterEnd && filterMode === 'recent';
                                    const dailyDebate = showHero ? visiblePosts.find(p => (p.content as ParsedContent).tag === todayTag) : null;
                                    const otherDebates = visiblePosts.filter(p => p.id !== dailyDebate?.id);

                                    return (
                                        <div className="space-y-4 pt-4 px-4 sm:px-0">
                                            {/* Daily Hero */}
                                            {showHero && (
                                                dailyDebate ? (
                                                    <div onClick={() => setSelectedDebate(dailyDebate)} className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-[32px] border border-purple-100 dark:border-purple-900/30 shadow-md cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] group relative overflow-hidden mb-6">
                                                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                                            <i className="ph-fill ph-sparkle text-8xl text-purple-600 dark:text-purple-400"></i>
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300 mb-2 block">Debate Activo</span>
                                                        <h3 className="serif font-bold text-2xl leading-tight text-[var(--text-main)] mb-3">{(dailyDebate.content as ParsedContent).title || dailyTopic}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-2 overflow-hidden">
                                                                {/* Fake Participants for visual appeal */}
                                                                <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-[var(--card)]"></div>
                                                                <div className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-[var(--card)]"></div>
                                                                <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-[var(--card)] flex items-center justify-center text-[10px] font-bold text-purple-800">+</div>
                                                            </div>
                                                            <span className="text-xs font-bold text-purple-800 dark:text-purple-200">Únete a la discusión</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div onClick={handleOpenDailyDebate} className="bg-[var(--card)] p-6 rounded-[32px] border-2 border-dashed border-[var(--border)] cursor-pointer hover:border-purple-300 transition-colors flex flex-col items-center text-center gap-2 opacity-60 hover:opacity-100 mb-6">
                                                        <i className="ph-duotone ph-plus-circle text-3xl text-purple-500"></i>
                                                        <span className="text-sm font-bold">Iniciar el Debate de Hoy</span>
                                                    </div>
                                                )
                                            )}

                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Discusiones</div>
                                            
                                            <div className="grid gap-2">
                                                {otherDebates.length === 0 && <div className="text-center py-10 opacity-30 italic text-xs">No se encontraron debates en este rango.</div>}
                                                {otherDebates.map(post => (
                                                    <PostCard 
                                                        key={post.id} 
                                                        post={post} 
                                                        currentUser={user}
                                                        currentUserId={userId}
                                                        onSelect={setSelectedDebate}
                                                        onDelete={handleDelete}
                                                        onEdit={handleEdit}
                                                        onReaction={handleReaction}
                                                        onQuote={handleQuote}
                                                        onReply={handleReplyClick}
                                                        onBookmark={toggleBookmarkPost}
                                                        isBookmarked={bookmarkedPosts.some((p: Post) => p.id === post.id)}
                                                        onViewProfile={handleViewProfile}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }

                                // --- STANDARD FEED RENDER ---
                                return visiblePosts.map(post => {
                                    const c = post.content as ParsedContent;
                                    const isDebate = c.tag === 'Debate' || c.type === 'debate' || (c.tag && c.tag.startsWith('Diario:'));
                                    return (
                                        <div key={post.id} className={isDebate ? 'sm:mt-2' : ''}>
                                            <PostCard 
                                                post={post} 
                                                currentUser={user}
                                                currentUserId={userId}
                                                onSelect={setSelectedDebate}
                                                onDelete={handleDelete}
                                                onEdit={handleEdit}
                                                onReaction={handleReaction}
                                                onQuote={handleQuote}
                                                onReply={handleReplyClick}
                                                onBookmark={toggleBookmarkPost}
                                                isBookmarked={bookmarkedPosts.some((p: Post) => p.id === post.id)}
                                                onViewProfile={handleViewProfile}
                                            />
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>

                {/* --- FAB MENU (Speed Dial) --- */}
                <div className="fixed bottom-24 right-6 flex flex-col items-end gap-3 z-50">
                    {fabOpen && (
                        <>
                            <div className="flex items-center gap-3 animate-fade-in origin-bottom">
                                <span className="bg-[var(--card)] px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-[var(--border)]">Ensayo</span>
                                <button onClick={handleComposeEssay} className="w-12 h-12 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-lg flex items-center justify-center hover:bg-[var(--highlight)] text-rose-500">
                                    <i className="ph-bold ph-scroll text-xl"></i>
                                </button>
                            </div>
                            <div className="flex items-center gap-3 animate-fade-in origin-bottom" style={{animationDelay: '0.05s'}}>
                                <span className="bg-[var(--card)] px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-[var(--border)]">Debate</span>
                                <button onClick={handleComposeDebate} className="w-12 h-12 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-lg flex items-center justify-center hover:bg-[var(--highlight)] text-sky-500">
                                    <i className="ph-bold ph-chats text-xl"></i>
                                </button>
                            </div>
                            <div className="flex items-center gap-3 animate-fade-in origin-bottom" style={{animationDelay: '0.1s'}}>
                                <span className="bg-[var(--card)] px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-[var(--border)]">Breve</span>
                                <button onClick={handleComposeShort} className="w-12 h-12 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-lg flex items-center justify-center hover:bg-[var(--highlight)] text-emerald-500">
                                    <i className="ph-bold ph-pencil-simple text-xl"></i>
                                </button>
                            </div>
                        </>
                    )}
                    
                    <button 
                        onClick={() => setFabOpen(!fabOpen)} 
                        className={`w-16 h-16 rounded-full bg-[var(--text-main)] text-[var(--bg)] shadow-2xl flex items-center justify-center active:scale-90 transition-all duration-300 border border-[var(--border)] ${fabOpen ? 'rotate-45' : 'hover:scale-105'}`}
                    >
                        <i className="ph-bold ph-plus text-2xl"></i>
                    </button>
                </div>

                <Composer 
                    user={user}
                    isOpen={isComposerOpen}
                    onClose={() => { setIsComposerOpen(false); setQuotingPost(null); setSharedItem(null); setEditingPost(null); }}
                    onPublish={handlePublish}
                    onUpdate={handleUpdatePost}
                    quotingPost={quotingPost}
                    editingPost={editingPost}
                    sharedItem={sharedItem}
                    initialMode={composerMode}
                    initialTitle={composerInitialTitle}
                    initialTag={composerInitialTag}
                    availableTags={composerAvailableTags}
                />
            </div>
        );
    }

    const isArticle = (selectedDebate.content as ParsedContent).type === 'article';
    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] relative">
            <div className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center gap-4 sticky top-0 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] z-10 transition-all">
                <button onClick={() => setSelectedDebate(null)} className="w-10 h-10 rounded-full hover:bg-[var(--highlight)] flex items-center justify-center transition-colors"><i className="ph-bold ph-arrow-left text-xl"></i></button>
                <h2 className="text-xl font-bold font-serif">{isArticle ? 'Ensayo' : 'Hilo de Discusión'}</h2>
            </div>

            <div className="flex-1 overflow-y-auto pb-40 no-scrollbar w-full max-w-3xl mx-auto">
                <PostCard 
                    post={selectedDebate} 
                    currentUser={user}
                    currentUserId={userId}
                    isDetail={true} 
                    isThreadStart={true} 
                    hasReply={debateReplies.length > 0} 
                    onSelect={() => {}} 
                    onDelete={(id) => { handleDelete(id); setSelectedDebate(null); }}
                    onEdit={handleEdit}
                    onReaction={handleReaction}
                    onQuote={handleQuote}
                    onReply={() => replyInputRef.current?.focus()}
                    onBookmark={toggleBookmarkPost}
                    isBookmarked={bookmarkedPosts.some((p: Post) => p.id === selectedDebate.id)}
                    onViewProfile={handleViewProfile}
                />
                
                <div className="bg-[var(--bg)] relative pl-4 sm:pl-0">
                    {debateReplies.map((reply) => (
                         <PostCard 
                            key={reply.id} 
                            post={reply} 
                            currentUser={user}
                            currentUserId={userId}
                            onSelect={() => {}} 
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onReaction={handleReaction}
                            onQuote={handleQuote}
                            onReply={() => replyInputRef.current?.focus()}
                            onBookmark={toggleBookmarkPost}
                            isBookmarked={bookmarkedPosts.some((p: Post) => p.id === reply.id)}
                            onViewProfile={handleViewProfile}
                        />
                    ))}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg)] border-t border-[var(--border)] z-20">
                <div className="max-w-3xl mx-auto flex gap-3 items-end">
                    <div className="shrink-0 mb-2 w-10 h-10 rounded-full bg-stone-200 overflow-hidden border border-[var(--border)]">
                        {myProfile.avatar && !myProfile.avatar.startsWith('ph-') ? <img src={myProfile.avatar} className="w-full h-full object-cover" alt="me" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{user && user[0] ? user[0].toUpperCase() : 'U'}</div>}
                    </div>
                    <div className="flex-1 flex gap-2 bg-[var(--highlight)] p-2 rounded-[28px] focus-within:ring-2 ring-[var(--border)] transition-all">
                        <textarea 
                            ref={replyInputRef} 
                            placeholder="Publicar respuesta..." 
                            className="flex-1 bg-transparent p-3 outline-none resize-none text-base max-h-32 min-h-[48px] placeholder:opacity-40" 
                            rows={1} 
                            style={{ height: 'auto', minHeight: '48px' }} 
                            onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'; }} 
                        />
                        <button onClick={handleReply} className="w-12 h-12 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-transform hover:opacity-90">
                            <i className="ph-bold ph-paper-plane-right text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <Composer 
                user={user}
                isOpen={isComposerOpen}
                onClose={() => { setIsComposerOpen(false); setQuotingPost(null); setSharedItem(null); setEditingPost(null); }}
                onPublish={handlePublish}
                onUpdate={handleUpdatePost}
                quotingPost={quotingPost}
                editingPost={editingPost}
                sharedItem={sharedItem}
                initialMode={composerMode}
                initialTitle={composerInitialTitle}
                initialTag={composerInitialTag}
                availableTags={composerAvailableTags}
            />
        </div>
    );
}
