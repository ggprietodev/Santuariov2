
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { chatWithOracle } from '../services/geminiService';
import { supabase, fetchChatHistory, saveChatMessage } from '../services/supabase';
import { Reading, SharedItem, PhilosopherBio, PhilosophySchool } from '../types';

interface OracleProps {
    toggleSave: (r: Reading) => void;
    savedReadings: Reading[];
    onBack: () => void;
    onShare?: (item: SharedItem) => void;
    philosophers?: PhilosopherBio[];
    schools?: PhilosophySchool[]; 
}

interface ChatMessage {
    id?: string;
    role: 'user' | 'model';
    content: string;
}

const COMMON_TOPICS = ["Ansiedad", "Muerte", "Amor", "Propósito", "Ira", "Soledad", "Fracaso", "Éxito", "Dinero", "Tiempo"];

export function OracleModule({ onBack, toggleSave, savedReadings, philosophers = [], schools = [] }: OracleProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Configuration State
    const [showConfig, setShowConfig] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<string>("General");
    const [selectedPhilosopher, setSelectedPhilosopher] = useState<string>("Cualquiera");
    const [topicInput, setTopicInput] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const history = await fetchChatHistory(user.id);
                const uiMessages: ChatMessage[] = history.map((h: any) => ({
                    id: h.id,
                    role: h.role,
                    content: h.content
                }));
                setMessages(uiMessages);
                
                if (uiMessages.length === 0) {
                    setMessages([{ role: 'model', content: "Soy el Oráculo Estoico. Pregúntame sobre lo que te inquieta, y examinaremos juntos qué está bajo tu control." }]);
                }
            }
        };
        loadHistory();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (overrideText?: string) => {
        const textToSend = overrideText || input;
        if (!textToSend.trim() || loading) return;
        
        setInput("");
        setLoading(true);
        setShowConfig(false); 

        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. Optimistic UI update
        const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
        setMessages(newMessages);

        // 2. Save user message
        if (user) await saveChatMessage(user.id, 'user', textToSend);

        // 3. Call AI with history context
        const responseText = await chatWithOracle(textToSend, newMessages.slice(-10));

        // 4. Update UI with AI response
        setMessages(prev => [...prev, { role: 'model', content: responseText }]);
        setLoading(false);

        // 5. Save AI message
        if (user) await saveChatMessage(user.id, 'model', responseText);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleConsult = () => {
        if (!topicInput.trim()) return;
        
        let prompt = `Busco consejo sobre: "${topicInput}".`;
        if (selectedPhilosopher !== "Cualquiera") {
            prompt += ` Invoco la sabiduría de ${selectedPhilosopher}.`;
        }
        if (selectedSchool !== "General" && selectedSchool !== "Todas") {
            prompt += ` Analízalo desde la perspectiva de la escuela: ${selectedSchool}.`;
        }
        
        handleSend(prompt);
        setTopicInput("");
    };

    const handleSaveResponse = (msg: ChatMessage, index: number) => {
        // Find the preceding user message to use as Title/Context
        let question = "Consulta al Oráculo";
        if (index > 0 && messages[index - 1].role === 'user') {
            question = messages[index - 1].content;
        }

        const readingPayload: Reading = {
            t: question, // Title is the question
            q: msg.content, // Quote is the answer
            b: `Respuesta del Oráculo (${selectedSchool !== 'General' ? selectedSchool : 'Estoicismo'})`,
            a: selectedPhilosopher !== 'Cualquiera' ? selectedPhilosopher : 'Oráculo Digital',
            philosophy: selectedSchool !== 'General' ? selectedSchool : 'Estoicismo',
            type: 'oracle' as any, // Special type for filtering
            k: ['Oráculo', 'Consejo']
        };

        toggleSave(readingPayload);
    };

    // Check if a specific message content is already saved
    const isMessageSaved = (content: string) => {
        return savedReadings.some(r => r.q === content);
    };

    // Filter philosophers based on selected school
    const availablePhilosophers = useMemo(() => {
        if (selectedSchool === "General" || selectedSchool === "Todas") return philosophers;
        return philosophers.filter(p => p.school === selectedSchool);
    }, [selectedSchool, philosophers]);

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center relative overflow-hidden">
            
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <div>
                        <h2 className="serif text-2xl font-bold">El Oráculo</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mentor Estoico</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowConfig(!showConfig)} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border transition-all ${showConfig ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}
                >
                    <i className="ph-bold ph-sliders-horizontal"></i>
                </button>
            </div>

            {/* Config Panel (Collapsible) */}
            <div className={`w-full max-w-2xl bg-[var(--card)] border-b border-[var(--border)] overflow-hidden transition-all duration-300 ease-in-out shadow-sm relative z-20 ${showConfig ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 space-y-5">
                    
                    {/* Schools */}
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Escuela</span>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            <button onClick={() => { setSelectedSchool("General"); setSelectedPhilosopher("Cualquiera"); }} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedSchool==="General" ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>General</button>
                            {schools.map(s => (
                                <button key={s.name} onClick={() => { setSelectedSchool(s.name); setSelectedPhilosopher("Cualquiera"); }} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedSchool===s.name ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Philosophers */}
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Guía Específico</span>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            <button onClick={() => setSelectedPhilosopher("Cualquiera")} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedPhilosopher==="Cualquiera" ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>Cualquiera</button>
                            {availablePhilosophers.map(p => (
                                <button key={p.id} onClick={() => setSelectedPhilosopher(p.name)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedPhilosopher===p.name ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topic */}
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Tema de Consulta</span>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {COMMON_TOPICS.map(t => (
                                <button key={t} onClick={() => setTopicInput(t)} className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${topicInput === t ? 'bg-[var(--highlight)] border-[var(--text-main)]' : 'bg-[var(--bg)] border-[var(--border)] opacity-60 hover:opacity-100'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                value={topicInput} 
                                onChange={(e) => setTopicInput(e.target.value)} 
                                placeholder="O escribe tu inquietud..." 
                                className="flex-1 bg-[var(--highlight)] p-3 rounded-xl text-sm font-serif outline-none border border-transparent focus:border-[var(--text-main)]"
                            />
                            <button onClick={handleConsult} disabled={!topicInput.trim()} className="bg-[var(--text-main)] text-[var(--bg)] px-4 rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all">
                                <i className="ph-bold ph-paper-plane-right text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Body */}
            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-4 pt-6 relative z-10 flex flex-col no-scrollbar" ref={scrollRef}>
                <div className="space-y-6 pb-20">
                    {messages.map((msg, i) => {
                        const isUser = msg.role === 'user';
                        const isSaved = !isUser && isMessageSaved(msg.content);

                        return (
                            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
                                <div className={`max-w-[85%] rounded-[24px] px-6 py-4 relative shadow-sm ${isUser ? 'bg-[var(--text-main)] text-[var(--bg)] rounded-br-sm' : 'bg-[var(--card)] border border-[var(--border)] rounded-bl-sm text-[var(--text-main)]'}`}>
                                    {!isUser && (
                                        <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center shadow-md z-10">
                                            <i className="ph-fill ph-sparkle text-indigo-400 text-sm animate-pulse-slow"></i>
                                        </div>
                                    )}
                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'font-sans' : 'serif-text opacity-90'}`}>
                                        {msg.content}
                                    </p>
                                    
                                    {/* Bookmark Action for AI Messages */}
                                    {!isUser && (
                                        <button 
                                            onClick={() => handleSaveResponse(msg, i)}
                                            className={`absolute -bottom-3 -right-3 w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-all active:scale-90 ${isSaved ? 'bg-[var(--gold)] border-[var(--gold)] text-white' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:text-[var(--gold)]'}`}
                                            title="Guardar en Biblioteca"
                                        >
                                            <i className={`ph-${isSaved ? 'fill' : 'bold'} ph-bookmark-simple text-sm`}></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {loading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[24px] rounded-bl-sm px-6 py-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-[var(--text-sub)] rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                <div className="w-2 h-2 bg-[var(--text-sub)] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-[var(--text-sub)] rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="w-full max-w-2xl px-4 pb-6 pt-2 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent z-20">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-2 flex items-center gap-2 shadow-lg focus-within:border-[var(--text-main)] transition-colors">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-sub)] opacity-50 shrink-0">
                        <i className="ph-bold ph-chats-teardrop text-xl"></i>
                    </div>
                    <input 
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Consulta al sabio..."
                        className="flex-1 bg-transparent outline-none font-serif text-base placeholder:font-sans placeholder:opacity-40 h-12"
                        disabled={loading}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="w-12 h-12 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50 hover:scale-105 shrink-0"
                    >
                        <i className="ph-bold ph-paper-plane-right text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}
