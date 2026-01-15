
export const LEVELS = [
    { level: 1, title: "Novicio", min: 0, max: 250 },       // Requiere mucha constancia
    { level: 2, title: "Estudiante", min: 250, max: 800 },  // El filtro real
    { level: 3, title: "Prokopton", min: 800, max: 2000 },  // Compromiso serio
    { level: 4, title: "Filósofo", min: 2000, max: 5000 },  // Maestría teórica
    { level: 5, title: "Sabio", min: 5000, max: Infinity }, // Ideal inalcanzable
];

export interface LevelData {
    level: number;
    title: string;
    progress: number; // 0 - 100
    currentXp: number;
    nextLevelXp: number | null;
    xpToNext: number;
}

export const calculateLevel = (currentXp: number = 0): LevelData => {
    // Encontrar el nivel actual
    const current = LEVELS.find(l => currentXp >= l.min && currentXp < l.max) || LEVELS[LEVELS.length - 1];
    
    // Calcular progreso
    let progress = 0;
    let nextLevelXp: number | null = current.max;
    let xpToNext = 0;

    if (current.max === Infinity) {
        progress = 100; // Nivel máximo alcanzado
        nextLevelXp = null;
        xpToNext = 0;
    } else {
        const range = current.max - current.min;
        const gained = currentXp - current.min;
        progress = Math.min(100, Math.max(0, (gained / range) * 100));
        xpToNext = current.max - currentXp;
    }

    return {
        level: current.level,
        title: current.title,
        progress,
        currentXp,
        nextLevelXp,
        xpToNext
    };
};
