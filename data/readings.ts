
import { Reading } from '../types';

export const STOIC_DB: Reading[] = [
    // MARCO AURELIO (Expandido)
    {t:"La Ciudadela", q:"La mente sin pasiones es una fortaleza.", b:"No busques retiros externos. Tienes en ti mismo un refugio al que puedes retirarte siempre.", a:"Marco Aurelio", k:["Paz", "Refugio"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"El Obstáculo", q:"El impedimento a la acción avanza la acción.", b:"Lo que se interpone en el camino se convierte en el camino.", a:"Marco Aurelio", k:["Resiliencia"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Vista de Pájaro", q:"Piensa en la sustancia universal.", b:"Mira tus problemas desde las estrellas. Son polvo.", a:"Marco Aurelio", k:["Perspectiva"], type: 'ejercicio', philosophy: 'Estoicismo'},
    {t:"Cambio", q:"El universo es cambio; la vida es opinión.", b:"Nada es estable. Acéptalo.", a:"Marco Aurelio", k:["Cambio"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Simpatía", q:"Lo que no beneficia a la colmena, no beneficia a la abeja.", b:"Estamos conectados.", a:"Marco Aurelio", k:["Sociedad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Venganza", q:"La mejor venganza es no ser como tu enemigo.", b:"Si odias, pierdes.", a:"Marco Aurelio", k:["Venganza"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Levántate", q:"Al amanecer, dite: 'Me levanto para hacer el trabajo de un hombre'.", b:"¿Naciste para estar caliente bajo las mantas?", a:"Marco Aurelio", k:["Disciplina"], type: 'ejercicio', philosophy: 'Estoicismo'},
    {t:"Opinión", q:"Valoramos más la opinión ajena que la propia.", b:"Extraña contradicción del ego.", a:"Marco Aurelio", k:["Validación"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Presente", q:"Confina el presente.", b:"No sufras por el futuro. Enfréntalo cuando llegue.", a:"Marco Aurelio", k:["Presente"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Aceptación", q:"Ama a las personas con las que el destino te junta.", b:"Pero hazlo con todo tu corazón.", a:"Marco Aurelio", k:["Amor Fati"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Belleza", q:"Todo lo que sucede justamente es bello.", b:"Observa la belleza incluso en lo que envejece, como el pan que se agrieta.", a:"Marco Aurelio", k:["Belleza"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Fama", q:"Pronto nos olvidarán, y pronto olvidaremos.", b:"La fama es un río vacío.", a:"Marco Aurelio", k:["Humildad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Ofensa", q:"Rechaza la sensación de haber sido ofendido y la ofensa desaparecerá.", b:"Es tu juicio lo que duele, no el acto.", a:"Marco Aurelio", k:["Juicio"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Rectitud", q:"Si no es correcto, no lo hagas; si no es verdad, no lo digas.", b:"La integridad es binaria.", a:"Marco Aurelio", k:["Integridad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Tolerancia", q:"Sé estricto contigo mismo y tolerante con los demás.", b:"Exígete a ti, perdona a otros.", a:"Marco Aurelio", k:["Empatía"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Mortalidad", q:"Podrías dejar la vida ahora mismo.", b:"Deja que eso determine lo que haces, dices y piensas.", a:"Marco Aurelio", k:["Memento Mori"], type: 'ejercicio', philosophy: 'Estoicismo'},

    // EPICTETO (Expandido)
    {t:"Control", q:"De las cosas, unas dependen de nosotros y otras no.", b:"Juicio y deseo son tuyos. Cuerpo y fama no.", a:"Epicteto", k:["Control"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Juicios", q:"No son las cosas las que atormentan, sino las opiniones.", b:"La muerte no es terrible, el juicio sobre ella sí.", a:"Epicteto", k:["Juicio"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Banquete", q:"La vida es un banquete.", b:"Toma con moderación lo que pasa frente a ti. No anheles lo que no llega.", a:"Epicteto", k:["Moderación"], type: 'parabola', philosophy: 'Estoicismo'},
    {t:"Insultos", q:"Si hablan mal de ti, no te excuses.", b:"Di: 'No conocen mis otros defectos'.", a:"Epicteto", k:["Humildad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Encarnar", q:"No expliques tu filosofía. Encárnala.", b:"No digas cómo se come, come bien.", a:"Epicteto", k:["Acción"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Actor", q:"Eres un actor en una obra.", b:"Tu papel lo elige otro. Tu deber es actuarlo bien.", a:"Epicteto", k:["Rol"], type: 'parabola', philosophy: 'Estoicismo'},
    {t:"Dos Asas", q:"Todo tiene dos asas.", b:"Si tu hermano te ofende, tómalo por el asa del amor fraternal, no de la ofensa.", a:"Epicteto", k:["Perspectiva"], type: 'ejercicio', philosophy: 'Estoicismo'},
    {t:"Invencible", q:"Es invencible quien no se perturba por nada ajeno.", b:"Ni el oro ni el poder vencen a la voluntad libre.", a:"Epicteto", k:["Fuerza"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Culpa", q:"El ignorante culpa a otros. El sabio a nadie.", b:"Asume responsabilidad radical.", a:"Epicteto", k:["Responsabilidad"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Deseo", q:"La libertad no se logra satisfaciendo el deseo, sino eliminándolo.", b:"Quien menos necesita es más libre.", a:"Epicteto", k:["Deseo"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Crecimiento", q:"Si quieres progresar, soporta parecer estúpido en cosas externas.", b:"Deja que otros crean que saben más.", a:"Epicteto", k:["Humildad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Escucha", q:"Tenemos dos oídos y una boca para escuchar el doble de lo que hablamos.", b:"El silencio es maestro.", a:"Epicteto", k:["Silencio"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Libertad", q:"Nadie es libre si no es dueño de sí mismo.", b:"La esclavitud mental es la peor prisión.", a:"Epicteto", k:["Libertad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Hábito", q:"Cualquier cosa que quieras hacer hábito, hazla; lo que no, no lo hagas.", b:"Somos lo que repetimos.", a:"Epicteto", k:["Hábito"], type: 'reflexion', philosophy: 'Estoicismo'},

    // SÉNECA (Expandido)
    {t:"Tiempo", q:"No es que tengamos poco tiempo, es que perdemos mucho.", b:"La vida es larga si se usa bien.", a:"Séneca", k:["Tiempo"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Miedos", q:"Sufrimos más en la imaginación que en la realidad.", b:"El miedo exagera todo.", a:"Séneca", k:["Ansiedad"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Riqueza", q:"El sabio prefiere la riqueza pero no la necesita.", b:"La tiene en su casa, no en su alma.", a:"Séneca", k:["Riqueza"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Amistad", q:"Decide ser amigo, luego confía totalmente.", b:"Habla con él como contigo mismo.", a:"Séneca", k:["Amistad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Muerte Diaria", q:"Morimos cada día.", b:"El tiempo pasado pertenece a la muerte.", a:"Séneca", k:["Muerte"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Lectura", q:"Nútrete de pocos autores.", b:"Estar en todas partes es no estar en ninguna.", a:"Séneca", k:["Foco"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Ira", q:"La ira es una locura breve.", b:"Te daña más a ti que a tu enemigo.", a:"Séneca", k:["Ira"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Pobreza", q:"Pobre es el que desea más.", b:"La naturaleza pide poco.", a:"Séneca", k:["Suficiencia"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Retiro", q:"Retírate a ti mismo.", b:"Mejórate a ti mismo y a quienes te rodean.", a:"Séneca", k:["Soledad"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Libertad", q:"Libertad es no temer a nada.", b:"Dominio absoluto de uno mismo.", a:"Séneca", k:["Libertad"], type: 'reflexion', philosophy: 'Estoicismo'},
    {t:"Viajes", q:"Llevas a tu enemigo contigo.", b:"Viajar no cura el alma porque te llevas a ti mismo.", a:"Séneca", k:["Viaje"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Suerte", q:"Suerte es lo que sucede cuando la preparación encuentra a la oportunidad.", b:"No esperes, prepárate.", a:"Séneca", k:["Suerte"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Dificultad", q:"El fuego prueba el oro; la miseria, a los hombres fuertes.", b:"La adversidad es tu entrenamiento.", a:"Séneca", k:["Resiliencia"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Inicio", q:"El comienzo es la mitad del todo.", b:"Solo empieza. El resto sigue.", a:"Séneca", k:["Acción"], type: 'cita', philosophy: 'Estoicismo'},
    {t:"Enseñanza", q:"Mientras enseñamos, aprendemos.", b:"Comparte tu sabiduría para entenderla mejor.", a:"Séneca", k:["Aprendizaje"], type: 'cita', philosophy: 'Estoicismo'},

    // CONFUCIO
    {t:"Errores", q:"Exígete mucho a ti mismo y espera poco de los demás.", b:"Así te ahorrarás disgustos.", a:"Confucio", k:["Relaciones"], type: 'cita', philosophy: 'Confucianismo'},
    {t:"Venganza", q:"Antes de embarcarte en un viaje de venganza, cava dos tumbas.", b:"Una para tu enemigo, otra para ti.", a:"Confucio", k:["Ira"], type: 'cita', philosophy: 'Confucianismo'},
    {t:"Rectificación", q:"Si los nombres no son correctos, el lenguaje no está de acuerdo con la verdad de las cosas.", b:"Llama a las cosas por su nombre.", a:"Confucio", k:["Verdad"], type: 'reflexion', philosophy: 'Confucianismo'},
    {t:"Montaña", q:"El hombre que mueve una montaña comienza cargando pequeñas piedras.", b:"La constancia vence a la fuerza.", a:"Confucio", k:["Perseverancia"], type: 'cita', philosophy: 'Confucianismo'},

    // CICERÓN
    {t:"Seis Errores", q:"La ilusión de que la ganancia personal se logra aplastando a otros.", b:"Error humano fundamental.", a:"Cicerón", k:["Justicia"], type: 'reflexion', philosophy: 'Eclecticismo'},
    {t:"Gratitud", q:"La gratitud no es solo la mayor virtud, sino madre de todas.", b:"Agradece y serás virtuoso.", a:"Cicerón", k:["Gratitud"], type: 'cita', philosophy: 'Eclecticismo'},
    {t:"Vejez", q:"La cosecha de la vejez es el recuerdo y la abundancia de bendiciones.", b:"No temas envejecer.", a:"Cicerón", k:["Vejez"], type: 'cita', philosophy: 'Eclecticismo'},
    {t:"Amistad", q:"La vida no es vida sin amistad.", b:"Es el sol de la existencia.", a:"Cicerón", k:["Amistad"], type: 'cita', philosophy: 'Eclecticismo'},
    {t:"Jardín", q:"Si tienes un jardín y una biblioteca, tienes todo lo necesario.", b:"La cultura y la naturaleza bastan.", a:"Cicerón", k:["Suficiencia"], type: 'cita', philosophy: 'Eclecticismo'},

    // OTROS MAESTROS
    {t:"Deseo Naval", q:"El deseo es un contrato que haces contigo mismo para ser infeliz hasta obtener lo que quieres.", b:"Rompe el contrato.", a:"Naval Ravikant", k:["Deseo"], type: 'cita', philosophy: 'Estoicismo Moderno'},
    {t:"Felicidad", q:"La felicidad es lo que queda cuando eliminas el deseo de que algo falte.", b:"Es un estado de paz, no de euforia.", a:"Naval Ravikant", k:["Felicidad"], type: 'reflexion', philosophy: 'Estoicismo Moderno'},
    {t:"Mariposa", q:"¿Era Zhuangzi soñando que era una mariposa, o una mariposa soñando que era Zhuangzi?", b:"La realidad es relativa.", a:"Zhuangzi", k:["Perspectiva"], type: 'parabola', philosophy: 'Taoísmo'},
    {t:"Inutilidad", q:"Todos conocen la utilidad de lo útil, pero nadie conoce la utilidad de lo inútil.", b:"Un árbol retorcido vive más porque nadie lo tala.", a:"Zhuangzi", k:["Utilidad"], type: 'reflexion', philosophy: 'Taoísmo'},
    {t:"Rechazo", q:"Me entreno para ser rechazado.", b:"Diógenes pedía a estatuas para endurecerse.", a:"Diógenes", k:["Rechazo"], type: 'ejercicio', philosophy: 'Cinismo'},
    {t:"Sol", q:"Apártate, me tapas el sol.", b:"La verdadera riqueza es no necesitar al emperador.", a:"Diógenes", k:["Autarquía"], type: 'parabola', philosophy: 'Cinismo'},
    {t:"Oculto", q:"Vive oculto.", b:"La fama es prisión. Cultiva tu jardín.", a:"Epicuro", k:["Privacidad"], type: 'cita', philosophy: 'Epicureísmo'},
    {t:"Muerte Epicúrea", q:"Cuando somos, la muerte no es.", b:"No temas a la nada.", a:"Epicuro", k:["Muerte"], type: 'reflexion', philosophy: 'Epicureísmo'},
    {t:"Duda", q:"No afirmo, solo informo.", b:"La suspensión del juicio trae paz.", a:"Sexto Empírico", k:["Duda"], type: 'reflexion', philosophy: 'Escepticismo'},
    {t:"Río", q:"Nadie se baña dos veces en el mismo río.", b:"Todo cambia.", a:"Heráclito", k:["Impermanencia"], type: 'cita', philosophy: 'Presocrático'},
    {t:"Carácter", q:"El carácter es el destino.", b:"Tu ethos define tu futuro.", a:"Heráclito", k:["Carácter"], type: 'cita', philosophy: 'Presocrático'},
    {t:"Invisible", q:"¿Serías justo si fueras invisible?", b:"La integridad es actuar bien sin público.", a:"Platón", k:["Integridad"], type: 'ejercicio', philosophy: 'Platonismo'},
    {t:"Medio", q:"La virtud es el punto medio.", b:"Entre cobardía y temeridad está el valor.", a:"Aristóteles", k:["Equilibrio"], type: 'reflexion', philosophy: 'Aristotelismo'},
    {t:"Fortuna", q:"La fortuna no quita lo que no dio.", b:"La virtud es inalienable.", a:"Boecio", k:["Fortuna"], type: 'cita', philosophy: 'Neoplatonismo'},
    {t:"Exilio", q:"¿Me quitan mi patria? Me dan el mundo.", b:"El sabio es cosmopolita.", a:"Musonio Rufo", k:["Cosmopolitismo"], type: 'cita', philosophy: 'Estoicismo'},
    
    // ORIENTALES
    {t:"Flecha", q:"La segunda flecha es opcional.", b:"El dolor físico es inevitable, el sufrimiento mental es elección.", a:"Buda", k:["Dolor"], type: 'parabola', philosophy: 'Budismo'},
    {t:"Vacío", q:"La forma es vacío.", b:"Todo es interdependiente.", a:"Sutra Corazón", k:["Vacuidad"], type: 'reflexion', philosophy: 'Budismo'},
    {t:"Wu Wei", q:"Actúa sin actuar.", b:"Fluye con la naturaleza, no fuerces.", a:"Lao Tse", k:["Flujo"], type: 'cita', philosophy: 'Taoísmo'},
    {t:"Agua", q:"Sé como el agua.", b:"Gana cediendo, ocupa el lugar bajo.", a:"Lao Tse", k:["Humildad"], type: 'reflexion', philosophy: 'Taoísmo'},
    {t:"Suerte", q:"¿Buena o mala suerte? Quién sabe.", b:"No juzgues los eventos prematuramente.", a:"Taoísmo", k:["Juicio"], type: 'parabola', philosophy: 'Taoísmo'},
    {t:"Utilidad", q:"No hagas nada que no sea útil.", b:"Elimina lo superfluo.", a:"Miyamoto Musashi", k:["Disciplina"], type: 'cita', philosophy: 'Bushido'},
    {t:"Camino", q:"Conoce el camino y lo verás en todas las cosas.", b:"La maestría en una cosa se transfiere a todo.", a:"Miyamoto Musashi", k:["Maestría"], type: 'cita', philosophy: 'Bushido'},

    // MODERNOS
    {t:"Amor Fati", q:"No querer nada distinto.", b:"Amar lo que sucede es grandeza.", a:"Nietzsche", k:["Destino"], type: 'cita', philosophy: 'Existencialismo'},
    {t:"Retorno", q:"¿Vivirías esto otra vez?", b:"Si no, cambia tu vida.", a:"Nietzsche", k:["Vida"], type: 'ejercicio', philosophy: 'Existencialismo'},
    {t:"Verano", q:"Un verano invencible.", b:"Dentro hay algo más fuerte que el invierno.", a:"Camus", k:["Esperanza"], type: 'cita', philosophy: 'Absurdismo'},
    {t:"Sísifo", q:"Sísifo feliz.", b:"La lucha basta para llenar el corazón.", a:"Camus", k:["Esfuerzo"], type: 'reflexion', philosophy: 'Absurdismo'},
    {t:"Libertad", q:"La última libertad es la actitud.", b:"Nadie puede quitarte tu respuesta.", a:"Viktor Frankl", k:["Actitud"], type: 'reflexion', philosophy: 'Logoterapia'},
    {t:"Simple", q:"¡Simplicidad, simplicidad!", b:"Reduce tus necesidades.", a:"Thoreau", k:["Minimalismo"], type: 'cita', philosophy: 'Trascendentalismo'},
    {t:"Justicia", q:"El lugar del justo es la cárcel.", b:"Desobedece leyes injustas.", a:"Thoreau", k:["Justicia"], type: 'cita', philosophy: 'Trascendentalismo'},
    {t:"Confianza", q:"Confía en ti mismo.", b:"La imitación es suicidio.", a:"Emerson", k:["Autenticidad"], type: 'cita', philosophy: 'Trascendentalismo'},
    {t:"Antifrágil", q:"Mejora con el caos.", b:"No solo resistas, crece con el golpe.", a:"Nassim Taleb", k:["Caos"], type: 'concepto', philosophy: 'Incerto'},
    {t:"Stockdale", q:"Fe y Brutalidad.", b:"Ten fe en el final, pero enfrenta la cruda realidad hoy.", a:"Stockdale", k:["Realismo"], type: 'concepto', philosophy: 'Estoicismo'},
    {t:"Sombra", q:"Haz consciente la oscuridad.", b:"Iluminarse es integrar la sombra.", a:"Carl Jung", k:["Sombra"], type: 'cita', philosophy: 'Psicología'},
    {t:"Agua", q:"Esto es agua.", b:"Decide qué tiene sentido en la rutina.", a:"D.F. Wallace", k:["Atención"], type: 'reflexion', philosophy: 'Contemporánea'},
    {t:"Creencias", q:"No son los hechos, son tus creencias sobre ellos.", b:"Cambia tu creencia, cambias tu emoción.", a:"Albert Ellis", k:["Mente"], type: 'cita', philosophy: 'TCC'},
    
    // CORTAS / EXTRAS
    {t:"Silencio", q:"Mejora el silencio o calla.", b:"El silencio es sabio.", a:"Pitágoras", k:["Silencio"], type: 'cita', philosophy: 'Pitagorismo'},
    {t:"Valentía", q:"La fortuna favorece a los valientes.", b:"El miedo paraliza.", a:"Virgilio", k:["Coraje"], type: 'cita', philosophy: 'Poesía'},
    {t:"Kintsugi", q:"Tus heridas son oro.", b:"Repara con oro, embellece la cicatriz.", a:"Japón", k:["Resiliencia"], type: 'concepto', philosophy: 'Zen'},
    {t:"Hechos", q:"Bien hecho es mejor que bien dicho.", b:"Actúa.", a:"Franklin", k:["Acción"], type: 'cita', philosophy: 'Pragmatismo'},
    {t:"Espejo", q:"El mundo te refleja.", b:"Si sonríes, sonríe.", a:"Zen", k:["Reflejo"], type: 'cita', philosophy: 'Zen'},
    {t:"Jardín", q:"Debes cultivar tu jardín.", b:"Ocúpate de lo tuyo.", a:"Voltaire", k:["Trabajo"], type: 'cita', philosophy: 'Ilustración'},
    {t:"Enemigos", q:"El hombre sabio aprende de sus enemigos.", b:"Ellos te dicen la verdad.", a:"Aristófanes", k:["Aprendizaje"], type: 'cita', philosophy: 'Comedia'}
];
