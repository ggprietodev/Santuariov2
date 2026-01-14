
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Meditation } from '../types';
import { generateSpeech, generateMeditation } from '../services/geminiService';
import { supabase, fetchUserMeditationProgress, markMeditationCompleteDB, fetchUserMeditationFavorites, toggleMeditationFavoriteDB } from '../services/supabase';

interface CitadelProps {
    onBack: () => void;
    meditations: Meditation[];
    initialActiveMeditation?: Meditation | null;
    onPlayerToggle?: (active: boolean) => void;
}

// --- AUDIO UTILS ---

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length; 
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}

// --- HELPERS ---

const estimateRealDuration = (text: string): number => {
    const segments = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
    const wordCount = text.split(/\s+/).length;
    const speakingTime = wordCount * 0.4;
    const silenceTime = segments.length * 8; 
    return Math.max(1, Math.ceil((speakingTime + silenceTime) / 60));
};

// --- COMPONENTS ---

const AudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
    return (
        <div className="flex items-center justify-center gap-1.5 h-12">
            {[...Array(5)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-1.5 bg-white rounded-full transition-all duration-300 ${isPlaying ? 'animate-music-bar' : 'h-1.5 opacity-30'}`}
                    style={{ 
                        animationDelay: `${i * 0.1}s`,
                        height: isPlaying ? '24px' : '6px'
                    }}
                ></div>
            ))}
        </div>
    );
};

// --- IMPROVED BREATHING ENGINE ---
type BreathPattern = 'relax' | 'box' | 'balance';

const BREATH_CONFIGS = {
    relax: { 
        name: 'Relajación (4-7-8)', 
        desc: 'Para dormir o calmar ansiedad',
        phases: [
            { label: 'Inhala', duration: 4000, scale: 1.25, opacity: 1, guide: 'Lena pulmones' },
            { label: 'Sostén', duration: 7000, scale: 1.25, opacity: 0.8, guide: 'Mantén aire' },
            { label: 'Exhala', duration: 8000, scale: 0.5, opacity: 0.4, guide: 'Suelta todo' }
        ]
    },
    box: { 
        name: 'Enfoque (Caja)', 
        desc: 'Claridad mental y alerta',
        phases: [
            { label: 'Inhala', duration: 4000, scale: 1.2, opacity: 1, guide: 'Cuenta 4' },
            { label: 'Sostén', duration: 4000, scale: 1.2, opacity: 0.8, guide: 'Cuenta 4' },
            { label: 'Exhala', duration: 4000, scale: 0.5, opacity: 0.4, guide: 'Cuenta 4' },
            { label: 'Sostén', duration: 4000, scale: 0.5, opacity: 0.4, guide: 'Vacío' }
        ]
    },
    balance: { 
        name: 'Coherencia', 
        desc: 'Equilibrio emocional rápido',
        phases: [
            { label: 'Inhala', duration: 5500, scale: 1.25, opacity: 1, guide: 'Suavemente' },
            { label: 'Exhala', duration: 5500, scale: 0.5, opacity: 0.4, guide: 'Lentamente' }
        ]
    }
};

const BreathingEngine = () => {
    const [pattern, setPattern] = useState<BreathPattern>('balance');
    const [isActive, setIsActive] = useState(false);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [text, setText] = useState("Listo");
    
    // Voice State
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    
    // Animation states
    const [scale, setScale] = useState(0.5);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);

    // Progress Ring State
    const requestRef = useRef<number>(0);
    const [progress, setProgress] = useState(0);

    const timerRef = useRef<any>(null);

    // Haptic Feedback Helper
    const vibrate = () => {
        if (navigator.vibrate) navigator.vibrate(50);
    };

    // Voice Helper
    const speakPhrase = (phrase: string) => {
        if (voiceEnabled && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel previous
            const u = new SpeechSynthesisUtterance(phrase);
            u.lang = 'es-ES';
            u.rate = 0.9; // Slightly slower for friendly/calm tone
            u.pitch = 1.0;
            window.speechSynthesis.speak(u);
        }
    };

    const updateProgress = () => {
        if (!isActive) return;
        const now = Date.now();
        const elapsed = now - startTime;
        const currentDuration = BREATH_CONFIGS[pattern].phases[phaseIndex].duration;
        const p = Math.min(100, (elapsed / currentDuration) * 100);
        setProgress(p);
        
        if (p < 100) {
            requestRef.current = requestAnimationFrame(updateProgress);
        }
    };

    useEffect(() => {
        if (!isActive) {
            setText("Respirar");
            setScale(0.5);
            setDuration(1000);
            setProgress(0);
            cancelAnimationFrame(requestRef.current);
            window.speechSynthesis.cancel();
            return;
        }

        const runPhase = () => {
            const config = BREATH_CONFIGS[pattern];
            const currentPhase = config.phases[phaseIndex];
            
            setText(currentPhase.label);
            setScale(currentPhase.scale);
            setDuration(currentPhase.duration);
            setStartTime(Date.now());
            
            // Trigger effects
            vibrate();
            speakPhrase(currentPhase.label);
            
            cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(updateProgress);

            timerRef.current = setTimeout(() => {
                setPhaseIndex(prev => (prev + 1) % config.phases.length);
            }, currentPhase.duration);
        };

        runPhase();

        return () => {
            clearTimeout(timerRef.current);
            cancelAnimationFrame(requestRef.current);
        };
    }, [isActive, phaseIndex, pattern]);

    const toggle = () => {
        if (isActive) {
            setIsActive(false);
            setPhaseIndex(0);
            clearTimeout(timerRef.current);
        } else {
            setIsActive(true);
            setPhaseIndex(0);
        }
    };

    const changePattern = (p: BreathPattern) => {
        setIsActive(false);
        setPattern(p);
        setPhaseIndex(0);
        clearTimeout(timerRef.current);
    };

    // Calculate circumference for SVG
    const radius = 140;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center h-full w-full max-w-sm mx-auto animate-fade-in pt-10 pb-20 relative">
            
            {/* Voice Toggle - Absolute Top Right */}
            <button 
                onClick={(e) => { e.stopPropagation(); setVoiceEnabled(!voiceEnabled); }} 
                className={`absolute top-0 right-4 w-10 h-10 rounded-full flex items-center justify-center border z-30 transition-all ${voiceEnabled ? 'bg-[var(--highlight)] text-[var(--text-main)] border-[var(--border)]' : 'bg-transparent text-[var(--text-sub)] border-transparent opacity-50'}`}
                title={voiceEnabled ? "Silenciar Voz" : "Activar Voz"}
            >
                <i className={`ph-fill ${voiceEnabled ? 'ph-microphone' : 'ph-microphone-slash'}`}></i>
            </button>

            {/* Organic Breath Visualizer */}
            <div className="relative flex-1 w-full flex items-center justify-center mb-10 min-h-[350px]" onClick={toggle}>
                
                {/* Guide Circle (Target Size) - Ghost outline indicating max inhalation */}
                <div 
                    className={`absolute rounded-full border border-[var(--text-main)] opacity-10 transition-all duration-1000`}
                    style={{ width: '320px', height: '320px' }}
                ></div>

                {/* Progress Ring (SVG) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <svg width="320" height="320" className="transform -rotate-90">
                        <circle
                            cx="160"
                            cy="160"
                            r={radius}
                            stroke="var(--highlight)"
                            strokeWidth="2"
                            fill="none"
                        />
                        <circle
                            cx="160"
                            cy="160"
                            r={radius}
                            stroke="var(--gold)"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-100 ease-linear"
                        />
                    </svg>
                </div>

                {/* Main Breathing Circle */}
                <div 
                    className="rounded-full bg-gradient-to-br from-[var(--highlight)] to-[var(--card)] shadow-[0_0_60px_rgba(0,0,0,0.05)] border border-[var(--border)] flex items-center justify-center relative z-10 transition-all ease-in-out will-change-transform cursor-pointer"
                    style={{ 
                        width: '260px',
                        height: '260px',
                        transform: `scale(${isActive ? scale : 1})`,
                        transitionDuration: `${duration}ms`
                    }}
                >
                    {/* Inner Texture */}
                    <div className="absolute inset-0 rounded-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--text-main),_transparent)]"></div>
                </div>

                {/* Text Overlay - Centered and Large */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <span className={`serif text-4xl font-bold tracking-widest text-[var(--text-main)] transition-all duration-500 drop-shadow-md ${isActive ? 'scale-110' : 'scale-100'}`}>
                        {text}
                    </span>
                    {isActive && (
                        <div className="mt-4 px-3 py-1 rounded-full bg-[var(--bg)]/80 backdrop-blur text-[10px] uppercase font-bold tracking-[2px] opacity-60 border border-[var(--border)]">
                            {pattern === 'box' ? '4 - 4 - 4 - 4' : pattern === 'relax' ? '4 - 7 - 8' : 'Coherencia'}
                        </div>
                    )}
                </div>
            </div>

            {/* Config & Controls */}
            <div className="w-full space-y-8 px-4 z-20">
                <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(BREATH_CONFIGS) as BreathPattern[]).map(key => (
                        <button 
                            key={key}
                            onClick={() => changePattern(key)}
                            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${pattern === key ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)] shadow-lg scale-105' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)] hover:border-[var(--text-main)]'}`}
                        >
                            <i className={`ph-fill ${key === 'relax' ? 'ph-moon' : key === 'box' ? 'ph-corners-out' : 'ph-infinity'} text-xl`}></i>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{BREATH_CONFIGS[key].name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                <div className="text-center">
                    <p className="text-xs opacity-50 max-w-xs mx-auto mb-6 h-8">{BREATH_CONFIGS[pattern].desc}</p>
                    <button 
                        onClick={toggle} 
                        className={`w-full max-w-xs mx-auto py-5 rounded-[24px] font-bold text-xs uppercase tracking-[3px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isActive ? 'bg-[var(--card)] text-[var(--text-main)] border border-[var(--border)]' : 'bg-[var(--text-main)] text-[var(--bg)]'}`}
                    >
                        {isActive ? <><i className="ph-fill ph-pause"></i> Pausar</> : <><i className="ph-fill ph-play"></i> Iniciar Guía</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CITADEL MODULE ---
export function CitadelModule({ onBack, meditations, initialActiveMeditation, onPlayerToggle }: CitadelProps) {
    const [mode, setMode] = useState<'focus' | 'breathe' | 'guided'>('guided');
    
    // Focus State
    const [focusTime, setFocusTime] = useState(25 * 60);
    const [initialFocusTime, setInitialFocusTime] = useState(25);
    const [isFocusActive, setIsFocusActive] = useState(false);
    
    // --- AUDIO PLAYER STATE ---
    const [activeMeditation, setActiveMeditation] = useState<Meditation | null>(null);
    const [segments, setSegments] = useState<string[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [playerPhase, setPlayerPhase] = useState<'listening' | 'breathing'>('listening');
    const [currentSilenceDuration, setCurrentSilenceDuration] = useState(5000);
    
    // Ambient
    const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'fire' | 'white'>('off');
    const [volume, setVolume] = useState(0.5);
    const [showControls, setShowControls] = useState(false);

    // Generator
    const [showGenerator, setShowGenerator] = useState(false);
    const [genTopic, setGenTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [genConfig, setGenConfig] = useState<{dur: 'short'|'long', diff: 'beginner'|'advanced'}>({ dur: 'short', diff: 'beginner' });

    // Filter & Stats State
    const [filterDiff, setFilterDiff] = useState<'all' | 'beginner' | 'advanced'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'done' | 'favorites'>('all');
    
    // Database Stats
    const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
    const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
    const [totalMinutes, setTotalMinutes] = useState(0);

    // --- REFS ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const ambientSourceRef = useRef<HTMLAudioElement | null>(null);
    const audioCache = useRef<Map<number, AudioBuffer>>(new Map());
    
    const playRequestId = useRef<number>(0);
    const timeoutRef = useRef<any>(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        return () => stopEverything();
    }, []);

    useEffect(() => {
        if (initialActiveMeditation) {
            setMode('guided');
            startSession(initialActiveMeditation);
        }
    }, [initialActiveMeditation]);

    // Force Navbar Hide Logic
    useEffect(() => {
        if (onPlayerToggle) {
            onPlayerToggle(!!activeMeditation);
        }
    }, [activeMeditation, onPlayerToggle]);

    // Load User Progress & Favorites on Mount
    useEffect(() => {
        const loadUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [progIds, favIds] = await Promise.all([
                    fetchUserMeditationProgress(user.id),
                    fetchUserMeditationFavorites(user.id)
                ]);
                
                setCompletedIds(new Set(progIds));
                setFavoriteIds(new Set(favIds));
                
                // Calculate total minutes based on completed IDs
                let minutes = 0;
                progIds.forEach(id => {
                    const med = meditations.find(m => m.id === id);
                    if (med) minutes += estimateRealDuration(med.content);
                });
                setTotalMinutes(minutes);
            }
        };
        loadUserData();
    }, [meditations]);

    // --- AUDIO ENGINE ---

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
            audioContextRef.current = new Ctx({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    const stopEverything = () => {
        playRequestId.current++;
        if (voiceSourceRef.current) {
            try { voiceSourceRef.current.stop(); voiceSourceRef.current.disconnect(); } catch(e) {}
            voiceSourceRef.current = null;
        }
        if (ambientSourceRef.current) ambientSourceRef.current.pause();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        setIsPlaying(false);
        setIsBuffering(false);
        setPlayerPhase('listening');
    };

    const markSessionComplete = async () => {
        if (activeMeditation && activeMeditation.id) {
            if (!completedIds.has(activeMeditation.id)) {
                // Optimistic UI Update
                setCompletedIds(prev => new Set(prev).add(activeMeditation.id!));
                setTotalMinutes(prev => prev + estimateRealDuration(activeMeditation.content));
                
                // DB Update
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await markMeditationCompleteDB(user.id, activeMeditation.id);
                }
            }
        }
        setSessionComplete(true);
        setIsPlaying(false);
        setPlayerPhase('listening');
    };

    const toggleFavorite = async (meditation: Meditation) => {
        if (!meditation.id) return;
        const id = meditation.id;
        
        // Optimistic
        const newSet = new Set(favoriteIds);
        const isFav = newSet.has(id);
        if (isFav) newSet.delete(id);
        else newSet.add(id);
        setFavoriteIds(newSet);

        // DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await toggleMeditationFavoriteDB(user.id, id);
        }
    };

    const playSegment = async (index: number) => {
        if (voiceSourceRef.current) {
            try { voiceSourceRef.current.stop(); } catch(e){}
            voiceSourceRef.current = null;
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (!activeMeditation || index >= segments.length) {
            markSessionComplete();
            return;
        }

        const currentId = ++playRequestId.current;
        setIsBuffering(true);
        setIsPlaying(true);
        setPlayerPhase('listening');
        
        try {
            let buffer = audioCache.current.get(index);
            if (!buffer) {
                const text = segments[index];
                const base64 = await generateSpeech(text, 'Kore');
                if (playRequestId.current !== currentId) return;
                if (base64) {
                    initAudioContext();
                    if (!audioContextRef.current) throw new Error("No Context");
                    buffer = await decodeAudioData(decode(base64), audioContextRef.current);
                    audioCache.current.set(index, buffer);
                }
            }

            if (playRequestId.current !== currentId) return;

            if (buffer && audioContextRef.current) {
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                
                source.onended = () => {
                    if (playRequestId.current === currentId) {
                        const textLength = segments[index].length;
                        const baseCycle = 6000;
                        const extraTime = Math.min(Math.floor(textLength / 20) * 1000, 6000);
                        const silenceDuration = baseCycle + extraTime;
                        
                        setCurrentSilenceDuration(silenceDuration);
                        setPlayerPhase('breathing');

                        timeoutRef.current = setTimeout(() => {
                            if (playRequestId.current === currentId) {
                                setCurrentSegmentIndex(prev => prev + 1);
                            }
                        }, silenceDuration);
                    }
                };

                voiceSourceRef.current = source;
                source.start();
                setIsBuffering(false);
            } else {
                setIsBuffering(false);
                setTimeout(() => setCurrentSegmentIndex(prev => prev + 1), 4000);
            }

            // Pre-fetch next
            const nextIdx = index + 1;
            if (nextIdx < segments.length && !audioCache.current.has(nextIdx)) {
                generateSpeech(segments[nextIdx], 'Kore').then(b64 => {
                    if(b64 && audioContextRef.current) {
                        decodeAudioData(decode(b64), audioContextRef.current).then(buf => audioCache.current.set(nextIdx, buf));
                    }
                });
            }

        } catch (e) {
            console.error("Playback error", e);
            setIsBuffering(false);
            setTimeout(() => setCurrentSegmentIndex(prev => prev + 1), 2000);
        }
    };

    useEffect(() => {
        if (activeMeditation && !sessionComplete && isPlaying) {
            playSegment(currentSegmentIndex);
        }
    }, [currentSegmentIndex, activeMeditation]); 

    const togglePlayback = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (sessionComplete) {
            setCurrentSegmentIndex(0);
            setSessionComplete(false);
            setIsPlaying(true);
            playSegment(0);
            return;
        }

        if (isPlaying) {
            setIsPlaying(false);
            playRequestId.current++;
            if (voiceSourceRef.current) { try { voiceSourceRef.current.stop(); } catch(e){} }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else {
            initAudioContext();
            setIsPlaying(true);
            playSegment(currentSegmentIndex);
        }
    };

    useEffect(() => {
        if (!ambientSourceRef.current) {
            ambientSourceRef.current = new Audio();
            ambientSourceRef.current.loop = true;
        }
        const audio = ambientSourceRef.current;
        audio.volume = volume;

        if (ambientSound === 'off' || !activeMeditation) {
            audio.pause();
        } else {
            const sounds: any = { 
                rain: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_03e0705704.mp3?filename=soft-rain-ambient-111163.mp3", 
                fire: "https://cdn.pixabay.com/download/audio/2021/08/09/audio_6c75955d21.mp3?filename=fireplace-2005.mp3", 
                white: "https://cdn.pixabay.com/download/audio/2021/09/06/audio_9829f0c239.mp3?filename=white-noise-8129.mp3" 
            };
            const src = sounds[ambientSound];
            if (audio.src !== src) audio.src = src;
            if (isPlaying && audio.paused) audio.play().catch(() => {});
            else if (!isPlaying) audio.pause();
        }
    }, [ambientSound, isPlaying, activeMeditation, volume]);

    // --- LOGIC ---

    const startSession = (m: Meditation) => {
        const rawSegments = m.content.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [m.content];
        const cleanSegments: string[] = [];
        let buffer = "";
        rawSegments.forEach(seg => { 
            const s = seg.trim(); 
            if (!s) return; 
            if (buffer.length + s.length < 150) { buffer += (buffer ? " " : "") + s; } 
            else { if (buffer) cleanSegments.push(buffer); buffer = s; } 
        });
        if (buffer) cleanSegments.push(buffer);

        stopEverything();
        audioCache.current.clear();
        setSegments(cleanSegments);
        setCurrentSegmentIndex(0);
        setSessionComplete(false);
        setActiveMeditation(m);
        setPlayerPhase('listening');
        initAudioContext();
        setIsPlaying(true);
    };

    const handleGenerate = async () => {
        if (!genTopic.trim()) return;
        setIsGenerating(true);
        const med = await generateMeditation(genTopic, genConfig.dur, genConfig.diff);
        if (med) {
            const payload = { ...med, difficulty: genConfig.diff, created_at: new Date().toISOString() };
            supabase.from('content_meditations').insert(payload).then(({error}) => {
                if(error) console.error("Save error", error);
            });
            setShowGenerator(false);
            setGenTopic("");
            startSession(med);
        }
        setIsGenerating(false);
    };

    const filteredList = useMemo(() => {
        return meditations.filter(m => {
            const matchDiff = filterDiff === 'all' || m.difficulty === filterDiff;
            const isDone = m.id && completedIds.has(m.id);
            const isFav = m.id && favoriteIds.has(m.id);
            
            let matchStatus = true;
            if (filterStatus === 'new') matchStatus = !isDone;
            if (filterStatus === 'done') matchStatus = isDone;
            if (filterStatus === 'favorites') matchStatus = !!isFav;

            return matchDiff && matchStatus;
        });
    }, [meditations, filterDiff, filterStatus, completedIds, favoriteIds]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const totalAvailable = meditations.length;
    const progressPercentage = totalAvailable > 0 ? (completedIds.size / totalAvailable) * 100 : 0;

    // --- RENDER PLAYER ---
    if (activeMeditation) {
        const isFav = activeMeditation.id ? favoriteIds.has(activeMeditation.id) : false;

        const handleTap = (e: React.MouseEvent) => {
            if (playerPhase === 'breathing' && isPlaying && !sessionComplete) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setCurrentSegmentIndex(prev => prev + 1);
            }
        };

        const totalSegments = segments.length;
        const progressPercent = ((currentSegmentIndex) / Math.max(1, totalSegments - 1)) * 100;

        return (
            <div 
                className="fixed inset-0 z-[9999] bg-[var(--bg)] flex flex-col animate-fade-in text-[var(--text-main)] overflow-hidden h-[100dvh]"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
                onClick={handleTap}
            >
                {/* Immersive Background */}
                <div className={`absolute inset-0 transition-opacity duration-[2000ms] ${isPlaying ? 'opacity-20' : 'opacity-5'}`}>
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-500/30 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                </div>

                {/* Top Bar */}
                <div className="relative z-20 flex justify-between items-center p-6" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { stopEverything(); setActiveMeditation(null); }} className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-sm active:scale-95 transition-transform opacity-50 hover:opacity-100">
                        <i className="ph-bold ph-caret-down"></i>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Meditación</span>
                        <span className="font-bold text-sm">{activeMeditation.category}</span>
                    </div>
                    <button 
                        onClick={() => toggleFavorite(activeMeditation)} 
                        className={`w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-sm active:scale-95 transition-all ${isFav ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-[var(--text-sub)] hover:text-rose-500'}`}
                    >
                        <i className={`ph-${isFav ? 'fill' : 'bold'} ph-heart text-lg`}></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-8 text-center pb-32">
                    <div className="w-full max-w-xs h-1 bg-[var(--border)] rounded-full mb-12 overflow-hidden">
                        <div className="h-full bg-[var(--text-main)] transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>

                    <div className="min-h-[240px] flex items-center justify-center relative w-full pointer-events-none">
                        {isBuffering && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 transition-all">
                                <div className="bg-[var(--card)] px-4 py-2 rounded-full shadow-lg flex items-center gap-3 border border-[var(--border)] animate-pulse">
                                    <i className="ph-duotone ph-spinner animate-spin text-[var(--gold)]"></i>
                                    <span className="text-xs font-bold uppercase tracking-widest">Sintonizando...</span>
                                </div>
                            </div>
                        )}
                        {playerPhase === 'breathing' && isPlaying && !sessionComplete ? (
                            <div className="animate-fade-in relative flex items-center justify-center">
                                <div className="w-48 h-48 rounded-full border-2 border-[var(--text-main)] opacity-10 animate-ping-slow absolute"></div>
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 animate-pulse">Respiración</div>
                            </div>
                        ) : (
                            <p className={`serif text-2xl md:text-3xl leading-relaxed font-medium transition-all duration-1000 ${isBuffering ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}>
                                {sessionComplete ? "Sesión Finalizada" : segments[currentSegmentIndex]}
                            </p>
                        )}
                    </div>

                    <div className="h-12 mt-8 flex items-center justify-center">
                        {sessionComplete ? (
                            <span className="text-emerald-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-check-circle"></i> Namasté</span>
                        ) : isPlaying && !isBuffering ? (
                            playerPhase === 'listening' ? <AudioVisualizer isPlaying={true} /> : <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 animate-pulse">(Toca para saltar)</span>
                        ) : (
                            <span className="text-xs font-bold uppercase tracking-widest opacity-40">Pausa</span>
                        )}
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-[var(--card)] border-t border-[var(--border)] p-6 pb-8 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pointer-events-auto" style={{zIndex: 10000}} onClick={e => e.stopPropagation()}>
                    <div className="max-w-md mx-auto relative pb-4">
                        
                        {/* Audio Settings Popover */}
                        {showControls && (
                            <div className="absolute bottom-full left-0 right-0 mb-6 bg-stone-900/90 backdrop-blur-md text-white p-4 rounded-2xl animate-slide-up shadow-2xl border border-stone-700 z-[60]">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Sonido Ambiente</span>
                                    <button onClick={() => setShowControls(false)} className="opacity-60 hover:opacity-100"><i className="ph-bold ph-x"></i></button>
                                </div>
                                <div className="flex justify-around mb-4">
                                    {['rain', 'fire', 'white', 'off'].map((s:any) => (
                                        <button key={s} onClick={() => setAmbientSound(s)} className={`flex flex-col items-center gap-1 transition-all ${ambientSound === s ? 'text-[var(--gold)] scale-110' : 'opacity-40 hover:opacity-100'}`}>
                                            <i className={`ph-fill ${s==='rain'?'ph-cloud-rain':s==='fire'?'ph-fire':s==='white'?'ph-waves':'ph-speaker-slash'} text-2xl`}></i>
                                            <span className="text-[8px] font-bold uppercase">{s}</span>
                                        </button>
                                    ))}
                                </div>
                                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full accent-[var(--gold)] h-1 bg-white/20 rounded-full appearance-none" />
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col">
                                <h3 className="serif font-bold text-lg leading-none mb-1 line-clamp-1">{activeMeditation.title}</h3>
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                                    {estimateRealDuration(activeMeditation.content)} min • {activeMeditation.difficulty}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { stopEverything(); setActiveMeditation(null); }} className="w-10 h-10 rounded-full border border-rose-200 bg-rose-50 text-rose-500 flex items-center justify-center transition-all hover:bg-rose-100 active:scale-95" title="Terminar sesión">
                                    <i className="ph-bold ph-stop"></i>
                                </button>
                                <button onClick={() => setShowControls(!showControls)} className={`w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center transition-all ${showControls ? 'bg-[var(--text-main)] text-[var(--bg)]' : 'bg-[var(--bg)] text-[var(--text-main)]'}`}>
                                    <i className="ph-bold ph-faders"></i>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-8">
                            <button onClick={(e) => { e.stopPropagation(); if(currentSegmentIndex > 0) { setCurrentSegmentIndex(c => c - 1); playRequestId.current++; } }} className="text-3xl opacity-40 hover:opacity-100 transition-opacity disabled:opacity-10" disabled={currentSegmentIndex === 0}>
                                <i className="ph-fill ph-skip-back"></i>
                            </button>
                            
                            <button onClick={togglePlayback} className="w-20 h-20 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center text-4xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                                <i className={`ph-fill ${isPlaying ? 'ph-pause' : sessionComplete ? 'ph-arrow-counter-clockwise' : 'ph-play ml-1'}`}></i>
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); if(currentSegmentIndex < segments.length - 1) { setCurrentSegmentIndex(c => c + 1); playRequestId.current++; } }} className="text-3xl opacity-40 hover:opacity-100 transition-opacity disabled:opacity-10" disabled={currentSegmentIndex >= segments.length - 1}>
                                <i className="ph-fill ph-skip-forward"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN LIST VIEW ---
    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center relative">
             <div className="w-full max-w-2xl flex items-center justify-between px-6 py-6 z-20">
                 <div className="flex items-center gap-4">
                    <button onClick={() => { stopEverything(); onBack(); }} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <div>
                        <h2 className="serif text-2xl font-bold">La Ciudadela</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Refugio Interior</p>
                    </div>
                 </div>
            </div>
            
            {/* TABS */}
            <div className="w-full max-w-lg px-6 mb-6 z-20">
                <div className="flex bg-[var(--card)] p-1.5 rounded-full shadow-sm border border-[var(--border)]">
                    <button onClick={() => setMode('guided')} className={`flex-1 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode==='guided'?'bg-[var(--text-main)] text-[var(--bg)] shadow-md':'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Guiadas</button>
                    <button onClick={() => setMode('focus')} className={`flex-1 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode==='focus'?'bg-[var(--text-main)] text-[var(--bg)] shadow-md':'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Enfoque</button>
                    <button onClick={() => setMode('breathe')} className={`flex-1 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode==='breathe'?'bg-[var(--text-main)] text-[var(--bg)] shadow-md':'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>Respirar</button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-2xl px-6 pb-32 overflow-y-auto no-scrollbar">
                {/* FOCUS MODE */}
                {mode === 'focus' && (
                    <div className="flex flex-col items-center justify-center h-full animate-fade-in pb-20">
                        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="3" />
                                <circle 
                                    cx="50" cy="50" r="45" fill="none" stroke="var(--gold)" strokeWidth="3" 
                                    strokeDasharray="283" 
                                    strokeDashoffset={283 - (283 * focusTime) / (initialFocusTime * 60)}
                                    className="transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="text-5xl font-serif font-bold tabular-nums">{formatTime(focusTime)}</div>
                        </div>
                        {!isFocusActive && (
                            <div className="flex gap-3 mb-8">
                                {[15, 25, 45, 60].map(m => (
                                    <button key={m} onClick={() => { setInitialFocusTime(m); setFocusTime(m * 60); }} className={`w-12 h-12 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${initialFocusTime === m ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'border-[var(--border)] text-[var(--text-sub)] hover:border-[var(--gold)]'}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setIsFocusActive(!isFocusActive)} className="w-full max-w-xs py-5 rounded-[24px] bg-[var(--text-main)] text-[var(--bg)] font-bold text-sm uppercase tracking-[3px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                            {isFocusActive ? <><i className="ph-fill ph-pause"></i> Pausar</> : <><i className="ph-fill ph-play"></i> Concentrarse</>}
                        </button>
                    </div>
                )}

                {/* BREATHE MODE */}
                {mode === 'breathe' && <BreathingEngine />}

                {/* GUIDED MODE */}
                {mode === 'guided' && (
                    <div className="animate-fade-in space-y-6">
                        
                        {/* PROGRESS BAR - NEW */}
                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Nivel de Sintonía</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">{completedIds.size} / {totalAvailable}</span>
                            </div>
                            <div className="w-full h-2 bg-[var(--highlight)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* STATS PANEL */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-[var(--card)] p-4 rounded-[24px] border border-[var(--border)] flex flex-col items-center justify-center shadow-sm">
                                <span className="text-2xl font-serif font-bold text-[var(--text-main)]">{completedIds.size}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Sesiones</span>
                            </div>
                            <div className="bg-[var(--card)] p-4 rounded-[24px] border border-[var(--border)] flex flex-col items-center justify-center shadow-sm">
                                <span className="text-2xl font-serif font-bold text-[var(--text-main)]">{totalMinutes}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Minutos</span>
                            </div>
                        </div>

                        {/* Generator Card */}
                        {!showGenerator ? (
                            <div onClick={() => setShowGenerator(true)} className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-6 rounded-[32px] border border-purple-100 dark:border-purple-900/30 cursor-pointer hover:shadow-md transition-all group flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-105 transition-transform">
                                    <i className="ph-bold ph-magic-wand"></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="serif font-bold text-lg text-purple-900 dark:text-purple-100">Diseñar Sesión</h3>
                                    <p className="text-xs opacity-60">Personalizada con IA</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center"><i className="ph-bold ph-plus text-purple-600"></i></div>
                            </div>
                        ) : (
                            <div className="bg-[var(--card)] p-6 rounded-[32px] border border-[var(--border)] shadow-md animate-fade-in relative">
                                <button onClick={() => setShowGenerator(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)]"><i className="ph-bold ph-x"></i></button>
                                <h3 className="serif font-bold text-lg mb-4">Tu Intención</h3>
                                <input 
                                    value={genTopic}
                                    onChange={e => setGenTopic(e.target.value)}
                                    placeholder="Ej: Calma antes de dormir..."
                                    className="w-full bg-[var(--highlight)] p-4 rounded-2xl outline-none font-serif text-lg mb-4"
                                    autoFocus
                                />
                                <div className="flex gap-2 mb-4">
                                    <select 
                                        value={genConfig.dur} 
                                        onChange={e=>setGenConfig({...genConfig, dur: e.target.value as any})}
                                        className="flex-1 bg-[var(--highlight)] p-3 rounded-xl text-xs font-bold uppercase tracking-widest outline-none"
                                    >
                                        <option value="short">Breve</option>
                                        <option value="long">Profunda</option>
                                    </select>
                                    <select 
                                        value={genConfig.diff} 
                                        onChange={e=>setGenConfig({...genConfig, diff: e.target.value as any})}
                                        className="flex-1 bg-[var(--highlight)] p-3 rounded-xl text-xs font-bold uppercase tracking-widest outline-none"
                                    >
                                        <option value="beginner">Iniciado</option>
                                        <option value="advanced">Adepto</option>
                                    </select>
                                </div>
                                <button onClick={handleGenerate} disabled={isGenerating || !genTopic.trim()} className="w-full py-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isGenerating ? <><i className="ph-duotone ph-spinner animate-spin"></i> Sincronizando...</> : 'Comenzar Viaje'}
                                </button>
                            </div>
                        )}

                        {/* List Filters (MOBILE FRIENDLY) */}
                        <div className="space-y-4">
                            {/* Difficulty Toggles (Full Width Segmented) */}
                            <div className="flex bg-[var(--card)] p-1 rounded-2xl border border-[var(--border)] shadow-sm">
                                {['all', 'beginner', 'advanced'].map((f: any) => (
                                    <button 
                                        key={f} 
                                        onClick={() => setFilterDiff(f)} 
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterDiff===f ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-sm' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}
                                    >
                                        {f === 'all' ? 'Todo' : f === 'beginner' ? 'Iniciado' : 'Adepto'}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Status Pills (Horizontal Scroll) */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
                                {[
                                    { id: 'all', label: 'Todos', icon: 'ph-list' },
                                    { id: 'new', label: 'Por Hacer', icon: 'ph-circle' },
                                    { id: 'done', label: 'Completados', icon: 'ph-check-circle' },
                                    { id: 'favorites', label: 'Favoritos', icon: 'ph-heart' }
                                ].map((f: any) => (
                                    <button 
                                        key={f.id} 
                                        onClick={() => setFilterStatus(f.id)} 
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap shrink-0 ${filterStatus===f.id ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)] shadow-sm' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)]'}`}
                                    >
                                        <i className={`ph-fill ${f.icon} text-sm`}></i> {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {filteredList.length === 0 && <div className="text-center py-10 opacity-30 italic font-serif">No hay meditaciones con estos filtros.</div>}
                            {filteredList.map((m, i) => {
                                const isDone = m.id && completedIds.has(m.id);
                                const isFav = m.id && favoriteIds.has(m.id);
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => startSession(m)} 
                                        className={`bg-[var(--card)] p-4 rounded-[24px] border shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group flex items-center gap-4 ${isDone ? 'border-emerald-200 dark:border-emerald-900/30' : 'border-[var(--border)]'}`}
                                    >
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-[var(--border)] ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-[var(--highlight)] text-[var(--text-sub)]'}`}>
                                            <i className={`ph-duotone ${isDone ? 'ph-check-circle' : 'ph-waves'}`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="serif font-bold text-base leading-tight line-clamp-2 text-left pr-2">{m.title}</h4>
                                                {isFav && <i className="ph-fill ph-heart text-rose-500 text-xs shrink-0 mt-1"></i>}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                <span>{estimateRealDuration(m.content)} min</span>
                                                <span>•</span>
                                                <span className={m.difficulty === 'advanced' ? 'text-purple-500' : 'text-emerald-500'}>{m.difficulty === 'advanced' ? 'Adepto' : 'Iniciado'}</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--text-main)] group-hover:text-[var(--bg)] transition-colors shrink-0">
                                            <i className="ph-fill ph-play ml-0.5"></i>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
