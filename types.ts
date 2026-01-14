
export type ReactionType = 'heart' | 'fire' | 'bulb' | 'leaf';
export type CanvasStyle = 'classic' | 'nebula' | 'dawn' | 'midnight' | 'paper';

export interface UserProfile {
    username: string;
    name?: string;
    bio: string;
    avatar: string;
    banner: string;
    website?: string;
    birth_date?: string; // NEW: Memento Mori
    joinedAt?: string;
}

export interface JournalEntry {
    text: string;
    question_response?: string;
    challenge_response?: string;
    challenge_title?: string; // NEW: Persist title
    challenge_completed?: boolean;
    challenge_status?: 'success' | 'failed'; // NEW: Persist explicit status
    mood: number;
    read?: boolean;
    updated_at?: string;
}

export interface Reading {
    id?: string;
    t: string; // Título
    q: string; // Cita
    b: string; // Cuerpo/Explicación
    a?: string; // Autor
    k?: string[]; // Keywords
    type?: 'cita' | 'ejercicio' | 'parabola' | 'reflexion' | 'concepto' | 'koan';
    philosophy?: string;
    saved?: boolean;
    source_work_id?: number; 
}

export type WorkStatus = 'to_read' | 'reading' | 'completed' | null;

export interface WorkInteraction {
    work_id: number;
    rating: number | null;
    status: WorkStatus;
}

export interface Work {
    id?: number; 
    title: string;
    author: string;
    philosopher_id?: string; 
    description?: string;
    link_url: string; 
    cover_url?: string;
    type: 'epub' | 'pdf' | 'text' | 'audio' | 'video';
    created_at?: string;
    // UI Helpers added dynamically
    avg_rating?: number;
    user_interaction?: WorkInteraction;
}

export interface PhilosophySchool {
    id?: string;
    name: string;
    description: string;
    core_principle: string;
    icon: string;
    color: string;
    origin?: string;
}

export interface PhilosopherBio {
    id: string;
    name: string;
    dates: string;
    role: string;
    school: string;
    branch?: string; // NEW: Subcategory (e.g. Madhyamaka, Late Stoa)
    desc: string;
    key_ideas: string[];
    icon: string;
}

export interface GlossaryTerm {
    id?: string;
    term: string;
    origin: string;
    definition: string;
    example: string;
    related_school?: string;
    related_author?: string;
}

// --- MEDITATION & COURSES ---

export interface Meditation {
    id?: number;
    title: string;
    description: string;
    category: string; // Ej: "Zen", "Estoicismo"
    difficulty?: 'beginner' | 'advanced'; // NEW field for DB persistence
    duration_minutes: number;
    content: string; // Guion paso a paso separado por saltos de línea
    created_at?: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    icon: string;
    level: string;
    tags?: string[];
}

export interface Module {
    id: string;
    course_id: string;
    title: string;
    subtitle?: string;
    description: string;
    icon: string;
    sort_order: number;
    lessons?: Lesson[];
}

export interface Lesson {
    id: string;
    module_id: string;
    title: string;
    duration: string;
    description: string;
    content: string;
    task: string;
    sort_order: number;
    is_generated?: boolean;
}

export interface UserProgress {
    lesson_id: string;
    completed_at: string;
    user_id?: string;
}

// Legacy / Helper Interfaces
export interface CourseModule {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    lessons: Lesson[];
}

export interface GuidedQuestion {
    id: string;
    category: string;
    question: string;
    context: string;
    aiPrompt: string;
}

export interface LearningReflection {
    questionId: string;
    answer: string;
    date: string;
    question?: string; // Helper for display
}

export interface LessonProgress {
    lessonId: string;
    completed: boolean;
    completedAt: string;
}

export interface DichotomyScenario {
    id?: string;
    text: string;
    type: 'internal' | 'external';
}

export interface Task {
    id?: string;
    title: string;
    description: string;
}

export interface SharedItem {
    type: 'reading' | 'challenge' | 'lesson';
    title: string;
    subtitle?: string;
    content: string; 
    extra?: string; 
    data?: any; 
}

export interface ParsedContent {
    type: 'log' | 'debate' | 'article' | 'daily' | 'reply' | 'task' | 'deleted'; 
    tag?: string; 
    title?: string;
    body?: string; 
    dailyDate?: string; 
    data?: Reading; 
    replyToId?: number; 
    taskTitle?: string; 
    likes?: string[]; 
    reactions?: Record<string, ReactionType>;
    quoteOf?: Post; 
    canvasStyle?: CanvasStyle;
    authorProfile?: {
        avatar?: string;
        bio?: string;
    };
    sharedItem?: SharedItem;
    deleted?: boolean; 
}

export interface Post {
    id?: number;
    user_id?: string; 
    user_name: string;
    content: string | ParsedContent; 
    created_at?: string;
    date?: string;
}