
import { DichotomyScenario } from '../types';

export const DICHOTOMY_SCENARIOS: DichotomyScenario[] = [
    { text: "El clima", type: "external" }, { text: "Tu opinión del clima", type: "internal" },
    { text: "Opinión ajena", type: "external" }, { text: "Tus metas", type: "internal" },
    { text: "Enfermedad", type: "external" }, { text: "Reacción al dolor", type: "internal" },
    { text: "Economía", type: "external" }, { text: "Honestidad", type: "internal" },
    { text: "Muerte", type: "external" }, { text: "Juicios", type: "internal" },
    { text: "Tráfico", type: "external" }, { text: "Puntualidad", type: "internal" },
    { text: "Taza rota", type: "external" }, { text: "Tu ira", type: "internal" },
    { text: "Likes", type: "external" }, { text: "Autoestima", type: "internal" },
    { text: "Ruido", type: "external" }, { text: "Paz mental", type: "internal" },
    { text: "Llaves perdidas", type: "external" }, { text: "Calma al buscar", type: "internal" },
    { text: "Invitación", type: "external" }, { text: "Ser educado", type: "internal" },
    { text: "Lealtad ajena", type: "external" }, { text: "Tu lealtad", type: "internal" },
    { text: "Insulto", type: "external" }, { text: "Ignorar", type: "internal" },
    { text: "Fama", type: "external" }, { text: "Virtud hoy", type: "internal" },
    { text: "Ganar debate", type: "external" }, { text: "Argumentar bien", type: "internal" },
    { text: "Ascenso", type: "external" }, { text: "Trabajo duro", type: "internal" },
    { text: "Venta", type: "external" }, { text: "Esfuerzo", type: "internal" },
    { text: "Despido", type: "external" }, { text: "Actualizar CV", type: "internal" },
    { text: "Jefe", type: "external" }, { text: "Integridad", type: "internal" },
    { text: "Genética", type: "external" }, { text: "Salud", type: "internal" },
    { text: "Pasado", type: "external" }, { text: "Aprendizaje", type: "internal" },
    { text: "Futuro", type: "external" }, { text: "Planificación", type: "internal" },
    { text: "Longevidad", type: "external" }, { text: "Calidad de vida", type: "internal" },
    { text: "Talento", type: "external" }, { text: "Práctica", type: "internal" },
    { text: "Hambre", type: "external" }, { text: "Moderación", type: "internal" },
    { text: "Miedo físico", type: "external" }, { text: "Coraje", type: "internal" },
    { text: "Robo", type: "external" }, { text: "Desapego", type: "internal" },
    { text: "Gratitud ajena", type: "external" }, { text: "Bondad", type: "internal" },
    { text: "Victoria", type: "external" }, { text: "Juego limpio", type: "internal" },
    { text: "Rumores", type: "external" }, { text: "Verdad", type: "internal" },
    { text: "Herencia", type: "external" }, { text: "Generosidad", type: "internal" },
    { text: "Guerra", type: "external" }, { text: "Paz interior", type: "internal" },
    { text: "Vejez", type: "external" }, { text: "Sabiduría", type: "internal" },
    { text: "Prestigio", type: "external" }, { text: "Humildad", type: "internal" }
];

export const DAILY_QUESTIONS = [
    "¿Qué temes perder?", "¿Qué virtud practicaste?", "¿Satisfecho si murieras hoy?",
    "¿Qué perturbó tu paz?", "¿A quién perdonar?", "¿Qué es suficiente?",
    "¿Perdiste el control?", "¿Qué harías sin miedo?", "¿Qué postergas?",
    "¿De qué te quejas?", "¿Qué hábito te ata?", "¿Fuiste buen amigo?",
    "¿Qué verdad evitas?", "¿Tiempo perdido?", "¿Si nadie juzgara?",
    "¿A quién serviste?", "¿Qué aprendiste?", "¿Fuiste justo?",
    "¿Gula o necesidad?", "¿Hablaste de más?", "¿Te comparaste?",
    "¿Aceptaste el destino?", "¿Fuiste amable?", "¿Recordaste la muerte?",
    "¿Agradeciste?", "¿En qué fallaste hoy?", "¿Qué te hizo más fuerte?"
];

export const STOIC_TASKS = [
    { title: "Privación Micro", description: "Espera 2 minutos antes de comer o beber cuando tengas ganas." },
    { title: "Vista de Pájaro", description: "Cierra los ojos 1 minuto e imagina tu casa desde el espacio." },
    { title: "Sin Opinión", description: "Lee una noticia polémica y no emitas juicio alguno." },
    { title: "Silencio Breve", description: "Quédate 5 minutos en absoluto silencio sin hacer nada." },
    { title: "Memento Mori", description: "Mira tu mano e imagina cómo será cuando seas anciano." },
    { title: "Shock Frío", description: "Lávate la cara con agua helada y no te quejes." },
    { title: "Generosidad", description: "Envía un mensaje de agradecimiento a alguien ahora mismo." },
    { title: "Examen Rápido", description: "Escribe 3 cosas que has hecho bien hoy." },
    { title: "Sin Pantalla", description: "Deja el móvil en otra habitación durante 15 minutos." },
    { title: "Paseo Atento", description: "Camina 5 minutos fijándote solo en los colores." },
    { title: "Suelo", description: "Siéntate en el suelo duro durante 2 minutos." },
    { title: "Sabor Simple", description: "Come algo (pan, fruta) muy despacio, saboreando cada segundo." },
    { title: "Escucha Activa", description: "En tu próxima conversación, espera 3 segundos antes de responder." },
    { title: "Gratitud", description: "Escribe una cosa por la que estás vivo hoy." },
    { title: "Impermanencia", description: "Observa una nube hasta que cambie de forma o desaparezca." },
    { title: "Mano Torpe", description: "Usa tu mano no dominante para beber agua o abrir una puerta." },
    { title: "Ayuno Micro", description: "Sáltate el próximo snack o café que te apetezca." },
    { title: "Orden Flash", description: "Ordena una sola cosa (escritorio, cama, cajón) en 1 minuto." },
    { title: "Perdón", description: "Di en voz alta 'Te perdono' pensando en alguien que te molestó." },
    { title: "Contacto", description: "Saluda amablemente a la primera persona que veas." },
    { title: "Lectura", description: "Lee una sola frase filosófica y piénsala durante 1 minuto." },
    { title: "Postura", description: "Corrige tu postura y mantente recto durante 2 minutos." },
    { title: "No Queja", description: "Transforma tu próxima queja en una solución." },
    { title: "Sonrisa", description: "Sonríete a ti mismo en el espejo durante 10 segundos." },
    { title: "Verdad", description: "Sé brutalmente honesto contigo mismo sobre una debilidad." }
];

export const STOIC_GUIDED_QUESTIONS = [
    { id: "gq1", category: "Mente", question: "¿Qué impresión te molesta?", context: "Distingue hecho de juicio.", aiPrompt: "Ayuda a separar hecho de juicio." },
    { id: "gq2", category: "Acción", question: "¿Y si no pudieras fallar?", context: "Desapego del resultado.", aiPrompt: "Motiva la virtud intrínseca." },
    { id: "gq3", category: "Relaciones", question: "¿A quién impresionas?", context: "Vanidad social.", aiPrompt: "Perspectiva sobre validación." },
    { id: "gq4", category: "Muerte", question: "¿Si fuera el fin?", context: "Prioridades.", aiPrompt: "Usa la muerte para ordenar." },
    { id: "gq5", category: "Mente", question: "¿En qué gastas tiempo?", context: "Valor del tiempo.", aiPrompt: "Auditoría de tiempo." },
    { id: "gq6", category: "Acción", question: "¿Qué es esencial?", context: "Simplifica.", aiPrompt: "Discernir lo esencial." },
    { id: "gq7", category: "Mente", question: "¿Miedo a ser quién?", context: "Libertad.", aiPrompt: "Miedo a la libertad." },
    { id: "gq8", category: "Relaciones", question: "¿Cómo servir?", context: "Sympatheia.", aiPrompt: "Formas de servir." },
    { id: "gq9", category: "Mente", question: "¿Segunda flecha?", context: "Sufrimiento opcional.", aiPrompt: "Identificar sufrimiento extra." },
    { id: "gq10", category: "Acción", question: "¿Sísifo feliz?", context: "Rutina.", aiPrompt: "Sentido en la rutina." }
];
