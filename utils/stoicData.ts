
import { ParsedContent, Reading, PhilosopherBio, Meditation, Task, Work } from '../types';
import { getISO } from '../services/supabase';

// NEW: User Level Logic
export const getUserLevel = (xp: number) => {
    if (xp < 5) return { title: "Neófito", icon: "ph-seed", next: 5, color: "text-stone-500" };
    if (xp < 15) return { title: "Caminante", icon: "ph-footprints", next: 15, color: "text-sky-500" };
    if (xp < 30) return { title: "Estudiante", icon: "ph-book-open", next: 30, color: "text-emerald-500" };
    if (xp < 60) return { title: "Prokopton", icon: "ph-mountain", next: 60, color: "text-amber-500" }; // El que progresa
    if (xp < 100) return { title: "Filósofo", icon: "ph-columns", next: 100, color: "text-purple-500" };
    return { title: "Sabio", icon: "ph-crown", next: 1000, color: "text-[var(--gold)]" };
};

// --- ALGORITMO PSEUDO-ALEATORIO (SEEDED) ---

/**
 * Genera un índice pseudo-aleatorio basado en una semilla (string fecha)
 * garantizando que el mismo día SIEMPRE devuelve el mismo índice para la misma colección.
 */
const getSeededIndex = (seed: string, length: number): number => {
    if (length === 0) return 0;
    
    // Hash simple de la cadena de fecha (DJB2 modificado)
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    }
    
    // Asegurar positivo y aplicar módulo
    return Math.abs(hash) % length;
};

// Fix for JSX parser: <T,> instead of <T>
export const getSeededRandomItem = <T,>(dateStr: string, collection: T[], salt: string = ""): T | null => {
    if (!collection || collection.length === 0) return null;
    
    // Check for a user reset salt in local storage
    const userSalt = localStorage.getItem('stoic_salt') || "";
    
    // Añadimos "salt" para que la meditación del día no sea el mismo índice que la lectura del día
    // Plus userSalt for manual resets
    const index = getSeededIndex(dateStr + salt + userSalt, collection.length);
    return collection[index];
};

// --- HELPERS ---

export const parsePost = (content: string | ParsedContent | any): ParsedContent => {
    if (typeof content === 'object' && content !== null) { return content as ParsedContent; }
    try {
        if (typeof content === 'string' && content.trim().startsWith('{')) { return JSON.parse(content); }
        return { type: 'log', body: String(content) };
    } catch (e) { return { type: 'log', body: String(content) }; }
};

export const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Updated to accept list dependency, defaults to generic if empty
export const getDailyQuestion = (questionsList: string[] = [], dateOffset = 0) => {
    const d = new Date(); d.setDate(d.getDate() + dateOffset);
    return getSeededRandomItem(getISO(d), questionsList, "question") || "¿En qué has puesto tu atención hoy?";
};

export const getDailyQuestionByDate = (dateStr: string, questionsList: string[] = []) => {
    if (!dateStr) return "Pregunta olvidada...";
    return getSeededRandomItem(dateStr, questionsList, "question") || "¿Qué es esencial?";
};

export const getDailyTask = (tasksList: Task[] = [], dateOffset = 0) => {
    const d = new Date(); d.setDate(d.getDate() + dateOffset);
    return getSeededRandomItem(getISO(d), tasksList, "task") || { title: "Sin Reto", description: "El sistema está cargando..." };
};

// --- CORE DATA SYNC ---

export const getSyncedDailyData = (
    date: Date = new Date(), 
    readingsList: Reading[] = [], 
    biosList: PhilosopherBio[] = [],
    meditationsList: Meditation[] = [],
    tasksList: Task[] = [],
    questionsList: string[] = []
) => {
    const dateStr = getISO(date);
    
    // 1. Get Daily Reading (Seeded)
    const dailyReading = getSeededRandomItem(dateStr, readingsList, "reading");
    
    // 2. Try to match Philosopher to Reading, otherwise random (Seeded)
    let dailyPhilosopher = null;
    if (dailyReading) {
        dailyPhilosopher = biosList.find(b => 
            (dailyReading.a && b.name.toLowerCase().includes(dailyReading.a.toLowerCase())) || 
            (dailyReading.a && dailyReading.a.toLowerCase().includes(b.name.toLowerCase()))
        );
    }

    const isMatch = !!dailyPhilosopher;
    
    if (!dailyPhilosopher) {
        dailyPhilosopher = getSeededRandomItem(dateStr, biosList, "bio");
    }

    // 3. Get Daily Meditation (Seeded)
    const dailyMeditation = meditationsList.length > 0 
        ? getSeededRandomItem(dateStr, meditationsList, "meditation") 
        : null;

    // 4. Get Daily Task (Seeded)
    const dailyTask = getSeededRandomItem(dateStr, tasksList, "task");

    // 5. Get Daily Question (Seeded)
    const dailyQuestion = getSeededRandomItem(dateStr, questionsList, "question") || "¿Qué depende de ti?";

    return { dailyReading, dailyPhilosopher, isMatch, dailyMeditation, dailyTask, dailyQuestion };
};
