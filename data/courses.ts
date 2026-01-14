

import { CourseModule } from '../types';

export const STOIC_COURSE: CourseModule[] = [
    {
        id: "mod1", title: "I. Asentimiento", subtitle: "Claridad", description: "Ver el mundo objetivamente.", icon: "ph-eye",
        lessons: [
            { id: "l1", module_id: "mod1", sort_order: 1, title: "Juicio y Hecho", duration: "5 min", description: "Tu mente crea tu realidad.", content: "No son las cosas, son tus juicios.", task: "Identifica un juicio." },
            { id: "l2", module_id: "mod1", sort_order: 2, title: "Dicotomía", duration: "7 min", description: "Herramienta maestra.", content: "Control vs No Control.", task: "Clasifica 3 cosas." },
            { id: "l3", module_id: "mod1", sort_order: 3, title: "Vista Cósmica", duration: "6 min", description: "Perspectiva.", content: "Aleja el foco.", task: "Visualiza desde arriba." }
        ]
    },
    {
        id: "mod2", title: "II. Deseo", subtitle: "Aceptación", description: "Alinea tu voluntad.", icon: "ph-heart",
        lessons: [
            { id: "l4", module_id: "mod2", sort_order: 1, title: "Amor Fati", duration: "5 min", description: "Amar el destino.", content: "Abraza lo que sucede.", task: "Encuentra lo bueno en lo malo." },
            { id: "l5", module_id: "mod2", sort_order: 2, title: "Impermanencia", duration: "8 min", description: "Todo fluye.", content: "El vaso ya está roto.", task: "Contempla un final." },
            { id: "l6", module_id: "mod2", sort_order: 3, title: "Premeditatio", duration: "10 min", description: "Visualización negativa.", content: "Prepárate para lo peor.", task: "Imagina un escenario difícil." }
        ]
    },
    {
        id: "mod3", title: "III. Acción", subtitle: "Justicia", description: "Virtud social.", icon: "ph-hand-fist",
        lessons: [
            { id: "l7", module_id: "mod3", sort_order: 1, title: "Sympatheia", duration: "6 min", description: "Conexión.", content: "Somos uno.", task: "Ayuda anónima." },
            { id: "l8", module_id: "mod3", sort_order: 2, title: "El Obstáculo", duration: "7 min", description: "Combustible.", content: "Usa la dificultad.", task: "Convierte problema en reto." }
        ]
    },
    {
        id: "mod4", title: "IV. Pasiones", subtitle: "Emociones", description: "Gestión emocional.", icon: "ph-fire",
        lessons: [
            { id: "l9", module_id: "mod4", sort_order: 1, title: "Ira", duration: "8 min", description: "Locura breve.", content: "Espera antes de reaccionar.", task: "Cuenta hasta 20." },
            { id: "l10", module_id: "mod4", sort_order: 2, title: "Miedo", duration: "7 min", description: "Irrealidad.", content: "Sufres en imaginación.", task: "Define tu miedo." }
        ]
    },
    {
        id: "mod5", title: "V. Memento Mori", subtitle: "Finitud", description: "La muerte aconseja.", icon: "ph-skull",
        lessons: [
            { id: "l11", module_id: "mod5", sort_order: 1, title: "Préstamo", duration: "6 min", description: "Nada es tuyo.", content: "Devuélvelo sin queja.", task: "Despídete de algo." },
            { id: "l12", module_id: "mod5", sort_order: 2, title: "Inmediatez", duration: "5 min", description: "No postergues.", content: "Vive ahora.", task: "Hazlo hoy." }
        ]
    },
    {
        id: "mod6", title: "VI. Sociedad", subtitle: "Relaciones", description: "Convivencia.", icon: "ph-users",
        lessons: [
            { id: "l13", module_id: "mod6", sort_order: 1, title: "Gente Difícil", duration: "7 min", description: "Paciencia.", content: "Espéralos.", task: "Sé amable con el grosero." },
            { id: "l14", module_id: "mod6", sort_order: 2, title: "Fama", duration: "6 min", description: "Ruido.", content: "Ignora el aplauso.", task: "Haz el bien en secreto." }
        ]
    },
    {
        id: "mod7", title: "VII. Física", subtitle: "Cosmos", description: "Naturaleza.", icon: "ph-atom",
        lessons: [
            { id: "l15", module_id: "mod7", sort_order: 1, title: "Logos", duration: "8 min", description: "Razón.", content: "Todo tiene causa.", task: "Observa sin juzgar." },
            { id: "l16", module_id: "mod7", sort_order: 2, title: "Causalidad", duration: "7 min", description: "Destino.", content: "Eres parte de la red.", task: "Traza las causas." }
        ]
    },
    {
        id: "mod8", title: "VIII. Maestría", subtitle: "Excelencia", description: "Perfeccionamiento.", icon: "ph-medal",
        lessons: [
            { id: "l17", module_id: "mod8", sort_order: 1, title: "Prosoche", duration: "9 min", description: "Atención.", content: "Vigila tu mente.", task: "1 hora en HD." },
            { id: "l18", module_id: "mod8", sort_order: 2, title: "El Sabio", duration: "5 min", description: "Ideal.", content: "Tu norte.", task: "Define tu ideal." }
        ]
    },
    {
        id: "mod9", title: "IX. Liderazgo", subtitle: "Poder", description: "Mando.", icon: "ph-gavel",
        lessons: [
            { id: "l19", module_id: "mod9", sort_order: 1, title: "Servicio", duration: "8 min", description: "Mandar es servir.", content: "Cuida a los tuyos.", task: "Sirve hoy." },
            { id: "l20", module_id: "mod9", sort_order: 2, title: "Calma", duration: "7 min", description: "Frialdad.", content: "Decide sin emoción.", task: "Decisión difícil." }
        ]
    },
    {
        id: "mod10", title: "X. Lógica", subtitle: "Mente", description: "Pensamiento crítico.", icon: "ph-brain",
        lessons: [
            { id: "l21", module_id: "mod10", sort_order: 1, title: "Falacias", duration: "10 min", description: "Errores.", content: "No te engañes.", task: "Analiza un pensamiento." },
            { id: "l22", module_id: "mod10", sort_order: 2, title: "Asentimiento", duration: "8 min", description: "El Sí.", content: "No aceptes todo.", task: "Pausa el juicio." }
        ]
    },
    {
        id: "mod11", title: "XI. Ecología", subtitle: "Naturaleza", description: "Conexión natural.", icon: "ph-tree",
        lessons: [
            { id: "l23", module_id: "mod11", sort_order: 1, title: "Somos Tierra", duration: "6 min", description: "Unidad.", content: "Eres polvo estelar.", task: "Observa una planta." },
            { id: "l24", module_id: "mod11", sort_order: 2, title: "Ciclos", duration: "7 min", description: "Estaciones.", content: "Acepta el cambio.", task: "Siente el clima." }
        ]
    },
    {
        id: "mod12", title: "XII. Guerra", subtitle: "Resistencia", description: "Tiempos difíciles.", icon: "ph-shield",
        lessons: [
            { id: "l25", module_id: "mod12", sort_order: 1, title: "Stockdale", duration: "9 min", description: "Fe y Realidad.", content: "Aguanta y cree.", task: "Escribe tu peor caso." },
            { id: "l26", module_id: "mod12", sort_order: 2, title: "Soportar", duration: "5 min", description: "Abstine.", content: "Renuncia y aguanta.", task: "Abstente de algo." }
        ]
    }
];
