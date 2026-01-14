
import React, { useState } from 'react';
import { generateBulkReadings, generateBulkGlossary, generateBulkTasks, generateBulkPhilosophers, generateMeditation, generateFullCourseStructure, generateLessonContent, generateBulkSchools, generateBulkMeditations, generateBulkDailyQuestions, generateBulkDichotomies, askGemini } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { Reading, GlossaryTerm, Task, PhilosopherBio, Meditation, Course, Module, Lesson, PhilosophySchool, DichotomyScenario } from '../types';

type ContentType = 'readings' | 'glossary' | 'tasks' | 'philosophers' | 'meditation' | 'course' | 'schools' | 'daily_questions' | 'dichotomies';

export function AdminGenerator({ onBack, schools, philosophers }: { onBack: () => void, schools?: PhilosophySchool[], philosophers?: PhilosopherBio[] }) {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [count, setCount] = useState(5);
    const [type, setType] = useState<ContentType>('readings');
    const [topicInput, setTopicInput] = useState("");
    const [dbStatus, setDbStatus] = useState<any>(null);
    
    // Glossary Context State
    const [glossaryContextType, setGlossaryContextType] = useState<'universal' | 'school' | 'author'>('universal');
    const [selectedContextId, setSelectedContextId] = useState("");

    // Meditation Specific State
    const [meditationDifficulty, setMeditationDifficulty] = useState<'beginner' | 'advanced'>('beginner');
    const [meditationDuration, setMeditationDuration] = useState<'short' | 'long'>('short');

    // Course Specific State
    const [courseLevel, setCourseLevel] = useState<'Iniciado' | 'Intermedio' | 'Avanzado'>('Iniciado');

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const handleCheckDb = async () => {
        setLoading(true);
        addLog("SCANNING SYSTEM...");
        const tables = ['content_readings', 'content_philosophers', 'content_meditations', 'content_courses', 'content_lessons', 'content_tasks', 'content_glossary', 'content_dichotomies'];
        const stats: any = {};
        
        for (const t of tables) {
            const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
            stats[t] = count || 0;
        }
        setDbStatus(stats);
        addLog("SYSTEM SCAN COMPLETE.");
        setLoading(false);
    }

    const handleNuke = async () => {
        if(!confirm("⚠️ PELIGRO: ¿Borrar TODO el contenido generado (Lecturas, Tareas, Glosario)? Esta acción es irreversible.")) return;
        setLoading(true);
        addLog("INITIATING PURGE SEQUENCE...");
        await supabase.from('content_readings').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all uuids
        await supabase.from('content_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('content_glossary').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        addLog("PURGE COMPLETE. SYSTEM CLEAN.");
        handleCheckDb();
        setLoading(false);
    }

    const handleGenerate = async () => {
        setLoading(true);
        setLogs([]);
        addLog(`>> EXEC: GENERATE ${type.toUpperCase()}`);
        
        try {
            if (type === 'course') {
                await handleGenerateCourse();
            } else if (type === 'meditation') {
                await handleGenerateMeditation();
            } else {
                await handleBulkGeneration();
            }
        } catch (e: any) {
            addLog(`!! CRITICAL ERROR: ${e.message}`);
        } finally {
            setLoading(false);
            handleCheckDb();
        }
    };

    const handleGenerateMeditation = async () => {
        // Modo "Sorpresa Universal" si topicInput está vacío (Generación Masiva Aleatoria)
        if (count > 1 && !topicInput) {
            addLog(`Generando ${count} meditaciones rítmicas variadas (Optimizado para TTS)...`);
            const meds = await generateBulkMeditations(count);
            if(meds.length === 0) { addLog("Error en IA."); return; }
            
            const payload = meds.map(m => ({ ...m, created_at: new Date().toISOString() }));
            const { error } = await supabase.from('content_meditations').upsert(payload, { onConflict: 'title', ignoreDuplicates: true });
            
            if (error) addLog(`Error DB: ${error.message}`);
            else addLog(`Éxito: ${meds.length} sesiones rítmicas guardadas.`);
            return;
        }

        // Modo Single Topic (Especificando Nivel y Duración)
        addLog(topicInput ? `Diseñando sesión rítmica sobre: "${topicInput}" (${meditationDifficulty})...` : `Diseñando sesión sorpresa (${meditationDifficulty})...`);
        
        const med = await generateMeditation(topicInput, meditationDuration, meditationDifficulty);
        if (!med) { addLog("Error en IA."); return; }

        addLog(`Guion generado: ${med.title} [${med.duration_minutes}m]`);
        
        // Ensure difficulty is saved
        const payload = { 
            ...med, 
            difficulty: meditationDifficulty, // Force consistency with UI selection
            created_at: new Date().toISOString() 
        };
        
        const { error } = await supabase.from('content_meditations').insert(payload);

        if (error) addLog(`Error DB: ${error.message}`);
        else addLog("Éxito: Sesión guardada y lista para reproducción.");
    }

    const handleGenerateCourse = async () => {
        let targetTopic = topicInput;

        if (!targetTopic) {
             addLog("🧠 Imaginando tema para el curso...");
             const autoTitle = await askGemini("Crea un título atractivo, breve y profundo para un curso de filosofía estoica o espiritualidad práctica. Máximo 6 palabras. Solo el texto del título.");
             if (!autoTitle) { addLog("Error: Fallo al autogenerar título."); return; }
             targetTopic = autoTitle.trim().replace(/^"|"$/g, '');
             addLog(`Tema autogenerado: "${targetTopic}"`);
        }

        addLog(`Diseñando estructura del curso (${courseLevel}): ${targetTopic}...`);

        const structure = await generateFullCourseStructure(targetTopic, courseLevel);
        
        if (!structure || !structure.course || !structure.modules || !Array.isArray(structure.modules)) {
            addLog("Error: La IA no devolvió una estructura válida. Intenta de nuevo.");
            return;
        }

        addLog(`Estructura creada: ${structure.course.title} con ${structure.modules.length} módulos.`);

        // 1. Insert Course (Let DB generate ID)
        const coursePayload = { 
            ...structure.course,
            created_at: new Date().toISOString() 
        };
        
        const { data: savedCourse, error: cErr } = await supabase
            .from('content_courses')
            .insert(coursePayload)
            .select('id')
            .single();

        if (cErr || !savedCourse) { addLog(`Error guardando curso: ${cErr?.message}`); return; }
        
        const courseId = savedCourse.id;
        addLog(`Curso guardado (DB ID: ${courseId}). Procesando módulos...`);

        // 2. Process Modules & Lessons
        let totalLessons = 0;
        for (let i = 0; i < structure.modules.length; i++) {
            const modData = structure.modules[i];
            addLog(`Insertando Módulo ${i+1}: ${modData.title}...`);
            
            // Link to Course ID, let DB generate Module ID
            const modulePayload = {
                course_id: courseId,
                title: modData.title,
                subtitle: modData.subtitle,
                description: modData.description,
                icon: modData.icon,
                sort_order: i + 1,
                created_at: new Date().toISOString()
            };

            const { data: savedModule, error: mErr } = await supabase
                .from('content_modules')
                .insert(modulePayload)
                .select('id')
                .single();

            if (mErr || !savedModule) { addLog(`Error en módulo ${i+1}: ${mErr?.message}`); continue; }
            
            const moduleId = savedModule.id;

            // 3. Generate Lesson Content Sequentially
            if (modData.lessons && Array.isArray(modData.lessons)) {
                for (let j = 0; j < modData.lessons.length; j++) {
                    const lesMeta = modData.lessons[j];
                    addLog(`  Generando contenido Lección ${j+1}: ${lesMeta.title}... (Espere)`);
                    
                    const fullLesson = await generateLessonContent(lesMeta.title, coursePayload.title, modData.title);
                    
                    if (fullLesson) {
                        const lessonPayload = {
                            module_id: moduleId, // Link to real DB Module ID
                            title: fullLesson.title,
                            duration: fullLesson.duration,
                            description: lesMeta.description || "Sin descripción", 
                            content: fullLesson.content,
                            task: fullLesson.task,
                            sort_order: j + 1,
                            is_generated: true,
                            created_at: new Date().toISOString()
                        };
                        
                        const { error: lErr } = await supabase.from('content_lessons').insert(lessonPayload);
                        if (lErr) addLog(`  Error guardando lección: ${lErr.message}`);
                        else { 
                            addLog(`  -> Lección guardada.`); 
                            totalLessons++; 
                        }
                    } else {
                        addLog(`  -> Fallo en generación de IA para lección.`);
                    }
                    
                    await new Promise(r => setTimeout(r, 1500)); // Slight delay to prevent rate limits
                }
            }
        }
        addLog(`Curso completado con éxito. ${totalLessons} lecciones creadas.`);
    }

    const handleBulkGeneration = async () => {
        addLog(`>> INIT BULK GEN: ${count} x ${type.toUpperCase()}`);
        let data: any[] = [];
        let tableName = '';
        let conflictKey = '';
        let mapFunction = (item: any) => item;

        switch (type) {
            case 'readings':
                data = await generateBulkReadings(count);
                tableName = 'content_readings';
                conflictKey = 'quote';
                mapFunction = (r: Reading) => ({
                    title: r.t, quote: r.q, body: r.b, author: r.a, tags: r.k, type: r.type || 'reflexion', philosophy: r.philosophy || 'Universal', created_at: new Date().toISOString()
                });
                break;
            case 'glossary':
                // Prepare context
                let contextObj = {};
                if (glossaryContextType === 'school' && selectedContextId) {
                    const schoolName = schools?.find(s => s.id === selectedContextId || s.name === selectedContextId)?.name || selectedContextId;
                    contextObj = { school: schoolName };
                } else if (glossaryContextType === 'author' && selectedContextId) {
                    const authorName = philosophers?.find(p => p.id === selectedContextId)?.name || selectedContextId;
                    contextObj = { author: authorName };
                }

                data = await generateBulkGlossary(count, contextObj);
                tableName = 'content_glossary';
                conflictKey = 'term';
                mapFunction = (g: GlossaryTerm) => ({ 
                    ...g, 
                    related_school: glossaryContextType === 'school' ? (contextObj as any).school : null,
                    related_author: glossaryContextType === 'author' ? (contextObj as any).author : null,
                    created_at: new Date().toISOString() 
                });
                break;
            case 'tasks':
                data = await generateBulkTasks(count);
                tableName = 'content_tasks';
                conflictKey = 'title';
                mapFunction = (t: Task) => ({ ...t, created_at: new Date().toISOString() });
                break;
            case 'philosophers':
                data = await generateBulkPhilosophers(count);
                tableName = 'content_philosophers';
                conflictKey = 'id';
                mapFunction = (p: PhilosopherBio) => ({
                    id: p.id, 
                    name: p.name, 
                    dates: p.dates, 
                    role: p.role, 
                    school: p.school, 
                    branch: p.branch, // Map new branch field
                    description: p.desc, 
                    key_ideas: p.key_ideas, 
                    icon: p.icon, 
                    created_at: new Date().toISOString()
                });
                break;
            case 'schools':
                data = await generateBulkSchools(count);
                tableName = 'content_schools';
                conflictKey = 'name';
                mapFunction = (s: PhilosophySchool) => ({ ...s, created_at: new Date().toISOString() });
                break;
            case 'daily_questions':
                data = await generateBulkDailyQuestions(count);
                tableName = 'content_daily_questions';
                conflictKey = 'question';
                mapFunction = (q: { question: string }) => ({ ...q, created_at: new Date().toISOString() });
                break;
            case 'dichotomies':
                data = await generateBulkDichotomies(count);
                tableName = 'content_dichotomies';
                conflictKey = 'text'; // Assuming text is unique enough for conflict
                mapFunction = (d: DichotomyScenario) => ({ ...d, created_at: new Date().toISOString() });
                break;
        }
        
        if (!data || data.length === 0) { addLog("!! ERROR: Empty AI response."); return; }
        
        const dbPayload = data.map(mapFunction);
        const { error } = await supabase.from(tableName).upsert(dbPayload, { onConflict: conflictKey, ignoreDuplicates: true });

        if (error) addLog(`!! DB ERROR: ${error.message}`);
        else addLog(`>> SUCCESS: +${data.length} items in ${tableName}.`);
    };

    const TabButton = ({ id, label, icon }: { id: ContentType, label: string, icon: string }) => (
        <button 
            onClick={() => { setType(id); setLogs([]); }} 
            className={`flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-all ${type === id ? 'bg-black text-[#00ff00] border-2 border-[#00ff00]' : 'bg-[#111] text-gray-500 hover:text-white border border-[#333]'}`}
        >
            <i className={`ph-bold ${icon} text-lg`}></i>
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[90] bg-[#0a0a0a] flex flex-col items-center justify-center p-4 animate-fade-in font-mono">
             <div className="w-full max-w-4xl bg-[#0a0a0a] rounded-lg border border-[#333] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                
                {/* Terminal Header */}
                <div className="p-4 border-b border-[#333] bg-[#111] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-[#00ff00] text-xs font-bold ml-4">ADMIN_TERMINAL_V3.3</span>
                    </div>
                    <button onClick={onBack} className="text-gray-500 hover:text-white"><i className="ph-bold ph-x"></i></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Controls */}
                    <div className="w-1/3 border-r border-[#333] p-4 flex flex-col gap-4 overflow-y-auto bg-[#0a0a0a]">
                        <div className="grid grid-cols-2 gap-2">
                            <TabButton id="readings" label="Lecturas" icon="ph-quotes" />
                            <TabButton id="philosophers" label="Bios" icon="ph-student" />
                            <TabButton id="schools" label="Escuelas" icon="ph-columns" />
                            <TabButton id="meditation" label="Meditar" icon="ph-flower" />
                            <TabButton id="course" label="Curso" icon="ph-path" />
                            <TabButton id="glossary" label="Glosario" icon="ph-book-bookmark" />
                            <TabButton id="tasks" label="Retos" icon="ph-sword" />
                            <TabButton id="dichotomies" label="Dicotomías" icon="ph-arrows-left-right" />
                            <TabButton id="daily_questions" label="Preguntas" icon="ph-question" />
                        </div>

                        <div className="border-t border-[#333] pt-4 mt-2">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Parámetros</label>
                            
                            {type === 'meditation' && (
                                <div className="space-y-3 mb-4">
                                    <select value={meditationDifficulty} onChange={(e) => setMeditationDifficulty(e.target.value as any)} className="w-full bg-[#111] text-gray-300 p-2 rounded text-xs border border-[#333] outline-none">
                                        <option value="beginner">Iniciado (Guiado)</option>
                                        <option value="advanced">Adepto (Silencio)</option>
                                    </select>
                                    <select value={meditationDuration} onChange={(e) => setMeditationDuration(e.target.value as any)} className="w-full bg-[#111] text-gray-300 p-2 rounded text-xs border border-[#333] outline-none">
                                        <option value="short">Breve (5m)</option>
                                        <option value="long">Profunda (15m)</option>
                                    </select>
                                </div>
                            )}

                            {type === 'course' && (
                                <div className="space-y-3 mb-4">
                                    <select value={courseLevel} onChange={(e) => setCourseLevel(e.target.value as any)} className="w-full bg-[#111] text-gray-300 p-2 rounded text-xs border border-[#333] outline-none">
                                        <option value="Iniciado">Nivel: Iniciado</option>
                                        <option value="Intermedio">Nivel: Intermedio</option>
                                        <option value="Avanzado">Nivel: Avanzado</option>
                                    </select>
                                </div>
                            )}

                            {type === 'glossary' && (
                                <div className="flex gap-1 mb-3">
                                    {['universal', 'school', 'author'].map((t:any) => (
                                        <button key={t} onClick={() => setGlossaryContextType(t)} className={`flex-1 text-[9px] py-1 uppercase rounded border ${glossaryContextType === t ? 'bg-[#333] text-white border-white' : 'border-[#333] text-gray-600'}`}>{t}</button>
                                    ))}
                                </div>
                            )}

                            <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)} placeholder={type === 'course' ? "Título del Curso..." : "Tema Específico..."} className="w-full bg-[#111] text-[#00ff00] p-3 rounded mb-3 text-xs font-mono border border-[#333] outline-none placeholder:text-gray-700" />
                            
                            <div className="flex items-center gap-2 mb-4">
                                <input type="range" min="1" max="10" value={count} onChange={(e) => setCount(Number(e.target.value))} className="flex-1 accent-[#00ff00]" />
                                <span className="text-[#00ff00] text-xs font-bold w-6">{count}</span>
                            </div>

                            <button onClick={handleGenerate} disabled={loading} className="w-full py-3 bg-[#00ff00] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#00cc00] disabled:opacity-50 mb-4 rounded-sm">
                                {loading ? "PROCESSING..." : "EXECUTE"}
                            </button>

                            <div className="flex gap-2">
                                <button onClick={handleCheckDb} className="flex-1 py-2 border border-[#333] text-gray-500 text-[9px] hover:text-white uppercase font-bold">Status Check</button>
                                <button onClick={handleNuke} className="flex-1 py-2 border border-red-900 text-red-700 text-[9px] hover:bg-red-900 hover:text-white uppercase font-bold">Nuke DB</button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Output */}
                    <div className="w-2/3 bg-[#050505] p-4 flex flex-col font-mono text-xs overflow-hidden relative">
                        <div className="flex-1 overflow-y-auto space-y-1 pb-20 custom-cursor">
                            {logs.length === 0 && <div className="text-gray-700 opacity-50">System Ready... Waiting for input.</div>}
                            {logs.map((log, i) => (
                                <div key={i} className={`${log.includes('ERROR') ? 'text-red-500' : log.includes('SUCCESS') ? 'text-[#00ff00]' : 'text-gray-300'}`}>
                                    {log}
                                </div>
                            ))}
                            {loading && <div className="text-[#00ff00] animate-pulse">_</div>}
                        </div>

                        {/* DB Status Overlay */}
                        {dbStatus && (
                            <div className="absolute bottom-0 left-0 right-0 bg-[#111] border-t border-[#333] p-2 flex gap-4 text-[10px] text-gray-500 overflow-x-auto">
                                <span>STATUS: ONLINE</span>
                                {Object.entries(dbStatus).map(([k,v]) => (
                                    <span key={k} className="uppercase">{k.replace('content_','')}: <span className="text-white">{v as any}</span></span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
}
