
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, getISO } from '../services/supabase';
import { Reading, Post, ParsedContent } from '../types';
import { parsePost } from '../utils/stoicData';

export function StatsModule({ journal, user, savedReadings, onBack }: any) {
    const [postCount, setPostCount] = useState(0);
    const [feedPosts, setFeedPosts] = useState<Post[]>([]);

    // Fetch Community Stats & Posts for Analysis
    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            
            // Get count
            const { count } = await supabase.from('forum_posts')
                .select('*', { count: 'exact', head: true })
                .eq('user_name', user);
            if (count !== null) setPostCount(count);

            // Get actual posts for keyword analysis
            const { data } = await supabase.from('forum_posts')
                .select('*')
                .eq('user_name', user)
                .order('created_at', { ascending: false })
                .limit(50); // Analyze last 50 posts
            
            if (data) {
                setFeedPosts(data.map((p:any) => ({...p, content: parsePost(p.content)})));
            }
        }
        fetchStats();
    }, [user]);

    // Data Processing
    const entries = Object.keys(journal).length;
    const sortedDates = Object.keys(journal).sort().reverse();
    
    // --- STREAK LOGIC ---
    let streak = 0;
    if (sortedDates.length > 0) {
        const today = getISO();
        const yesterday = getISO(new Date(Date.now() - 86400000));
        
        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
            streak = 1;
            let currentDate = new Date(sortedDates[0]);
            for (let i = 1; i < sortedDates.length; i++) {
                const prevDate = new Date(sortedDates[i]);
                const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) { streak++; currentDate = prevDate; } else { break; }
            }
        }
    }

    // --- MOOD & RESONANCE CALCS ---
    const last30Dates = Array.from({length: 30}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return getISO(d);
    });
    
    const moodData = last30Dates.map(d => journal[d]?.mood || 0);
    const validMoods = moodData.filter(m => m > 0);
    const avgMoodNum = validMoods.length > 0 
        ? (validMoods.reduce((a, b) => a + b, 0) / validMoods.length)
        : 0;

    const getMoodLabel = (val: number) => {
        if (val === 0) return "Sin Datos";
        if (val < 2.0) return "Caos";
        if (val < 3.0) return "Duda";
        if (val < 4.0) return "Paz";
        return "Areté";
    }

    const avgMoodLabel = getMoodLabel(avgMoodNum);
    const avgMoodDisplay = avgMoodNum > 0 ? avgMoodNum.toFixed(1) : "--";

    // --- KEYWORDS EXTRACTION (From Feed Posts TAGS) ---
    const topKeywords = useMemo(() => {
        if (feedPosts.length === 0) return [];

        const counts: Record<string, number> = {};
        
        feedPosts.forEach(p => {
            const c = p.content as ParsedContent;
            let tag = c.tag || "Sin Etiqueta";
            // Clean up special tags
            if (tag.startsWith('Diario:')) tag = "Diario";
            
            counts[tag] = (counts[tag] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
    }, [feedPosts]);

    // --- TIME OF DAY ANALYSIS ---
    const timeOfDayStats = useMemo(() => {
        let morning = 0; // 5-12
        let afternoon = 0; // 12-20
        let night = 0; // 20-5

        Object.values(journal).forEach((e: any) => {
            if (e.updated_at) {
                const hour = new Date(e.updated_at).getHours();
                if (hour >= 5 && hour < 12) morning++;
                else if (hour >= 12 && hour < 20) afternoon++;
                else night++;
            }
        });
        
        const total = morning + afternoon + night;
        if (total === 0) return { morning: 0, afternoon: 0, night: 0 };
        return {
            morning: Math.round((morning / total) * 100),
            afternoon: Math.round((afternoon / total) * 100),
            night: Math.round((night / total) * 100)
        };
    }, [journal]);

    // --- HEATMAP DATA (Last 35 days) ---
    const heatmapDays = Array.from({length: 35}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (34 - i));
        return getISO(d);
    });

    // --- CHALLENGE STATS ---
    const totalChallenges = Object.values(journal).filter((e:any) => e.challenge_status !== undefined || e.challenge_completed !== undefined).length;
    const wonChallenges = Object.values(journal).filter((e:any) => e.challenge_status === 'success' || (e.challenge_completed === true && !e.challenge_status)).length;
    const challengeRate = totalChallenges > 0 ? Math.round((wonChallenges / totalChallenges) * 100) : 0;

    // --- ORB COLOR LOGIC ---
    let orbColor = "from-stone-500 to-stone-700"; // Neutral
    let orbShadow = "shadow-stone-500/50";
    if (avgMoodNum > 0) {
        if (avgMoodNum < 2.0) { orbColor = "from-red-500 to-orange-600"; orbShadow = "shadow-red-500/50"; }
        else if (avgMoodNum < 3.0) { orbColor = "from-purple-500 to-indigo-600"; orbShadow = "shadow-purple-500/50"; }
        else if (avgMoodNum < 4.0) { orbColor = "from-cyan-400 to-blue-600"; orbShadow = "shadow-cyan-500/50"; }
        else { orbColor = "from-emerald-400 to-teal-600"; orbShadow = "shadow-emerald-500/50"; }
    }

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
             <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 z-30 bg-[var(--bg)]/70 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--highlight)] transition-colors border border-[var(--border)]"><i className="ph-bold ph-arrow-left text-xl"></i></button>
                    <h2 className="serif text-2xl font-bold">Legado</h2>
                </div>
            </div>
            
            <div className="w-full max-w-2xl px-6 pb-32 overflow-y-auto no-scrollbar pt-6">
                
                {/* 1. VISUAL RESONANCE ORB */}
                <div className="mb-10 flex flex-col items-center justify-center relative">
                    <div className={`w-48 h-48 rounded-full bg-gradient-to-tr ${orbColor} blur-3xl opacity-40 absolute animate-pulse-slow`}></div>
                    <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${orbColor} relative z-10 flex flex-col items-center justify-center shadow-2xl ${orbShadow} border-4 border-[var(--bg)]`}>
                        <span className="text-white/80 font-bold text-sm uppercase tracking-widest mb-1">Resonancia</span>
                        <span className="text-white text-5xl font-serif font-bold">{avgMoodDisplay}</span>
                        <span className="text-white/60 text-xs mt-1 font-bold">{avgMoodLabel}</span>
                    </div>
                </div>

                {/* 2. HERO METRICS */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[24px] shadow-sm flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Racha</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-serif font-bold text-[var(--text-main)]">{streak}</span>
                            <span className="text-xs opacity-40">días</span>
                        </div>
                    </div>
                    <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[24px] shadow-sm flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Total</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-serif font-bold text-[var(--text-main)]">{entries}</span>
                            <span className="text-xs opacity-40">entradas</span>
                        </div>
                    </div>
                </div>

                {/* 3. ACTIVITY HEATMAP */}
                <div className="mb-8 bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-2 mb-4 opacity-40">
                        <i className="ph-bold ph-calendar-check"></i>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Constancia (35 días)</span>
                    </div>
                    <div className="grid grid-cols-7 gap-3 justify-center">
                        {heatmapDays.map((date) => {
                            const entry = journal[date];
                            const hasEntry = !!entry;
                            const mood = entry?.mood || 0;
                            const isToday = date === getISO();
                            let bgClass = "bg-[var(--highlight)]";
                            
                            if (hasEntry) {
                                if (mood > 0) bgClass = ""; 
                                else bgClass = "bg-[var(--text-main)] opacity-100";
                            }

                            return (
                                <div 
                                    key={date} 
                                    className={`aspect-square rounded-lg transition-all ${bgClass} ${isToday && !hasEntry ? 'border-2 border-[var(--text-main)]' : ''}`}
                                    style={mood > 0 ? { backgroundColor: `var(--mood-${mood})` } : {}}
                                    title={date}
                                ></div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. NEW: KEYWORDS CLOUD (FROM FEED TAGS) */}
                <div className="mb-8 bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-2 mb-4 opacity-40">
                        <i className="ph-bold ph-tag"></i>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Categorías Públicas</span>
                    </div>
                    {topKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {topKeywords.map(([word, count], i) => (
                                <span key={word} className={`px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${i === 0 ? 'bg-[var(--text-main)] text-[var(--bg)]' : 'bg-[var(--highlight)] opacity-80'}`}>
                                    {word} <span className="opacity-60 text-[9px]">{count}</span>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center opacity-30 italic text-xs py-4">Comparte en el Ágora para ver análisis.</div>
                    )}
                </div>

                {/* 5. NEW: CRONOTIPO (TIME OF DAY) */}
                <div className="mb-8 bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-2 mb-4 opacity-40">
                        <i className="ph-bold ph-clock"></i>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Cronotipo Reflexivo</span>
                    </div>
                    <div className="flex gap-1 h-12 rounded-xl overflow-hidden">
                        {timeOfDayStats.morning > 0 && (
                            <div className="bg-orange-300 dark:bg-orange-700 flex items-center justify-center text-[10px] font-bold text-white relative group" style={{ width: `${timeOfDayStats.morning}%` }}>
                                <i className="ph-fill ph-sun-horizon"></i>
                                <div className="absolute bottom-full mb-1 bg-black text-white text-[9px] p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Mañana {timeOfDayStats.morning}%</div>
                            </div>
                        )}
                        {timeOfDayStats.afternoon > 0 && (
                            <div className="bg-sky-400 dark:bg-sky-700 flex items-center justify-center text-[10px] font-bold text-white relative group" style={{ width: `${timeOfDayStats.afternoon}%` }}>
                                <i className="ph-fill ph-sun"></i>
                                <div className="absolute bottom-full mb-1 bg-black text-white text-[9px] p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Tarde {timeOfDayStats.afternoon}%</div>
                            </div>
                        )}
                        {timeOfDayStats.night > 0 && (
                            <div className="bg-indigo-500 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-white relative group" style={{ width: `${timeOfDayStats.night}%` }}>
                                <i className="ph-fill ph-moon-stars"></i>
                                <div className="absolute bottom-full mb-1 bg-black text-white text-[9px] p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Noche {timeOfDayStats.night}%</div>
                            </div>
                        )}
                        {(timeOfDayStats.morning + timeOfDayStats.afternoon + timeOfDayStats.night === 0) && (
                            <div className="w-full bg-[var(--highlight)] flex items-center justify-center text-xs opacity-30 italic">Sin datos de hora</div>
                        )}
                    </div>
                </div>

                {/* 6. CHALLENGE PERFORMANCE */}
                <div className="border border-[var(--border)] p-6 mb-8 flex items-center justify-between rounded-[24px] bg-[var(--card)] shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 mb-2 opacity-50">
                            <i className="ph-bold ph-sword"></i>
                            <span className="text-[9px] font-bold uppercase tracking-widest">Arena</span>
                        </div>
                        <div className="text-3xl font-serif font-bold">{challengeRate}%</div>
                        <p className="text-xs opacity-40">Tasa de Victoria</p>
                    </div>
                    
                    <div className="w-16 h-16 relative flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-[var(--highlight)]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path className="text-[var(--text-main)]" strokeDasharray={`${challengeRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                {/* 7. COMMUNITY FOOTER */}
                <div className="border-t border-[var(--border)] py-4 flex items-center justify-between opacity-60">
                     <span className="text-xs font-bold uppercase tracking-widest">Contribuciones</span>
                     <span className="font-serif font-bold text-xl">{postCount}</span>
                </div>

            </div>
        </div>
    );
}
