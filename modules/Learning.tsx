
import React, { useState, useEffect, useMemo } from 'react';
import { Module, Lesson, UserProgress, Course } from '../types';
import { generateCourseLesson } from '../services/geminiService';
import { supabase } from '../services/supabase';

// --- MARKDOWN RENDERER COMPONENT ---
const MarkdownRenderer = ({ content }: { content: string }) => {
    if (!content) return null;

    // Helper to process inline styles (bold, italic)
    const processInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-[var(--text-main)]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic opacity-80">{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-[var(--highlight)] px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    // Split by lines to handle blocks
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    let listBuffer: React.ReactNode[] = [];

    const flushList = () => {
        if (listBuffer.length > 0) {
            elements.push(
                <ul key={`list-${elements.length}`} className="list-none space-y-2 mb-6 ml-2">
                    {listBuffer}
                </ul>
            );
            listBuffer = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Skip empty lines but flush lists
        if (!trimmed) {
            flushList();
            return;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className="serif text-xl font-bold text-[var(--text-main)] mt-8 mb-4">{trimmed.replace('### ', '')}</h3>);
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(<h2 key={index} className="serif text-2xl font-bold text-[var(--text-main)] mt-10 mb-4 pb-2 border-b border-[var(--border)]">{trimmed.replace('## ', '')}</h2>);
        } else if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(<h1 key={index} className="serif text-3xl font-bold text-[var(--text-main)] mt-6 mb-6">{trimmed.replace('# ', '')}</h1>);
        }
        // Lists
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            listBuffer.push(
                <li key={`li-${index}`} className="flex gap-3 text-base opacity-90 leading-relaxed">
                    <span className="text-[var(--gold)] mt-1.5 text-[8px] shrink-0">●</span>
                    <span>{processInline(content)}</span>
                </li>
            );
        }
        // Blockquotes (Simple heuristic)
        else if (trimmed.startsWith('> ')) {
            flushList();
            elements.push(
                <blockquote key={index} className="border-l-4 border-[var(--gold)] pl-4 py-2 my-6 italic text-lg opacity-80 bg-[var(--highlight)]/30 rounded-r-lg">
                    {processInline(trimmed.replace('> ', ''))}
                </blockquote>
            );
        }
        // Paragraphs
        else {
            flushList();
            elements.push(
                <p key={index} className="serif-text text-lg leading-loose mb-4 opacity-90 text-justify">
                    {processInline(trimmed)}
                </p>
            );
        }
    });

    flushList(); // Final flush

    return <div className="markdown-content">{elements}</div>;
};

export function LearningModule({ onBack, setActiveChallenge, onNavigateToArena, modules, courses, userId }: { 
    onBack: () => void, 
    setActiveChallenge: (c: any) => void, 
    onNavigateToArena: () => void, 
    modules: Module[],
    courses: Course[],
    userId?: string
}) {
    const [view, setView] = useState<'courses_list' | 'module_path' | 'lesson'>('courses_list');
    
    // Selection State
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeModule, setActiveModule] = useState<Module | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    
    // Filter State
    const [filterLevel, setFilterLevel] = useState("Todos");

    const [isGenerating, setIsGenerating] = useState(false);
    
    // Remote Progress State
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
    const [loadingProgress, setLoadingProgress] = useState(true);

    // Hydrate module list locally to reflect new insertions immediately
    // CRITICAL: Initialize directly from props, but use useEffect to update when props change (async fetch)
    const [localModules, setLocalModules] = useState<Module[]>(modules);

    // Sync local state when props update (e.g. after DB fetch completes)
    useEffect(() => {
        if (modules && modules.length > 0) {
            setLocalModules(modules);
        }
    }, [modules]);

    // Local Notes State
    const [lessonNotes, setLessonNotes] = useState<Record<string, string>>(() => {
        try {
            return JSON.parse(localStorage.getItem('stoic_lesson_notes') || '{}');
        } catch(e) { return {}; }
    });

    // Fetch User Progress from DB
    useEffect(() => {
        const fetchProgress = async () => {
            if (!userId) { setLoadingProgress(false); return; }
            const { data } = await supabase.from('user_progress').select('lesson_id');
            if (data) {
                setCompletedLessonIds(new Set(data.map(p => p.lesson_id)));
            }
            setLoadingProgress(false);
        };
        fetchProgress();
    }, [userId]);

    // Extract Unique Levels
    const uniqueLevels = useMemo(() => ["Todos", ...Array.from(new Set(courses.map(c => c.level))).sort()], [courses]);

    // Filter Courses
    const filteredCourses = useMemo(() => {
        return courses.filter(c => filterLevel === "Todos" || c.level === filterLevel);
    }, [courses, filterLevel]);

    const isLessonComplete = (id: string) => completedLessonIds.has(id);

    const markComplete = async (lessonId: string) => {
        if (!isLessonComplete(lessonId) && userId) {
            // Optimistic Update
            setCompletedLessonIds(prev => new Set(prev).add(lessonId));
            
            await supabase.from('user_progress').insert({
                user_id: userId,
                lesson_id: lessonId,
                completed_at: new Date().toISOString()
            });
        }
        setActiveLesson(null); // Return to module view
    };

    const handleSyncToArena = () => {
        if(!activeLesson) return;
        setActiveChallenge({ title: activeLesson.title, task: activeLesson.task });
        onNavigateToArena();
    };

    const handleSaveNote = (lessonId: string, text: string) => {
        const newNotes = { ...lessonNotes, [lessonId]: text };
        setLessonNotes(newNotes);
        localStorage.setItem('stoic_lesson_notes', JSON.stringify(newNotes));
    };

    const handleGenerateExtra = async () => {
        if(!activeModule) return;
        setIsGenerating(true);
        const aiData = await generateCourseLesson(activeModule.title, activeModule.description);
        
        if(aiData) {
            const newOrder = (activeModule.lessons?.length || 0) + 1;
            const newLessonPayload = {
                module_id: activeModule.id,
                title: aiData.title,
                duration: aiData.duration,
                description: aiData.description,
                content: aiData.content,
                task: aiData.task,
                sort_order: newOrder,
                is_generated: true
            };

            const { data, error } = await supabase.from('content_lessons').insert(newLessonPayload).select().single();

            if (data && !error) {
                const insertedLesson = data as Lesson;
                // Update Local State for UI
                const updatedModules = localModules.map(m => {
                    if(m.id === activeModule.id) {
                        return { ...m, lessons: [...(m.lessons || []), insertedLesson] };
                    }
                    return m;
                });
                setLocalModules(updatedModules);
                // Also update currently active module reference
                setActiveModule(prev => prev ? ({ ...prev, lessons: [...(prev.lessons || []), insertedLesson] }) : null);
            } else {
                console.error("Error inserting lesson:", error);
                alert("Error guardando la lección.");
            }
        }
        setIsGenerating(false);
    };

    const calculateCourseProgress = (courseId: string) => {
        const courseModules = localModules.filter(m => m.course_id === courseId);
        if (courseModules.length === 0) return 0;

        let totalLessons = 0;
        let completed = 0;

        courseModules.forEach(m => {
            if(m.lessons) {
                totalLessons += m.lessons.length;
                completed += m.lessons.filter(l => isLessonComplete(l.id)).length;
            }
        });

        if(totalLessons === 0) return 0;
        return Math.round((completed / totalLessons) * 100);
    };

    // Calculate Global Progress across ALL courses
    const globalProgress = useMemo(() => {
        let total = 0;
        let done = 0;
        
        localModules.forEach(m => {
            if(m.lessons) {
                total += m.lessons.length;
                done += m.lessons.filter(l => completedLessonIds.has(l.id)).length;
            }
        });
        
        if (total === 0) return 0;
        return Math.round((done / total) * 100);
    }, [localModules, completedLessonIds]);

    const handleCourseSelect = (c: Course) => {
        setSelectedCourse(c);
        setView('module_path');
    };

    // LOGIC UPDATE: Always show a Hero card. If no progress, show first course as "Start Journey"
    const activeCourseData = useMemo(() => {
        if (courses.length === 0) return null;
        
        // 1. Try to find a course in progress
        for (const c of courses) {
            const p = calculateCourseProgress(c.id);
            if (p > 0 && p < 100) return { course: c, progress: p, label: "Tu Senda Actual", action: "Continuar" };
        }

        // 2. If none in progress, suggest the first one to start
        if (courses.length > 0) {
             return { course: courses[0], progress: 0, label: "Comienza el Viaje", action: "Empezar" };
        }

        return null;
    }, [courses, completedLessonIds, localModules]);

    const getLevelColor = (level: string) => {
        if (level === 'Avanzado') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800';
        if (level === 'Intermedio') return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800';
    }

    const getLevelIcon = (level: string) => {
        if (level === 'Avanzado') return 'ph-mountains';
        if (level === 'Intermedio') return 'ph-path';
        return 'ph-footprints';
    }

    // --- RENDER: LESSON VIEW ---
    if (view === 'lesson' && activeLesson) {
        const isDone = isLessonComplete(activeLesson.id);
        const currentNote = lessonNotes[activeLesson.id] || "";

        return (
            <div className="flex flex-col h-full animate-fade-in bg-[#FDFBF7] dark:bg-[#1a1a1a] relative">
                <div className="w-full max-w-2xl mx-auto flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-[var(--bg)]/90 backdrop-blur sticky top-0 z-30">
                    <button onClick={() => setView('module_path')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><i className="ph-bold ph-arrow-left"></i></button>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Lección</div>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-32 max-w-xl mx-auto w-full pt-8 no-scrollbar">
                    <div className="text-center mb-10 pb-6 border-b border-stone-200 dark:border-stone-800">
                        <span className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)] mb-2 block">{activeModule?.title}</span>
                        <h2 className="serif text-3xl md:text-4xl font-bold leading-tight mb-3 text-stone-800 dark:text-stone-100">{activeLesson.title}</h2>
                        <div className="flex items-center justify-center gap-2 text-xs opacity-40 font-mono">
                            <i className="ph-fill ph-clock"></i> {activeLesson.duration}
                        </div>
                    </div>

                    <div className="mb-12">
                        <MarkdownRenderer content={activeLesson.content} />
                    </div>

                    {/* REDESIGNED PRACTICAL CHALLENGE */}
                    <div className="mb-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-[32px] opacity-80"></div>
                        <div className="relative p-8 rounded-[32px] border border-amber-100 dark:border-amber-900/30">
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xl shadow-sm">
                                    <i className="ph-duotone ph-lightning"></i>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold uppercase tracking-[3px] text-amber-800 dark:text-amber-200">Misión del Día</span>
                                    <h3 className="serif font-bold text-lg text-[var(--text-main)]">Reto Práctico</h3>
                                </div>
                            </div>

                            <div className="pl-4 border-l-2 border-amber-300 dark:border-amber-700 mb-8">
                                <p className="serif text-xl italic text-stone-800 dark:text-stone-100 leading-relaxed">
                                    "{activeLesson.task}"
                                </p>
                            </div>

                            <button onClick={handleSyncToArena} className="w-full py-4 bg-white dark:bg-[#2C2410] rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors border border-amber-200 dark:border-amber-800/50 shadow-sm text-amber-900 dark:text-amber-100 group-hover:scale-[1.02] transform duration-300">
                                <i className="ph-bold ph-sword"></i> Aceptar Reto en la Arena
                            </button>
                        </div>
                    </div>

                    {/* INTERACTIVE NOTEBOOK */}
                    <div className="mb-10 bg-stone-100 dark:bg-stone-900/50 p-6 rounded-[24px] border border-stone-200 dark:border-stone-800 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 opacity-60">
                            <i className="ph-bold ph-notebook text-lg"></i>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Cuaderno de Viaje</span>
                        </div>
                        <textarea 
                            value={currentNote}
                            onChange={(e) => handleSaveNote(activeLesson.id, e.target.value)}
                            placeholder="Anota tus reflexiones clave sobre esta lección..."
                            className="w-full bg-transparent outline-none font-serif text-base resize-none h-32 placeholder:italic placeholder:opacity-40"
                        />
                    </div>

                    <div className="py-8 border-t border-stone-200 dark:border-stone-800">
                        <button 
                            onClick={() => markComplete(activeLesson!.id)}
                            className={`w-full py-5 rounded-[24px] font-bold uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${isDone ? 'bg-[var(--gold)] text-white' : 'bg-[var(--text-main)] text-[var(--bg)] hover:opacity-90'}`}
                        >
                            {isDone ? <><i className="ph-fill ph-check-circle text-xl"></i> Lección Completada</> : "Marcar como Leída"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: MODULE PATH VIEW (VERTICAL CONNECTED TIMELINE) ---
    if (view === 'module_path' && selectedCourse) {
        const courseModules = localModules.filter(m => m.course_id === selectedCourse.id);
        const progress = calculateCourseProgress(selectedCourse.id);
        const isCourseCompleted = progress === 100;

        return (
            <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
                <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 bg-[var(--bg)]/90 backdrop-blur z-20 border-b border-[var(--border)]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setSelectedCourse(null); setView('courses_list'); }} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                        <div className="flex flex-col">
                            <h2 className="serif text-lg font-bold line-clamp-1">{selectedCourse.title}</h2>
                            <span className="text-[9px] uppercase tracking-widest opacity-50">{progress}% Completado</span>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-2xl px-6 pb-32 flex-1 overflow-y-auto no-scrollbar pt-8 relative">
                    
                    {/* CERTIFICATE BANNER */}
                    {isCourseCompleted && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-[var(--gold)] to-amber-600 rounded-[24px] text-white shadow-lg flex flex-col items-center text-center relative overflow-hidden animate-slide-up">
                            <i className="ph-duotone ph-certificate text-9xl absolute -right-6 -bottom-6 opacity-20"></i>
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-4 backdrop-blur-sm">
                                <i className="ph-fill ph-trophy"></i>
                            </div>
                            <h3 className="serif text-2xl font-bold mb-1">Curso Completado</h3>
                            <p className="text-xs opacity-90 uppercase tracking-widest mb-4">Maestría Alcanzada</p>
                            <div className="px-4 py-2 bg-white/20 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm">
                                {selectedCourse.level}
                            </div>
                        </div>
                    )}

                    {activeModule ? (
                        <div className="animate-fade-in">
                            <button onClick={() => setActiveModule(null)} className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100"><i className="ph-bold ph-caret-left"></i> Volver al Mapa</button>
                            <div className="mb-8 text-center">
                                <h3 className="serif text-3xl font-bold mb-2">{activeModule.title}</h3>
                                <p className="text-sm opacity-60 max-w-sm mx-auto">{activeModule.description}</p>
                            </div>
                            
                            <div className="space-y-3">
                                {activeModule.lessons?.map((lesson, i) => {
                                    const isDone = isLessonComplete(lesson.id);
                                    const isLocked = i > 0 && !isLessonComplete(activeModule.lessons![i-1].id);
                                    
                                    return (
                                        <div 
                                            key={lesson.id} 
                                            onClick={() => !isLocked && (setActiveLesson(lesson), setView('lesson'))}
                                            className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${isLocked ? 'bg-[var(--bg)] border-[var(--border)] opacity-50 cursor-not-allowed' : 'bg-[var(--card)] border-[var(--border)] cursor-pointer hover:border-[var(--text-main)] active:scale-[0.99] shadow-sm'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold border transition-colors ${isDone ? 'bg-[var(--gold)] border-[var(--gold)] text-white' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-sub)]'}`}>
                                                {isDone ? <i className="ph-bold ph-check"></i> : i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="serif font-bold text-base">{lesson.title}</h4>
                                                <span className="text-[10px] uppercase tracking-widest opacity-50">{lesson.duration}</span>
                                            </div>
                                            {isLocked ? <i className="ph-fill ph-lock opacity-30"></i> : <i className="ph-bold ph-caret-right opacity-30"></i>}
                                        </div>
                                    )
                                })}
                                <button onClick={handleGenerateExtra} disabled={isGenerating} className="w-full py-4 mt-6 border-2 border-dashed border-[var(--border)] rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 hover:border-[var(--text-main)] transition-all">
                                    {isGenerating ? <i className="ph-duotone ph-spinner animate-spin"></i> : <i className="ph-bold ph-plus"></i>} Generar Lección Extra
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative pl-4">
                            {/* Connected Vertical Line */}
                            <div className="absolute left-[35px] top-4 bottom-10 w-[2px] bg-[var(--border)] z-0"></div>
                            
                            <div className="space-y-8 relative z-10">
                                {courseModules.map((mod, i) => {
                                    const modLessons = mod.lessons || [];
                                    const modCompleted = modLessons.filter(l => isLessonComplete(l.id)).length;
                                    const isComplete = modLessons.length > 0 && modCompleted === modLessons.length;
                                    const isLocked = i > 0 && calculateCourseProgress(selectedCourse.id) < (i * 10); 
                                    const isActive = !isLocked && !isComplete;

                                    return (
                                        <div key={mod.id} onClick={() => !isLocked && setActiveModule(mod)} className={`group relative flex items-start gap-6 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                            
                                            {/* Timeline Node */}
                                            <div className={`w-12 h-12 rounded-full border-4 shrink-0 flex items-center justify-center z-10 transition-all duration-300 ${isComplete ? 'bg-[var(--gold)] border-[var(--gold)] text-white scale-100' : isActive ? 'bg-[var(--bg)] border-[var(--text-main)] text-[var(--text-main)] scale-110 shadow-lg' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-sub)] scale-100'}`}>
                                                {isComplete ? <i className="ph-fill ph-check text-xl"></i> : isLocked ? <i className="ph-fill ph-lock text-xl"></i> : <span className="font-serif font-bold text-lg">{i+1}</span>}
                                            </div>

                                            {/* Card Content */}
                                            <div className={`flex-1 bg-[var(--card)] p-6 rounded-[24px] border transition-all relative overflow-hidden ${isActive ? 'border-[var(--text-main)] shadow-md ring-2 ring-[var(--text-main)]/5' : 'border-[var(--border)] shadow-sm hover:border-[var(--text-sub)]'}`}>
                                                <div className="flex justify-between items-start relative z-10">
                                                    <div>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1 block">Módulo {i+1}</span>
                                                        <h3 className="serif text-xl font-bold">{mod.title}</h3>
                                                        <p className="text-xs opacity-60 mt-1 line-clamp-1">{mod.description}</p>
                                                    </div>
                                                    <i className={`ph-duotone ${mod.icon} text-3xl opacity-20`}></i>
                                                </div>
                                                
                                                {/* Mini Progress Bar */}
                                                <div className="mt-4 w-full h-1.5 bg-[var(--highlight)] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[var(--gold)] transition-all duration-700" style={{ width: `${(modCompleted / (modLessons.length || 1)) * 100}%` }}></div>
                                                </div>
                                                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-2 text-right">
                                                    {modCompleted}/{modLessons.length} Lecciones
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- MAIN VIEW: COURSES LIST ---
    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
            <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-[var(--border)]"><i className="ph-bold ph-arrow-left"></i></button>
                    <h2 className="serif text-2xl font-bold">Caminos</h2>
                </div>
            </div>

            {/* GLOBAL PROGRESS HEADER */}
            <div className="w-full max-w-2xl px-6 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Maestría General</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{globalProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--highlight)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div className="h-full bg-gradient-to-r from-[var(--gold)] to-amber-600 rounded-full transition-all duration-1000" style={{ width: `${globalProgress}%` }}></div>
                </div>
            </div>

            <div className="w-full max-w-2xl px-6 mb-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {uniqueLevels.map(lvl => (
                        <button 
                            key={lvl} 
                            onClick={() => setFilterLevel(lvl)} 
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all ${filterLevel === lvl ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-sub)]'}`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full max-w-2xl px-6 pb-32 flex-1 overflow-y-auto no-scrollbar pt-2">
                
                {/* HERO ACTIVE COURSE CARD (ALWAYS VISIBLE if data exists) */}
                {activeCourseData && filterLevel === "Todos" && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3 opacity-60 px-1">
                            <i className="ph-fill ph-compass text-amber-500"></i>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{activeCourseData.label}</span>
                        </div>
                        <div onClick={() => handleCourseSelect(activeCourseData.course)} className="bg-[var(--text-main)] text-[var(--bg)] p-8 rounded-[32px] shadow-xl relative overflow-hidden cursor-pointer group active:scale-[0.99] transition-transform">
                            {/* Abstract Background Decoration */}
                            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-[var(--gold)]/10 rounded-full blur-3xl"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{activeCourseData.course.level}</span>
                                        <h3 className="serif text-3xl font-bold leading-tight max-w-[80%]">{activeCourseData.course.title}</h3>
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl border border-white/10">
                                        <i className={`ph-fill ${activeCourseData.course.icon}`}></i>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                                        <span>Progreso</span>
                                        <span>{activeCourseData.progress}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--gold)] rounded-full shadow-[0_0_10px_var(--gold)] transition-all duration-1000" style={{width: `${activeCourseData.progress}%`}}></div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                    <span>{activeCourseData.action}</span> <i className="ph-bold ph-arrow-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* COURSE GRID */}
                {filteredCourses.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                        <i className="ph-duotone ph-map-trifold text-5xl mb-4"></i>
                        <span className="serif text-lg italic">No hay caminos disponibles.</span>
                     </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 opacity-40 px-1 mt-4">
                            <i className="ph-fill ph-squares-four"></i>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Catálogo</span>
                        </div>
                        <div className="grid gap-4">
                            {filteredCourses.map((course) => {
                                const progress = calculateCourseProgress(course.id);
                                // Skip showing the active course again in the main list if we are in "Todos" view (it's already in Hero)
                                if (filterLevel === "Todos" && activeCourseData && activeCourseData.course.id === course.id) return null;

                                return (
                                    <div key={course.id} onClick={() => handleCourseSelect(course)} className="bg-[var(--card)] p-5 rounded-[28px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group relative overflow-hidden flex items-center gap-5">
                                         
                                         {/* Level Colored Icon Box */}
                                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-[var(--border)] group-hover:scale-105 transition-transform ${getLevelColor(course.level)}`}>
                                             <i className={`ph-duotone ${course.icon}`}></i>
                                         </div>

                                         <div className="flex-1 min-w-0">
                                             <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <i className={`ph-fill ${getLevelIcon(course.level)} text-[10px] opacity-40`}></i>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{course.level}</span>
                                                    </div>
                                                    <h3 className="serif text-lg font-bold leading-tight truncate pr-2 text-[var(--text-main)]">{course.title}</h3>
                                                </div>
                                                {progress === 100 && <i className="ph-fill ph-seal-check text-[var(--gold)] shrink-0 text-lg"></i>}
                                             </div>
                                             
                                             <p className="text-xs opacity-60 line-clamp-1 mb-2.5 mt-1">{course.description}</p>
                                             
                                             <div className="flex items-center gap-3">
                                                 <div className="flex-1 h-1.5 bg-[var(--highlight)] rounded-full overflow-hidden">
                                                     <div className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-[var(--text-main)]'}`} style={{ width: `${progress}%` }}></div>
                                                 </div>
                                                 <span className="text-[10px] font-bold opacity-40 uppercase">{progress}%</span>
                                             </div>
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
