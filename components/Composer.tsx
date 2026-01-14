
import React, { useState, useEffect } from 'react';
import { Post, ParsedContent, CanvasStyle, SharedItem } from '../types';

interface ComposerProps {
    user: string;
    isOpen: boolean;
    onClose: () => void;
    onPublish: (text: string, title: string, tag: string, mode: 'thought'|'article', style: CanvasStyle, quoteOf?: Post, sharedItem?: SharedItem) => Promise<void>;
    onUpdate?: (postId: number, text: string, title: string, tag: string, style: CanvasStyle) => Promise<void>;
    quotingPost?: Post | null;
    editingPost?: Post | null;
    sharedItem?: SharedItem | null;
    initialMode?: 'thought' | 'article';
    initialTitle?: string;
    initialTag?: string;
    availableTags?: string[]; 
}

const DEFAULT_TAGS = ["Reflexión", "Pregunta", "Victoria", "Cita", "Consejo"];
const DEBATE_TAGS = ["Ética", "Lógica", "Física", "Política", "Cotidiano"];

const CANVAS_STYLES: Record<CanvasStyle, string> = {
    classic: 'bg-[var(--card)] ring-2 ring-[var(--text-main)]',
    paper: 'bg-[#FDFBF7] ring-2 ring-stone-300',
    nebula: 'bg-gradient-to-br from-indigo-900 to-purple-900 text-white',
    dawn: 'bg-gradient-to-br from-orange-200 to-rose-200 text-rose-900',
    midnight: 'bg-stone-900 text-stone-200'
};

type ComposerTab = 'breve' | 'debate' | 'ensayo';

export const Composer = ({ 
    user, isOpen, onClose, onPublish, onUpdate, 
    quotingPost, editingPost, sharedItem, 
    initialMode = 'thought', initialTitle = "", initialTag = "Reflexión",
    availableTags = DEFAULT_TAGS 
}: ComposerProps) => {
    const [activeTab, setActiveTab] = useState<ComposerTab>('breve');
    const [text, setText] = useState("");
    const [title, setTitle] = useState(initialTitle);
    const [tag, setTag] = useState(initialTag);
    const [style, setStyle] = useState<CanvasStyle>('classic');
    const [isPosting, setIsPosting] = useState(false);

    // Sync state when opening
    useEffect(() => {
        if(isOpen) {
            if (editingPost) {
                const c = editingPost.content as ParsedContent;
                if (c.type === 'article') setActiveTab('ensayo');
                else if (c.type === 'debate' || DEBATE_TAGS.includes(c.tag || '')) setActiveTab('debate');
                else setActiveTab('breve');

                setText(c.body || "");
                setTitle(c.title || "");
                setTag(c.tag || "Reflexión");
                setStyle(c.canvasStyle || 'classic');
            } else {
                // Determine tab based on initial props
                if (initialMode === 'article') setActiveTab('ensayo');
                else if (availableTags === DEBATE_TAGS || initialTag === 'Ética') setActiveTab('debate');
                else setActiveTab('breve');

                setText("");
                setTitle(initialTitle || "");
                setTag(initialTag);
                
                // Force tab if quoting
                if(quotingPost || sharedItem) setActiveTab('breve');
            }
        }
    }, [isOpen, initialMode, initialTitle, initialTag, quotingPost, sharedItem, editingPost, availableTags]);

    // Handle Tab Switching Logic
    const handleTabChange = (tab: ComposerTab) => {
        setActiveTab(tab);
        if (tab === 'breve') {
            setTag("Reflexión");
            setStyle('classic');
        } else if (tab === 'debate') {
            setTag("Ética");
            setStyle('classic');
        } else if (tab === 'ensayo') {
            setTag("Ensayo");
            setStyle('paper'); // Default nice style for essays
        }
    };

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setIsPosting(true);
        
        const finalMode = activeTab === 'ensayo' ? 'article' : 'thought';
        // Special case: Daily debate tag preservation if user switched tabs back and forth
        const finalTag = activeTab === 'ensayo' ? 'Ensayo' : tag;

        if (editingPost && onUpdate && editingPost.id) {
            await onUpdate(editingPost.id, text, title, finalTag, style);
        } else {
            await onPublish(text, title, finalTag, finalMode, style, quotingPost || undefined, sharedItem || undefined);
        }
        
        setIsPosting(false);
        onClose();
    };

    if (!isOpen) return null;

    // Derived UI states
    const showTitleInput = activeTab === 'debate' || activeTab === 'ensayo' || tag.startsWith('Diario:');
    const showTags = activeTab === 'breve' || activeTab === 'debate';
    const currentTags = activeTab === 'debate' ? DEBATE_TAGS : DEFAULT_TAGS;
    
    // Override tags if daily debate
    const displayTags = tag.startsWith('Diario:') ? [tag] : currentTags;

    return (
        <div className="fixed inset-0 z-[100] bg-[var(--bg)] animate-fade-in flex flex-col sm:items-center sm:justify-center sm:bg-black/50">
            <div className="bg-[var(--bg)] w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-[24px] sm:shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header Actions */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)] shrink-0 bg-[var(--bg)] z-10">
                    <button onClick={onClose} className="text-[var(--text-main)] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--highlight)]"><i className="ph-bold ph-x text-lg"></i></button>
                    
                    {/* TABS - Only show if not editing/quoting specific context */}
                    {!editingPost && !quotingPost && !sharedItem && !tag.startsWith('Diario:') ? (
                        <div className="flex bg-[var(--highlight)] p-1 rounded-full">
                            <button onClick={() => handleTabChange('breve')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'breve' ? 'bg-[var(--card)] shadow-sm text-[var(--text-main)]' : 'text-[var(--text-sub)]'}`}>Breve</button>
                            <button onClick={() => handleTabChange('debate')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'debate' ? 'bg-[var(--card)] shadow-sm text-[var(--text-main)]' : 'text-[var(--text-sub)]'}`}>Debate</button>
                            <button onClick={() => handleTabChange('ensayo')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'ensayo' ? 'bg-[var(--card)] shadow-sm text-[var(--text-main)]' : 'text-[var(--text-sub)]'}`}>Ensayo</button>
                        </div>
                    ) : (
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-1">
                            {editingPost ? 'Editando' : quotingPost ? 'Citando' : sharedItem ? 'Compartiendo' : 'Debate Diario'}
                        </span>
                    )}

                    <button onClick={handleSubmit} disabled={isPosting || !text.trim() || (activeTab !== 'breve' && !title.trim())} className="px-5 py-2 bg-[var(--text-main)] text-[var(--bg)] rounded-full text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-opacity">
                        {isPosting ? <i className="ph-duotone ph-spinner animate-spin"></i> : 'Publicar'}
                    </button>
                </div>
                
                <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                    
                    {/* Tags Row */}
                    {showTags && !quotingPost && !sharedItem && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 shrink-0">
                            {displayTags.map(t => (
                                <button key={t} onClick={() => setTag(t)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${tag === t ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)] shadow-sm' : 'border-[var(--border)] text-[var(--text-sub)] bg-[var(--card)]'}`}>{t}</button>
                            ))}
                        </div>
                    )}

                    {/* Context Previews */}
                    {quotingPost && (
                        <div className="mb-4 ml-4 border-l-4 border-[var(--border)] pl-4 py-2 opacity-70 select-none">
                            <span className="text-xs font-bold block mb-1">@{quotingPost.user_name}</span>
                            <p className="text-sm line-clamp-2 italic serif-text">"{(quotingPost.content as ParsedContent).body}"</p>
                        </div>
                    )}
                    {sharedItem && (
                        <div className="mb-4 mx-4 bg-[var(--highlight)]/30 border border-[var(--border)] rounded-2xl p-4">
                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1 flex items-center gap-1">
                                <i className="ph-bold ph-link"></i> {sharedItem.type}
                            </div>
                            <h4 className="serif font-bold text-base">{sharedItem.title}</h4>
                        </div>
                    )}

                    {/* Editor Canvas */}
                    <div className={`flex-1 flex flex-col transition-all rounded-2xl ${style !== 'classic' ? `p-6 shadow-sm ${CANVAS_STYLES[style]}` : ''}`}>
                        
                        {showTitleInput && (
                            <input 
                                autoFocus 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder={activeTab === 'ensayo' ? "Título del Ensayo" : "Tema del Debate"} 
                                className={`w-full text-2xl font-serif font-bold bg-transparent outline-none placeholder:opacity-30 mb-4 ${style !== 'classic' ? 'placeholder:text-white/50' : ''}`}
                            />
                        )}

                        <textarea 
                            autoFocus={!showTitleInput}
                            value={text} 
                            onChange={e => setText(e.target.value)} 
                            placeholder={activeTab === 'ensayo' ? "Desarrolla tu pensamiento..." : activeTab === 'debate' ? "Expón tu argumento..." : "¿Qué estás pensando?"} 
                            className={`w-full bg-transparent outline-none serif-text leading-relaxed placeholder:opacity-30 resize-none flex-1 ${activeTab === 'ensayo' ? 'text-lg' : 'text-xl'} ${style !== 'classic' ? 'placeholder:text-white/50 text-center flex flex-col justify-center' : 'text-[var(--text-main)]'}`}
                        />
                    </div>
                    
                    {/* Visual Styles Selector (Only for Breve/Thought mode without context) */}
                    {activeTab === 'breve' && !quotingPost && !sharedItem && (
                        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estilo</span>
                            <div className="flex gap-3">
                                <button onClick={() => setStyle('classic')} className={`w-6 h-6 rounded-full border border-[var(--border)] bg-[var(--card)] ${style === 'classic' ? 'ring-2 ring-[var(--text-main)]' : ''}`}></button>
                                <button onClick={() => setStyle('paper')} className={`w-6 h-6 rounded-full border border-stone-200 bg-[#FDFBF7] ${style === 'paper' ? 'ring-2 ring-[var(--text-main)]' : ''}`}></button>
                                <button onClick={() => setStyle('nebula')} className={`w-6 h-6 rounded-full bg-gradient-to-br from-indigo-900 to-purple-900 ${style === 'nebula' ? 'ring-2 ring-[var(--text-main)]' : ''}`}></button>
                                <button onClick={() => setStyle('dawn')} className={`w-6 h-6 rounded-full bg-gradient-to-br from-orange-200 to-rose-200 ${style === 'dawn' ? 'ring-2 ring-[var(--text-main)]' : ''}`}></button>
                                <button onClick={() => setStyle('midnight')} className={`w-6 h-6 rounded-full bg-stone-900 ${style === 'midnight' ? 'ring-2 ring-[var(--text-main)]' : ''}`}></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
