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
    onPlayerToggle,
    theme 
}: any) {
    
    const handleModuleBack = () => {
        if (returnToToday) {
            setReturnToToday(false);
            if (clearDeepLink) clearDeepLink(); 
        } else {
            setSanctuaryMode('menu');
        }
    };

    // --- LÓGICA DE ESTILOS PERSONALIZADA ---
    const isCustomTheme = useMemo(() => !['light', 'dark'].includes(theme), [theme]);

    const getCardClasses = (defaultColorBg: string, defaultBorder: string, defaultIconColor: string, defaultTitleColor: string, defaultSubColor: string, defaultBox: string) => {
        if (isCustomTheme) {
            // Valores por defecto para temas custom
            let cardBg = `bg-[var(--card)]`;
            let cardBorder = `border-[var(--border)]`;
            let textColor = `text-[var(--text-main)]`;
            let subColor = `text-[var(--text-sub)] opacity-60`;
            let boxClass = `bg-[var(--highlight)] text-[var(--text-main)] border border-[var(--border)]`;

            // Personalización profunda por tema (Tarjeta oscura + Texto claro)
            if (theme === 'ocean') {
                cardBg = 'bg-cyan-950';
                cardBorder = 'border-cyan-800';
                textColor = 'text-cyan-50';
                subColor = 'text-cyan-200 opacity-60';
                boxClass = 'bg-cyan-900 text-cyan-200 border border-cyan-700 shadow-inner'; 
            } else if (theme === 'forest') {
                cardBg = 'bg-emerald-950';
                cardBorder = 'border-emerald-800';
                textColor = 'text-emerald-50';
                subColor = 'text-emerald-200 opacity-60';
                boxClass = 'bg-emerald-900 text-emerald-200 border border-emerald-700 shadow-inner';
            } else if (theme === 'sunset') {
                cardBg = 'bg-orange-950';
                cardBorder = 'border-orange-800';
                textColor = 'text-orange-50';
                subColor = 'text-orange-200 opacity-60';
                boxClass = 'bg-orange-900 text-orange-200 border border-orange-700 shadow-inner';
            }

            // Diseño Monocromático / Elegante
            return {
                card: `${cardBg} ${cardBorder} border shadow-sm group transition-all hover:scale-[1.02] active:scale-95 duration-300 h-full`,
                icon: `${textColor} opacity-90 transition-transform group-hover:scale-110 duration-300`,
                title: textColor,
                sub: `text-[9px] uppercase font-bold ${subColor}`,
                box: `${boxClass} transition-all group-hover:scale-110 duration-300 shadow-sm`
            };
        }
        
        // Estilo Colorido Original (Día/Noche)
        return {
            card: `${defaultColorBg} ${defaultBorder} transition-all border h-full group hover:shadow-md hover:scale-[1.02] active:scale-95 duration-300`,
            icon: `${defaultIconColor} transition-transform group-hover:scale-110 duration-300`,
            title: defaultTitleColor,
            sub: defaultSubColor,
            box: `${defaultBox} transition-transform group-hover:scale-110 duration-300 shadow-sm`
        };
    };

    const styles = {
        path: getCardClasses("bg-[#FAF5FF] dark:bg-[#1E1024]", "border-fuchsia-100 dark:border-fuchsia-900/20", "text-fuchsia-500", "text-fuchsia-900 dark:text-fuchsia-50", "text-fuchsia-800 dark:text-fuchsia-200", ""),
        masters: getCardClasses("bg-[var(--card)]", "border-[var(--border)]", "text-[var(--text-main)]", "text-[var(--text-main)]", "opacity-60", ""),
        schools: getCardClasses("bg-[var(--card)]", "border-[var(--border)]", "text-[var(--text-main)]", "text-[var(--text-main)]", "opacity-60", ""),
        oracle: getCardClasses("bg-purple-50 dark:bg-purple-900/10", "border-purple-100 dark:border-purple-900/20", "text-purple-500/10", "text-purple-900 dark:text-purple-50", "text-purple-800 dark:text-purple-200", "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"),
        library: getCardClasses("bg-[#FFF7ED] dark:bg-[#2C1810]", "border-orange-100 dark:border-orange-900/20", "text-orange-500/10", "text-orange-900 dark:text-orange-50", "text-orange-800 dark:text-orange-200", "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300"),
        works: getCardClasses("bg-[#F0FDF4] dark:bg-[#052E16]", "border-emerald-100 dark:border-emerald-900/20", "text-emerald-500/10", "text-emerald-900 dark:text-emerald-50", "text-emerald-800 dark:text-emerald-200", "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300"),
        arena: getCardClasses("bg-[#FFFBEB] dark:bg-[#2C2410]", "border-amber-100 dark:border-amber-900/20", "text-amber-500", "text-amber-900 dark:text-amber-50", "text-amber-800 dark:text-amber-200", ""),
        citadel: getCardClasses("bg-stone-100 dark:bg-stone-900", "border-[var(--border)]", "text-[var(--text-sub)] opacity-10", "text-[var(--text-main)]", "opacity-60", "bg-[var(--text-main)] text-[var(--bg)]"),
        glossary: getCardClasses("bg-[var(--card)]", "border-[var(--border)]", "text-[var(--text-sub)]", "text-[var(--text-main)]", "opacity-60", ""),
        stats: getCardClasses("bg-[#Fdf4f0] dark:bg-[#2e1a16]", "border-rose-100 dark:border-rose-900/20", "text-rose-500", "text-rose-900 dark:text-rose-50", "text-rose-800 dark:text-rose-200", "")
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
                        {/* CAMINO */}
                        <div onClick={() => setSanctuaryMode('path')} className={`${styles.path.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                            <div className="flex justify-start">
                                <i className={`ph-duotone ph-path text-4xl ${styles.path.icon}`}></i>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.path.title}`}>Camino</h3>
                                <p className={`${styles.path.sub}`}>Cursos</p>
                            </div>
                        </div>

                        {/* MAESTROS (LIMPIO) */}
                        <div onClick={() => setSanctuaryMode('masters')} className={`${styles.masters.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                            <div className="flex justify-start">
                                <i className={`ph-duotone ph-student text-4xl ${styles.masters.icon}`}></i>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.masters.title}`}>Maestros</h3>
                                <p className={`${styles.masters.sub}`}>Biografías</p>
                            </div>
                        </div>

                        {/* ESCUELAS */}
                        <div onClick={() => setSanctuaryMode('schools')} className={`${styles.schools.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                             <div className="flex justify-start">
                                <i className={`ph-duotone ph-columns text-4xl ${styles.schools.icon}`}></i>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.schools.title}`}>Escuelas</h3>
                                <p className={`${styles.schools.sub}`}>Tradiciones</p>
                            </div>
                        </div>

                        {/* ORÁCULO */}
                        <div onClick={() => setSanctuaryMode('oracle')} className={`${styles.oracle.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                             <div className="flex justify-start">
                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${styles.oracle.box}`}>
                                    <i className="ph-bold ph-sparkle text-xl"></i>
                                </div>
                             </div>
                             <div>
                                <h3 className={`serif text-lg font-bold ${styles.oracle.title}`}>Oráculo</h3>
                                <p className={`${styles.oracle.sub}`}>Consultas</p>
                             </div>
                        </div>

                        {/* BIBLIOTECA */}
                        <div onClick={() => setSanctuaryMode('library')} className={`${styles.library.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                             <div className="flex justify-start">
                                 <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${styles.library.box}`}>
                                    <i className="ph-bold ph-book-open text-xl"></i>
                                 </div>
                             </div>
                             <div>
                                <h3 className={`serif text-lg font-bold ${styles.library.title}`}>Biblioteca</h3>
                                <p className={`${styles.library.sub}`}>Citas</p>
                             </div>
                        </div>

                        {/* OBRAS */}
                        <div onClick={() => setSanctuaryMode('works')} className={`${styles.works.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                            <div className="flex justify-start">
                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${styles.works.box}`}>
                                    <i className="ph-bold ph-read-cv-logo text-xl"></i>
                                </div>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.works.title}`}>Obras</h3>
                                <p className={`${styles.works.sub}`}>Libros</p>
                            </div>
                        </div>

                         {/* ARENA */}
                         <div onClick={() => setSanctuaryMode('arena')} className={`${styles.arena.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                            <div className="flex justify-start">
                                <i className={`ph-fill ph-sword text-4xl ${styles.arena.icon}`}></i>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.arena.title}`}>Arena</h3>
                                <p className={`${styles.arena.sub}`}>Reto</p>
                            </div>
                        </div>

                        {/* CIUDADELA */}
                        <div onClick={() => setSanctuaryMode('citadel')} className={`${styles.citadel.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                            <div className="flex justify-start">
                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${styles.citadel.box}`}>
                                    <i className="ph-bold ph-castle-turret text-xl"></i>
                                </div>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.citadel.title}`}>Ciudadela</h3>
                                <p className={`${styles.citadel.sub}`}>Meditación</p>
                            </div>
                        </div>

                        {/* GLOSARIO */}
                        <div onClick={() => setSanctuaryMode('glossary')} className={`${styles.glossary.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                            <div className="flex justify-start">
                                <i className={`ph-duotone ph-book-bookmark text-4xl ${styles.glossary.icon}`}></i>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.glossary.title}`}>Léxico</h3>
                                <p className={`${styles.glossary.sub}`}>Glosario</p>
                            </div>
                        </div>

                        {/* LEGADO */}
                        <div onClick={() => setSanctuaryMode('stats')} className={`${styles.stats.card} p-6 rounded-[32px] cursor-pointer flex flex-col justify-between`}>
                            <div className="flex justify-start">
                                <i className={`ph-fill ph-chart-bar text-3xl ${styles.stats.icon}`}></i>
                            </div>
                            <div>
                                <h3 className={`serif text-lg font-bold ${styles.stats.title}`}>Legado</h3>
                                <p className={`${styles.stats.sub}`}>Stats</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            {sanctuaryMode === 'library' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><LibraryModule user={user} readings={masterReadings} savedReadings={savedReadings} toggleSave={toggleSave} onBack={handleModuleBack} onShare={onShare} schools={masterSchools} philosophers={masterPhilosophers} /></div>}
            {sanctuaryMode === 'works' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><WorksManager works={masterWorks} philosophers={masterPhilosophers} onBack={handleModuleBack} onWorkAdded={onWorkAdded} onWorkDeleted={onWorkDeleted} userInteractions={userInteractions} onInteractionUpdate={onWorkInteractionUpdate} /></div>}
            {sanctuaryMode === 'oracle' && <div className="absolute inset-0 bg-[var(--bg)] z-10"><OracleModule savedReadings={savedReadings} toggleSave={toggleSave} onBack={handleModuleBack} philosophers={masterPhilosophers} schools={masterSchools} /></div>}
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
                {view === 'sanctuary' && <SanctuaryView user={username} userId={session?.user?.id} savedReadings={savedReadings} toggleSave={toggleSave} journal={journal} sanctuaryMode={sanctuaryMode} setSanctuaryMode={setSanctuaryMode} onUpdateEntry={handleUpdateToday} learningReflections={learningReflections} saveLearningReflection={saveLearningReflection} activeChallenge={activeChallenge} setActiveChallenge={setActiveChallenge} followedPhilosophers={followedPhilosophers} toggleFollowPhilosopher={toggleFollowPhilosopher} dailyPhilosopher={dailyPhilosopher} onShare={handleShare} onNavigateToProfile={() => handleNavigateToProfile(username)} onOpenSettings={() => setIsSettingsOpen(true)} masterReadings={masterReadings} masterPhilosophers={masterPhilosophers} masterSchools={masterSchools} masterGlossary={masterGlossary} masterModules={masterModules} masterCourses={masterCourses} masterTasks={masterTasks} masterDichotomies={masterDichotomies} masterWorks={masterWorks} masterMeditations={masterMeditations} onWorkAdded={handleWorkAdded} onWorkDeleted={handleWorkDeleted} initialActiveMeditation={targetMeditation} initialSelectedPhilosopherId={targetPhilosopherId} clearDeepLink={clearDeepLink} returnToToday={returnToToday} setReturnToToday={setReturnToToday} handleNavigateToPhilosopher={handleNavigateToPhilosopher} handleNavigateToSchool={handleNavigateToSchool} handleNavigateToChallenge={handleNavigateToChallenge} handleNavigateToPath={handleNavigateToPath} handleNavigateToMeditation={handleNavigateToMeditation} dailyTask={dailyTask} userInteractions={userInteractions} onWorkInteractionUpdate={handleWorkInteractionUpdate} onPlayerToggle={setIsPlayerActive} theme={theme} />}
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