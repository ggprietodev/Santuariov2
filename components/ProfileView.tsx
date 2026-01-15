
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Post, ParsedContent, JournalEntry } from '../types';
import { PostCard } from './PostCard';
import { calculateLevel } from '../utils/gamification';
import { UserAvatar } from './Shared';
import { getISO } from '../services/supabase';

// --- CURATED CLASSICAL BUSTS GALLERY ---
const ELEGANT_AVATARS = [
    // Classical Busts & Statues (High Quality Unsplash Crops)
    { type: 'img', url: 'https://images.unsplash.com/photo-1555661607-687dd708573a?auto=format&fit=crop&w=400&q=80', label: 'David' },
    { type: 'img', url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=400&q=80', label: 'César' },
    { type: 'img', url: 'https://images.unsplash.com/photo-1566125882500-87e10f726cdc?auto=format&fit=crop&w=400&q=80', label: 'Séneca' },
    { type: 'img', url: 'https://images.unsplash.com/photo-1545997281-2cfe4d4474ad?auto=format&fit=crop&w=400&q=80', label: 'Atenea' },
    { type: 'img', url: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=400&q=80', label: 'Miguel Ángel' },
    { type: 'img', url: 'https://images.unsplash.com/photo-1596721027560-639a0937f37d?auto=format&fit=crop&w=400&q=80', label: 'Apolo' },
    
    // Philosophical Icons (Fallback)
    { type: 'icon', icon: 'ph-columns', color: 'text-stone-600', label: 'Stoa' },
    { type: 'icon', icon: 'ph-fire', color: 'text-amber-600', label: 'Ignis' },
    { type: 'icon', icon: 'ph-brain', color: 'text-purple-600', label: 'Logos' },
    { type: 'icon', icon: 'ph-mountains', color: 'text-emerald-600', label: 'Mons' },
    { type: 'icon', icon: 'ph-yin-yang', color: 'text-stone-800', label: 'Tao' },
    { type: 'icon', icon: 'ph-sun', color: 'text-orange-500', label: 'Luz' },
];

// --- ATMOSPHERES & TEXTURES ---
const ELEGANT_BANNERS = [
    { name: 'Mármol', url: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=800&q=80', type: 'image' },
    { name: 'Papiro', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80', type: 'image' },
    { name: 'Papel', url: 'bg-[#F9F7F1]', type: 'color' },
    { name: 'Niebla', url: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)', type: 'gradient' },
    { name: 'Obsidiana', url: 'linear-gradient(to right, #434343 0%, black 100%)', type: 'gradient' },
    { name: 'Amanecer', url: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)', type: 'gradient' },
    { name: 'Arena', url: 'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)', type: 'gradient' },
    { name: 'Olivo', url: 'linear-gradient(to right, #606c88 0%, #3f4c6b 100%)', type: 'gradient' },
];

// --- MEDALS DEFINITION ---
const DEFINED_MEDALS = [
    { id: 'scribe', label: 'Escriba', icon: 'ph-feather', color: 'text-stone-500', requirement: '1k Palabras', check: (stats: any) => stats.words >= 1000 },
    { id: 'chronicler', label: 'Cronista', icon: 'ph-scroll', color: 'text-sky-600', requirement: '10k Palabras', check: (stats: any) => stats.words >= 10000 },
    { id: 'author', label: 'Autor', icon: 'ph-book-open', color: 'text-amber-500', requirement: '50k Palabras', check: (stats: any) => stats.words >= 50000 },
    { id: 'novice', label: 'Iniciado', icon: 'ph-sparkle', color: 'text-emerald-600', requirement: '10 Entradas', check: (stats: any) => stats.entries >= 10 },
    { id: 'constant', label: 'Constante', icon: 'ph-star', color: 'text-purple-600', requirement: '50 Entradas', check: (stats: any) => stats.entries >= 50 },
    { id: 'stoic', label: 'Estoico', icon: 'ph-crown', color: 'text-[var(--gold)]', requirement: '100 Entradas', check: (stats: any) => stats.entries >= 100 },
];

// --- STOP WORDS (PALABRAS A IGNORAR) ---
const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 
    'es', 'son', 'fue', 'era', 'con', 'sin', 'por', 'para', 'de', 'del', 'a', 'al', 
    'en', 'sobre', 'entre', 'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'me', 'te', 'se', 
    'nos', 'os', 'lo', 'la', 'le', 'les', 'que', 'como', 'cuando', 'donde', 'quien', 
    'porque', 'esta', 'este', 'esto', 'ese', 'esa', 'eso', 'aqui', 'alli', 'hoy', 'ayer', 
    'mañana', 'dia', 'noche', 'vida', 'cosas', 'todo', 'nada', 'algo', 'hacer', 'tengo', 
    'puedo', 'quiero', 'estoy', 'estas', 'esta', 'estamos', 'estan', 'ser', 'estar', 'haber',
    'tener', 'mas', 'menos', 'muy', 'mucho', 'poco', 'tan', 'asi', 'bien', 'mal', 'ahora',
    'entonces', 'luego', 'despues', 'antes', 'mismo', 'otra', 'otro', 'cada', 'fin', 'gran',
    'soy', 'fui', 'sido', 'eres', 'he', 'has', 'ha', 'han', 'hemos', 'habia'
]);

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

// Helper to strip HTML for accurate word count
const stripHtml = (html: string) => {
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

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
    const [editTab, setEditTab] = useState<'perfil'|'avatar'>('perfil');
    const [avatarSource, setAvatarSource] = useState<'gallery'|'url'>('gallery');

    useEffect(() => {
        if(userProfile) {
            setBio(userProfile.bio || "");
            setAvatar(userProfile.avatar || "");
            setBanner(userProfile.banner || "");
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
            joinedAt: userProfile?.joinedAt || new Date().toISOString(),
            xp: userProfile?.xp,
            current_level: userProfile?.current_level 
        };
        onUpdateProfile(newProfile);
        setIsEditing(false);
    };

    const xpData = calculateLevel(userProfile?.xp || 0);

    // Advanced Stats Calculation
    const stats = useMemo(() => {
        let ethics = 0, logic = 0, physics = 0;
        let wordCount = 0;
        const wordFrequency: Record<string, number> = {};
        
        // Expanded Dictionary with WEIGHTS
        // Key: word fragment, Value: { type: 'ethics'|'logic'|'physics', weight: number }
        const dictionary: Record<string, { t: 'e'|'l'|'p', w: number }> = {
            // Ética
            'virtud': {t:'e', w:5}, 'justicia': {t:'e', w:5}, 'acción': {t:'e', w:4}, 'bien': {t:'e', w:3},
            'mal': {t:'e', w:3}, 'deber': {t:'e', w:4}, 'sociedad': {t:'e', w:3}, 'amigo': {t:'e', w:3},
            'ayuda': {t:'e', w:3}, 'moral': {t:'e', w:4}, 'comunidad': {t:'e', w:3}, 'prójimo': {t:'e', w:3},
            'hábito': {t:'e', w:4}, 'carácter': {t:'e', w:5}, 'voluntad': {t:'e', w:5}, 'templanza': {t:'e', w:5},
            'valor': {t:'e', w:4}, 'amor': {t:'e', w:3}, 'perdón': {t:'e', w:4}, 'empatía': {t:'e', w:4},
            
            // Lógica
            'lógica': {t:'l', w:5}, 'mente': {t:'l', w:4}, 'juicio': {t:'l', w:5}, 'razón': {t:'l', w:5},
            'verdad': {t:'l', w:4}, 'pensamiento': {t:'l', w:3}, 'duda': {t:'l', w:3}, 'opinión': {t:'l', w:3},
            'análisis': {t:'l', w:4}, 'aprender': {t:'l', w:3}, 'entender': {t:'l', w:3}, 'control': {t:'l', w:5},
            'elección': {t:'l', w:4}, 'asentimiento': {t:'l', w:5}, 'falacia': {t:'l', w:5}, 'claridad': {t:'l', w:3},
            'percepción': {t:'l', w:4}, 'idea': {t:'l', w:3}, 'logos': {t:'l', w:5},
            
            // Física
            'física': {t:'p', w:5}, 'naturaleza': {t:'p', w:5}, 'cosmos': {t:'p', w:5}, 'dios': {t:'p', w:4},
            'destino': {t:'p', w:5}, 'muerte': {t:'p', w:5}, 'tiempo': {t:'p', w:4}, 'universo': {t:'p', w:5},
            'cambio': {t:'p', w:4}, 'átomo': {t:'p', w:5}, 'fuego': {t:'p', w:4}, 'pneuma': {t:'p', w:5},
            'fluir': {t:'p', w:3}, 'vida': {t:'p', w:2}, 'mundo': {t:'p', w:2}, 'energía': {t:'p', w:3},
            'azar': {t:'p', w:4}, 'caos': {t:'p', w:4}, 'impermanencia': {t:'p', w:5}, 'materia': {t:'p', w:3}
        };

        const analyzeText = (text: string) => {
            if(!text) return;
            const clean = stripHtml(text).toLowerCase();
            // Split by non-word characters to get clearer tokens
            const tokenized = clean.split(/[^a-záéíóúñ]+/);
            
            tokenized.forEach(word => {
                if (word.length > 2) {
                    wordCount++;
                    
                    // Stop words check
                    if (!STOP_WORDS.has(word)) {
                        let weight = 1;
                        let isPhilosophical = false;

                        // Check dictionary matches (partial match)
                        for (const [key, val] of Object.entries(dictionary)) {
                            if (word.includes(key)) {
                                if (val.t === 'e') ethics += val.w;
                                if (val.t === 'l') logic += val.w;
                                if (val.t === 'p') physics += val.w;
                                weight = 5; // Philosophical words count x5 for Focus
                                isPhilosophical = true;
                                break; 
                            }
                        }
                        
                        wordFrequency[word] = (wordFrequency[word] || 0) + weight;
                    }
                }
            });
        };

        // Analyze Posts
        posts.forEach(p => {
            const c = p.content as ParsedContent;
            analyzeText((c.title || "") + " " + (c.tag || "") + " " + (c.body || ""));
        });

        // Analyze Journal (Private) - Only if isMe
        let streak = 0;
        if(journal && isMe) {
            const entries = Object.values(journal);
            entries.forEach(e => {
                analyzeText((e.text || "") + " " + (e.question_response || "") + " " + (e.challenge_response || ""));
            });

            // Calculate Streak
            const sortedDates = Object.keys(journal).sort().reverse();
            if (sortedDates.length > 0) {
                const today = getISO();
                const yesterday = getISO(new Date(Date.now() - 86400000));
                
                if (sortedDates[0] === today || sortedDates[0] === yesterday) {
                    streak = 1;
                    let currentDate = new Date(sortedDates[0]);
                    for (let i = 1; i < sortedDates.length; i++) {
                        const prevDate = new Date(sortedDates[i]);
                        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                        if (diffDays === 1) { streak++; currentDate = prevDate; } else { break; }
                    }
                }
            }
        }
        
        // Find most frequent word (Focus)
        let focusWord = "Vacío";
        let focusCount = 0;
        let maxCount = 0;
        
        Object.entries(wordFrequency).forEach(([w, c]) => {
            if (c > maxCount) {
                maxCount = c;
                focusWord = w;
                focusCount = c; // Rough approximation of relevance
            }
        });

        // Normalize scores to avoid empty bars
        const totalRaw = ethics + logic + physics;
        const base = totalRaw === 0 ? 3 : 0; 
        
        // Assign Patron Philosopher
        let patron = "Zenón (Equilibrio)";
        if (ethics > logic && ethics > physics) patron = "Marco Aurelio (Ética)";
        else if (logic > ethics && logic > physics) patron = "Epicteto (Lógica)";
        else if (physics > ethics && physics > logic) patron = "Séneca (Física)";

        const total = totalRaw + base;
        
        return { 
            words: wordCount, 
            entries: isMe && journal ? Object.keys(journal).length : posts.length,
            streak,
            focus: focusWord,
            focusScore: Math.round(maxCount / 5), // Normalize back roughly
            patron,
            ethics: Math.round(((ethics + (base/3)) / total) * 100), 
            logic: Math.round(((logic + (base/3)) / total) * 100), 
            physics: Math.round(((physics + (base/3)) / total) * 100) 
        };
    }, [posts, journal, isMe]);

    const entryCount = stats.entries;
    
    // Process Medals state (Locked/Unlocked)
    const medalsState = useMemo(() => {
        return DEFINED_MEDALS.map(m => ({
            ...m,
            unlocked: m.check(stats)
        }));
    }, [stats]);

    const recentPublicWorks = useMemo(() => {
        return posts
            .filter(p => {
                const c = p.content as ParsedContent;
                return c.type === 'article' || c.type === 'debate';
            })
            .slice(0, 5);
    }, [posts]);

    const bannerStyle = banner && banner.startsWith('http')
        ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: banner || 'linear-gradient(to bottom, #e2e2e2, #ffffff)' };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] relative overflow-hidden">
            {/* Nav */}
            <div className="absolute top-0 left-0 right-0 z-40 p-4 flex justify-between items-center text-[var(--text-main)] mix-blend-difference pointer-events-none">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-white/30 transition-colors shadow-sm border border-white/10 text-white"><i className="ph-bold ph-arrow-left"></i></button>
                {isMe && (
                    <button onClick={() => setIsEditing(true)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-white/30 transition-colors shadow-sm border border-white/10 text-white">
                        <i className="ph-bold ph-pencil-simple"></i>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                
                {/* 1. HERO HEADER */}
                <div className="relative pt-24 pb-8 px-6 text-center border-b border-[var(--border)] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-48 opacity-100 z-0" style={bannerStyle}>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-[var(--bg)]"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <UserAvatar 
                            name={username}
                            avatarUrl={avatar}
                            size="xxl"
                            className="border-4 border-[var(--bg)] shadow-xl bg-stone-100 dark:bg-stone-800"
                        />
                        
                        <h1 className="serif text-3xl font-bold mb-1 mt-4 text-[var(--text-main)]">{username}</h1>
                        
                        <div className="flex flex-col items-center gap-2 mb-4 w-full max-w-[180px] bg-[var(--card)]/50 backdrop-blur-sm p-3 rounded-2xl border border-[var(--border)] shadow-sm mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Nivel {xpData.level}</span>
                                <span className="font-serif font-bold text-[var(--gold)]">{xpData.title}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--highlight)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full" style={{width: `${xpData.progress}%`}}></div>
                            </div>
                            <span className="text-[9px] font-mono opacity-40">{userProfile?.xp || 0} XP</span>
                        </div>

                        {userProfile?.website && (
                            <a href={userProfile.website} target="_blank" rel="noopener" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:text-[var(--gold)] transition-colors mt-1 flex items-center gap-1">
                                <i className="ph-bold ph-link"></i> {userProfile.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        
                        {bio && (
                            <p className="serif-text text-base italic leading-relaxed opacity-80 max-w-md mx-auto mt-4 text-[var(--text-main)]">"{bio}"</p>
                        )}
                    </div>
                </div>

                {/* 2. STATS GRID */}
                <div className="max-w-2xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8">
                        <div className="bg-[var(--card)] p-3 sm:p-5 rounded-[20px] border border-[var(--border)] shadow-sm flex flex-col items-center justify-center">
                            <span className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">{(stats.words / 1000).toFixed(1)}k</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Palabras</span>
                        </div>
                        <div className="bg-[var(--card)] p-3 sm:p-5 rounded-[20px] border border-[var(--border)] shadow-sm flex flex-col items-center justify-center">
                            <span className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">{entryCount}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Entradas</span>
                        </div>
                        {/* New Stats */}
                        <div className="bg-[var(--card)] p-3 sm:p-5 rounded-[20px] border border-[var(--border)] shadow-sm flex flex-col items-center justify-center">
                            <span className="text-xl sm:text-2xl font-serif font-bold text-emerald-600">{stats.streak}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Racha</span>
                        </div>
                        <div className="bg-[var(--card)] p-3 sm:p-5 rounded-[20px] border border-[var(--border)] shadow-sm flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-sm sm:text-base font-serif font-bold text-[var(--text-main)] truncate w-full text-center px-1 capitalize">{stats.focus}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Foco ({stats.focusScore})</span>
                        </div>
                    </div>

                    {/* Stoic Compass Analysis */}
                    <div className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm mb-8">
                        <div className="flex justify-between items-center mb-4 border-b border-[var(--border)] pb-3">
                            <h3 className="serif text-lg font-bold opacity-90">Arquetipo Filosófico</h3>
                            <span className="text-[9px] font-bold uppercase tracking-widest bg-[var(--highlight)] px-2 py-1 rounded-lg opacity-60 truncate max-w-[150px]">
                                {stats.patron}
                            </span>
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
                    </div>

                    {/* NEW: MEDALS SECTION (Always Visible, with Locks) */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4 opacity-40 px-1">
                            <i className="ph-fill ph-medal"></i>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Medallero de Virtudes</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                            {medalsState.map((medal, i) => (
                                <div key={i} className={`flex flex-col items-center gap-2 min-w-[80px] group transition-all ${!medal.unlocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                                    <div className="w-16 h-16 rounded-[20px] bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform">
                                        {medal.unlocked ? (
                                            <i className={`ph-fill ${medal.icon} text-3xl ${medal.color}`}></i>
                                        ) : (
                                            <i className="ph-bold ph-lock-key text-2xl opacity-30"></i>
                                        )}
                                        {/* Shine effect for unlocked */}
                                        {medal.unlocked && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 rotate-45 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">{medal.label}</span>
                                        {!medal.unlocked && <span className="text-[8px] font-mono opacity-50">{medal.requirement}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. PUBLIC WORKS */}
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
                                            onViewProfile={() => {}} 
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in flex flex-col sm:items-center sm:justify-center p-0 sm:p-6">
                    <div className="bg-[var(--card)] w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-[32px] sm:shadow-2xl flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]/50 backdrop-blur-sm shrink-0">
                            <h2 className="serif text-xl font-bold">Tallar Identidad</h2>
                            <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full hover:bg-[var(--highlight)] flex items-center justify-center transition-colors"><i className="ph-bold ph-x"></i></button>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 pt-4 pb-2 flex gap-4 border-b border-[var(--border)] bg-[var(--card)]">
                            <button onClick={() => setEditTab('perfil')} className={`pb-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${editTab === 'perfil' ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-sub)] opacity-60'}`}>Perfil</button>
                            <button onClick={() => setEditTab('avatar')} className={`pb-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${editTab === 'avatar' ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-sub)] opacity-60'}`}>Apariencia</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[var(--bg)]">
                            
                            {/* TAB: PERFIL */}
                            {editTab === 'perfil' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-2">Biografía</label>
                                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full h-32 bg-[var(--highlight)] p-4 rounded-2xl outline-none text-sm resize-none border border-transparent focus:border-[var(--text-main)] serif-text leading-relaxed" placeholder="Tu filosofía de vida..."/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-2">Sitio Web</label>
                                        <div className="flex items-center gap-3 bg-[var(--highlight)] p-4 rounded-2xl border border-transparent focus-within:border-[var(--text-main)]">
                                            <i className="ph-bold ph-link opacity-30"></i>
                                            <input value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-transparent outline-none text-sm font-mono" placeholder="https://..."/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: AVATAR & BANNER */}
                            {editTab === 'avatar' && (
                                <div className="space-y-8 animate-fade-in">
                                    
                                    {/* LIVE PREVIEW */}
                                    <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] h-40 group">
                                        <div className="absolute inset-0" style={banner && banner.startsWith('http') ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover' } : { background: banner || 'linear-gradient(to bottom, #e2e2e2, #ffffff)' }}>
                                            <div className="absolute inset-0 bg-black/10"></div>
                                        </div>
                                        
                                        <div className="absolute bottom-4 left-6 flex items-end gap-4">
                                            <UserAvatar name={username} avatarUrl={avatar} size="xl" className="border-4 border-[var(--bg)] shadow-lg bg-stone-100" />
                                            <div className="mb-2 text-white drop-shadow-md">
                                                <h3 className="serif font-bold text-lg leading-none">{username}</h3>
                                                <p className="text-[10px] uppercase tracking-widest opacity-80">Vista Previa</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Avatar Selection */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Efigie (Bustos)</label>
                                            <div className="flex bg-[var(--highlight)] rounded-full p-0.5">
                                                <button onClick={() => setAvatarSource('gallery')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${avatarSource==='gallery'?'bg-[var(--card)] shadow-sm text-[var(--text-main)]':'text-[var(--text-sub)]'}`}>Galería</button>
                                                <button onClick={() => setAvatarSource('url')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${avatarSource==='url'?'bg-[var(--card)] shadow-sm text-[var(--text-main)]':'text-[var(--text-sub)]'}`}>Enlace</button>
                                            </div>
                                        </div>

                                        {avatarSource === 'gallery' ? (
                                            <div className="grid grid-cols-4 gap-4">
                                                {ELEGANT_AVATARS.map((a, i) => (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => setAvatar(a.type === 'icon' ? `${a.icon}|${a.color}` : a.url || "")}
                                                        className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center relative group ${avatar === (a.type === 'icon' ? `${a.icon}|${a.color}` : a.url) ? 'border-[var(--text-main)] ring-2 ring-[var(--text-main)]/20 shadow-md scale-105' : 'border-transparent bg-[var(--highlight)] opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}
                                                        title={a.label}
                                                    >
                                                        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                                            {a.type === 'icon' ? (
                                                                <i className={`ph-fill ${a.icon} text-3xl ${a.color?.replace('text-', '')}`}></i>
                                                            ) : (
                                                                <img src={a.url} className="w-full h-full object-cover filter hover:contrast-125 transition-all duration-500" alt={a.label} />
                                                            )}
                                                        </div>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-60 pb-1">{a.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-[var(--highlight)] p-4 rounded-2xl border border-transparent focus-within:border-[var(--text-main)] transition-colors">
                                                <i className="ph-bold ph-image opacity-30 text-lg"></i>
                                                <input 
                                                    value={avatar.startsWith('http') && !ELEGANT_AVATARS.some(p => p.url === avatar) ? avatar : ''} 
                                                    onChange={e => setAvatar(e.target.value)} 
                                                    placeholder="https://ejemplo.com/imagen.jpg" 
                                                    className="w-full bg-transparent outline-none text-sm font-mono"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Banner Selection */}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-4">Atmósfera</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {ELEGANT_BANNERS.map((b, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => setBanner(b.url)}
                                                    className={`h-24 rounded-2xl overflow-hidden border-2 transition-all relative group ${banner === b.url ? 'border-[var(--text-main)] shadow-md scale-[1.02]' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-[1.01]'}`}
                                                >
                                                    {b.type === 'image' ? (
                                                        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${b.url})`}}></div>
                                                    ) : (
                                                        <div className="absolute inset-0" style={{background: b.url}}></div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/10"></div>
                                                    <span className={`absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-widest drop-shadow-md text-white`}>{b.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-[var(--border)] bg-[var(--card)] shrink-0">
                            <button onClick={handleSave} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-[2px] text-xs shadow-lg hover:opacity-90 transition-opacity active:scale-[0.99]">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
