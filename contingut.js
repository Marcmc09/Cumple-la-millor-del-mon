/*
 * EL REGAL DE LA BERTA — CONTINGUT PERSONAL
 * Versió 0.2 · postal, cinema i Memory
 *
 * Aquest arxiu conté les dades; no és una pàgina que es pugui obrir sola.
 * index.html el carregarà abans d'app.js. No cal instal·lar cap paquet.
 *
 * COM EDITAR-LO
 * - Canvia el text dins de les cometes dobles. Mantén les comes i les claus.
 * - Pots escriure apòstrofs directament: "T'estimo".
 * - Si vols cometes dins d'un text, fes servir «aquestes».
 * - [PENDENT: ...] indica un text que encara hem de preparar.
 * - Cada entrada de paragrafs és un paràgraf separat. Pots afegir-ne més.
 * - Els textos són text pla: no cal posar-hi etiquetes HTML.
 * - No canviïs els id un cop estrenada la web: identifiquen els records,
 *   les cartes, els preferits i les respostes desades.
 *
 * FOTOS
 * - Guarda els fitxers a fotos/ i afegeix-los a la llista fotos.
 * - foto: "altafulla" fa referència a l'id, no al nom del fitxer.
 * - foto: null vol dir que encara no hi ha cap fotografia assignada.
 * - Respecta majúscules, minúscules i extensió a les rutes dels fitxers.
 *
 * IMPORTANT
 * - Els exemples de les proves NO són records vostres inventats.
 * - Aquest fitxer no desa ni envia res per si sol: això correspon a app.js.
 * - No hi posis contrasenyes ni claus privades. El contingut d'una web
 *   estàtica es pot consultar des del navegador.
 */

window.CONTINGUT = {
  // 1. DADES GENERALS I BENVINGUDA
  nom: "Berta",
  edat: 17,
  data: "30 · 09", // Etiqueta visual: no programa l'obertura de la web.
  benvinguda: "Una mica de nosaltres, per tenir-nos sempre a prop.",
  signatura: "El teu bebe marc",

  // false amagarà l'avís de prova; NO substituirà els textos pendents.
  provisional: false,

  // Pendent de configurar i provar. Buit = cap destinació configurada.
  // Aquí només anirà l'adreça pública del formulari, MAI una clau secreta.
  formEndpoint: "https://formspree.io/f/mjykanra",

  // 2. FOTOGRAFIES
  // Catàleg de TOTES les fotos: cartes, portada, plans i àlbum.
  // La llista album de sota decideix quines apareixen a la galeria.
  // text: peu de foto opcional. alt: descripció per a lectors de pantalla.
  // La foto d'Altafulla és l'única assignada en aquesta primera versió.
  fotos: [
    {
  id: "foto001",
  src: "fotos/001.jpeg",
  text: "Una de les vegades que hem anat a Altafulla junts",
  alt: "Una foto de nosaltres dos, quan vem anar a Altafulla",
},
{
  id: "foto002",
  src: "fotos/002.jpeg",
  text: "Felfie per santorini",
  alt: "",
},
{
  id: "foto003",
  src: "fotos/003.jpeg",
  text: "Una tarda qualsevol",
  alt: "",
},
{
  id: "foto004",
  src: "fotos/004.jpeg",
  text: "La millor foto a Santorini",
  alt: "",
},
{
  id: "foto005",
  src: "fotos/005.jpeg",
  text: "Cocoaaa",
  alt: "",
},
{
  id: "foto006",
  src: "fotos/006.jpeg",
  text: "Posant-nos guapos",
  alt: "",
},
{
  id: "foto007",
  src: "fotos/007.jpeg",
  text: "Mola molt aquesta foto",
  alt: "",
},
{
  id: "foto008",
  src: "fotos/008.jpeg",
  text: "Dos guapos al cotxe",
  alt: "",
},
{
  id: "foto009",
  src: "fotos/009.jpeg",
  text: "El castell de Altafulla",
  alt: "",
},
{
  id: "foto010",
  src: "fotos/010.jpeg",
  text: "Un moment qualsevol a Roses",
  alt: "",
},
{
  id: "foto011",
  src: "fotos/011.jpeg",
  text: "Amb aquesta sudadera estas més guapa",
  alt: "",
},
{
  id: "foto012",
  src: "fotos/012.jpeg",
  text: "Aquells dimarts despres del insti",
  alt: "",
},
{
  id: "foto013",
  src: "fotos/013.jpeg",
  text: "Som lleons",
  alt: "",
},
{
  id: "foto014",
  src: "fotos/014.jpeg",
  text: "Gaudint del cel i primera vegada dormint junts",
  alt: "",
},
{
  id: "foto015",
  src: "fotos/015.jpeg",
  text: "El masnou i el seu atardecer",
  alt: "",
},
{
  id: "foto016",
  src: "fotos/016.jpeg",
  text: "Aix que asco",
  alt: "",
},
{
  id: "foto017",
  src: "fotos/017.jpeg",
  text: "Que bonic es santorini",
  alt: "",
},
{
  id: "foto050",
  src: "fotos/050.jpeg",
  text: "Puntos negrooss",
  alt: "",
},
{
  id: "foto051",
  src: "fotos/051.jpeg",
  text: "Dos guapos per Altafulla",
  alt: "",
},
{
  id: "foto052",
  src: "fotos/052.jpeg",
  text: "Dos guiris per Barcelona",
  alt: "",
},
{
  id: "foto053",
  src: "fotos/053.jpeg",
  text: "Amb el Pauuuuu",
  alt: "",
},
{
  id: "foto054",
  src: "fotos/054.jpeg",
  text: "Foto maddre a Santorini",
  alt: "",
},
{
  id: "foto055",
  src: "fotos/055.jpeg",
  text: "Conduint el nostre yate",
  alt: "",
},
{
  id: "foto056",
  src: "fotos/056.jpeg",
  text: "Que guapa anaves",
  alt: "",
},
{
  id: "foto057",
  src: "fotos/057.jpeg",
  text: "Primera i ultima vegada sent mes alta que jo",
  alt: "",
},
{
  id: "foto058",
  src: "fotos/058.jpeg",
  text: "La family felfie (falta el rulas)",
  alt: "",
},
{
  id: "foto059",
  src: "fotos/059.jpeg",
  text: "Roseeesssss",
  alt: "",
},
{
  id: "foto060",
  src: "fotos/060.jpeg",
  text: "Foto padre en un dia molt especial",
  alt: "",
},
{
  id: "foto061",
  src: "fotos/061.jpeg",
  text: "Un dia molt especial",
  alt: "",
},
{
  id: "foto062",
  src: "fotos/062.jpeg",
  text: "La calle",
  alt: "",
},
{
  id: "foto063",
  src: "fotos/063.jpeg",
  text: "Dormint com sempre bebe",
  alt: "",
},
{
  id: "foto064",
  src: "fotos/064.jpeg",
  text: "Vaya dos quesitos",
  alt: "",
},
{
  id: "foto065",
  src: "fotos/065.jpeg",
  text: "Que tontos",
  alt: "",
},
{
  id: "foto066",
  src: "fotos/066.jpeg",
  text: "Despres de caminar 20 km",
  alt: "",
},
{
  id: "foto067",
  src: "fotos/067.jpeg",
  text: "Que guai va ser",
  alt: "",
},
{
  id: "foto068",
  src: "fotos/068.jpeg",
  text: "Las flors roses i dos randoms al costat",
  alt: "",
},
{
  id: "foto069",
  src: "fotos/069.jpeg",
  text: "Quina tableta de xocolata més bona",
  alt: "",
},
{
  id: "foto070",
  src: "fotos/070.jpeg",
  text: "Dos guapos per Roses",
  alt: "",
},
    // Exemple per afegir una foto quan tinguis el fitxer:
    // { id: "foto019", src: "fotos/019.jpeg", text: "", alt: "Un record nostre" },
  ],

  // Portada del racó: assigna "foto002" quan incorporis fotos/002.jpeg.
  // null mostra una il·lustració de paper sense repetir la foto del puzle.
  racoFoto: "foto017",

  // ÀLBUM: posa els id de les seves fotos, en l'ordre que prefereixis.
  // Exemple: ["foto019", "foto020", "foto021"]. Quantitat lliure.
  // Les fotos assignades a cartes, puzle, portada o plans es reserven
  // per a aquells apartats i no es mostren a l'àlbum ni al cinema.
album: [
  "foto001",
  "foto002",
  "foto003",
  "foto004",
  "foto005",
  "foto006",
  "foto007",
  "foto008",
  "foto009",
  "foto010",
  "foto011",
  "foto012",
  "foto013",
  "foto014",
  "foto015",
  "foto016",
  "foto050",
  "foto051",
  "foto052",
  "foto053",
  "foto054",
  "foto055",
  "foto056",
  "foto057",
  "foto058",
  "foto059",
  "foto060",
  "foto061",
  "foto062",
  "foto063",
  "foto064",
  "foto065",
  "foto066",
  "foto067",
  "foto068",
  "foto069",
  "foto070",
],

  // Memory: 9 fotos úniques de TOT el catàleg, 18 cartes per partida.
  // Cal incorporar almenys 9 fotos diferents per jugar amb fotos reals.
  // Amb provisional: true, es pot provar amb símbols de mostra mentre falten.
  // La postal també permet escollir qualsevol foto del catàleg.

  // 3. LES SIS PROVES
  // Mantén sis proves i sis sobres en el mateix ordre.
  proves: [
    "Peça a peça",
    "Te’n recordes?",
    "Qui ho va dir?",
    "Només nosaltres",
    "I tu?",
    "Ens queda pendent…",
  ],

  // PROVA 1 · Puzle de nou peces. Foto ja acordada.
  puzzleFoto: "foto001",

  // PROVA 2 · Pregunta PROVISIONAL per provar el joc.
  // correcta és la posició: 0 = primera; 1 = segona; 2 = tercera.
  // Mantén tres opcions i tres pistes progressives.
  record: {
    pregunta: "De quina vegada és la fotografia de la primera prova?",
    opcions: [
      "Primera vegada a Altafulla",
      "Segona vegada a Altafulla",
      "Tercera vegada a Altafulla",
    ],
    correcta: 1,
    pistes: [
      "Va ser al juliol",
      "Va ser amb els meus pares",
      "1+1",
    ],
  },

  // PROVA 3 · Cinc frases vostres.
  // autor: "berta" = botó «Jo»; autor: "tu" = botó «Tu».
  // «Tu» és qui li prepara el regal. Les autories encara són de prova.
  frases: [
    {
      text: "Un 13/10",
      autor: "berta",
      context: "Un dels dos va preguntar del 1 al 10... i l'altre va respondre 13.",
    },
    {
      text: "Qui dels dos sent mes adrenalina?",
      autor: "berta",
      context: "La presio de fer algunes coses fa pujar la ADRENALINAAA",
    },
    {
      text: "Tenir un ano timido",
      autor: "tu",
      context: "Quan la berta no pot cagar se li diu que te un ano timido",
    },
    {
      text: "Qui te complejo de colarse a les cases?",
      autor: "tu",
      context: "Un dia vaig decidir que volia ser un lladre, vaig decidir provar amb casa teva i vaig aconseguir escapar-me del papa Raul i de la poli.",
    },
    {
      text: "S'ha acabat el broquil",
      autor: "berta",
    context: "SHA ACABAT EL BROQUIL JODERRRRRRRRRRRRRRRRRRRRRRRRR",
    },
  ],

  // PROVA 4 · Tres expressions: EXEMPLES per comprovar el funcionament.
  // respostes pot contenir variants: ["paraula", "una altra variant"].
  // La primera es mostrarà quan es reveli la solució.
  // El joc ignorarà majúscules, accents i espais sobrants.
  expressions: [
    {
      text: "Se'm veu el …",
      respostes: ["os"],
      pista: "Expresió per quan ens fem mal de broma jejeje.",
    },
    {
      text: "La nostre peli és …",
      respostes: ["Paddington"],
      pista: "Una pel·li trista.",
    },
    {
      text: "Ara que no miren els …",
      respostes: ["professors", "profes"],
      pista: "Per donarnos un peto no han de mirar els ...",
    },
  ],

  // PROVA 5 · Pregunta ja acordada; no té resposta correcta.
  preguntaOberta:
    "Si poguessis tornar a viure un moment amb mi, quin seria i per què?",

  // PROVA 6 · Quatre plans. Les fotos queden pendents d'assignar.
  // La carta final serà la mateixa, independentment del pla escollit.
  plans: [
    {
      id: "pla1",
      titol: "Un meravellós sopar junts",
      foto: "foto014",
      text: "Anar a sopar junts a un restaurant que ens agradi molt i passar una estona molt bona.",
    },
    {
      id: "pla2",
      titol: "Tirar la bola",
      foto: "foto013",
      text: "Anar a jugar a la bolera i passar una estona divertida fent una competició entre nosaltres.",
    },
    {
      id: "pla3",
      titol: "Unes boniques vistes",
      foto: "foto015",
      text: "Anar a un mirador a veure el atardecer i parlar.",
    },
    {
      id: "pla4",
      titol: "Un dia fred",
      foto: "foto016",
      text: "Hivern, guata, peli, abraçats, dormir junts",
    },
  ],

  // 4. CARTES DELS SIS SOBRES
  // sobre1 és el premi de la primera prova, sobre2 de la segona, etc.
  // El sisè sobre ja és la carta final: no hi ha un setè sobre del joc.
  // Pots afegir paràgrafs i assignar una foto de la llista.
  sobres: [
    {
      id: "sobre1",
      titol: "Altafulla",
      foto: "foto001",
      paragrafs: [
        "Anar a Altafulla amb tu va ser un moment molt especial. Poder anar amb la meva família i tu em feia sentir molt feliç de veure que et portes molt bé amb ells. Tornaria a repetir aquells caps de setmana sempre que puguem. Gràcies per crear aquells moments tan bonics.",
      ],
    },
    {
      id: "sobre2",
      titol: "Un record nostre",
      foto: "foto002",
      paragrafs: [
        "En aquest sobre voldria dir-te que m'agrada molt que em facis sentir especial i que sempre estiguis al meu costat pel que necessiti. Gràcies per ser com ets i per fer-me sentir tan bé. També vull que sàpigues que sempre estaré per tu i per escoltar-te, no vull que mai diguis ni sentis que estàs sola, perquè em tindràs a mi per tot, sempre voldré ajudar-te amb el que sigui i pensa que aquesta és la meva prioritat, que siguis feliç i que et sentis bé. T'estimo molt i espero que mai ho dubtis.",
      ],
    },
    {
      id: "sobre3",
      titol: "Les coses que ens diem",
      foto: "foto003",
      paragrafs: [
        "Una de les coses que mes magrada de nosaltres es que sempre ens entenguem les bromes i tinguem bromes que nomes entenem nosaltres. Magrada molt que siguiem molt semblants, bueno casi iguals, de personalitat i de guapos jejejeje.",
      ],
    },
    {
      id: "sobre4",
      titol: "El nostre petit diccionari",
      foto: "foto005",
      paragrafs: [
        "Una broma que només entenem nosaltres jejejejeje",
        "Una pel·li molt trista, ja que abandonen el pobre os Paddington i es queda sol, primera i última vegada que he anat al cine jejejeje",
        "Els petons han de ser d'amagat i els profes no ens poden veure jejejejeje",
      ],
    },
    {
      id: "sobre5",
      titol: "Els nostres plans",
      foto: "foto006",
      paragrafs: [
        "Fer amb tu plans és una de les coses més divertides i especials de la meva vida, poder compartir nous moments o repetir aquells que tant ens agraden em fa molt feliç. Sempre que estic amb tu és un moment especial i em sento a gust amb tu. Tot i que no fem un pla especial, el simple fet d'estar amb tu ja fa que sigui un moment especial.",
      ],
    },
    {
      id: "sobre6",
      titol: "Per molts anys, amor",
      foto: "foto004",
      paragrafs: [
        "Avui és un dia molt especial, ja que és el teu aniversari i vull que sàpigues que ets una persona molt important per a mi. Gràcies per ser com ets i per fer-me sentir tan bé. Espero que aquest dia sigui tan especial com tu. Porto molt de temps pensant en el teu cumple i en com fer que sigui un moment molt especial i que disfrutis i siguis feliç un dia tan important de l'any. Veure't feliç i contenta em fa ser feliç, per això vull que avui sigui un dia especial i que puguem compartir-ho junts. M'encanta passar temps junts i sentir-me estimat per tu, m'encantaria poder estar sempre junts, poder ser el teu nòvio sempre i així fer-nos feliços i estimar-nos. M'encanta com ets i com em tractes, espero que mai deixem de ser nosaltres. Ets una gran persona i nòvia, m'encanta poder estar amb algú tan perfecte com tu. T'estimo moltíssim i espero poder celebrar molts més aniversaris amb tu i que disfrutis del teu dia.",
      ],
    },
  ],

  // 5. OBRE'M QUAN…
  // Cartes independents dels sobres del joc, sense bloqueig per dates.
  // activa: false amagarà una carta sense haver d'esborrar-ne el text.
  cartes: [
    {
      id: "faltar",
      activa: true,
      titol: "Em trobis a faltar",
      foto: "foto007",
      paragrafs: [
        "Aquesta carta és per als dies que em trobis a faltar i t’agradaria que estiguéssim junts. Si estàs llegint això, m’encantaria poder aparèixer al teu costat i fer-te una abraçada de les que duren molta estona. A mi em passa que, després d’estar amb tu, torno a casa i ja tinc ganes de tornar-te a veure. M’encanta passar temps junts, encara que no fem res especial, només estar amb tu ja em fa feliç. De moment t’hauràs de conformar amb aquestes paraules, però quan ens veiem em pots donar totes les abraçades que no ens hàgim donat. T’estimo moltíssim.",
      ],
    },
    {
      id: "trista",
      activa: true,
      titol: "Estiguis ratllada o trista",
      foto: "foto009",
      paragrafs: [
        "Bebè, si tens alguna cosa al cap que no et deixa tranquil·la, m’ho pots explicar, encara que pensis que és una tonteria o que ja n’hem parlat moltes vegades, que sàpigues que jo sempre et tornaré a escoltar els cops que faci falta. Si a tu et preocupa, jo ho vull escoltar per poder-te ajudar. I si té a veure amb nosaltres, també prefereixo que en parlem i ens entenguem, i que sempre puguem buscar una solució a tot. Ja saps que, tot i que pensis que alguna cosa em podria molestar o rallar, que tu estiguis bé va per davant i és la meva prioritat, per això vull que m'ho expliquis tot. No cal que sàpigues explicar-ho perfecte ni que deixis d’estar trista de cop, però sí que puguis tenir algú que t’escolti i t'ajudi també en els mals moments. M’importa com et sents i vull que puguis ser tu amb mi, també quan no estàs bé. També pensa si això que et preocupa té una solució o potser no ha passat i només estàs sobrepensant alguna situació i no cal que li donis tantes voltes. Et recordo que mai dubtis a explicar-me el que vulguis. T’estimo moltíssim i vull que estiguis bé.",
      ],
    },
    {
      id: "riure",
      activa: true,
      titol: "Necessitis riure",
      foto: "foto012",
      paragrafs: [
        "No sé si aquesta carta et farà riure, JAJAJAJAJAAJ, però recorda que el teu nòvio va anar al cine a veure Paddington i es va passar la pel·lícula plorant perquè li feia pena l’os. Per tant, si algun dia necessites algú poc sensible per veure una pel·lícula, ja saps a qui escriure. Pensa en totes les nostres bromes i aquells moments on no podem parar de riure i tot ens fa gràcia. Que sàpigues que sempre pots comptar amb mi per fer tonteries, tot i que jo no et considero tonta.",
      ],
    },
    {
      id: "dormir",
      activa: true,
      titol: "No puguis dormir",
      foto: "foto008",
      paragrafs: [
        "M'agradaria estar al teu costat ara mateix, abraçar-te i quedar-me amb tu fins que ens adormíssim. Si estàs donant voltes a alguna cosa, no cal trobar-hi una resposta aquesta nit. Posa’t còmoda i llegeix aquesta història que t'explicaré. Hi havia una vegada un nen molt guapo, molt guapo, a qui li agradava una noia molt guapa, molt guapa, aquesta noia anava amb ell a classe. Els dos es van adonar de les grans persones que eren, llavors poc a poc van anar parlant fins que van començar a ser nuvis. Des d’aquell dia el nen va ser molt i molt feliç i estava molt a gust amb la seva noia. Els dos eren molt feliços junts i s'ho passaven molt bé sempre que estaven junts. Els dos nens són molt iguals i això fa que tinguin una connexió especial entre ells, el destí els va ajuntar aquella vegada a la classe i mai més els tornarà a separar. Després d'aquesta història,que no sé qui són els personatges, toca deixar el mòbil i descansar, bebè. Bonaanitt, amor meu. T’estimo moltíssim.",
      ],
    },
    {
      id: "recordar",
      activa: true,
      titol: "Et vingui de gust recordar-nos",
      foto: "foto010",
      paragrafs: [
        "Pensa en tot el que hem anat vivint des que vam començar. Recorda tots els caps de setmana a Altafulla, poder estar amb la meva família i amb tu, i veure com de bé us porteu i com de bé ens ho vam passar. Òbviament, també cal recordar el finde que vam anar a Roses, on vaig estar molt bé i ens ho vam passar molt bé amb la teva family felfie. També m’encanten els moments més normals, les tonteries que diem i les estones que passem junts sense fer cap gran pla. Si mires les nostres fotos, segur que trobaràs algun moment que ja no recordaves. M’agrada molt tot el que hem fet i em fa molta il·lusió pensar en els records que encara ens queden per fer. T’estimo moltíssim.",
      ],
    },
    {
      id: "sorpresa",
      activa: true,
      titol: "Vulguis una sorpresa",
      foto: "foto011",
      paragrafs: [
        "Sorpresaaaaa! Aquesta carta val perquè triïs un pla. Te'n proposo un perquè ja sé que no voldràs decidir, jejeje. Podríem anar a Barcelona guapos, sopar en algun lloc guai i, abans o després, fer una volta per allà. També podríem anar a berenar xurros amb xocolata i veure els llums de Nadal quan estiguin posats. Em fa molta il·lusió fer plans així amb tu i seguir creant records tan especials. Si et ve de gust una altra cosa, tu tries, amor. Quan vulguis anar-hi, ja ho saps, m'escrius i hi anem, jejejejeje. T'estimo moltíssim!",
      ],
    },
        {
      id: "dificil",
      activa: false, // Prescindible si volem reduir feina, com hem acordat.
      titol: "Tinguis un dia difícil",
      foto: null,
      paragrafs: [
        "[PENDENT: la teva carta per a un dia difasl.]",
      ],
    },
  ],
};
