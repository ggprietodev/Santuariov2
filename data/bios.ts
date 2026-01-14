
import { PhilosopherBio, PhilosophySchool } from '../types';

export const PHILOSOPHICAL_SCHOOLS: PhilosophySchool[] = [
    { name: "Estoicismo", description: "El arte de la resiliencia. Enfócate en lo que controlas, acepta lo que no, y vive con virtud.", core_principle: "La virtud es el único bien.", icon: "ph-columns", color: "text-amber-600" },
    { name: "Cinismo", description: "La vida natural. Rechazo radical de las convenciones sociales, la riqueza y el poder.", core_principle: "Autarquía y Franqueza.", icon: "ph-dog", color: "text-stone-600" },
    { name: "Epicureísmo", description: "El jardín del placer sencillo. Ausencia de dolor (Aponía) y miedo.", core_principle: "El placer es la ausencia de dolor.", icon: "ph-wine", color: "text-rose-600" },
    { name: "Platonismo", description: "El mundo de las Ideas. La realidad física es sombra de la verdad.", core_principle: "El mundo real es ideal.", icon: "ph-shapes", color: "text-blue-600" },
    { name: "Aristotelismo", description: "El realismo práctico. La virtud está en el 'Justo Medio'.", core_principle: "La virtud es equilibrio.", icon: "ph-compass", color: "text-teal-600" },
    { name: "Escepticismo", description: "La duda sanadora. Suspender el juicio (Epoché) para la paz mental.", core_principle: "No juzgues, sé feliz.", icon: "ph-question", color: "text-gray-500" },
    { name: "Neoplatonismo", description: "El misticismo racional. Todo emana del 'Uno' y debe retornar.", core_principle: "Todo es Uno.", icon: "ph-sun", color: "text-yellow-500" },
    { name: "Taoísmo", description: "El flujo natural. Vivir en armonía con el Tao.", core_principle: "Fluye como el agua.", icon: "ph-yin-yang", color: "text-emerald-600" },
    { name: "Budismo", description: "El camino medio. Liberación del sufrimiento (Dukkha).", core_principle: "El apego es sufrimiento.", icon: "ph-lotus", color: "text-fuchsia-600" },
    { name: "Existencialismo", description: "La libertad radical. Tú creas tu propio propósito.", core_principle: "La existencia precede a la esencia.", icon: "ph-fingerprint", color: "text-indigo-600" },
    { name: "Trascendentalismo", description: "La divinidad del individuo y la naturaleza.", core_principle: "Confía en ti mismo.", icon: "ph-tree", color: "text-green-700" },
    { name: "Racionalismo", description: "La razón como fuente. Entender el orden geométrico.", core_principle: "Comprender es libertad.", icon: "ph-eye-glasses", color: "text-cyan-700" },
    { name: "Absurdismo", description: "Rebelarse ante la falta de sentido del universo.", core_principle: "Rebelión ante el absurdo.", icon: "ph-mask-happy", color: "text-orange-700" },
    { name: "Bushido", description: "El camino del guerrero. Honor, disciplina y aceptación de la muerte.", core_principle: "La muerte otorga sentido.", icon: "ph-sword", color: "text-red-700" },
    { name: "Confucianismo", description: "Armonía social y rectitud moral a través de los ritos y el deber.", core_principle: "Benevolencia y Orden.", icon: "ph-scroll", color: "text-purple-600" },
    { name: "Eclecticismo", description: "Tomar lo mejor de cada escuela sin dogmas fijos.", core_principle: "La verdad está en todas partes.", icon: "ph-scales", color: "text-slate-600" },
    { name: "Ilustración", description: "La razón y la ciencia como luces contra la ignorancia.", core_principle: "Atrévete a saber.", icon: "ph-lightbulb", color: "text-amber-500" }
];

export const EXTENDED_BIOS: PhilosopherBio[] = [
    // ESTOICISMO
    { id: "maurelio", name: "Marco Aurelio", dates: "121-180 d.C.", role: "Emperador", school: "Estoicismo", desc: "El rey filósofo. Escribió las 'Meditaciones' en el frente de batalla para mantenerse humano en un mundo inhumano.", key_ideas: ["Ciudadela Interior", "Deber Cívico", "Impermanencia"], icon: "ph-crown" },
    { id: "seneca", name: "Séneca", dates: "4 a.C.-65 d.C.", role: "Estadista", school: "Estoicismo", desc: "Consejero de Nerón, dramaturgo y el hombre más rico de Roma. Maestro de la psicología humana y el tiempo.", key_ideas: ["Brevendad de la Vida", "Clemencia", "Premeditatio"], icon: "ph-scroll" },
    { id: "epicteto", name: "Epicteto", dates: "50-135 d.C.", role: "Maestro", school: "Estoicismo", desc: "Nacido esclavo, tullido, se convirtió en el maestro más influyente. Enseñó que la libertad es 100% mental.", key_ideas: ["Dicotomía de Control", "Prohairesis", "Voluntad"], icon: "ph-chains" },
    { id: "zenon", name: "Zenón de Citio", dates: "334-262 a.C.", role: "Fundador", school: "Estoicismo", desc: "Comerciante fenicio que naufragó, perdió todo y fundó la Stoa en Atenas.", key_ideas: ["Vivir acorde a Naturaleza", "Katalepsis"], icon: "ph-columns" },
    { id: "cleanthes", name: "Cleantes", dates: "330-230 a.C.", role: "El Boxeador", school: "Estoicismo", desc: "Obrero de noche, filósofo de día. Famoso por su resistencia y su 'Himno a Zeus'.", key_ideas: ["Devoción", "Resistencia", "Trabajo Duro"], icon: "ph-drop" },
    { id: "chrysippus", name: "Crisipo", dates: "279-206 a.C.", role: "El Lógico", school: "Estoicismo", desc: "Sistematizador de la Stoa. Se dice que 'sin Crisipo no habría Stoa'. Murió de risa.", key_ideas: ["Lógica Proposicional", "Determinismo", "Destino"], icon: "ph-brain" },
    { id: "musonio", name: "Musonio Rufo", dates: "30-100 d.C.", role: "Sócrates Romano", school: "Estoicismo", desc: "Maestro de Epicteto. Defendió la igualdad de mujeres en la filosofía y el ascetismo.", key_ideas: ["Igualdad de Género", "Ascetismo", "Exilio"], icon: "ph-scales" },
    { id: "caton", name: "Catón el Joven", dates: "95-46 a.C.", role: "El Incorruptible", school: "Estoicismo", desc: "Mártir de la República Romana. Se suicidó antes que someterse a la tiranía de César.", key_ideas: ["Integridad Radical", "Defensa de la República"], icon: "ph-sword" },
    { id: "porcia", name: "Porcia", dates: "70-43 a.C.", role: "La Valiente", school: "Estoicismo", desc: "Hija de Catón, esposa de Bruto. Se hirió a sí misma para probar que podía guardar secretos.", key_ideas: ["Coraje Físico", "Lealtad", "Silencio"], icon: "ph-heart-break" },
    { id: "panaetius", name: "Panecio", dates: "185-110 a.C.", role: "El Humanista", school: "Estoicismo", desc: "Introdujo la Stoa en la aristocracia romana, suavizando su rigor.", key_ideas: ["Deber (Officium)", "Decoro"], icon: "ph-users-three" },
    { id: "posidonius", name: "Posidonio", dates: "135-51 a.C.", role: "El Polímata", school: "Estoicismo", desc: "Científico, historiador y viajero. Maestro de Cicerón. Midió la circunferencia de la Tierra.", key_ideas: ["Ciencia Unificada", "Simpatía Cósmica"], icon: "ph-globe" },

    // NUEVOS
    { id: "cicero", name: "Cicerón", dates: "106-43 a.C.", role: "El Orador", school: "Eclecticismo", desc: "Estadista romano. Aunque no era estoico puro, tradujo y popularizó la ética estoica en latín.", key_ideas: ["Humanitas", "Ley Natural", "Deberes"], icon: "ph-bank" },
    { id: "zhuangzi", name: "Zhuangzi", dates: "369-286 a.C.", role: "El Taoísta", school: "Taoísmo", desc: "Sabio del humor y la paradoja. Enseñó la inutilidad de la utilidad y el flujo natural.", key_ideas: ["Sueño de la Mariposa", "Espontaneidad", "Relatividad"], icon: "ph-butterfly" },
    { id: "naval", name: "Naval Ravikant", dates: "1974-", role: "El Inversor", school: "Estoicismo Moderno", desc: "Pensador contemporáneo que mezcla racionalismo, estoicismo y tecnología.", key_ideas: ["Riqueza vs Estatus", "Felicidad es Paz", "Apalancamiento"], icon: "ph-rocket" },

    // CINISMO
    { id: "diogenes", name: "Diógenes", dates: "412-323 a.C.", role: "El Perro", school: "Cinismo", desc: "Vivía en una tinaja. Buscaba un hombre honesto con una lámpara de día.", key_ideas: ["Ascetismo Extremo", "Parrhesia", "Cosmopolitismo"], icon: "ph-dog" },
    { id: "antisthenes", name: "Antístenes", dates: "445-365 a.C.", role: "El Fundador", school: "Cinismo", desc: "Alumno de Sócrates. Enseñó que la virtud es suficiente para la felicidad.", key_ideas: ["Autarquía", "Esfuerzo Voluntario"], icon: "ph-hand-fist" },
    { id: "crates", name: "Crates", dates: "365-285 a.C.", role: "El Abrepuertas", school: "Cinismo", desc: "Regaló su fortuna para ser libre. Conocido como el médico de almas.", key_ideas: ["Filantropía", "Libertad", "Matrimonio Filosófico"], icon: "ph-door-open" },
    { id: "hipparchia", name: "Hiparquía", dates: "350-280 a.C.", role: "La Rebelde", school: "Cinismo", desc: "Mujer aristócrata que eligió la vida de mendiga por amor a la filosofía.", key_ideas: ["Igualdad Intelectual", "Elección de Vida"], icon: "ph-flower" },

    // EPICUREISMO
    { id: "epicuro", name: "Epicuro", dates: "341-270 a.C.", role: "El del Jardín", school: "Epicureísmo", desc: "Fundó una comunidad igualitaria. Buscaba placeres sencillos y amistad.", key_ideas: ["Ataraxia", "Amistad", "Tetrapharmakos"], icon: "ph-wine" },
    { id: "lucretius", name: "Lucrecio", dates: "99-55 a.C.", role: "El Poeta", school: "Epicureísmo", desc: "Escribió 'De la naturaleza de las cosas', explicando el atomismo en verso.", key_ideas: ["Atomismo", "Mortalidad del Alma", "Sin Miedo a Dioses"], icon: "ph-atom" },

    // PLATONISMO / ARISTOTELISMO / SOCRÁTICOS
    { id: "socrates", name: "Sócrates", dates: "470-399 a.C.", role: "El Tábano", school: "Socrático", desc: "Padre de la ética occidental. Murió por la verdad antes que ceder.", key_ideas: ["Solo sé que no sé nada", "Mayéutica", "Demonio Socrático"], icon: "ph-chat-centered-text" },
    { id: "plato", name: "Platón", dates: "427-347 a.C.", role: "El Filósofo", school: "Platonismo", desc: "Fundador de la Academia. Teoría de las Formas o Ideas.", key_ideas: ["Mundo Ideal", "Rey Filósofo", "Alegoría de la Caverna"], icon: "ph-shapes" },
    { id: "aristotle", name: "Aristóteles", dates: "384-322 a.C.", role: "El Maestro", school: "Aristotelismo", desc: "El gran científico y lógico. Tutor de Alejandro Magno.", key_ideas: ["Justo Medio", "Eudaimonia", "Lógica"], icon: "ph-compass" },
    { id: "plutarch", name: "Plutarco", dates: "46-120 d.C.", role: "El Biógrafo", school: "Platonismo", desc: "Sacerdote de Delfos. Sus 'Vidas Paralelas' inspiraron a siglos de líderes.", key_ideas: ["Moralidad", "Historia como Maestra"], icon: "ph-book-bookmark" },
    { id: "hypatia", name: "Hipatia", dates: "360-415 d.C.", role: "La Mártir", school: "Neoplatonismo", desc: "Brillante matemática y astrónoma de Alejandría asesinada por una turba.", key_ideas: ["Astronomía", "Razón vs Fanatismo"], icon: "ph-star" },
    { id: "boethius", name: "Boecio", dates: "480-524 d.C.", role: "El Cónsul", school: "Neoplatonismo", desc: "Escribió 'La Consolación de la Filosofía' esperando su ejecución.", key_ideas: ["Rueda de la Fortuna", "Providencia"], icon: "ph-hourglass" },
    { id: "plotinus", name: "Plotino", dates: "204-270 d.C.", role: "El Místico", school: "Neoplatonismo", desc: "Fundador del neoplatonismo. Buscaba la unión extática con el Uno.", key_ideas: ["Contemplación", "El Uno", "Emanación"], icon: "ph-sun" },

    // ESCEPTICISMO
    { id: "pyrrho", name: "Pirrón", dates: "360-270 a.C.", role: "El Indiferente", school: "Escepticismo", desc: "Viajó a la India con Alejandro. Enseñó la suspensión del juicio.", key_ideas: ["Acatalepsia", "Silencio", "Indiferencia"], icon: "ph-question" },
    { id: "sextus", name: "Sexto Empírico", dates: "160-210 d.C.", role: "El Médico", school: "Escepticismo", desc: "Recopiló los argumentos escépticos. La duda como medicina.", key_ideas: ["Epoché", "Isostheneia"], icon: "ph-first-aid" },
    { id: "montaigne", name: "Montaigne", dates: "1533-1592", role: "El Ensayista", school: "Humanismo", desc: "Retirado en su torre, se estudió a sí mismo con honestidad brutal.", key_ideas: ["¿Qué sé yo?", "Introspección", "Tolerancia"], icon: "ph-feather" },

    // MODERNOS / PSICOLOGÍA
    { id: "spinoza", name: "Spinoza", dates: "1632-1677", role: "El Racionalista", school: "Racionalismo", desc: "Pulidor de lentes. Veía a Dios y la Naturaleza como lo mismo.", key_ideas: ["Deus sive Natura", "Amor Dei Intellectualis"], icon: "ph-eye-glasses" },
    { id: "nietzsche", name: "Nietzsche", dates: "1844-1900", role: "El Vitalista", school: "Existencialismo", desc: "El filósofo del martillo. Desafió la moralidad de su tiempo.", key_ideas: ["Superhombre", "Eterno Retorno", "Amor Fati"], icon: "ph-lightning" },
    { id: "frankl", name: "Viktor Frankl", dates: "1905-1997", role: "El Psiquiatra", school: "Logoterapia", desc: "Sobreviviente del Holocausto. 'El hombre en busca de sentido'.", key_ideas: ["Voluntad de Sentido", "Libertad Última"], icon: "ph-bird" },
    { id: "ellis", name: "Albert Ellis", dates: "1913-2007", role: "El Psicólogo", school: "TCC / Estoicismo", desc: "Creó la Terapia Racional Emotiva basada en Epicteto.", key_ideas: ["Creencias Irracionales", "Modelo ABC"], icon: "ph-brain" },
    { id: "hadot", name: "Pierre Hadot", dates: "1922-2010", role: "El Historiador", school: "Estoicismo Moderno", desc: "Redescubrió la filosofía antigua como una forma de vida, no teoría.", key_ideas: ["Ejercicios Espirituales", "Filosofía como Vida"], icon: "ph-book-open-text" },
    { id: "camus", name: "Camus", dates: "1913-1960", role: "El Rebelde", school: "Absurdismo", desc: "Encontró la felicidad en la lucha contra el absurdo de la vida.", key_ideas: ["El Absurdo", "Rebelión", "Sísifo"], icon: "ph-mask-happy" },
    { id: "thoreau", name: "Thoreau", dates: "1817-1862", role: "El Salvaje", school: "Trascendentalismo", desc: "Se fue a los bosques para vivir deliberadamente.", key_ideas: ["Simplicidad", "Desobediencia Civil", "Naturaleza"], icon: "ph-tree" },
    { id: "emerson", name: "Emerson", dates: "1803-1882", role: "El Sabio", school: "Trascendentalismo", desc: "El profeta de la autosuficiencia americana.", key_ideas: ["Autoconfianza", "Alma Suprema"], icon: "ph-sun-dim" },
    { id: "jung", name: "Carl Jung", dates: "1875-1961", role: "El Alquimista", school: "Psicología", desc: "Exploró los mitos y el inconsciente colectivo.", key_ideas: ["Sombra", "Individuación", "Arquetipos"], icon: "ph-yin-yang" },
    { id: "krishnamurti", name: "Krishnamurti", dates: "1895-1986", role: "El Libre", school: "Librepensamiento", desc: "Rechazó ser un gurú. 'La verdad es una tierra sin caminos'.", key_ideas: ["Observación sin Juicio", "Libertad Total"], icon: "ph-eye" },
    { id: "stockdale", name: "Stockdale", dates: "1923-2005", role: "El Guerrero", school: "Estoicismo", desc: "Usó a Epicteto para sobrevivir 7 años en Vietnam.", key_ideas: ["Paradoja Stockdale", "Aguante"], icon: "ph-medal-military" },
    { id: "taleb", name: "Nassim Taleb", dates: "1960-", role: "El Escéptico", school: "Incerto", desc: "Matemático y ensayista sobre el riesgo y la incertidumbre.", key_ideas: ["Antifragilidad", "Cisne Negro", "Vía Negativa"], icon: "ph-chart-bar" },

    // ORIENTALES / ANTIGUOS
    { id: "buda", name: "Buda", dates: "s. V a.C.", role: "El Despierto", school: "Budismo", desc: "Príncipe que renunció a todo para encontrar el fin del sufrimiento.", key_ideas: ["Nirvana", "Cuatro Nobles Verdades", "Vacuidad"], icon: "ph-lotus" },
    { id: "laotse", name: "Lao Tse", dates: "s. VI a.C.", role: "El Viejo", school: "Taoísmo", desc: "Autor mítico del Tao Te Ching. Defensor de la no-acción.", key_ideas: ["Wu Wei", "El Tao", "Humildad del Agua"], icon: "ph-wind" },
    { id: "heraclitus", name: "Heráclito", dates: "535-475 a.C.", role: "El Oscuro", school: "Presocrático", desc: "El filósofo del cambio constante.", key_ideas: ["Fuego", "Logos", "Panta Rhei"], icon: "ph-fire" },
    { id: "musashi", name: "Miyamoto Musashi", dates: "1584-1645", role: "El Ronin", school: "Bushido", desc: "El santo de la espada. Autor de 'El Libro de los Cinco Anillos'.", key_ideas: ["Disciplina", "Vacío", "Estrategia"], icon: "ph-sword" },
    { id: "confucius", name: "Confucio", dates: "551-479 a.C.", role: "El Maestro", school: "Confucianismo", desc: "Buscó restaurar el orden social a través de la rectitud moral.", key_ideas: ["Ren (Benevolencia)", "Li (Rito)", "Piedad Filial"], icon: "ph-scroll" }
];
