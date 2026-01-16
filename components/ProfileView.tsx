
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Post, JournalEntry } from '../types';
import { calculateLevel } from '../utils/gamification';
import { getISO, sendMemento, fetchMementoCount, sendLetter, fetchInbox, searchUsers } from '../services/supabase';
import { UserAvatar } from './Shared';

// --- ARQUETIPOS ESTOICOS (SELECTOR) ---
const ARCHETYPES = [
    {
        category: 'Sabiduría',
        color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
        icons: [
            { icon: 'ph-brain', label: 'Razón' }, { icon: 'ph-scroll', label: 'Erudito' },
            { icon: 'ph-student', label: 'Estudiante' }, { icon: 'ph-lightbulb', label: 'Ideas' },
            { icon: 'ph-eye', label: 'Visión' }, { icon: 'ph-book-open', label: 'Lectura' },
        ]
    },
    {
        category: 'Virtud',
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        icons: [
            { icon: 'ph-scales', label: 'Justicia' }, { icon: 'ph-sword', label: 'Coraje' },
            { icon: 'ph-shield-check', label: 'Invencible' }, { icon: 'ph-anchor', label: 'Estabilidad' },
            { icon: 'ph-hand-heart', label: 'Filantropía' }, { icon: 'ph-crown', label: 'Soberanía' },
        ]
    },
    {
        category: 'Naturaleza',
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        icons: [
            { icon: 'ph-fire', label: 'Fuego' }, { icon: 'ph-sun', label: 'Cosmos' },
            { icon: 'ph-moon', label: 'Serenidad' }, { icon: 'ph-waves', label: 'Fluidez' },
            { icon: 'ph-tree', label: 'Crecimiento' }, { icon: 'ph-plant', label: 'Semilla' },
            { icon: 'ph-mountains', label: 'Persistencia' }, { icon: 'ph-drop', label: 'Simplicidad' },
            { icon: 'ph-snowflake', label: 'Templanza' }, { icon: 'ph-wind', label: 'Cambio' },
        ]
    },
    {
        category: 'Tiempo',
        color: 'text-stone-600 bg-stone-50 dark:bg-stone-900/20 border-stone-200 dark:border-stone-800',
        icons: [
            { icon: 'ph-hourglass', label: 'Memento' }, { icon: 'ph-clock', label: 'Presente' },
            { icon: 'ph-path', label: 'Camino' }, { icon: 'ph-footprints', label: 'Viaje' },
            { icon: 'ph-compass', label: 'Norte' }, { icon: 'ph-flag', label: 'Meta' },
        ]
    },
    {
        category: 'Sociedad',
        color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
        icons: [
            { icon: 'ph-users-three', label: 'Cosmopolita' }, { icon: 'ph-columns', label: 'Sostén' },
            { icon: 'ph-lighthouse', label: 'Guía' },
        ]
    },
    {
        category: 'Expresión',
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
        icons: [
            { icon: 'ph-pen-nib', label: 'Diario' }, { icon: 'ph-microphone', label: 'Retórica' },
        ]
    }
];

// --- SELLOS DE LACRE PARA CARTAS ---
const SEALS = [
    { id: 'owl', icon: 'ph-bird', label: 'Sabiduría' },
    { id: 'fire', icon: 'ph-fire', label: 'Pasión' },
    { id: 'anchor', icon: 'ph-anchor', label: 'Firmeza' },
    { id: 'heart', icon: 'ph-heart', label: 'Afecto' },
    { id: 'skull', icon: 'ph-skull', label: 'Memento' },
    { id: 'star', icon: 'ph-star', label: 'Destino' },
];

// --- MOTOR DE ANÁLISIS DE ALMA (KEYWORDS) ---
const VIRTUE_KEYWORDS = {
    wisdom: ['razón', 'verdad', 'estudio', 'aprender', 'mente', 'lógica', 'atención', 'juicio', 'entender', 'conocer', 'leer', 'libro', 'idea', 'pensar'],
    courage: ['miedo', 'atreverse', 'fuerza', 'dolor', 'soportar', 'valentía', 'coraje', 'riesgo', 'enfrentar', 'luchar', 'fuego', 'guerra', 'difícil'],
    justice: ['comunidad', 'ayudar', 'otros', 'justo', 'bondad', 'servicio', 'empatía', 'equidad', 'amigo', 'sociedad', 'amor', 'hermano', 'perdonar'],
    temperance: ['control', 'deseo', 'placer', 'basta', 'equilibrio', 'moderación', 'sobrio', 'calma', 'paz', 'renuncia', 'ayuno', 'simple', 'orden']
};

interface SoulAnalysis {
    archetypeTitle: string;
    archetypeIcon: string;
    archetypeColor: string;
    virtues: { wisdom: number, courage: number, justice: number, temperance: number };
    moodBalance: { positive: number, negative: number }; // Percentage
    wordCount: number;
}

const analyzeSoul = (journal: Record<string, JournalEntry> | undefined, posts: Post[]): SoulAnalysis => {
    let scores = { wisdom: 0, courage: 0, justice: 0, temperance: 0 };
    let totalWords = 0;
    let moodCounts = { high: 0, low: 0, total: 0 };

    // 1. Collect all text sources (Journal if own, Posts if public)
    const texts: string[] = [];
    
    if (journal) {
        Object.values(journal).forEach(e => {
            texts.push(e.text || "");
            texts.push(e.question_response || "");
            if (e.mood > 0) {
                if (e.mood >= 3) moodCounts.high++; else moodCounts.low++;
                moodCounts.total++;
            }
        });
    }
    
    // Also analyze public posts for richer data
    posts.forEach(p => {
        if (typeof p.content === 'object' && 'body' in p.content) {
            texts.push(p.content.body || "");
        }
    });

    // 2. Scan Text
    texts.forEach(text => {
        if (!text) return;
        const clean = text.toLowerCase();
        totalWords += clean.split(/\s+/).length;

        Object.entries(VIRTUE_KEYWORDS).forEach(([virtue, words]) => {
            words.forEach(w => {
                if (clean.includes(w)) scores[virtue as keyof typeof scores]++;
            });
        });
    });

    // 3. Normalize Scores (0-100 relative distribution)
    const totalHits = scores.wisdom + scores.courage + scores.justice + scores.temperance;
    const normalized = {
        wisdom: totalHits ? Math.round((scores.wisdom / totalHits) * 100) : 25,
        courage: totalHits ? Math.round((scores.courage / totalHits) * 100) : 25,
        justice: totalHits ? Math.round((scores.justice / totalHits) * 100) : 25,
        temperance: totalHits ? Math.round((scores.temperance / totalHits) * 100) : 25,
    };

    // 4. Determine Archetype
    let title = "El Iniciado";
    let icon = "ph-seed";
    let color = "text-stone-500";

    if (totalHits > 5 || totalWords > 100) {
        const max = Math.max(normalized.wisdom, normalized.courage, normalized.justice, normalized.temperance);
        const isBalanced = Object.values(normalized).every(v => Math.abs(v - 25) < 10);

        if (isBalanced) {
            title = "El Filósofo"; icon = "ph-scales"; color = "text-purple-500";
        } else if (max === normalized.courage) {
            title = "El Guerrero"; icon = "ph-sword"; color = "text-rose-500";
        } else if (max === normalized.wisdom) {
            title = "El Sabio"; icon = "ph-brain"; color = "text-indigo-500";
        } else if (max === normalized.justice) {
            title = "El Ciudadano"; icon = "ph-users-three"; color = "text-amber-500";
        } else {
            title = "El Asceta"; icon = "ph-hand-palm"; color = "text-emerald-500";
        }
    }

    const moodBalance = {
        positive: moodCounts.total ? Math.round((moodCounts.high / moodCounts.total) * 100) : 50,
        negative: moodCounts.total ? Math.round((moodCounts.low / moodCounts.total) * 100) : 50
    };

    return {
        archetypeTitle: title,
        archetypeIcon: icon,
        archetypeColor: color,
        virtues: normalized,
        moodBalance,
        wordCount: totalWords
    };
};

interface ProfileViewProps {
    username: string;
    currentUser: string; 
    userId?: string;     
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

export const ProfileView = ({ 
    username, currentUser, userId, onBack, posts, userProfile, onUpdateProfile,
    onSelect, onDelete, onEdit, onReaction, onQuote, onReply, onBookmark, isBookmarked, journal
}: ProfileViewProps) => {
    const isMe = username === currentUser;
    const [activeTab, setActiveTab] = useState<'identity' | 'soul' | 'correspondence'>('identity');
    const [isEditing, setIsEditing] = useState(false);
    
    // --- ESTADO DE EDICIÓN ---
    const [editUsername, setEditUsername] = useState(username);
    const [editAvatarStr, setEditAvatarStr] = useState(userProfile?.avatar || "ph-user|text-stone-500 bg-stone-100");
    const [editBio, setEditBio] = useState(userProfile?.bio || ""); 

    // --- SYNC EDIT STATE ---
    useEffect(() => {
        if (!isEditing) {
            setEditUsername(username);
            setEditAvatarStr(userProfile?.avatar || "ph-user|text-stone-500 bg-stone-100");
            setEditBio(userProfile?.bio || "");
        }
    }, [username, userProfile, isEditing]);

    // --- COMUNICACIÓN ESTOICA (ESTADO) ---
    const [mementoCount, setMementoCount] = useState(0);
    const [inbox, setInbox] = useState<any[]>([]);
    
    // MODALES Y PROCESOS
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [showWriter, setShowWriter] = useState(false);
    const [letterTarget, setLetterTarget] = useState<{id: string, name: string} | null>(null);
    const [letterBody, setLetterBody] = useState("");
    const [selectedSeal, setSelectedSeal] = useState("ph-seal-check");
    const [isSending, setIsSending] = useState(false);

    // --- CARGA DE DATOS ---
    useEffect(() => {
        const targetId = userId || (userProfile as any)?.id; 
        if (targetId) {
            fetchMementoCount(targetId).then(setMementoCount);
            if (isMe) {
                fetchInbox(targetId).then(setInbox);
            }
        }
    }, [userId, userProfile, isMe]);

    // --- ANÁLISIS DE DATOS (USEMEMO) ---
    const xpData = useMemo(() => calculateLevel(userProfile?.xp || 0), [userProfile?.xp]);
    const soulData = useMemo(() => analyzeSoul(journal, posts), [journal, posts]);

    // --- PARSING AVATAR ---
    const getAvatarParts = (avatarString: string) => {
        if (!avatarString) return { icon: 'ph-user', classes: 'text-stone-500 bg-stone-100 dark:bg-stone-800' };
        
        if (avatarString.includes('|')) {
            const [icon, classes] = avatarString.split('|');
            return { icon, classes };
        } else {
            // Fallback if no color specified
            return { icon: avatarString, classes: 'text-stone-500 bg-stone-100 dark:bg-stone-800' };
        }
    };

    const displayAvatar = getAvatarParts(isEditing ? editAvatarStr : (userProfile?.avatar || "ph-user|text-stone-500 bg-stone-100"));

    // --- HANDLERS ---
    const handleSaveProfile = () => {
        if (!userProfile) return;
        const updated = { 
            ...userProfile, 
            username: editUsername, // Ensure editUsername is used here
            avatar: editAvatarStr, 
            bio: editBio 
        };
        onUpdateProfile(updated);
        setIsEditing(false);
    };

    const handleSendMemento = async () => {
        const targetId = userId || (userProfile as any)?.id;
        const myId = (await import('../services/supabase')).supabase.auth.getUser().then(r => r.data.user?.id);
        
        if (targetId && (await myId)) {
             setMementoCount(c => c + 1);
             await sendMemento(await myId, targetId);
             alert("Has presentado tus respetos.");
        }
    };

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        const results = await searchUsers(q);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleSelectUser = (u: any) => {
        setLetterTarget({ id: u.id, name: u.username });
        setShowUserSearch(false);
        setShowWriter(true);
    };

    const handleSendLetter = async () => {
        if (!letterBody.trim() || !letterTarget) return;
        setIsSending(true);
        
        // Obtener mi ID
        const {data: {user}} = await (await import('../services/supabase')).supabase.auth.getUser();
        
        if (user) {
             await sendLetter(user.id, letterTarget.id, letterBody, selectedSeal);
             await new Promise(r => setTimeout(r, 1500)); // Fake delay for UX
             alert(`Epístola sellada. Llegará a ${letterTarget.name} en 6 horas.`);
             setShowWriter(false);
             setLetterBody("");
             setLetterTarget(null);
        }
        setIsSending(false);
    };

    const openWriteToProfile = () => {
        const targetId = userId || (userProfile as any)?.id;
        if(targetId) {
            setLetterTarget({ id: targetId, name: username });
            setShowWriter(true);
        }
    };

    // --- VIEW: EDIT MODE ---
    if (isEditing) {
        return (
            <div className="fixed inset-0 z-[100] bg-[var(--bg)] animate-fade-in flex flex-col">
                <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)] shrink-0">
                    <h2 className="serif text-xl font-bold">Definir Identidad</h2>
                    <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full hover:bg-[var(--highlight)] flex items-center justify-center transition-colors"><i className="ph-bold ph-x text-lg"></i></button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32 max-w-3xl mx-auto w-full">
                    <div className="flex flex-col items-center mb-10">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl border-4 border-[var(--bg)] ${displayAvatar.classes}`}>
                            <i className={`ph-fill ${displayAvatar.icon}`}></i>
                        </div>
                        <div className="w-full max-w-xs space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block text-center">Nombre Público</label>
                                <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center font-serif text-lg font-bold outline-none focus:border-[var(--text-main)] transition-colors" placeholder="Tu nombre..." />
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block text-center">Biografía / Presentación</label>
                                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 font-serif text-sm outline-none focus:border-[var(--text-main)] transition-colors min-h-[100px] resize-none" placeholder="¿Quién eres? ¿Qué buscas en la filosofía?" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        {ARCHETYPES.map((cat, i) => (
                            <div key={i}>
                                <h3 className="text-[10px] font-bold uppercase tracking-[3px] opacity-40 mb-4 ml-2">{cat.category}</h3>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                    {cat.icons.map((item, j) => {
                                        const valueStr = `${item.icon}|${cat.color}`;
                                        const isSelected = editAvatarStr === valueStr;
                                        return (
                                            <button key={j} onClick={() => setEditAvatarStr(valueStr)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${isSelected ? 'border-[var(--text-main)] scale-105 shadow-md' : 'border-transparent hover:bg-[var(--highlight)] opacity-60 hover:opacity-100'}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${cat.color}`}><i className={`ph-fill ${item.icon}`}></i></div>
                                                <span className="text-[8px] font-bold uppercase tracking-wide">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-[var(--border)] bg-[var(--card)] shrink-0 flex justify-center">
                    <button onClick={handleSaveProfile} className="w-full max-w-sm py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-[24px] font-bold uppercase tracking-[2px] text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Guardar Cambios</button>
                </div>
            </div>
        );
    }

    // --- VIEW: MAIN PROFILE ---
    return (
        <div className="flex flex-col h-full animate-fade-in bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-100 via-[var(--bg)] to-[var(--bg)] dark:from-stone-900/40 dark:via-[var(--bg)] dark:to-[var(--bg)] relative overflow-hidden">
            
            {/* Top Navigation */}
            <div className="px-6 py-4 flex justify-between items-center z-10 sticky top-0 bg-[var(--bg)]/50 backdrop-blur-md">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-sm hover:bg-[var(--highlight)] transition-colors"><i className="ph-bold ph-arrow-left"></i></button>
                {isMe && (
                    <button onClick={() => setIsEditing(true)} className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-sm hover:bg-[var(--highlight)] transition-colors">
                        <i className="ph-bold ph-pencil-simple"></i>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                
                {/* 1. HEADER: THE MASK (IDENTITY) */}
                <div className="px-6 pt-2 pb-6 flex flex-col items-center text-center">
                    <div className="relative group">
                        {/* Level Ring */}
                        <svg className="absolute -inset-3 w-[136px] h-[136px] rotate-[-90deg]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" fill="none" stroke="var(--border)" strokeWidth="2" />
                            <circle 
                                cx="50" cy="50" r="48" fill="none" stroke="var(--gold)" strokeWidth="2" 
                                strokeDasharray="301" 
                                strokeDashoffset={301 - (301 * xpData.progress) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-2xl border-4 border-[var(--bg)] relative z-10 ${displayAvatar.classes}`}>
                            <i className={`ph-fill ${displayAvatar.icon}`}></i>
                        </div>
                        {/* Glow based on Soul Archetype if enough data */}
                        {soulData.wordCount > 50 && (
                            <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 scale-125 z-0 bg-current ${soulData.archetypeColor}`}></div>
                        )}
                    </div>
                    
                    <h1 className="serif text-3xl font-bold mt-6 mb-1 text-[var(--text-main)]">{username}</h1>
                    
                    <div className="flex flex-col items-center gap-2 mt-1">
                        <div className="flex items-center gap-2 bg-[var(--card)] px-4 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
                            <i className={`ph-fill ${soulData.archetypeIcon} ${soulData.archetypeColor}`}></i>
                            <span className="text-xs font-bold uppercase tracking-widest">{soulData.archetypeTitle}</span>
                            <span className="text-[10px] opacity-40">• Nivel {xpData.level}</span>
                        </div>
                        
                        {/* SOCIAL ACTIONS (IF VISITOR) */}
                        {!isMe && (
                            <div className="flex gap-3 mt-4 animate-fade-in">
                                <button onClick={handleSendMemento} className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--highlight)] transition-colors">
                                    <i className="ph-fill ph-hand-heart"></i> Respetos ({mementoCount})
                                </button>
                                <button onClick={openWriteToProfile} className="px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] border border-[var(--text-main)] rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg">
                                    <i className="ph-bold ph-envelope-simple"></i> Epístola
                                </button>
                            </div>
                        )}
                        {isMe && (
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
                                {mementoCount} Respetos Recibidos
                            </div>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex justify-center mb-6">
                    <div className="flex bg-[var(--card)] p-1 rounded-full border border-[var(--border)] shadow-sm">
                        <button onClick={() => setActiveTab('identity')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'identity' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Identidad</button>
                        <button onClick={() => setActiveTab('soul')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'soul' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Alma</button>
                        {isMe && <button onClick={() => setActiveTab('correspondence')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'correspondence' ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Buzón</button>}
                    </div>
                </div>

                {/* TAB CONTENT */}
                <div className="px-4 sm:px-6 max-w-3xl mx-auto w-full animate-fade-in pb-10">
                    
                    {/* --- TAB: IDENTITY (BIO) --- */}
                    {activeTab === 'identity' && (
                        <div className="space-y-6">
                            <div className="bg-[var(--card)] p-8 rounded-[24px] border border-[var(--border)] shadow-sm text-center relative overflow-hidden">
                                <i className="ph-duotone ph-quotes text-4xl absolute top-4 left-6 opacity-10"></i>
                                {userProfile?.bio ? (
                                    <p className="serif text-lg leading-relaxed opacity-80">{userProfile.bio}</p>
                                ) : (
                                    <p className="serif text-sm opacity-40 italic">Sin presentación.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SOUL (ANALYTICS & XP) --- */}
                    {activeTab === 'soul' && (
                        <div className="grid grid-cols-2 gap-3">
                            {/* XP Progress Card */}
                            <div className="col-span-1 bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                <div className="relative z-10">
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Nivel {xpData.level}</span>
                                    <div className="text-2xl font-serif font-bold text-[var(--gold)] mt-1 flex items-baseline gap-1">
                                        {userProfile?.xp || 0} <span className="text-[10px] text-[var(--text-main)] opacity-40 font-sans">XP</span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--highlight)] rounded-full overflow-hidden mt-4">
                                    <div className="h-full bg-[var(--gold)] relative overflow-hidden" style={{width: `${xpData.progress}%`}}>
                                         <div className="absolute inset-0 bg-white/30 animate-[pulse_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Mental State */}
                            <div className="col-span-1 bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm flex flex-col justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Foco Mental</span>
                                <div className="flex h-4 w-full rounded-full overflow-hidden my-auto mt-2">
                                    <div className="h-full bg-sky-400 transition-all duration-1000" style={{width: `${soulData.moodBalance.positive}%`}}></div>
                                    <div className="h-full bg-stone-300 dark:bg-stone-700 transition-all duration-1000 flex-1"></div>
                                </div>
                                <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest opacity-50 mt-1">
                                    <span>+{soulData.moodBalance.positive}%</span>
                                    <span>-{soulData.moodBalance.negative}%</span>
                                </div>
                            </div>

                            {/* Virtue Radar (Full Width) */}
                            <div className="col-span-2 bg-[var(--card)] p-5 rounded-[24px] border border-[var(--border)] shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-4 opacity-60">
                                    <i className="ph-bold ph-fingerprint-simple"></i>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Compás Moral</span>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    {[
                                        { k: 'wisdom', l: 'Sabiduría', c: 'bg-indigo-500', v: soulData.virtues.wisdom },
                                        { k: 'courage', l: 'Coraje', c: 'bg-rose-500', v: soulData.virtues.courage },
                                        { k: 'justice', l: 'Justicia', c: 'bg-amber-500', v: soulData.virtues.justice },
                                        { k: 'temperance', l: 'Templanza', c: 'bg-emerald-500', v: soulData.virtues.temperance }
                                    ].map((stat) => (
                                        <div key={stat.k}>
                                            <div className="flex justify-between mb-1 text-[9px] font-bold uppercase tracking-widest opacity-70">
                                                <span>{stat.l}</span>
                                                <span>{stat.v}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[var(--highlight)] rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${stat.c}`} style={{width: `${Math.max(5, stat.v)}%`}}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: CORRESPONDENCE (INBOX) --- */}
                    {activeTab === 'correspondence' && isMe && (
                        <div className="space-y-4 relative min-h-[300px]">
                            {/* Floating Action Button for New Letter */}
                            <div className="absolute bottom-4 right-2 z-20">
                                <button onClick={() => setShowUserSearch(true)} className="w-14 h-14 rounded-full bg-[var(--text-main)] text-[var(--bg)] shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-[var(--border)]">
                                    <i className="ph-fill ph-pencil-simple-slash text-2xl"></i>
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-2 opacity-40 px-2">
                                <i className="ph-fill ph-envelope-open"></i>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Epístolas Recibidas</span>
                                <div className="h-[1px] flex-1 bg-[var(--border)]"></div>
                            </div>

                            {inbox.length === 0 ? (
                                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                    <i className="ph-duotone ph-mailbox text-4xl mb-2"></i>
                                    <span className="serif text-sm italic">Tu buzón está vacío.</span>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {inbox.map((letter, i) => (
                                        <div key={i} className="bg-[#FAF5FF] dark:bg-[#1E1024] p-6 rounded-[24px] border border-purple-100 dark:border-purple-900/30 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
                                            <div className="absolute top-0 right-0 p-4 opacity-10"><i className={`ph-fill ${letter.seal_icon || 'ph-seal-check'} text-4xl text-purple-600`}></i></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-200 dark:border-purple-800">
                                                        <UserAvatar name={letter.sender?.username} avatarUrl={letter.sender?.avatar} size="sm" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-purple-900 dark:text-purple-100">{letter.sender?.username || 'Anónimo'}</span>
                                                        <span className="text-[9px] opacity-60 uppercase tracking-widest">{new Date(letter.deliver_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <p className="serif-text text-sm leading-loose opacity-90 text-purple-950 dark:text-purple-100 italic">
                                                    "{letter.content}"
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL 1: USER SEARCH --- */}
            {showUserSearch && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowUserSearch(false)}>
                    <div className="bg-[var(--card)] w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative border border-[var(--border)] flex flex-col h-[60vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="serif text-xl font-bold mb-4 text-center">Destinatario</h3>
                        
                        <div className="bg-[var(--highlight)] p-3 rounded-2xl flex items-center gap-3 mb-4 border border-[var(--border)]">
                            <i className="ph-bold ph-magnifying-glass opacity-40"></i>
                            <input 
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Buscar filósofo..."
                                className="bg-transparent outline-none w-full text-sm font-serif"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                            {isSearching && <div className="text-center py-4 opacity-50"><i className="ph-duotone ph-spinner animate-spin"></i></div>}
                            {!isSearching && searchResults.length === 0 && searchQuery.length > 2 && (
                                <div className="text-center py-4 opacity-40 text-xs">No encontrado.</div>
                            )}
                            {searchResults.map(u => (
                                <button key={u.id} onClick={() => handleSelectUser(u)} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--highlight)] rounded-xl transition-colors text-left group">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border)]">
                                        <UserAvatar name={u.username} avatarUrl={u.avatar} size="md" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{u.username}</div>
                                        <div className="text-[9px] opacity-50 uppercase tracking-widest">{calculateLevel(u.xp).title}</div>
                                    </div>
                                    <i className="ph-bold ph-caret-right ml-auto opacity-0 group-hover:opacity-50"></i>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: LETTER WRITER (RITUAL) --- */}
            {showWriter && letterTarget && (
                <div className="fixed inset-0 z-[110] bg-stone-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-lg bg-[#FDFBF7] text-stone-800 rounded-[2px] shadow-2xl p-8 relative flex flex-col items-center" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'}}>
                        <button onClick={() => setShowWriter(false)} className="absolute top-4 right-4 opacity-30 hover:opacity-100"><i className="ph-bold ph-x text-xl"></i></button>
                        
                        <div className="mb-6 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[3px] opacity-40 mb-1">Para</p>
                            <h3 className="serif text-2xl font-bold">{letterTarget.name}</h3>
                        </div>

                        <textarea 
                            value={letterBody}
                            onChange={(e) => setLetterBody(e.target.value)}
                            placeholder="Tus palabras viajarán despacio..."
                            className="w-full h-48 bg-transparent outline-none serif-text text-lg italic leading-loose resize-none mb-8 text-center placeholder:opacity-30"
                        />

                        <div className="w-full border-t border-stone-200 pt-6 flex flex-col items-center">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-4">Elige tu Sello</span>
                            <div className="flex gap-4 mb-8">
                                {SEALS.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => setSelectedSeal(s.icon)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedSeal === s.icon ? 'bg-red-700 text-white scale-110 shadow-lg' : 'bg-stone-200 text-stone-400 hover:bg-stone-300'}`}
                                        title={s.label}
                                    >
                                        <i className={`ph-fill ${s.icon} text-lg`}></i>
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={handleSendLetter}
                                disabled={isSending || !letterBody.trim()}
                                className="px-8 py-3 bg-stone-800 text-[#FDFBF7] font-bold uppercase tracking-[2px] text-xs rounded-sm hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSending ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-fill ph-seal-check"></i>}
                                Sellar y Enviar
                            </button>
                            <p className="text-[9px] mt-3 opacity-40 uppercase tracking-widest">Entrega en 6 horas • Slow Tech</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
