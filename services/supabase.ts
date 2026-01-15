
import { createClient } from '@supabase/supabase-js';
import { GlossaryTerm, WorkInteraction, WorkStatus, Work, Meditation, Post, Course, Module, Lesson, PhilosopherBio, Reading, PhilosophySchool, Task, PremeditatioLog } from '../types';
import { parsePost } from '../utils/stoicData';
import { calculateLevel } from '../utils/gamification';

const SB_URL = "https://yxyukavdvtyyytwvdlha.supabase.co";
const SB_KEY = "sb_publishable_LHy6ZCd3zJCHaO8uQKbBYw_usAbY0Aw"; 

export const supabase = createClient(SB_URL, SB_KEY);

export const getISO = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Auth Helpers
export const signIn = async (email: string) => {
    return await supabase.auth.signInWithOtp({ email });
};

export const signOut = async () => {
    return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error;
};

export const updateUserBirthDate = async (date: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "No user";
    const { error } = await supabase.from('profiles').update({ birth_date: date }).eq('id', user.id);
    return error;
}

// --- GAMIFICATION ---

export const addXP = async (userId: string, amount: number) => {
    console.log(`[XP] Iniciando transacción: Usuario ${userId} +${amount} XP`);
    try {
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error("[XP] Error recuperando perfil:", fetchError);
            return { success: false, leveledUp: false };
        }

        const currentXP = profile?.xp || 0;
        const newXP = currentXP + amount;
        const levelData = calculateLevel(newXP);
        const oldLevelData = calculateLevel(currentXP);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                xp: newXP, 
                current_level: levelData.level 
            })
            .eq('id', userId);

        if (updateError) {
            console.error("[XP] Error crítico al actualizar BBDD:", updateError);
            throw updateError;
        }

        return {
            success: true,
            leveledUp: levelData.level > oldLevelData.level,
            newLevel: levelData.level,
            newTitle: levelData.title,
            currentXp: newXP
        };

    } catch (e) {
        console.error("[XP] Excepción no controlada:", e);
        return { success: false, leveledUp: false };
    }
};

// --- PREMEDITATIO MALORUM ---

export const savePremeditatio = async (entry: Omit<PremeditatioLog, 'id' | 'created_at' | 'user_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Error("Usuario no autenticado");

    const { error } = await supabase
        .from('premeditatio_logs')
        .insert({
            user_id: user.id,
            event_context: entry.event_context,
            worst_case: entry.worst_case,
            prevention: entry.prevention,
            virtue_response: entry.virtue_response,
            confidence_score: entry.confidence_score, 
            mantra: entry.mantra,
            created_at: new Date().toISOString()
        });
    
    return error;
};

export const fetchPremeditatioLogs = async (): Promise<PremeditatioLog[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('premeditatio_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as PremeditatioLog[];
};

export const deletePremeditatioLog = async (id: string) => {
    try {
        const { error } = await supabase
            .from('premeditatio_logs')
            .delete()
            .eq('id', id);
        return error;
    } catch (e) {
        return e;
    }
};

// --- CHAT HISTORY (ORACLE) ---

export const fetchChatHistory = async (userId: string) => {
    const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);
    
    if (error || !data) return [];
    return data;
};

export const saveChatMessage = async (userId: string, role: 'user' | 'model', content: string) => {
    const { error } = await supabase
        .from('ai_chat_history')
        .insert({
            user_id: userId,
            role: role,
            content: content,
            created_at: new Date().toISOString()
        });
    return error;
};

// Glossary Helper
export const fetchGlossaryTerm = async (term: string): Promise<GlossaryTerm | null> => {
    try {
        const { data, error } = await supabase
            .from('content_glossary')
            .select('*')
            .ilike('term', term)
            .maybeSingle(); 
        
        if (error) throw error;
        return data;
    } catch (e) {
        console.error("Error fetching glossary term:", e);
        return null;
    }
};

export const fetchGlossary = async (): Promise<GlossaryTerm[]> => {
    const { data, error } = await supabase
        .from('content_glossary')
        .select('*')
        .order('term', { ascending: true });
    
    if (error || !data) return [];
    return data as GlossaryTerm[];
}

// --- NEW: CONTENT FETCHERS ---

export const fetchPhilosophers = async (): Promise<PhilosopherBio[]> => {
    const { data, error } = await supabase
        .from('content_philosophers')
        .select('*');
    
    if (error || !data) return [];
    
    return data.map((p: any) => ({
        ...p,
        desc: p.description || p.desc || "Sin descripción disponible.",
        key_ideas: typeof p.key_ideas === 'string' ? JSON.parse(p.key_ideas) : p.key_ideas
    })) as PhilosopherBio[];
}

export const fetchSchools = async (): Promise<PhilosophySchool[]> => {
    const { data, error } = await supabase
        .from('content_schools')
        .select('*');
    
    if (error || !data) return [];
    return data as PhilosophySchool[];
}

export const fetchReadings = async (): Promise<Reading[]> => {
    try {
        const { data, error } = await supabase
            .from('content_readings')
            .select('*')
            .order('id', { ascending: true });
            
        if (error) {
            console.error("Error fetching readings from Supabase:", error);
            return [];
        }
        
        if (!data || data.length === 0) return [];
        
        return data.map((r: any) => ({
            t: r.title,
            q: r.quote,
            b: r.body || '',
            a: r.author || 'Anónimo',
            k: r.tags || [],
            type: r.type,
            philosophy: r.philosophy,
            id: r.id,
            source_work_id: r.source_work_id
        })) as Reading[];
    } catch (e) {
        console.error("Unexpected error in fetchReadings:", e);
        return [];
    }
}

// --- LIBRARY WORKS ---

export const fetchWorks = async (): Promise<Work[]> => {
    const { data, error } = await supabase
        .from('content_works')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as Work[];
}

// --- TASKS & QUESTIONS ---

export const fetchTasks = async (): Promise<Task[]> => {
    const { data, error } = await supabase
        .from('content_tasks')
        .select('*');
    if (error || !data) return [];
    return data as Task[];
};

export const fetchDailyQuestions = async (): Promise<string[]> => {
    const { data, error } = await supabase
        .from('content_daily_questions')
        .select('question');
    if (error || !data) return [];
    return data.map((d: any) => d.question);
};

// --- COURSES ---

export const fetchFullCourses = async (): Promise<{ courses: Course[], modules: Module[] }> => {
    try {
        const { data, error } = await supabase
            .from('content_courses')
            .select(`
                *,
                modules:content_modules(
                    *,
                    lessons:content_lessons(*)
                )
            `)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching courses:", error);
            return { courses: [], modules: [] };
        }

        if (!data) return { courses: [], modules: [] };

        const flatCourses: Course[] = [];
        const flatModules: Module[] = [];

        data.forEach((c: any) => {
            flatCourses.push({
                id: String(c.id), 
                title: c.title,
                description: c.description,
                icon: c.icon,
                level: c.level,
                tags: c.tags
            });

            if (c.modules && Array.isArray(c.modules)) {
                const sortedModules = c.modules.sort((a:any, b:any) => (a.sort_order || 0) - (b.sort_order || 0));
                
                sortedModules.forEach((m: any) => {
                    const sortedLessons = m.lessons ? m.lessons.sort((a:any, b:any) => (a.sort_order || 0) - (b.sort_order || 0)) : [];
                    
                    flatModules.push({
                        id: String(m.id),
                        course_id: String(c.id),
                        title: m.title,
                        subtitle: m.subtitle,
                        description: m.description,
                        icon: m.icon,
                        sort_order: m.sort_order,
                        lessons: sortedLessons.map((l: any) => ({
                            ...l,
                            id: String(l.id),
                            module_id: String(m.id)
                        }))
                    });
                });
            }
        });

        return { courses: flatCourses, modules: flatModules };

    } catch (e) {
        console.error("Fetch full courses exception:", e);
        return { courses: [], modules: [] };
    }
};

// --- MEDITATIONS ---

export const fetchMeditations = async (): Promise<Meditation[]> => {
    const { data, error } = await supabase
        .from('content_meditations')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error || !data) return [];
    return data as Meditation[];
}

export const fetchUserMeditationProgress = async (userId: string): Promise<number[]> => {
    const { data, error } = await supabase
        .from('user_meditation_progress')
        .select('meditation_id')
        .eq('user_id', userId);
        
    if (error || !data) return [];
    return data.map((d: any) => d.meditation_id);
}

export const markMeditationCompleteDB = async (userId: string, meditationId: number) => {
    const { error } = await supabase
        .from('user_meditation_progress')
        .insert({ user_id: userId, meditation_id: meditationId })
        .select(); 
        
    if (error && error.code !== '23505') { 
        console.error("Error saving meditation progress:", error);
    }
}

export const fetchUserMeditationFavorites = async (userId: string): Promise<number[]> => {
    const { data, error } = await supabase
        .from('user_meditation_favorites')
        .select('meditation_id')
        .eq('user_id', userId);
        
    if (error || !data) return [];
    return data.map((d: any) => d.meditation_id);
}

export const toggleMeditationFavoriteDB = async (userId: string, meditationId: number): Promise<boolean> => {
    const { data } = await supabase
        .from('user_meditation_favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('meditation_id', meditationId)
        .maybeSingle();

    if (data) {
        await supabase.from('user_meditation_favorites').delete().eq('user_id', userId).eq('meditation_id', meditationId);
        return false;
    } else {
        await supabase.from('user_meditation_favorites').insert({ user_id: userId, meditation_id: meditationId });
        return true;
    }
}

// --- POST BOOKMARKS ---

export const fetchUserBookmarks = async (userId: string): Promise<Post[]> => {
    const { data, error } = await supabase
        .from('user_bookmarks')
        .select('post_id, forum_posts(*)')
        .eq('user_id', userId);

    if (error || !data) return [];
    
    return data
        .filter((item: any) => item.forum_posts) 
        .map((item: any) => ({
            ...item.forum_posts,
            content: parsePost(item.forum_posts.content)
        }));
};

export const togglePostBookmarkDB = async (userId: string, postId: number): Promise<boolean> => {
    const { data } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

    if (data) {
        await supabase.from('user_bookmarks').delete().eq('id', data.id);
        return false; 
    } else {
        await supabase.from('user_bookmarks').insert({ user_id: userId, post_id: postId });
        return true; 
    }
};

// --- LIBRARY INTERACTIONS ---

export const fetchUserLibraryInteractions = async (userId: string): Promise<WorkInteraction[]> => {
    const { data, error } = await supabase
        .from('library_user_interactions')
        .select('work_id, rating, status')
        .eq('user_id', userId);
    
    if (error || !data) return [];
    return data as WorkInteraction[];
};

export const updateWorkStatus = async (userId: string, workId: number, status: WorkStatus) => {
    const { error } = await supabase
        .from('library_user_interactions')
        .upsert({ 
            user_id: userId, 
            work_id: workId, 
            status: status 
        }, { onConflict: 'user_id, work_id' });
        
    return error;
};

export const updateWorkRating = async (userId: string, workId: number, rating: number) => {
    const { error } = await supabase
        .from('library_user_interactions')
        .upsert({ 
            user_id: userId, 
            work_id: workId, 
            rating: rating 
        }, { onConflict: 'user_id, work_id' });
        
    return error;
};
