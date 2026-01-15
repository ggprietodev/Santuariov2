
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Reading, GlossaryTerm, Task, PhilosopherBio, Meditation, Lesson, Module, Course, PhilosophySchool, DichotomyScenario } from "../types";

const apiKey = process.env.API_KEY;
const client = new GoogleGenAI({ apiKey });

// --- HELPERS ---
const safeJSONParse = (text: string) => {
    try {
        // Remove markdown code blocks if present
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error", e);
        return null;
    }
};

// --- AUDIO GENERATION (TTS) ---

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        
        // Return base64 string
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS Error", e);
        return null;
    }
};

// --- CHAT WITH ORACLE (STOIC MENTOR) ---

export const chatWithOracle = async (userMessage: string, history: { role: 'user' | 'model', content: string }[]) => {
    const systemPrompt = `Actúa como el Oráculo Estoico. Eres una fusión de la sabiduría de Marco Aurelio, Séneca y Epicteto.
    
    Directrices:
    1. Responde con brevedad y contundencia (máximo 3-4 frases).
    2. Usa la dicotomía del control constantemente: distingue entre lo que depende del usuario y lo que no.
    3. Cita frases estoicas famosas (parafraseadas o directas) cuando aplique.
    4. Sé empático pero firme. No eres un bot de autoayuda genérico ("tú puedes", "ánimo"). Eres un mentor que exige virtud y razón.
    5. Usa un tono sereno, atemporal y ligeramente místico.
    
    Si el usuario pregunta algo trivial, llévalo a un plano filosófico profundo.`;

    try {
        // Convert history to Gemini format
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        const chat = client.chats.create({
            model: "gemini-3-flash-preview",
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7, // Balance between creativity and stoic rigidity
            },
            history: formattedHistory
        });

        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "El silencio es a veces la única respuesta.";
    } catch (e) {
        console.error("Oracle Chat Error", e);
        return "El oráculo está meditando. Inténtalo de nuevo.";
    }
};

// --- BASIC GENERATORS (Updated Prompts) ---

export const definePhilosophicalTerm = async (term: string): Promise<GlossaryTerm | null> => {
    const prompt = `Define el concepto: "${term}".
    Si es un término común (ej: Lealtad, Honor), defínelo desde una perspectiva Estoica/Filosófica.
    Responde en JSON estricto con:
    - term: El término (capitalizado).
    - origin: Origen etimológico o Escuela asociada (ej: "Latín", "Estoicismo").
    - definition: Definición profunda y filosófica (máx 2 frases).
    - example: Un ejemplo práctico de aplicación en la vida.`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        term: { type: Type.STRING },
                        origin: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        example: { type: Type.STRING },
                    },
                    required: ["term", "origin", "definition", "example"]
                }
            }
        });
        return safeJSONParse(res.text || "{}");
    } catch (e) { return null; }
};

export const askGemini = async (prompt: string): Promise<string | null> => {
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return res.text || null;
    } catch (e) { console.error(e); return null; }
};

export const generatePremeditatioGuidance = async (context: string, step: 'worst_case' | 'prevention' | 'virtue'): Promise<string> => {
    const prompts = {
        worst_case: `El usuario teme: "${context}". Imagina el PEOR escenario realista posible desde una perspectiva estoica (Premeditatio Malorum). Sé crudo pero breve.`,
        prevention: `Ante el miedo: "${context}". ¿Qué acciones preventivas concretas están BAJO SU CONTROL? Da 3 puntos breves.`,
        virtue: `Si ocurre lo peor en: "${context}". ¿Qué virtud estoica (Coraje, Templanza, Justicia, Sabiduría) le ayudaría a soportarlo y cómo? Breve.`
    };

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompts[step]
        });
        return res.text || "";
    } catch (e) { return ""; }
};

// NEW: Stoic Mantra Generator
export const generateStoicMantra = async (context: string): Promise<string> => {
    const prompt = `Genera un mantra estoico CORTÍSIMO (máx 5-7 palabras) y poderoso para repetir ante esta adversidad: "${context}".
    Debe ser imperativo, fuerte y en español.
    Ejemplos: "El obstáculo es el camino", "Esto también pasará", "Soporta y renuncia", "Soy la roca contra la ola".`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return res.text?.replace(/"/g, '') || "Soporta y Renuncia.";
    } catch (e) { return "Amor Fati."; }
};

export const expandReadingAI = async (title: string, quote: string, author: string) => {
    try {
        const prompt = `Actúa como un erudito en ${author}. Expande esta cita: "${quote}" (${title}). Ofrece una reflexión profunda y aplicable universalmente. 3 párrafos.`;
        const res = await client.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
        return res.text?.trim() || null;
    } catch (e) { return null; }
};

export const generateJournalPrompt = async (mood: number, readingTopic: string) => {
    try {
        const prompt = `Genera una única pregunta de journaling filosófica, breve y muy profunda.
        Contexto: El usuario siente un ánimo de ${mood}/5 y leyó sobre "${readingTopic}".
        Estilo: Estoico, poético, directo y penetrante. Sin introducciones, solo la pregunta.
        Ejemplo: "¿Qué parte de ti se resiste a lo inevitable?"`;
        const res = await client.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
        return res.text?.trim().replace(/"/g, '') || "¿Qué es esencial hoy?";
    } catch (e) { return null; }
};

// NEW: Daily Mentor Feedback
export const generateDailyMentorFeedback = async (
    journalText: string, 
    questionResponse: string, 
    mood: number, 
    challengeStatus: string
): Promise<{ virtue: string, observation: string, advice: string } | null> => {
    
    // Si hay muy poco contexto, devolver null para evitar alucinaciones genéricas
    if ((!journalText || journalText.length < 10) && (!questionResponse || questionResponse.length < 5)) {
        return null;
    }

    const prompt = `Actúa como un mentor estoico sabio y empático (estilo Marco Aurelio o Séneca).
    Analiza el día del estudiante basándote en sus registros:
    
    - Ánimo (1-5): ${mood}
    - Diario: "${journalText.substring(0, 500)}..."
    - Respuesta a Pregunta del Día: "${questionResponse.substring(0, 300)}..."
    - Estado del Reto Diario: ${challengeStatus}

    Genera un feedback breve y estructurado en JSON:
    - virtue: Una única palabra (la virtud principal que demostró o la que necesita, ej: "Templanza", "Coraje").
    - observation: Una frase perspicaz sobre su estado mental actual (máx 15 palabras).
    - advice: Un consejo directo y accionable para mañana (máx 20 palabras).
    
    Tono: Sereno, directo, sin adornos innecesarios.`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        virtue: { type: Type.STRING },
                        observation: { type: Type.STRING },
                        advice: { type: Type.STRING },
                    },
                    required: ["virtue", "observation", "advice"]
                }
            }
        });
        return safeJSONParse(res.text || "{}");
    } catch (e) { return null; }
};

export const generateDeepDive = async (type: string, name: string, context?: string) => {
    const prompt = `Profundiza en: ${type} - ${name}. Contexto: ${context}. Explica sus principios clave y relevancia universal.`;
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        t: { type: Type.STRING },
                        q: { type: Type.STRING },
                        b: { type: Type.STRING },
                        a: { type: Type.STRING },
                        philosophy: { type: Type.STRING },
                        k: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["t", "q", "b", "a", "k", "philosophy"],
                }
            }
        });
        return safeJSONParse(res.text || "{}");
    } catch (e) { return null; }
};

// NEW: School Schematic Generator
export const generateSchoolSchematic = async (schoolName: string, description: string) => {
    const prompt = `Genera un resumen esquemático sobre la escuela filosófica: "${schoolName}" (${description}).
    Devuelve un JSON con:
    - origin: Breve historia del origen y fundación (2 frases).
    - dogmas: Lista de 4 dogmas o principios fundamentales (frases cortas).
    - practices: Lista de 3 prácticas o ejercicios espirituales típicos de esta escuela.
    - legacy: Una frase sobre su impacto hoy.`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        origin: { type: Type.STRING },
                        dogmas: { type: Type.ARRAY, items: { type: Type.STRING } },
                        practices: { type: Type.ARRAY, items: { type: Type.STRING } },
                        legacy: { type: Type.STRING }
                    },
                    required: ["origin", "dogmas", "practices", "legacy"],
                }
            }
        });
        return safeJSONParse(res.text || "{}");
    } catch (e) { return null; }
};

// NEW: Philosopher Bio & Works Generator
export const generatePhilosopherProfile = async (name: string, bioContext: string) => {
    const prompt = `Genera un perfil detallado de: "${name}" (${bioContext}).
    Devuelve un JSON con:
    - bio: Una biografía narrativa extendida (aprox 150 palabras) enfocada en su vida y carácter.
    - works: Lista de sus obras más destacadas (o ideas clave si no escribió libros), cada una con 'title' y 'desc' (breve descripción).`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        bio: { type: Type.STRING },
                        works: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    desc: { type: Type.STRING }
                                },
                                required: ["title", "desc"]
                            } 
                        }
                    },
                    required: ["bio", "works"],
                }
            }
        });
        return safeJSONParse(res.text || "{}");
    } catch (e) { return null; }
};

export const generateWisdom = async (topic: string, author?: string): Promise<Reading | null> => {
    const prompt = `Actúa como un oráculo de sabiduría antigua. El usuario busca consejo sobre: "${topic}".
    ${author ? `Básate en las enseñanzas de: ${author}.` : 'Usa una perspectiva filosófica profunda (Estoicismo, Zen, Taoísmo, etc).'}
    
    Genera una respuesta en formato JSON con la estructura de una "Lectura":
    - t: Título poético.
    - q: Cita clave (puede ser parafraseada o inventada en estilo del autor).
    - b: Explicación profunda y consejo práctico (2-3 párrafos).
    - a: Autor o Tradición.
    - philosophy: Escuela filosófica.
    - k: 3 Palabras clave (tags).`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        t: { type: Type.STRING },
                        q: { type: Type.STRING },
                        b: { type: Type.STRING },
                        a: { type: Type.STRING },
                        philosophy: { type: Type.STRING },
                        k: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["t", "q", "b", "a", "philosophy", "k"],
                }
            }
        });
        return safeJSONParse(res.text || "{}");
    } catch (e) { return null; }
};

export const generateMeditation = async (topic?: string, durationType: 'short' | 'long' = 'short', difficulty: 'beginner' | 'advanced' = 'beginner'): Promise<Meditation | null> => {
    const corePrompt = topic 
        ? `Tema: "${topic}". Usa la tradición filosófica más adecuada.`
        : `TEMA: ELIGE TÚ ALEATORIAMENTE un tema profundo (muerte, gratitud, ansiedad, coraje).`;

    const lengthInstruction = durationType === 'short' 
        ? "Duración: CORTA (aprox 10-15 frases)."
        : "Duración: LARGA (aprox 25-30 frases).";

    const difficultyInstruction = difficulty === 'beginner'
        ? "NIVEL INICIADO: Enfoque somático. Mucha guía de respiración. Lenguaje calmante y sencillo."
        : "NIVEL ADEPTO: Enfoque cognitivo/abstracto. Visualizaciones complejas (vista de pájaro, descomposición). Menos guía física, más silencio mental.";

    const prompt = `Crea un guion de meditación guiada ESTOICA o ZEN.
    ${corePrompt}
    ${lengthInstruction}
    ${difficultyInstruction}
    
    CRUCIAL - FORMATO DE AUDIO RÍTMICO:
    El texto será leído por una IA paso a paso.
    Debes estructurar el campo 'content' NO como párrafos largos, sino como FRASES CORTAS separadas por saltos de línea (\n).
    
    Reglas de Estilo:
    1. Frases breves e impactantes.
    2. Intercala instrucciones de respiración explícitas (ej: "Inhala profundamente...", "Sostén el aire...", "Suelta y relaja...").
    3. Deja espacio para el silencio entre ideas.
    
    Ejemplo de contenido deseado:
    "Cierra los ojos.
    Inhala profundamente por la nariz.
    Siente el aire llenando tus pulmones.
    Exhala lentamente.
    Imagina que estás en una playa desierta.
    Todo es calma.
    Pregúntate: ¿Qué es lo que realmente te preocupa hoy?
    Observa ese problema como si fuera una nube lejana."
    
    Genera JSON con:
    - title: Título poético y breve.
    - description: Sinopsis de 1 frase.
    - category: Tradición (ej: "Estoicismo").
    - difficulty: "${difficulty}".
    - duration_minutes: ${durationType === 'short' ? '5' : '15'}.
    - content: El guion formateado con saltos de línea (\n) como se indicó.`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        duration_minutes: { type: Type.INTEGER },
                        content: { type: Type.STRING },
                    },
                    required: ["title", "description", "category", "difficulty", "duration_minutes", "content"]
                }
            }
        });
        return safeJSONParse(res.text || "{}");
    } catch (e) { return null; }
};

export const generateBulkMeditations = async (count: number): Promise<Meditation[]> => {
    const prompt = `Genera ${count} guiones de meditación guiada VARIADOS (Estoicismo, Mindfulness, Zen).
    
    IMPORTANTE - FORMATO DE TEXTO:
    El campo 'content' debe ser una cadena de texto con FRASES CORTAS separadas por saltos de línea (\n).
    NO uses párrafos de bloque. Diseñado para TTS (Text-to-Speech) con pausas.
    Incluye instrucciones de respiración ("Inhala...", "Exhala...") intercaladas con las reflexiones.
    
    Ejemplo de 'content':
    "Siéntate con la espalda recta.\nInhala hondo.\nPiensa en tu mortalidad.\nExhala el miedo.\nEres eterno en el momento presente."

    JSON Array. Incluye campo 'difficulty' ('beginner' o 'advanced') aleatorio.`;
    
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            category: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                            duration_minutes: { type: Type.INTEGER },
                            content: { type: Type.STRING },
                        },
                        required: ["title", "description", "category", "difficulty", "duration_minutes", "content"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateFullCourseStructure = async (topic: string, level: string = 'Iniciado'): Promise<any | null> => {
    const prompt = `Diseña un curso filosófico sobre: "${topic}". Nivel: ${level}.
    
    Si el nivel es "Iniciado", hazlo accesible, práctico y con lenguaje sencillo.
    Si es "Avanzado", profundiza en metafísica, lógica compleja y textos originales.
    
    Estructura JSON (Course -> Modules -> Lessons):
    Importante: Para las 'lessons', solo genera el 'title' y 'description'. El contenido completo se generará después.
    
    Asegúrate de generar al menos 3 módulos y 3 lecciones por módulo.`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        course: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                level: { type: Type.STRING },
                                icon: { type: Type.STRING }
                            },
                            required: ["title", "description", "level", "icon"]
                        },
                        modules: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    subtitle: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    icon: { type: Type.STRING },
                                    lessons: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                title: { type: Type.STRING },
                                                description: { type: Type.STRING }
                                            },
                                            required: ["title", "description"]
                                        }
                                    }
                                },
                                required: ["title", "subtitle", "description", "icon", "lessons"]
                            }
                        }
                    },
                    required: ["course", "modules"]
                }
            }
        });
        const data = safeJSONParse(res.text || "{}");
        // Ensure the level matches what was requested
        if (data && data.course) {
            data.course.level = level;
        }
        return data;
    } catch (e) { 
        console.error("Course Generation Error", e);
        return null; 
    }
};

export const generateLessonContent = async (lessonTitle: string, courseContext: string, moduleContext: string): Promise<Lesson | null> => {
    const prompt = `Escribe el contenido para la lección: "${lessonTitle}" del curso "${courseContext}" (Módulo: "${moduleContext}").
    Contenido profundo, educativo y práctico. Formato Markdown. Incluye un reto (task).`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING }, 
                        content: { type: Type.STRING },
                        task: { type: Type.STRING },
                        duration: { type: Type.STRING }
                    },
                    required: ["content", "task", "duration"]
                }
            }
        });
        const data = safeJSONParse(res.text || "{}");
        return data ? { ...data, title: lessonTitle, description: "" } : null; 
    } catch (e) { return null; }
};

export const generateCourseLesson = async (moduleTitle: string, moduleContext: string) => {
    const res = await generateLessonContent("Nueva Lección", "Curso General", `${moduleTitle}: ${moduleContext}`);
    return res;
}

export const analyzeBookContent = async (text: string, authorHint: string = "Unknown"): Promise<Reading[]> => {
    try {
        const prompt = `Analiza el siguiente texto de ${authorHint}. Extrae 5 enseñanzas clave o citas poderosas.
        Identifica la filosofía subyacente (Ej: Existencialismo, Budismo, etc).
        
        TEXTO: ${text.substring(0, 30000)}...`;

        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            t: { type: Type.STRING },
                            q: { type: Type.STRING },
                            b: { type: Type.STRING },
                            a: { type: Type.STRING },
                            k: { type: Type.ARRAY, items: { type: Type.STRING } },
                            type: { type: Type.STRING },
                            philosophy: { type: Type.STRING }
                        },
                        required: ["t", "q", "b", "a", "k", "philosophy"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateBulkReadings = async (count: number): Promise<Reading[]> => {
    const prompt = `Genera ${count} lecturas filosóficas variadas de TODAS las tradiciones (Oriente y Occidente). JSON Array.`;
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            t: { type: Type.STRING },
                            q: { type: Type.STRING },
                            b: { type: Type.STRING },
                            a: { type: Type.STRING },
                            k: { type: Type.ARRAY, items: { type: Type.STRING } },
                            type: { type: Type.STRING },
                            philosophy: { type: Type.STRING }
                        },
                        required: ["t", "q", "b", "a", "k", "type", "philosophy"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateBulkDailyQuestions = async (count: number): Promise<{ question: string }[]> => {
    const prompt = `Genera ${count} preguntas profundas de journaling diario basadas en el estoicismo y la filosofía para la auto-reflexión.
    Ejemplos: "¿Qué temes perder hoy?", "¿A quién debes perdonar?", "¿Qué es suficiente?".
    Deben ser cortas, directas y punzantes.`;
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                        },
                        required: ["question"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateBulkGlossary = async (count: number, context?: { school?: string, author?: string }): Promise<GlossaryTerm[]> => {
    let prompt = `Genera ${count} términos filosóficos interesantes.`;
    
    if (context?.school) {
        prompt += ` Enfócate EXCLUSIVAMENTE en términos de la escuela: ${context.school}.`;
    } else if (context?.author) {
        prompt += ` Enfócate EXCLUSIVAMENTE en conceptos clave del autor: ${context.author}.`;
    } else {
        prompt += ` Variados de diversas culturas (Griego, Sánscrito, Chino, Japonés, Latín).`;
    }

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            term: { type: Type.STRING },
                            definition: { type: Type.STRING },
                            origin: { type: Type.STRING },
                            example: { type: Type.STRING },
                        },
                        required: ["term", "definition", "origin", "example"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateBulkTasks = async (count: number): Promise<Task[]> => {
    const prompt = `Genera ${count} micro-retos filosóficos estoicos/zen que se puedan realizar en MENOS DE 5 MINUTOS. 
    Ejemplos: "Bebe un vaso de agua con la mano izquierda", "Escribe una frase de gratitud", "Cierra los ojos 1 minuto".
    Evita retos de día completo.`;
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["title", "description"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateBulkDichotomies = async (count: number): Promise<DichotomyScenario[]> => {
    const prompt = `Genera ${count} pares de dicotomías de control estoicas para entrenamiento mental.
    Deben ser situaciones breves y contrastadas: una "externa" (fuera de control) y su contraparte "interna" (bajo control).
    
    Ejemplo:
    { "text": "El tráfico", "type": "external" }
    { "text": "Tu paciencia", "type": "internal" }
    
    Genera un array mezclado.`;

    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            type: { type: Type.STRING }, 
                        },
                        required: ["text", "type"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateBulkPhilosophers = async (count: number): Promise<PhilosopherBio[]> => {
    const prompt = `Genera ${count} filósofos variados.
    
    CRUCIAL - CLASIFICACIÓN:
    - 'school': Debe ser la CORRIENTE PRINCIPAL genérica (ej: 'Budismo', 'Estoicismo', 'Existencialismo').
    - 'branch': Debe ser la sub-escuela o rama específica (ej: 'Madhyamaka', 'Zen', 'Estoicismo Tardío', 'Absurdismo').
    
    id debe ser un slug. 
    ICON: Debe ser un nombre de clase de Phosphor Icons válido en KEBAB-CASE.
    
    Ejemplo: { name: "Nagarjuna", school: "Budismo", branch: "Madhyamaka" ... }`;
    
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            dates: { type: Type.STRING },
                            role: { type: Type.STRING },
                            school: { type: Type.STRING },
                            branch: { type: Type.STRING },
                            desc: { type: Type.STRING }, 
                            key_ideas: { type: Type.ARRAY, items: { type: Type.STRING } },
                            icon: { type: Type.STRING }
                        },
                        required: ["id", "name", "dates", "role", "school", "branch", "desc", "key_ideas", "icon"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};

export const generateBulkSchools = async (count: number): Promise<PhilosophySchool[]> => {
    const prompt = `Genera ${count} escuelas filosóficas o espirituales distintas (ej: Sufismo, Transcendentalismo, Yoga, Cinismo).
    ICON: Debe ser un nombre de clase de Phosphor Icons válido en KEBAB-CASE (ej: 'ph-scroll', 'ph-star', 'ph-brain', 'ph-fire').
    NO uses PascalCase.`;
    
    try {
        const res = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            core_principle: { type: Type.STRING },
                            origin: { type: Type.STRING },
                            icon: { type: Type.STRING },
                            color: { type: Type.STRING }
                        },
                        required: ["name", "description", "core_principle", "origin", "icon", "color"]
                    }
                }
            }
        });
        return safeJSONParse(res.text || "[]") || [];
    } catch (e) { return []; }
};
