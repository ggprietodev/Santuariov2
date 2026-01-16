
import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { getISO, fetchDailyQuestions } from '../services/supabase';
import { getDailyQuestion } from '../utils/stoicData';

interface JournalModuleProps {
    onClose: () => void;
    onSave: (date: string, entry: JournalEntry, title?: string, tags?: string[], structured_answers?: any) => void;
    initialMode?: 'morning' | 'evening' | 'free' | null;
    initialDate?: string; 
}

type Mode = 'morning' | 'evening' | 'free';

const RITUALS = {
    morning: {
        title: "Ritual del Amanecer",
        short: "Amanecer",
        icon: "ph-sun-horizon",
        // Warm, hopeful gradient
        bgClass: "bg-gradient-to-br from-[#FFF8E1] to-[#FFE0B2] dark:from-[#3E2723] dark:to-[#1a1a1a]", 
        textClass: "text-amber-900 dark:text-amber-50",
        accentColor: "text-amber-600 dark:text-amber-400",
        inputClass: "bg-white/50 dark:bg-black/20 border-amber-200/50 dark:border-amber-900/50 focus:border-amber-500",
        buttonClass: "bg-amber-800 text-white hover:bg-amber-900 shadow-amber-900/20",
        steps: [
            { id: "mood", label: "Estado Vital" },
            { id: "intent", label: "Propósito", prompt: "¿Cuál es la virtud principal que guiará mis acciones?" },
            { id: "premeditatio", label: "Anticipación", prompt: "¿Qué obstáculo podría surgir y cómo responderé estoicamente?" },
            { id: "gratitude", label: "Gratitud", prompt: "Una cosa simple por la que vale la pena vivir." }
        ],
        tags: ['morning', 'ritual']
    },
    evening: {
        title: "Cierre del Día",
        short: "Anochecer",
        icon: "ph-moon-stars",
        // Deep, contemplative gradient
        bgClass: "bg-gradient-to-br from-[#E0E7FF] to-[#C7D2FE] dark:from-[#0F172A] dark:to-[#1E1B4B]",
        textClass: "text-indigo-950 dark:text-indigo-50",
        accentColor: "text-indigo-600 dark:text-indigo-300",
        inputClass: "bg-white/50 dark:bg-white/5 border-indigo-200/50 dark:border-indigo-500/30 focus:border-indigo-600",
        buttonClass: "bg-indigo-900 text-white hover:bg-black shadow-indigo-900/20",
        steps: [
            { id: "mood", label: "Balance Final" },
            { id: "daily_question", label: "Pregunta del Día", prompt: "Cargando..." },
            { id: "review", label: "Examen", prompt: "¿En qué fallé? ¿Qué hice bien?" },
            { id: "peace", label: "Paz", prompt: "Suelto lo que no controlo para poder descansar." }
        ],
        tags: ['evening', 'ritual']
    },
    free: {
        title: "Escritura Libre",
        short: "Diario",
        icon: "ph-pen-nib",
        bgClass: "bg-[var(--bg)]",
        textClass: "text-[var(--text-main)]",
        accentColor: "text-[var(--text-sub)]",
        inputClass: "bg-transparent border-none",
        buttonClass: "bg-[var(--text-main)] text-[var(--bg)]",
        steps: [],
        tags: ['free']
    }
};

export const JournalModule: React.FC<JournalModuleProps> = ({ onClose, onSave, initialMode, initialDate }) => {
    const [mode, setMode] = useState<Mode | null>(initialMode || null);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [mood, setMood] = useState(0);
    const [text, setText] = useState(""); 
    const [dailyQuestionText, setDailyQuestionText] = useState("");

    // Determine target date and permissions
    const targetDate = initialDate || getISO();
    const isTimeTravel = !!initialDate && initialDate !== getISO();
    const canEdit = !isTimeTravel; // Strict: Only allow editing if it's today
    
    const dateDisplay = new Date(targetDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

    // Load Daily Question if Evening Mode
    useEffect(() => {
        const loadQuestion = async () => {
            if (mode === 'evening') {
                // Fetch questions to get a seeded random one for THAT specific date
                const questions = await fetchDailyQuestions();
                // Ensure we get the question for the TARGET date, not necessarily today()
                // Although getDailyQuestion defaults to today, let's assume we want the question for the journal entry date
                // We'll use a util that respects the date seed if possible, or fallback
                const q = getDailyQuestion(questions); // Currently gets for today, which is acceptable for 'Ritual' context
                setDailyQuestionText(q);
            }
        };
        loadQuestion();
    }, [mode]);

    const handleSelectMode = (m: Mode) => {
        setMode(m);
        setStep(0);
    };

    const handleNext = () => {
        if (!mode) return;
        if (mode === 'free') {
            handleFinish();
            return;
        }
        
        const config = RITUALS[mode];
        if (step < config.steps.length - 1) {
            setStep(s => s + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(s => s - 1);
        else setMode(null);
    };

    const handleAnswer = (val: string) => {
        if (!mode || mode === 'free') return;
        const key = RITUALS[mode].steps[step].id;
        setAnswers(prev => ({ ...prev, [key]: val }));
    };

    const handleFinish = () => {
        if (!canEdit) {
            onClose(); // Just close if read-only
            return;
        }

        let finalBody = "";
        let title = "";
        let tags: string[] = [];
        let structuredAnswers: any = {};

        if (mode === 'free') {
            finalBody = text;
            title = "Reflexión Libre";
            tags = ['free'];
        } else if (mode) {
            const config = RITUALS[mode];
            title = config.title;
            tags = config.tags;
            
            // Mark block with a specific ID class for sorting later
            const blockClass = mode === 'morning' ? 'ritual-block-morning' : 'ritual-block-evening';
            const headerColor = mode === 'morning' ? '#D97706' : '#4F46E5'; 
            const icon = mode === 'morning' ? '🌅' : '🌙';
            
            finalBody += `<div class="ritual-block ${blockClass}" style="margin-top: 2rem; margin-bottom: 2rem; padding: 1.5rem; background-color: rgba(125,125,125,0.05); border-radius: 16px;">`;
            finalBody += `<h4 style="color: ${headerColor}; font-family: sans-serif; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid rgba(125,125,125,0.2); padding-bottom: 0.5rem;">${icon} ${config.short}</h4>`;
            
            config.steps.forEach(s => {
                if (s.id !== 'mood') {
                    const ans = answers[s.id];
                    const displayPrompt = (mode === 'evening' && s.id === 'daily_question') ? dailyQuestionText : s.prompt;
                    
                    if (ans && ans.trim()) {
                        finalBody += `<div style="margin-bottom: 1.5rem;">`;
                        finalBody += `<p style="margin-bottom: 0.25rem; font-size: 0.7rem; opacity: 0.6; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">${s.label}</p>`;
                        if (displayPrompt) {
                            finalBody += `<p style="margin-bottom: 0.5rem; font-style: italic; font-size: 0.9rem; opacity: 0.85; font-family: serif;">${displayPrompt}</p>`;
                        }
                        finalBody += `<p style="margin-bottom: 0; font-size: 1rem; line-height: 1.6;">${ans}</p>`;
                        finalBody += `</div>`;
                        
                        structuredAnswers[s.id] = ans;
                        if (s.id === 'daily_question') {
                            structuredAnswers['daily_question_text'] = displayPrompt;
                        }
                    }
                }
            });
            finalBody += `</div>`;
        }

        const entry: JournalEntry = {
            text: finalBody, 
            mood: mood || 3,
            question_response: answers['daily_question'] || undefined,
            updated_at: new Date().toISOString()
        };

        onSave(targetDate, entry, title, tags, structuredAnswers);
        onClose();
    };

    const handleShare = async () => {
        if (!mode) return;
        const config = RITUALS[mode];
        let shareText = `${config.icon === 'ph-sun-horizon' ? '🌅' : '🌙'} *${config.title}* - ${new Date(targetDate).toLocaleDateString()}\n\n`;
        
        if (mode === 'free') {
            shareText += text;
        } else {
            config.steps.forEach(s => {
                if (s.id !== 'mood') {
                    const ans = answers[s.id];
                    const displayPrompt = (mode === 'evening' && s.id === 'daily_question') ? dailyQuestionText : s.prompt;
                    if (ans) {
                        shareText += `*${displayPrompt}*\n${ans}\n\n`;
                    }
                }
            });
        }

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Mi Diario Estoico', text: shareText });
            } catch (err) { console.log('Error sharing:', err); }
        } else {
            navigator.clipboard.writeText(shareText);
            alert("Copiado al portapapeles");
        }
    };

    // MENU MODE
    if (!mode) {
        return (
            <div className="fixed inset-0 z-[100] bg-[var(--bg)] animate-fade-in flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md space-y-4">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <div>
                            <h2 className="serif text-3xl font-bold text-[var(--text-main)]">Rituales</h2>
                            {isTimeTravel && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mt-1">Solo Lectura: {dateDisplay}</p>}
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--highlight)] transition-colors"><i className="ph-bold ph-x"></i></button>
                    </div>

                    <button onClick={() => handleSelectMode('morning')} className="w-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-[#2C2410] dark:to-[#3E2723] p-6 rounded-[32px] border border-amber-200 dark:border-amber-900/30 flex items-center gap-6 shadow-sm hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><i className="ph-fill ph-sun-horizon text-8xl text-amber-500"></i></div>
                        <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-amber-600 dark:text-amber-400 text-3xl shrink-0 group-hover:rotate-6 transition-transform shadow-sm">
                            <i className="ph-fill ph-sun-horizon"></i>
                        </div>
                        <div className="text-left relative z-10">
                            <h3 className="serif text-xl font-bold text-amber-900 dark:text-amber-100">Amanecer</h3>
                            <p className="text-xs opacity-70 text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">Prepara tu mente. Define tu intención.</p>
                        </div>
                    </button>

                    <button onClick={() => handleSelectMode('evening')} className="w-full bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-[#151030] dark:to-[#0F172A] p-6 rounded-[32px] border border-indigo-200 dark:border-indigo-900/30 flex items-center gap-6 shadow-sm hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><i className="ph-fill ph-moon-stars text-8xl text-indigo-500"></i></div>
                        <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl shrink-0 group-hover:-rotate-6 transition-transform shadow-sm">
                            <i className="ph-fill ph-moon-stars"></i>
                        </div>
                        <div className="text-left relative z-10">
                            <h3 className="serif text-xl font-bold text-indigo-900 dark:text-indigo-100">Anochecer</h3>
                            <p className="text-xs opacity-70 text-indigo-800 dark:text-indigo-200 mt-1 leading-relaxed">Examina tus acciones. Encuentra paz.</p>
                        </div>
                    </button>

                    <div className="flex justify-center pt-8">
                        <button onClick={() => handleSelectMode('free')} className="flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--card)] border border-[var(--border)] text-xs font-bold uppercase tracking-widest text-[var(--text-main)] hover:bg-[var(--highlight)] transition-all shadow-sm">
                            <i className="ph-bold ph-pen-nib text-lg"></i> Escritura Libre
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const config = RITUALS[mode];
    
    // FREE MODE UI
    if (mode === 'free') {
        return (
            <div className="fixed inset-0 z-[100] bg-[var(--bg)] animate-fade-in flex flex-col">
                <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]">
                    <button onClick={() => setMode(null)} className="opacity-50 hover:opacity-100"><i className="ph-bold ph-caret-left text-xl"></i></button>
                    <div className="text-center">
                        <h2 className="serif text-lg font-bold">{config.title}</h2>
                        {isTimeTravel && <p className="text-[9px] uppercase tracking-widest text-rose-500 font-bold">{dateDisplay} (Solo Lectura)</p>}
                    </div>
                    <button onClick={handleShare} className="opacity-50 hover:opacity-100"><i className="ph-bold ph-share-network text-xl"></i></button>
                </div>
                <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
                    <textarea 
                        autoFocus
                        disabled={!canEdit}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="El papel escucha..."
                        className="w-full h-full bg-transparent outline-none serif-text text-lg leading-loose resize-none placeholder:opacity-30"
                    />
                </div>
                <div className="p-6 border-t border-[var(--border)]">
                    {canEdit ? (
                        <button onClick={handleFinish} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-[24px] font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Guardar Entrada</button>
                    ) : (
                        <div className="text-center text-xs opacity-50 uppercase tracking-widest">Visualizando Archivo Histórico</div>
                    )}
                </div>
            </div>
        );
    }

    // WIZARD UI (Immersive & Ordered)
    const currentStepConfig = config.steps[step];
    const isMoodStep = currentStepConfig.id === 'mood';
    const isLastStep = step === config.steps.length - 1;
    
    // Determine dynamic prompt
    const displayPrompt = (mode === 'evening' && currentStepConfig.id === 'daily_question') 
        ? (dailyQuestionText || "Consultando a los sabios...") 
        : currentStepConfig.prompt;

    return (
        <div className={`fixed inset-0 z-[100] animate-fade-in flex flex-col ${config.bgClass} ${config.textClass} transition-colors duration-700`}>
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-20 ${mode === 'morning' ? 'bg-orange-300' : 'bg-indigo-500'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-20 ${mode === 'morning' ? 'bg-yellow-300' : 'bg-purple-600'}`}></div>
            </div>

            {/* Header */}
            <div className="px-6 py-6 flex justify-between items-center relative z-10">
                <button onClick={handleBack} className={`w-10 h-10 rounded-full border border-current/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100`}><i className="ph-bold ph-arrow-left"></i></button>
                <div className="text-center">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-current/10 bg-white/10 backdrop-blur-sm`}>
                        <i className={`ph-fill ${config.icon}`}></i> {config.short}
                    </div>
                    {isTimeTravel && <p className="text-[8px] uppercase tracking-widest opacity-60 mt-1">Solo Lectura • {dateDisplay}</p>}
                </div>
                <button onClick={onClose} className={`w-10 h-10 rounded-full border border-current/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100`}><i className="ph-bold ph-x"></i></button>
            </div>

            {/* Progress */}
            <div className="px-8 relative z-10">
                <div className="h-1 w-full bg-current/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-current transition-all duration-700 ease-out" 
                        style={{ width: `${((step + 1) / config.steps.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 flex flex-col items-center justify-center max-w-lg mx-auto w-full text-center relative z-10">
                
                <div className="mb-12 animate-slide-up w-full">
                    <span className={`text-[10px] font-bold uppercase tracking-[4px] opacity-60 block mb-6 ${config.accentColor}`}>{currentStepConfig.label}</span>
                    {displayPrompt && <h3 className="serif text-2xl sm:text-3xl md:text-4xl font-bold leading-tight opacity-90">{displayPrompt}</h3>}
                </div>

                {isMoodStep ? (
                    <div className="w-full flex justify-center gap-4 animate-fade-in">
                        {[1, 2, 3, 4, 5].map((m) => (
                            <button 
                                key={m} 
                                onClick={() => canEdit && setMood(m)}
                                disabled={!canEdit}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${mood === m ? `scale-110 shadow-lg bg-current ${mode==='morning'?'text-white':'text-black'}` : 'bg-white/10 hover:bg-white/20 border border-current/10'}`}
                            >
                                <i className={`ph-fill ${["", "ph-cloud-lightning", "ph-waves", "ph-minus", "ph-sun", "ph-star-four"][m]}`}></i>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="w-full animate-fade-in">
                        <textarea 
                            autoFocus
                            disabled={!canEdit}
                            value={answers[currentStepConfig.id] || ""}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder={canEdit ? "Escribe aquí..." : "Sin respuesta."}
                            className={`w-full h-64 outline-none font-serif text-xl sm:text-2xl leading-relaxed resize-none placeholder:opacity-30 text-center p-6 rounded-3xl transition-all shadow-inner ${config.inputClass}`}
                        />
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="p-8 relative z-10 flex justify-center">
                {canEdit ? (
                    <button 
                        onClick={handleNext} 
                        disabled={!isMoodStep && !answers[currentStepConfig.id]?.trim()}
                        className={`w-full max-w-sm py-5 rounded-[28px] font-bold uppercase tracking-[2px] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonClass}`}
                    >
                        {isLastStep ? 'Sellar Día' : 'Siguiente'} <i className={`ph-bold ${isLastStep ? 'ph-seal-check' : 'ph-arrow-right'}`}></i>
                    </button>
                ) : (
                    <div className="text-center opacity-50 text-[10px] uppercase tracking-widest font-bold">
                        Modo Lectura - No editable
                    </div>
                )}
            </div>
        </div>
    );
};
