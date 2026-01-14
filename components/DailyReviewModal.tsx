
import React, { useState, useEffect } from 'react';
import { generateDailyMentorFeedback } from '../services/geminiService';
import { JournalEntry, Task } from '../types';

interface DailyReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: JournalEntry;
    dailyTask: Task;
    onSaveAnalysis: (text: string) => void;
    user: string;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({ isOpen, onClose, entry, dailyTask, onSaveAnalysis, user }) => {
    const [step, setStep] = useState<'summary' | 'consulting' | 'reveal'>('summary');
    const [feedback, setFeedback] = useState<{virtue: string, observation: string, advice: string} | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('summary');
            setFeedback(null);
        }
    }, [isOpen]);

    const handleStartRitual = async () => {
        setStep('consulting');
        
        // Context
        const cleanJournal = (entry.text || "").replace(/<[^>]*>?/gm, '');
        const challengeStatus = entry.challenge_status === 'success' ? 'Completado' : entry.challenge_status === 'failed' ? 'Fallido' : 'Pendiente';
        
        try {
            // Artificial delay for ceremony feeling + AI call
            const [result] = await Promise.all([
                generateDailyMentorFeedback(cleanJournal, entry.question_response || "", entry.mood, challengeStatus),
                new Promise(resolve => setTimeout(resolve, 3500)) // Ritual wait time
            ]);
            
            if (result) {
                setFeedback(result);
                setStep('reveal');
            } else {
                throw new Error("Sin respuesta del mentor");
            }
        } catch (e) {
            console.error("Ritual interrupted:", e);
            // Fallback content on error/abort
            setFeedback({
                virtue: "Fortaleza",
                observation: "El silencio del oráculo es también una prueba. Tu esfuerzo hoy cuenta.",
                advice: "Mañana, mantén la constancia en lo pequeño."
            });
            setStep('reveal');
        }
    };

    const handleFinish = () => {
        if (feedback) {
            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const adviceHtml = `
                <br/><br/>
                <div style="border-left: 3px solid #D4AF37; padding-left: 15px; margin-top: 20px; font-family: 'Lora', serif; background-color: rgba(212, 175, 55, 0.05); padding: 15px; border-radius: 0 10px 10px 0;">
                    <p style="margin-bottom: 5px; font-size: 0.8em; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7;"><strong>Veredicto Nocturno</strong></p>
                    <p style="margin-bottom: 10px;">"${feedback.observation}"</p>
                    <p><em>Consejo: ${feedback.advice}</em></p>
                </div>
            `;
            onSaveAnalysis(adviceHtml);
        }
        onClose();
    };

    if (!isOpen) return null;

    const moodLabels = ["", "Caos", "Duda", "Paz", "Claridad", "Areté"];
    const moodLabel = moodLabels[entry.mood] || "Silencio";

    return (
        <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in text-stone-200">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[128px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
            </div>

            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors z-50">
                <i className="ph-bold ph-x text-lg"></i>
            </button>

            {/* PHASE 1: SUMMARY (THE MIRROR) */}
            {step === 'summary' && (
                <div className="w-full max-w-sm text-center relative z-10 animate-slide-up">
                    <div className="mb-8">
                        <div className="w-20 h-20 mx-auto rounded-full border border-white/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                            <i className="ph-fill ph-moon-stars text-3xl text-amber-500"></i>
                        </div>
                        <h2 className="serif text-3xl font-bold mb-2 text-white">Examen Nocturno</h2>
                        <p className="text-xs font-bold uppercase tracking-[3px] opacity-50">El día ha terminado</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-[24px] flex flex-col items-center">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Estado</span>
                            <span className="serif text-xl text-white">{moodLabel}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-[24px] flex flex-col items-center">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Misión</span>
                            {entry.challenge_status === 'success' ? (
                                <span className="serif text-xl text-emerald-400">Victoria</span>
                            ) : entry.challenge_status === 'failed' ? (
                                <span className="serif text-xl text-rose-400">Lección</span>
                            ) : (
                                <span className="serif text-xl opacity-50">Pendiente</span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleStartRitual}
                        className="w-full py-5 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="ph-bold ph-sparkle"></i> Invocar al Mentor
                    </button>
                </div>
            )}

            {/* PHASE 2: CONSULTING (THE ORACLE) */}
            {step === 'consulting' && (
                <div className="flex flex-col items-center justify-center relative z-10 animate-fade-in">
                    <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 border border-white/10 rounded-full scale-150 opacity-20"></div>
                        <div className="absolute inset-0 border border-white/20 rounded-full scale-125 opacity-40 animate-ping-slow"></div>
                        <div className="w-32 h-32 bg-white/5 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-amber-500/20 animate-spin-slow"></div>
                            <i className="ph-fill ph-eye text-4xl text-white/80 relative z-10 animate-pulse"></i>
                        </div>
                    </div>
                    <h3 className="serif text-2xl font-bold mb-2 text-white/90">Consultando el Logos...</h3>
                    <p className="text-xs uppercase tracking-widest opacity-50 animate-pulse">Pesando tus acciones en la balanza</p>
                </div>
            )}

            {/* PHASE 3: REVEAL (THE VERDICT) */}
            {step === 'reveal' && feedback && (
                <div className="w-full max-w-sm relative z-10 animate-slide-up">
                    <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 rounded-[32px] p-1 shadow-2xl relative overflow-hidden group">
                        {/* Glowing Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        
                        <div className="bg-[#121212] rounded-[28px] p-8 text-center h-full relative z-10">
                            <div className="mb-6">
                                <span className="text-[10px] font-bold uppercase tracking-[4px] text-amber-500 mb-2 block">Virtud Observada</span>
                                <h2 className="serif text-4xl font-bold text-white mb-1">{feedback.virtue}</h2>
                                <div className="w-12 h-1 bg-amber-500/30 mx-auto rounded-full mt-4"></div>
                            </div>

                            <p className="serif-text text-lg leading-relaxed text-white/80 mb-8 italic">
                                "{feedback.observation}"
                            </p>

                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 text-left">
                                <div className="flex items-center gap-2 mb-2 opacity-50">
                                    <i className="ph-bold ph-arrow-right"></i>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Mañana</span>
                                </div>
                                <p className="text-sm font-medium text-white/90 leading-relaxed">{feedback.advice}</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleFinish}
                        className="w-full mt-6 py-5 bg-white text-black rounded-[24px] font-bold uppercase tracking-widest text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="ph-bold ph-seal-check"></i> Sellar en Diario
                    </button>
                </div>
            )}
        </div>
    );
};
