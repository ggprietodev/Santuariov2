
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, getISO, signOut, fetchUserLibraryInteractions, fetchUserBookmarks, togglePostBookmarkDB, fetchWorks, fetchMeditations, fetchGlossary, fetchFullCourses, fetchPhilosophers, fetchReadings, fetchSchools, fetchTasks, fetchDailyQuestions } from './services/supabase';
import type { JournalEntry, Reading, Post, ParsedContent, LearningReflection, PhilosopherBio, SharedItem, PhilosophySchool, GlossaryTerm, Module, Task, DichotomyScenario, Work, Meditation, Course, WorkInteraction } from './types';
import { getSyncedDailyData, parsePost } from './utils/stoicData';
import { NavBtn } from './components/Shared';

// Views & Modules
import { TodayView } from './views/Today';
import { CalendarView } from './views/Calendar';
import { SettingsModule } from './modules/Settings';
import { CitadelModule } from './modules/Citadel';
import { LibraryModule } from './modules/Library';
import { StatsModule } from './modules/Stats';
import { ArenaModule } from './modules/Arena';
import { CommunityHub } from './modules/Community';
import { LearningModule } from './modules/Learning';
import { OracleModule } from './modules/Oracle';
import { PhilosophersModule } from './modules/Philosophers';
import { GlossaryModule } from './modules/Glossary';
import { SchoolsModule } from './modules/Schools';
import { WorksManager } from './modules/WorksManager';
import { AuthView } from './views/AuthView'; 
import { DayModal } from './components/DayModal';

function SanctuaryView({ 
    user, userId, savedReadings, toggleSave, journal, sanctuaryMode, setSanctuaryMode, onBack, onUpdateEntry, 
    learningReflections, saveLearningReflection, activeChallenge, setActiveChallenge, followedPhilosophers, 
    toggleFollowPhilosopher, dailyPhilosopher, onShare, onNavigateToProfile, onOpenSettings,
    masterReadings, masterPhilosophers, masterSchools, masterGlossary, masterModules, masterCourses, masterTasks, masterDichotomies, masterWorks, masterMeditations,
    onWorkAdded, onWorkDeleted, initialActiveMeditation, initialSelectedPhilosopherId,
    clearDeepLink, returnToToday, setReturnToToday, 
    handleNavigateToPhilosopher, 
    handleNavigateToSchool,
    handleNavigateToChallenge,
    handleNavigateToPath,
    handleNavigateToMeditation,
    dailyTask,
    userInteractions,
    onWorkInteractionUpdate,
    onPlayerToggle 
}: any) {
    
    const handleModuleBack = () => {
        if (returnToToday) {
            setReturnToToday(false);
            if (clearDeepLink) clearDeepLink(); 
        } else {
            setSanctuaryMode('menu');
        }
    };

    return (
        <div className="h-full w-full relative">
            <div className={`flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center overflow-y-auto no-scrollbar ${sanctuaryMode !== 'menu' ? 'hidden' : 'flex'}`}>
                 <div className="w-full max-w-2xl px-6 py-4 sticky top-0 z-40 bg-[var(--bg)]/70 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-between mb-4 transition-all">
                    <div>
                        <h1 className="serif text-2xl font-bold">Santuario</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sabiduría Universal</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <button onClick={() => onNavigateToProfile(user)} className="w-10 h-10 rounded-full bg-[var(--highlight)] flex items-center justify-center border border-[var(--border)] shadow-sm hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-colors overflow-hidden">
                            <div className="text-sm font-bold">{user && user[0] ? user[0].toUpperCase() : 'E'}</div>
                         </button>
                         <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center border border-[var(--border)] shadow-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"><i className="ph-bold ph-gear"></i></button>
                     </div>
                </div>

                <div className="w-full max-w-2xl px-6 pb-32">
                    <div className="grid grid-cols-2 gap-4 auto-rows-[160px]">
                        <div onClick={() => setSanctuaryMode('path')} className="bg-[#FAF5FF] dark:bg-[#1E1024] p-6 rounded-[32px] border border-fuchsia-100 dark:border-fuchsia-900/20 cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between hover:shadow-md">
                            <i className="ph-duotone ph-path text-4xl text-fuchsia-500"></i>
                            <div><h3 className="serif text-lg font-bold text-fuchsia-900 dark:text-fuchsia-50">Camino</h3><p className="text-[9px] uppercase font-bold opacity-60 text-fuchsia-800 dark:text-fuchsia-200">Cursos</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('masters')} className="bg-[var(--card)] p-6 rounded-[32px] border border-[var(--border)] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between hover:shadow-md relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-10"><i className={`ph-duotone ${dailyPhilosopher?.icon || 'ph-student'} text-6xl`}></i></div>
                            <i className="ph-duotone ph-student text-4xl text-[var(--text-main)] relative z-10"></i>
                            <div className="relative z-10"><h3 className="serif text-lg font-bold">Maestros</h3><p className="text-[9px] uppercase font-bold opacity-60">Biografías</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('schools')} className="bg-[var(--card)] p-6 rounded-[32px] border border-[var(--border)] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between hover:shadow-md">
                            <i className="ph-duotone ph-columns text-4xl text-[var(--text-main)]"></i>
                            <div><h3 className="serif text-lg font-bold">Escuelas</h3><p className="text-[9px] uppercase font-bold opacity-60">Tradiciones</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('oracle')} className="col-span-1 bg-purple-50 dark:bg-purple-900/10 p-6 rounded-[32px] border border-purple-100 dark:border-purple-900/20 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group hover:shadow-md flex flex-col justify-between">
                             <i className="ph-duotone ph-magic-wand absolute -right-4 -bottom-4 text-8xl text-purple-500/10 group-hover:scale-110 transition-transform"></i>
                             <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 flex items-center justify-center z-10"><i className="ph-bold ph-sparkle text-lg"></i></div>
                             <div className="relative z-10"><h3 className="serif text-lg font-bold text-purple-900 dark:text-purple-50">Oráculo</h3><p className="text-[9px] uppercase font-bold opacity-60 text-purple-800 dark:text-purple-200">Consultas</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('library')} className="col-span-1 bg-[#FFF7ED] dark:bg-[#2C1810] p-6 rounded-[32px] border border-orange-100 dark:border-orange-900/20 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group hover:shadow-md flex flex-col justify-between">
                             <i className="ph-duotone ph-books absolute -right-4 -bottom-4 text-8xl text-orange-500/10 group-hover:scale-110 transition-transform"></i>
                             <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 flex items-center justify-center z-10"><i className="ph-bold ph-book-open text-lg"></i></div>
                             <div className="relative z-10"><h3 className="serif text-lg font-bold text-orange-900 dark:text-orange-50">Biblioteca</h3><p className="text-[9px] uppercase font-bold opacity-60 text-orange-800 dark:text-orange-200">Citas</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('works')} className="col-span-1 bg-[#F0FDF4] dark:bg-[#052E16] p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-900/20 cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between hover:shadow-md group relative overflow-hidden">
                            <i className="ph-duotone ph-book-bookmark absolute -right-4 -bottom-4 text-8xl text-emerald-500/10 group-hover:scale-110 transition-transform"></i>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center z-10"><i className="ph-bold ph-read-cv-logo text-lg"></i></div>
                            <div className="relative z-10"><h3 className="serif text-lg font-bold text-emerald-900 dark:text-emerald-50">Obras</h3><p className="text-[9px] uppercase font-bold opacity-60 text-emerald-800 dark:text-emerald-200">Libros</p></div>
                        </div>
                         <div onClick={() => setSanctuaryMode('arena')} className="col-span-1 bg-[#FFFBEB] dark:bg-[#2C2410] p-6 rounded-[32px] border border-amber-100 dark:border-amber-900/20 cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between relative overflow-hidden group hover:shadow-md">
                            <i className="ph-fill ph-sword text-4xl text-amber-500"></i>
                            <div><h3 className="serif text-lg font-bold text-amber-900 dark:text-amber-50">Arena</h3><p className="text-[9px] uppercase font-bold opacity-60 text-amber-800 dark:text-amber-200">Reto</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('citadel')} className="col-span-1 bg-stone-100 dark:bg-stone-900 p-6 rounded-[32px] border border-[var(--border)] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between hover:shadow-md relative overflow-hidden group">
                            <i className="ph-duotone ph-castle-turret absolute -right-6 -bottom-4 text-8xl text-[var(--text-sub)] opacity-10 group-hover:scale-110 transition-transform"></i>
                            <div className="w-10 h-10 rounded-full bg-[var(--text-main)] text-[var(--bg)] flex items-center justify-center z-10"><i className="ph-bold ph-castle-turret text-lg"></i></div>
                            <div className="relative z-10"><h3 className="serif text-lg font-bold">Ciudadela</h3><p className="text-[9px] uppercase font-bold opacity-60">Meditación</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('glossary')} className="bg-[var(--card)] p-6 rounded-[32px] border border-[var(--border)] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between hover:shadow-md">
                            <i className="ph-duotone ph-book-bookmark text-4xl text-[var(--text-sub)]"></i>
                            <div><h3 className="serif text-lg font-bold">Léxico</h3><p className="text-[9px] uppercase font-bold opacity-60">Glosario</p></div>
                        </div>
                        <div onClick={() => setSanctuaryMode('stats')} className="bg-[#Fdf4f0] dark:bg-[#2e1a16] p-6 rounded-[32px] border border-rose-100 dark:border-rose-900/20 cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between hover:shadow-md">
                            <i className="ph-fill ph-chart-bar text-3xl text-rose-500"></i>
                            <div><h3 className="serif text-lg font-bold text-rose-900 dark:text-rose-50">Legado</h3><p className="text-[9px] uppercase font-bold opacity-60 text-rose-800 dark:text-rose-200">Stats</p></div>
                        </div>
                    </div>
                 </div>
            </div>

            {sanctuaryMode === 'library' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><LibraryModule user={user} readings={masterReadings} savedReadings={savedReadings} toggleSave={toggleSave} onBack={handleModuleBack} onShare={onShare} schools={masterSchools} philosophers={masterPhilosophers} /></div>}
            {sanctuaryMode === 'works' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><WorksManager works={masterWorks} philosophers={masterPhilosophers} onBack={handleModuleBack} onWorkAdded={onWorkAdded} onWorkDeleted={onWorkDeleted} userInteractions={userInteractions} onInteractionUpdate={onWorkInteractionUpdate} /></div>}
            {sanctuaryMode === 'oracle' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><OracleModule savedReadings={savedReadings} toggleSave={toggleSave} onBack={handleModuleBack} philosophers={masterPhilosophers} /></div>}
            {sanctuaryMode === 'citadel' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><CitadelModule onBack={handleModuleBack} meditations={masterMeditations} initialActiveMeditation={initialActiveMeditation} onPlayerToggle={onPlayerToggle} /></div>}
            {sanctuaryMode === 'stats' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><StatsModule journal={journal} user={user} savedReadings={savedReadings} onBack={handleModuleBack} /></div>}
            {sanctuaryMode === 'arena' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><ArenaModule journal={journal} onUpdateEntry={onUpdateEntry} onBack={handleModuleBack} activeChallenge={activeChallenge} onShare={onShare} tasks={masterTasks} dichotomies={masterDichotomies} dailyTask={dailyTask} /></div>}
            {sanctuaryMode === 'path' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><LearningModule userId={userId} onBack={handleModuleBack} setActiveChallenge={setActiveChallenge} onNavigateToArena={() => setSanctuaryMode('arena')} modules={masterModules} courses={masterCourses} /></div>}
            {sanctuaryMode === 'masters' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><PhilosophersModule readings={masterReadings} philosophers={masterPhilosophers} works={masterWorks} savedReadings={savedReadings} toggleSave={toggleSave} onBack={handleModuleBack} followedPhilosophers={followedPhilosophers} toggleFollowPhilosopher={toggleFollowPhilosopher} dailyPhilosopher={dailyPhilosopher} initialSelectedPhilosopherId={initialSelectedPhilosopherId} onNavigateToSchool={handleNavigateToSchool} /></div>}
            {sanctuaryMode === 'glossary' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><GlossaryModule onBack={handleModuleBack} terms={masterGlossary} onNavigateToSchool={handleNavigateToSchool} onNavigateToPhilosopher={handleNavigateToPhilosopher} /></div>}
            {sanctuaryMode === 'schools' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><SchoolsModule readings={masterReadings} schools={masterSchools} philosophers={masterPhilosophers} works={masterWorks} onBack={handleModuleBack} toggleSave={toggleSave} savedReadings={savedReadings} onNavigateToPhilosopher={handleNavigateToPhilosopher} /></div>}
        </div>
    )
}

export default function App() {
    const [session, setSession] = useState<any>(null);
    const [username, setUsername] = useState<string>('');
    const [loadingAuth, setLoadingAuth] = useState(true);

    // THEME & APPEARANCE STATE
    const [theme, setTheme] = useState<string>(() => localStorage.getItem('stoic_theme') || 'light');
    const [fontTheme, setFontTheme] = useState<'classic' | 'modern' | 'humanist' | 'elegant'>(() => (localStorage.getItem('stoic_font') as any) || 'classic');
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => (localStorage.getItem('stoic_size') as any) || 'medium');

    const [view, setView] = useState<'today' | 'calendar' | 'community' | 'sanctuary'>('today');
    const [sanctuaryMode, setSanctuaryMode] = useState<'menu' | 'library' | 'oracle' | 'citadel' | 'stats' | 'arena' | 'path' | 'masters' | 'glossary' | 'schools' | 'works'>('menu');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPlayerActive, setIsPlayerActive] = useState(false);

    const [targetMeditation, setTargetMeditation] = useState<Meditation | null>(null);
    const [targetPhilosopherId, setTargetPhilosopherId] = useState<string | null>(null);
    const [profileTargetUser, setProfileTargetUser] = useState<string | null>(null); 
    const [returnToToday, setReturnToToday] = useState(false); 

    const [activeChallenge, setActiveChallenge] = useState<any>(null);
    const [sharedItem, setSharedItem] = useState<SharedItem | null>(null);
    const [communityViewMode, setCommunityViewMode] = useState<'feed' | 'profile'>('feed');

    // Initialize with EMPTY arrays - NO STATIC DATA
    const [masterReadings, setMasterReadings] = useState<Reading[]>([]);
    const [masterPhilosophers, setMasterPhilosophers] = useState<PhilosopherBio[]>([]);
    const [masterSchools, setMasterSchools] = useState<PhilosophySchool[]>([]);
    const [masterGlossary, setMasterGlossary] = useState<GlossaryTerm[]>([]);
    const [masterTasks, setMasterTasks] = useState<Task[]>([]); 
    
    const [masterModules, setMasterModules] = useState<Module[]>([]); 
    const [masterCourses, setMasterCourses] = useState<Course[]>([]); 
    const [masterDichotomies, setMasterDichotomies] = useState<DichotomyScenario[]>([]);
    const [masterWorks, setMasterWorks] = useState<Work[]>([]);
    const [masterMeditations, setMasterMeditations] = useState<Meditation[]>([]);
    const [masterQuestions, setMasterQuestions] = useState<string[]>([]);

    const [journal, setJournal] = useState<Record<string, JournalEntry>>({});
    const [savedReadings, setSavedReadings] = useState<Reading[]>([]);
    const [learningReflections, setLearningReflections] = useState<LearningReflection[]>([]);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
    const [followedPhilosophers, setFollowedPhilosophers] = useState<string[]>([]);
    
    const [userInteractions, setUserInteractions] = useState<Record<number, WorkInteraction>>({});

    const [selectedDebate, setSelectedDebate] = useState<Post | null>(null);
    const [modalDay, setModalDay] = useState<string | null>(null);
    const [modalTab, setModalTab] = useState<'journal' | 'posts'>('journal');
    const [modalAgoraFilter, setModalAgoraFilter] = useState<'all' | 'brief' | 'debate' | 'essay'>('all');

    const [dayPosts, setDayPosts] = useState<Post[]>([]);
    const [loadingDayPosts, setLoadingDayPosts] = useState(false);
    
    // --- APPLY THEME EFFECT ---
    useEffect(() => {
        const root = document.documentElement;
        
        if(fontTheme === 'classic') {
            root.style.setProperty('--font-serif', '"Playfair Display", serif');
            root.style.setProperty('--font-text', '"Lora", serif');
        } else if(fontTheme === 'modern') {
            root.style.setProperty('--font-serif', '"Outfit", sans-serif');
            root.style.setProperty('--font-text', '"Inter", sans-serif');
        } else if(fontTheme === 'humanist') {
            root.style.setProperty('--font-serif', '"Fraunces", serif');
            root.style.setProperty('--font-text', '"DM Sans", sans-serif');
        } else if(fontTheme === 'elegant') {
            root.style.setProperty('--font-serif', '"Cormorant Garamond", serif');
            root.style.setProperty('--font-text', '"Lora", serif');
        }
        localStorage.setItem('stoic_font', fontTheme);

        if(fontSize === 'small') root.style.fontSize = '14px';
        if(fontSize === 'medium') root.style.fontSize = '16px';
        if(fontSize === 'large') root.style.fontSize = '18px';
        localStorage.setItem('stoic_size', fontSize);

        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('stoic_theme', theme);

    }, [theme, fontTheme, fontSize]);

    // --- DERIVE DAILY CONTENT ---
    const { dailyReading, dailyPhilosopher, isMatch, dailyMeditation, dailyTask, dailyQuestion } = useMemo(() => {
        if (masterReadings.length === 0) {
            return { dailyReading: null, dailyPhilosopher: null, isMatch: false, dailyMeditation: null, dailyTask: null, dailyQuestion: "..." };
        }
        return getSyncedDailyData(new Date(), masterReadings, masterPhilosophers, masterMeditations, masterTasks, masterQuestions);
    }, [masterReadings, masterPhilosophers, masterMeditations, masterTasks, masterQuestions]);

    // --- INITIAL FETCHES ---
    useEffect(() => {
        const loadContent = async () => {
            const works = await fetchWorks();
            setMasterWorks(works); 

            const meditations = await fetchMeditations();
            setMasterMeditations(meditations);

            const glossary = await fetchGlossary();
            setMasterGlossary(glossary);

            const philosophers = await fetchPhilosophers();
            setMasterPhilosophers(philosophers);

            const readings = await fetchReadings();
            setMasterReadings(readings);

            const schools = await fetchSchools();
            setMasterSchools(schools);

            const tasks = await fetchTasks();
            setMasterTasks(tasks);

            const questions = await fetchDailyQuestions();
            setMasterQuestions(questions);

            const { courses, modules } = await fetchFullCourses();
            setMasterCourses(courses);
            setMasterModules(modules);
        };
        loadContent();
    }, []); 

    // --- AUTH & USER DATA ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if(session) initUserData(session);
            else setLoadingAuth(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if(session) initUserData(session);
            else { setUsername(''); setJournal({}); setLoadingAuth(false); }
        });
        return () => subscription.unsubscribe();
    }, []);

    const initUserData = (session: any) => {
        const uid = session.user.id;
        fetchUserProfile(session);
        fetchUserLogs(uid);
        fetchInteractions(uid);
        fetchUserLibrary(uid);
        loadUserBookmarks(uid);
    }

    const loadUserBookmarks = async (uid: string) => {
        const bookmarks = await fetchUserBookmarks(uid);
        setBookmarkedPosts(bookmarks);
    }

    useEffect(() => {
        if (modalDay && username) {
            const fetchDay = async () => {
                setLoadingDayPosts(true);
                setDayPosts([]); 
                
                const start = new Date(modalDay); start.setHours(0,0,0,0);
                const end = new Date(modalDay); end.setHours(23,59,59,999);

                const { data } = await supabase.from('forum_posts')
                    .select('*')
                    .eq('user_name', username)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());

                if (data) {
                    setDayPosts(data.map(p => ({...p, content: parsePost(p.content)})));
                }
                setLoadingDayPosts(false);
            };
            fetchDay();
        }
    }, [modalDay, username]);

    const fetchUserProfile = async (session: any) => {
        const userId = session.user.id;
        const { data } = await supabase.from('profiles').select('username').eq('id', userId).single();
        
        if (data && data.username) {
            setUsername(data.username);
        } else if (session.user.user_metadata?.display_name) {
            // Fallback to metadata
            setUsername(session.user.user_metadata.display_name);
        } else if (session.user.email) {
            // Fallback to email
            setUsername(session.user.email.split('@')[0]);
        } else {
            setUsername('Estudiante'); 
        }
        setLoadingAuth(false);
    }

    const fetchUserLibrary = async (userId: string) => {
        const { data } = await supabase.from('user_library').select('reading_data').eq('user_id', userId);
        if (data) {
            setSavedReadings(data.map((r: any) => ({ ...r.reading_data, saved: true })));
        }
    }

    const fetchUserLogs = async (userId: string) => {
        const { data, error } = await supabase.from('user_daily_logs').select('*').eq('user_id', userId);
        if (data && !error) {
            const remoteJournal: Record<string, JournalEntry> = {};
            data.forEach((log: any) => {
                remoteJournal[log.date] = {
                    text: log.text_content || '',
                    mood: log.mood || 0,
                    question_response: log.question_response || '',
                    challenge_response: log.challenge_response || '',
                    challenge_title: log.challenge_title || '',
                    challenge_status: log.challenge_status || (log.challenge_completed ? 'success' : undefined),
                    challenge_completed: !!log.challenge_completed,
                    updated_at: log.updated_at
                };
            });
            setJournal(remoteJournal);
        }
        setLoadingAuth(false);
    };

    const fetchInteractions = async (userId: string) => {
        const ints = await fetchUserLibraryInteractions(userId);
        const map: Record<number, WorkInteraction> = {};
        ints.forEach(i => map[i.work_id] = i);
        setUserInteractions(map);
    }

    const handleWorkInteractionUpdate = (workId: number, interaction: WorkInteraction) => {
        setUserInteractions(prev => ({ ...prev, [workId]: interaction }));
    };

    const currentReads = useMemo(() => {
        return masterWorks.filter(w => w.id && userInteractions[w.id]?.status === 'reading');
    }, [masterWorks, userInteractions]);

    const handleSaveEntry = useCallback(async (date: string, entry: JournalEntry) => {
        setJournal(prev => ({ ...prev, [date]: entry }));
        if(session) {
            const payload = {
                user_id: session.user.id,
                date: date,
                mood: entry.mood || 0,
                text_content: entry.text || "",
                question_response: entry.question_response || "",
                challenge_response: entry.challenge_response || "",
                challenge_completed: entry.challenge_completed === true, 
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase.from('user_daily_logs').upsert(payload, { onConflict: 'user_id, date' });
            if (error) console.error("Error Saving Log:", error.message || error);
        }
    }, [session]);

    const handleUpdateToday = (overrides: Partial<JournalEntry>) => { 
        const todayStr = getISO();
        const current = journal[todayStr] || { text: '', mood: 0, question_response: '', challenge_response: '', challenge_completed: false, challenge_status: undefined };
        const updated = { ...current, ...overrides };
        handleSaveEntry(todayStr, updated);
    };

    const toggleSave = async (reading: Reading) => {
        const exists = savedReadings.some(r => r.q === reading.q);
        let newSaved;
        if (exists) {
            newSaved = savedReadings.filter(r => r.q !== reading.q);
        } else {
            newSaved = [...savedReadings, { ...reading, saved: true }];
        }
        setSavedReadings(newSaved);
        if (session) {
            try {
                if (exists) {
                    await supabase.from('user_library').delete().eq('user_id', session.user.id).eq('reading_data->>q', reading.q);
                } else {
                    await supabase.from('user_library').insert({ user_id: session.user.id, reading_data: { ...reading, saved: true } });
                }
            } catch (e) { console.error("Save error", e); }
        }
    };

    const toggleBookmarkPost = async (post: Post) => {
        if (!post.id || !session) return;
        const exists = bookmarkedPosts.some(p => p.id === post.id);
        const newList = exists ? bookmarkedPosts.filter(p => p.id !== post.id) : [...bookmarkedPosts, post];
        setBookmarkedPosts(newList);
        await togglePostBookmarkDB(session.user.id, post.id);
    };

    const toggleFollowPhilosopher = (id: string) => setFollowedPhilosophers(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    const saveLearningReflection = (questionId: string, answer: string) => { setLearningReflections(prev => [...prev.filter(r => r.questionId !== questionId), { questionId, answer, date: getISO() }]); }
    const handleShare = (item: SharedItem) => { setSharedItem(item); setCommunityViewMode('feed'); setView('community'); setSanctuaryMode('menu'); };
    const handleLogout = async () => { await signOut(); setSession(null); }
    const handleWorkAdded = (newWork: Work) => { setMasterWorks(prev => [newWork, ...prev]); };
    const handleWorkDeleted = (deletedId: number) => { setMasterWorks(prev => prev.filter(w => w.id !== deletedId)); };
    
    const handleOpenPost = async (post: Post) => { 
        let content = post.content;
        if (typeof content === 'string') { try { content = JSON.parse(content); } catch (e) {} }
        const safeContent = content as ParsedContent;
        setModalDay(null);
        setView('community'); 
        setCommunityViewMode('feed'); 
        if (safeContent.replyToId) {
             const { data } = await supabase.from('forum_posts').select('*').eq('id', safeContent.replyToId).single();
             if (data) {
                 const parent = { ...data, content: parsePost(data.content) };
                 setSelectedDebate(parent); 
                 return;
             }
        }
        setSelectedDebate(post); 
    };
    
    const clearDeepLink = () => { setTargetPhilosopherId(null); setReturnToToday(false); setView('today'); }
    const handleNavigateToProfile = (usernameToView: string) => { setProfileTargetUser(usernameToView || username); }

    const handleNavigateToMeditation = (meditation: Meditation) => { setTargetMeditation(meditation); setReturnToToday(true); setView('sanctuary'); setSanctuaryMode('citadel'); };
    const handleNavigateToPhilosopher = (id: string) => { const bio = masterPhilosophers.find(p => p.id === id || p.name.toLowerCase() === id.toLowerCase()); if(bio) { setTargetPhilosopherId(bio.id); setReturnToToday(true); setView('sanctuary'); setSanctuaryMode('masters'); } };
    const handleNavigateToSchool = (name: string) => { setView('sanctuary'); setSanctuaryMode('schools'); };
    const handleNavigateToChallenge = () => { setActiveChallenge({ title: dailyTask?.title || "Reto", task: dailyTask?.description || "..." }); setReturnToToday(true); setView('sanctuary'); setSanctuaryMode('arena'); };
    const handleNavigateToPath = () => { setReturnToToday(true); setView('sanctuary'); setSanctuaryMode('path'); }

    if (loadingAuth) return <div className="flex h-screen items-center justify-center bg-[var(--bg)]"><i className="ph-duotone ph-spinner animate-spin text-3xl"></i></div>;
    if (!session) return <AuthView onLoginSuccess={() => {}} />;

    const shouldHideNavbar = sanctuaryMode === 'citadel' && (targetMeditation || isPlayerActive);

    return (
        <div className="flex flex-col h-[100dvh] bg-[var(--bg)] text-[var(--text-main)] overflow-hidden font-sans relative transition-colors duration-500">
             <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {view === 'today' && <TodayView journal={journal} onSaveEntry={handleSaveEntry} onOpenSettings={() => setIsSettingsOpen(true)} onNavigateToProfile={() => handleNavigateToProfile(username)} onNavigateToArena={handleNavigateToChallenge} onNavigateToMasters={() => { setView('sanctuary'); setSanctuaryMode('masters'); }} onNavigateToPath={handleNavigateToPath} onToggleSaveQuote={toggleSave} savedReadings={savedReadings} dailyReading={dailyReading} dailyPhilosopher={dailyPhilosopher} isPhilosopherMatch={isMatch} dailyMeditation={dailyMeditation} dailyTask={dailyTask} dailyQuestion={dailyQuestion} onNavigateToChallenge={handleNavigateToChallenge} onNavigateToMeditation={handleNavigateToMeditation} onNavigateToPhilosopher={handleNavigateToPhilosopher} onShare={handleShare} user={username} currentReads={currentReads} />}
                {view === 'calendar' && <CalendarView journal={journal} openDay={setModalDay} user={username} onOpenSettings={() => setIsSettingsOpen(true)} onNavigateToProfile={() => handleNavigateToProfile(username)} />}
                {view === 'community' && <CommunityHub user={username} userId={session?.user?.id} selectedDebate={selectedDebate} setSelectedDebate={setSelectedDebate} onBack={() => { setView('today'); setCommunityViewMode('feed'); }} bookmarkedPosts={bookmarkedPosts} toggleBookmarkPost={toggleBookmarkPost} initialSharedItem={sharedItem} onClearSharedItem={() => setSharedItem(null)} initialViewMode={communityViewMode} onOpenSettings={() => setIsSettingsOpen(true)} onNavigateToProfile={handleNavigateToProfile} journal={journal} dailyTopic={dailyQuestion} />}
                {view === 'sanctuary' && <SanctuaryView user={username} userId={session?.user?.id} savedReadings={savedReadings} toggleSave={toggleSave} journal={journal} sanctuaryMode={sanctuaryMode} setSanctuaryMode={setSanctuaryMode} onUpdateEntry={handleUpdateToday} learningReflections={learningReflections} saveLearningReflection={saveLearningReflection} activeChallenge={activeChallenge} setActiveChallenge={setActiveChallenge} followedPhilosophers={followedPhilosophers} toggleFollowPhilosopher={toggleFollowPhilosopher} dailyPhilosopher={dailyPhilosopher} onShare={handleShare} onNavigateToProfile={() => handleNavigateToProfile(username)} onOpenSettings={() => setIsSettingsOpen(true)} masterReadings={masterReadings} masterPhilosophers={masterPhilosophers} masterSchools={masterSchools} masterGlossary={masterGlossary} masterModules={masterModules} masterCourses={masterCourses} masterTasks={masterTasks} masterDichotomies={masterDichotomies} masterWorks={masterWorks} masterMeditations={masterMeditations} onWorkAdded={handleWorkAdded} onWorkDeleted={handleWorkDeleted} initialActiveMeditation={targetMeditation} initialSelectedPhilosopherId={targetPhilosopherId} clearDeepLink={clearDeepLink} returnToToday={returnToToday} setReturnToToday={setReturnToToday} handleNavigateToPhilosopher={handleNavigateToPhilosopher} handleNavigateToSchool={handleNavigateToSchool} handleNavigateToChallenge={handleNavigateToChallenge} handleNavigateToPath={handleNavigateToPath} handleNavigateToMeditation={handleNavigateToMeditation} dailyTask={dailyTask} userInteractions={userInteractions} onWorkInteractionUpdate={handleWorkInteractionUpdate} onPlayerToggle={setIsPlayerActive} />}
             </main>
             
             {/* Main Navbar */}
             <nav className={`fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none z-50 transition-transform duration-500 ease-in-out ${shouldHideNavbar ? 'translate-y-[200%] hidden' : ''}`}>
                 <div className="bg-[var(--card)]/70 backdrop-blur-xl p-1.5 rounded-[24px] shadow-2xl border border-[var(--border)] flex gap-2 pointer-events-auto transition-all">
                     <NavBtn icon="sun" label="Hoy" active={view === 'today'} onClick={() => { setView('today'); setCommunityViewMode('feed'); setReturnToToday(false); }} />
                     <NavBtn icon="calendar-blank" label="Calendario" active={view === 'calendar'} onClick={() => { setView('calendar'); setCommunityViewMode('feed'); setReturnToToday(false); }} />
                     <NavBtn icon="users-three" label="Alianza" active={view === 'community'} onClick={() => { setView('community'); setCommunityViewMode('feed'); setReturnToToday(false); }} />
                     <NavBtn icon="columns" label="Santuario" active={view === 'sanctuary'} onClick={() => { setView('sanctuary'); setSanctuaryMode('menu'); setCommunityViewMode('feed'); setReturnToToday(false); }} />
                 </div>
             </nav>
             
             {isSettingsOpen && <SettingsModule user={username} setUser={setUsername} theme={theme} setTheme={setTheme} fontTheme={fontTheme} setFontTheme={setFontTheme} fontSize={fontSize} setFontSize={setFontSize} onBack={() => setIsSettingsOpen(false)} onLogout={handleLogout} journal={journal} masterSchools={masterSchools} masterPhilosophers={masterPhilosophers} />}
             
             {profileTargetUser && (
                <div className="fixed inset-0 z-[60] bg-[var(--bg)] animate-fade-in flex flex-col">
                    <CommunityHub user={username} userId={session?.user?.id} selectedDebate={null} setSelectedDebate={() => {}} onBack={() => setProfileTargetUser(null)} bookmarkedPosts={bookmarkedPosts} toggleBookmarkPost={toggleBookmarkPost} initialViewMode='profile' initialProfileTarget={profileTargetUser} onOpenSettings={() => {}} onNavigateToProfile={handleNavigateToProfile} journal={journal} dailyTopic={dailyQuestion} />
                </div>
             )}

             <DayModal 
                modalDay={modalDay}
                setModalDay={setModalDay}
                journal={journal}
                modalTab={modalTab}
                setModalTab={setModalTab}
                modalAgoraFilter={modalAgoraFilter}
                setModalAgoraFilter={setModalAgoraFilter}
                loadingDayPosts={loadingDayPosts}
                dayPosts={dayPosts}
                handleOpenPost={handleOpenPost}
                tasks={masterTasks}
                onSaveEntry={handleSaveEntry}
                user={username}
             />
        </div>
    );
}