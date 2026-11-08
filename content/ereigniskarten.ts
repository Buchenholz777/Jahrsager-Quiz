/**
 * 15 Ereigniskarten für den ersten Prototyp (3 Tagespakete à 5 Ereignisse).
 *
 * STATUS DIESER INHALTE (ehrlich getrennt):
 *  - TEXTE: Aus den unten genannten Quellen zusammengestellt (Seiten wurden bei der Recherche geöffnet,
 *    siehe `sources`). Wo nur Wikipedia als Hilfsquelle vorlag, steht das im Quellenlabel und in `openPoints`.
 *    Noch von keinem Menschen redaktionell freigegeben.
 *  - BILDER: Im Spiel wird derzeit ein generierter PLATZHALTER angezeigt. Der recherchierte Bildkandidat steht
 *    in `research.image` (Quelle, Urheber, Lizenz, Datum, Risiken). Status: "recherchiert" oder "zu_pruefen".
 *    Kein Bild ist "freigegeben". Der Import des Kandidatenbildes geschieht erst auf Anstoß der Redaktion
 *    (Admin-Button oder `npm run images:import`).
 *  - Alle Karten sind `is_demo = true`: Mit ALLOW_DEMO_CONTENT=false erscheinen sie nicht im öffentlichen Spiel.
 */
import type { ImageStatus, Research, Source } from "../src/server/types";

export interface Ereigniskarte {
  slug: string;
  category: string;
  difficulty: number;
  neutral_title: string;
  description: string;
  placeholderAlt: string;
  correct_year: number;
  exact_date: string | null;
  public_title: string;
  explanation_what: string;
  explanation_why: string;
  explanation_detail: string;
  background: string;
  sources: Source[];
  imageStatus: ImageStatus;
  research: Research;
  size: [number, number]; // Seitenverhältnis des Platzhalters entspricht dem Kandidatenbild
}

const CC = {
  by2: "https://creativecommons.org/licenses/by/2.0/",
  by4: "https://creativecommons.org/licenses/by/4.0/",
  bysa3: "https://creativecommons.org/licenses/by-sa/3.0/",
  bysa3de: "https://creativecommons.org/licenses/by-sa/3.0/de/",
  bysa4: "https://creativecommons.org/licenses/by-sa/4.0/",
  pdm: "https://creativecommons.org/publicdomain/mark/1.0/",
};
const com = (f: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, "_")).replace(/%2C/g, ",").replace(/%28/g, "(").replace(/%29/g, ")")}`;

export const PAKETE: Ereigniskarte[][] = [
  // ───────────────────────────── Paket 1 ─────────────────────────────
  [
    {
      slug: "apollo-11-mondlandung",
      category: "wissenschaft",
      difficulty: 1,
      neutral_title: "Schritte auf einer anderen Welt",
      description:
        "Ein Astronaut bewegt sich auf der Mondoberfläche. Gemeinsam mit einem Kollegen erkundet er das Gelände, während ein drittes Besatzungsmitglied im Raumschiff den Mond umkreist. Die Mission bringt erstmals Menschen auf einen anderen Himmelskörper.",
      placeholderAlt: "Platzhalter für eine Fotografie: Raumfahrer in weißem Anzug auf grauer Mondlandschaft",
      correct_year: 1969,
      exact_date: "1969-07-20",
      public_title: "Apollo 11: Die erste Mondlandung",
      explanation_what:
        "Neil Armstrong und Buzz Aldrin landeten mit der Mondfähre „Eagle“ im Meer der Ruhe und erkundeten die Mondoberfläche. Michael Collins blieb in der Kommandokapsel „Columbia“ im Mondorbit. Der gesamte Ausstieg dauerte mehr als zweieinhalb Stunden.",
      explanation_why:
        "Armstrong und Aldrin betraten als erste Menschen den Mond. Beim ersten Schritt sagte Armstrong den berühmt gewordenen Satz: „Das ist ein kleiner Schritt für einen Menschen, ein riesiger Sprung für die Menschheit.“",
      explanation_detail:
        "Die Astronauten ließen eine US-Flagge, ein Abzeichen zum Gedenken an die Apollo-1-Besatzung und eine Plakette zurück. Auf der Plakette steht: „We came in peace for all mankind.“",
      background:
        "Apollo 11 startete am 16. Juli 1969 von Startrampe 39A. Armstrong und Aldrin blieben insgesamt 21 Stunden und 36 Minuten auf dem Mond. Die Kapsel wasserte am 24. Juli 1969 im Pazifik; das Bergungsschiff war die USS Hornet.",
      sources: [
        { label: "NASA: Apollo 11 Mission Overview", url: "https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/" },
        { label: "NASA: One Giant Leap for Mankind (20. Juli 1969)", url: "https://www.nasa.gov/history/july-20-1969-one-giant-leap-for-mankind/" },
        { label: "NASA Science: Apollo 11 – Buzz Aldrin (Foto von Neil Armstrong)", url: "https://science.nasa.gov/resource/apollo-11-buzz-aldrin/" },
      ],
      imageStatus: "recherchiert",
      size: [1100, 1150],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "NASA-Bilddatensatz (images.nasa.gov/details/as11-40-5903) war bei der Recherche nicht lesbar; die Seite science.nasa.gov zeigt das Schwesterbild AS11-40-5902.",
          "Abgebildete Person (Aldrin): NASA weist bei kommerzieller Nutzung auf Persönlichkeitsrechte und das Verbot hin, eine NASA-Unterstützung zu suggerieren.",
          "Metadaten nennen nur „1969-07“; NASA-Seite nennt 20. Juli 1969.",
        ],
        image: {
          commonsFile: "AS11-40-5903 - Buzz Aldrin by Neil Armstrong (full frame).jpg",
          commonsUrl: com("AS11-40-5903 - Buzz Aldrin by Neil Armstrong (full frame).jpg"),
          originalUrl: "https://images.nasa.gov/details/as11-40-5903",
          originalReadable: false,
          author: "Neil Armstrong (NASA)",
          license: "Public Domain (NASA)",
          licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
          photoDate: "1969-07 (NASA: 20. Juli 1969)",
          creditShort: "Foto: Neil Armstrong / NASA",
          creditFull: "NASA / Neil Armstrong, Apollo 11, Bild AS11-40-5903 (Vollbild, Originalbelichtung)",
          altDraft: "Raumfahrer in weißem Anzug mit goldfarbenem Visier neben dem Landebein einer Mondfähre auf grauem Mondboden",
          width: 4400,
          height: 4600,
          risks: ["Nicht die bekannte beschnittene Version, sondern Vollbild.", "Persönlichkeitsrechte/Endorsement-Hinweis der NASA."],
        },
      },
    },
    {
      slug: "wunder-von-bern",
      category: "sport",
      difficulty: 1,
      neutral_title: "Ein Finale im Regen",
      description:
        "In einem Stadion in der Schweiz entscheidet ein Endspiel um den Weltmeistertitel. Die deutsche Mannschaft trifft auf die ungarische, die als großer Favorit antritt. Am Ende jubeln Spieler und Zuschauer über eine Überraschung, die ein ganzes Land bewegt.",
      placeholderAlt: "Platzhalter für eine Fotografie: Fußballspieler in zwei Trikotfarben im Strafraum, einige jubeln",
      correct_year: 1954,
      exact_date: "1954-07-04",
      public_title: "Das Wunder von Bern",
      explanation_what:
        "Im Endspiel der Fußball-Weltmeisterschaft im Berner Wankdorfstadion besiegte die Bundesrepublik Deutschland Ungarn mit 3:2, nachdem sie schon nach wenigen Minuten mit 0:2 zurücklag. Helmut Rahn erzielte in der 84. Minute das Siegtor.",
      explanation_why:
        "Die Deutschen gewannen gegen den großen Favoriten, der sie in der Vorrunde noch mit 8:3 geschlagen hatte. Das Finale ist deshalb als „Wunder von Bern“ in Erinnerung geblieben.",
      explanation_detail: "Ein Treffer von Ferenc Puskás zum 3:3 in der 86. Minute wurde wegen Abseits nicht anerkannt.",
      background:
        "Trainer der deutschen Mannschaft war Sepp Herberger, Kapitän Fritz Walter; die Ungarn trainierte Gusztáv Sebes, ihr Kapitän war Ferenc Puskás. Schiedsrichter war William Ling aus England, das Stadion fasste etwa 65.000 Zuschauer.",
      sources: [
        { label: "Wikipedia (Hilfsquelle): Wunder von Bern – Primärquelle (DFB/FIFA/bpb) noch zu ergänzen", url: "https://de.wikipedia.org/wiki/Wunder_von_Bern" },
      ],
      imageStatus: "recherchiert",
      size: [1200, 980],
      research: {
        factsStatus: "teilweise_hilfsquellen",
        openPoints: [
          "Faktenquelle ist nur Wikipedia; DFB-, FIFA- und bpb-Seiten waren bei der Recherche nicht lesbar bzw. enthielten nichts. Primärquelle ergänzen.",
          "ETH-Originaldatensatz (e-pics) war nicht erreichbar; Nutzungsbedingungen am Original prüfen.",
          "Das Kandidatenfoto zeigt einen Moment der Partie (ungarischer Torjubel in der ersten Halbzeit), nicht das Siegtor. Alternativen aus derselben Serie: Com_M03-0108-005-0010, -0001 (Letztere mit „License review needed“).",
          "CC BY-SA 4.0: Share-Alike-Folgen für bearbeitete (zugeschnittene/skalierte) Fassungen rechtlich klären.",
        ],
        image: {
          commonsFile: "Fussball-Weltmeisterschaft 1954 (Com M03-0108-005-0025).jpg",
          commonsUrl: com("Fussball-Weltmeisterschaft 1954 (Com M03-0108-005-0025).jpg"),
          originalUrl: "https://ba.e-pics.ethz.ch/",
          originalReadable: false,
          author: "Comet Photo AG (Zürich), ETH-Bibliothek Bildarchiv",
          license: "CC BY-SA 4.0",
          licenseUrl: CC.bysa4,
          photoDate: "1954-07-04",
          creditShort: "Foto: Comet Photo AG / ETH-Bibliothek",
          creditFull: "ETH-Bibliothek Zürich, Bildarchiv / Fotograf: Comet Photo AG (Zürich) / Com_M03-0108-005-0025 / CC BY-SA 4.0",
          altDraft: "Mehrere Fußballspieler in hellen und dunklen Trikots stehen dicht beieinander im Strafraum; einige Spieler jubeln",
          width: 4961,
          height: 4040,
          risks: ["Originalarchiv nicht lesbar.", "Share-Alike.", "Bildinhalt nicht gesehen – Beschreibung aus Commons-Metadaten."],
        },
      },
    },
    {
      slug: "erster-motorflug-der-brueder-wright",
      category: "technik",
      difficulty: 2,
      neutral_title: "Abheben am Strand",
      description:
        "Auf einer Sandfläche an der Küste steht ein einfacher Doppeldecker aus Holz und Stoff. Ein Mann liegt auf der unteren Tragfläche, ein zweiter steht am Rand. Der Flug dauert nur wenige Sekunden und gilt als erster gesteuerter Motorflug.",
      placeholderAlt: "Platzhalter für eine Fotografie: Doppeldecker kurz nach dem Start über Sandboden, daneben ein Mann",
      correct_year: 1903,
      exact_date: "1903-12-17",
      public_title: "Der erste Motorflug der Brüder Wright",
      explanation_what:
        "Orville Wright startete mit dem „Wright Flyer“ bei Kitty Hawk in North Carolina zu einem Flug von zwölf Sekunden und etwa 36 Metern. Sein Bruder Wilbur lief neben dem Flugzeug her. An diesem Vormittag gelangen vier Flüge; der längste dauerte 59 Sekunden und führte über rund 256 Meter.",
      explanation_why: "Die Flüge der Brüder Wright gelten als die ersten erfolgreichen Flüge eines Motorflugzeugs.",
      explanation_detail:
        "Das berühmte Foto löste John Daniels von der nahen Rettungsstation aus: Er drückte den Auslöser einer vorher eingestellten Kamera. Ein Motor mit zwölf PS trieb zwei Propeller an.",
      background: "Beim ersten Flug wehte ein Wind von rund 27 Meilen pro Stunde (etwa 43 km/h). Der Start erfolgte um 10:35 Uhr.",
      sources: [
        { label: "National Park Service: The First Flight", url: "https://www.nps.gov/articles/firstflight.htm" },
        { label: "Smithsonian National Air and Space Museum: 1903 Wright Flyer", url: "https://airandspace.si.edu/collection-objects/1903-wright-flyer/nasm_A19610048000" },
        { label: "National Park Service: Wright Brothers National Memorial", url: "https://www.nps.gov/wrbr/index.htm" },
      ],
      imageStatus: "recherchiert",
      size: [1200, 780],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "Library-of-Congress-Seite (ppprs.00626) war bei der Recherche nicht lesbar (HTTP 403): Rechtehinweis und Reproduktionsnummer dort prüfen.",
          "Fotograf laut Commons/NPS: John T. Daniels; LoC-Datensatz gegenprüfen.",
        ],
        image: {
          commonsFile: "First flight2.jpg",
          commonsUrl: com("First flight2.jpg"),
          originalUrl: "https://www.loc.gov/pictures/resource/ppprs.00626/",
          originalReadable: false,
          author: "John T. Daniels",
          license: "Public Domain",
          licenseUrl: CC.pdm,
          photoDate: "1903-12-17",
          creditShort: "Foto: John T. Daniels / Library of Congress",
          creditFull: "John T. Daniels, Library of Congress, Prints and Photographs Division (Digital ID ppprs.00626)",
          altDraft: "Schwarz-Weiß-Foto: Doppeldecker knapp über dem Sandboden in der Luft, rechts am Rand steht ein Mann",
          width: 6603,
          height: 4280,
          risks: ["LoC-Originalseite nicht lesbar.", "Datei ist sehr groß (ca. 29 MB); Import skaliert herunter."],
        },
      },
    },
    {
      slug: "mauerbau-in-berlin",
      category: "politik",
      difficulty: 2,
      neutral_title: "Eine Straße wird versperrt",
      description:
        "Mitten in einer Großstadt ist eine Straße mit Stacheldraht abgesperrt. Zwei Uniformierte stehen davor, im Hintergrund fährt eine Straßenbahn vorbei. Wer eben noch auf die andere Seite gehen konnte, kommt dort nicht mehr durch.",
      placeholderAlt: "Platzhalter für eine Fotografie: Stacheldrahtabsperrung quer über einer Stadtstraße, dahinter zwei Uniformierte",
      correct_year: 1961,
      exact_date: "1961-08-13",
      public_title: "Der Bau der Berliner Mauer",
      explanation_what:
        "Am 13. August 1961 begann die SED, die Grenzen rings um West-Berlin abzuriegeln – zunächst mit Stacheldraht, wenige Tage später mit Mauern.",
      explanation_why:
        "Die SED wollte die anschwellende Fluchtbewegung beenden und ihre Macht stabilisieren. Die DDR hatte zuvor ein Sechstel ihrer Bevölkerung verloren, mindestens vier Millionen Menschen.",
      explanation_detail: "Nach dem Mauerbau legte die DDR sieben Straßenübergänge und einen Bahnübergang zwischen Ost- und West-Berlin fest.",
      background:
        "Die Exklave Steinstücken mit rund 200 Einwohnern war vom Westen abgeschnitten; die USA stationierten dort drei Soldaten und sicherten die Verbindung per Hubschrauber.",
      sources: [{ label: "Stiftung Berliner Mauer: Die Berliner Mauer", url: "https://www.stiftung-berliner-mauer.de/de/themen/die-berliner-mauer" }],
      imageStatus: "zu_pruefen",
      size: [1200, 770],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "Aufnahmedatum nur „August 1961“, nicht der Tag; Bundesarchiv-Originalbildunterschrift prüfen. Motiv laut Commons-Kategorien: Straßenbahn am Leipziger Platz mit Stacheldraht – Bild ansehen.",
          "Auflösung des Kandidaten nur 800 px Breite.",
          "Zwei andere Bundesarchiv-Fotos (183-87665-0002 vom 30.10.1961, 183-88222-0001 vom 20.11.1961) wegen abweichender Daten verworfen.",
          "Wer die Abriegelung beschloss, wird in der Quelle nicht genannt – daher im Text nur „die SED“.",
          "Bundesarchiv-Bildunterschriften können politisch gefärbt sein.",
        ],
        image: {
          commonsFile: "Bundesarchiv Bild 173-1288, Berlin, Mauerbau.jpg",
          commonsUrl: com("Bundesarchiv Bild 173-1288, Berlin, Mauerbau.jpg"),
          originalUrl: "https://bild.bundesarchiv.de/",
          originalReadable: false,
          author: "Helmut J. Wolf (Bundesarchiv)",
          license: "CC BY-SA 3.0 DE",
          licenseUrl: CC.bysa3de,
          photoDate: "1961-08 (Tag nicht belegt)",
          photoDateNote: "Tag unbekannt",
          creditShort: "Foto: Helmut J. Wolf / Bundesarchiv",
          creditFull: "Bundesarchiv, Bild 173-1288 / Helmut J. Wolf / CC-BY-SA 3.0",
          altDraft: "Schwarz-Weiß-Foto: Stacheldrahtverhau quer über einer Stadtstraße, dahinter stehen zwei Uniformierte, im Hintergrund eine Straßenbahn",
          width: 800,
          height: 514,
          risks: ["Tag nicht belegt.", "Niedrige Auflösung.", "Share-Alike."],
        },
      },
    },
    {
      slug: "hubble-teleskop-ausgesetzt",
      category: "wissenschaft",
      difficulty: 3,
      neutral_title: "Ein Auge fürs Weltall",
      description:
        "Aus der Ladebucht eines Raumtransporters wird ein großes Instrument an einem Roboterarm in den Weltraum gehoben. Es soll von dort aus ungestört ins All blicken. Ein Sonnensegel ist schon ausgeklappt, das andere noch nicht.",
      placeholderAlt: "Platzhalter für eine Fotografie: zylindrisches Teleskop an einem Roboterarm über der Ladebucht eines Raumtransporters",
      correct_year: 1990,
      exact_date: "1990-04-25",
      public_title: "Das Hubble-Weltraumteleskop wird ausgesetzt",
      explanation_what:
        "Die Besatzung des Space Shuttles „Discovery“ setzte das Hubble-Weltraumteleskop im Erdorbit aus. Das Shuttle war am 24. April 1990 gestartet, das Teleskop wurde am 25. April ausgesetzt.",
      explanation_why: "Seit seinem Start hat das Hubble-Weltraumteleskop nach NASA-Angaben unser grundlegendes Verständnis des Universums verändert.",
      explanation_detail:
        "Das Teleskop ist nach dem Astronomen Edwin Hubble benannt. An Bord waren fünf Astronauten: Loren Shriver, Charles Bolden, Steven Hawley, Bruce McCandless und Kathryn Sullivan.",
      background: "Die Mission STS-31 war die 35. Mission des Space-Shuttle-Programms. Die Landung erfolgte am 29. April 1990 auf der Edwards Air Force Base.",
      sources: [
        { label: "NASA: STS-31", url: "https://www.nasa.gov/mission/sts-31/" },
        { label: "NASA Science: Hubble Space Telescope", url: "https://science.nasa.gov/mission/hubble/" },
      ],
      imageStatus: "recherchiert",
      size: [1200, 794],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "NASA-Bilddatensatz (S31-03-014) war nicht lesbar; Flickr-Original nicht geöffnet.",
          "Spiegelfehler und Reparaturmission 1993 sind in den gelesenen Quellen nicht wörtlich belegt und stehen deshalb nicht im Text.",
          "Das Foto zeigt das Aussetzen (noch am Roboterarm), nicht den Start.",
        ],
        image: {
          commonsFile: "Hubble Space Telescope Deployment from Shuttle Discovery (27512135784).jpg",
          commonsUrl: com("Hubble Space Telescope Deployment from Shuttle Discovery (27512135784).jpg"),
          originalUrl: "https://images.nasa.gov/details-S31-03-014",
          originalReadable: false,
          author: "NASA",
          license: "Public Domain (NASA)",
          licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
          photoDate: "1990-04-25",
          creditShort: "Foto: NASA",
          creditFull: "NASA, Space Shuttle Discovery (STS-31), Bild S31-03-014, aufgenommen mit einer 35-mm-Kamera durch ein Fenster des Flugdecks",
          altDraft: "Zylindrisches Weltraumteleskop mit einem ausgeklappten Sonnensegel am Roboterarm über der geöffneten Ladebucht eines Raumtransporters",
          width: 4095,
          height: 2708,
          risks: ["Originalarchiv nicht lesbar.", "Über Flickr-Konto der NASA hochgeladen."],
        },
      },
    },
  ],

  // ───────────────────────────── Paket 2 ─────────────────────────────
  [
    {
      slug: "vorstellung-des-ersten-iphone",
      category: "technik",
      difficulty: 1,
      neutral_title: "Eine Vorstellung auf der Bühne",
      description:
        "Ein Mann in dunklem Oberteil steht auf einer Bühne vor einer riesigen Leinwand und deutet darauf. Er stellt ein Gerät vor, das Telefon, Musikplayer und Internetzugang in einem sein und sich allein mit den Fingern bedienen lassen soll. Im Vordergrund sind die Silhouetten des Publikums zu sehen.",
      placeholderAlt: "Platzhalter für eine Fotografie: Redner auf einer Bühne vor einer großen Leinwand",
      correct_year: 2007,
      exact_date: "2007-01-09",
      public_title: "Die Vorstellung des ersten iPhone",
      explanation_what:
        "Auf der Macworld in San Francisco stellte Steve Jobs das iPhone vor: ein Mobiltelefon, ein Widescreen-iPod mit Touch-Bedienung und ein Internet-Kommunikationsgerät in einem Gerät. Bedient wird es mit den Fingern über ein großes Multi-Touch-Display.",
      explanation_why:
        "Apple kündigte an, mit dem iPhone das Telefon neu zu erfinden („Apple Reinvents the Phone“, so der Titel der Pressemitteilung). Jobs stellte das Gerät als seiner Zeit etwa fünf Jahre voraus dar.",
      explanation_detail: "Verkaufsstart sollte in den USA im Juni, in Europa Ende des Jahres und in Asien im Jahr darauf sein.",
      background: "Die Vorstellung fand im Rahmen der Eröffnungs-Keynote der Macworld Conference & Expo statt.",
      sources: [{ label: "Apple Newsroom: Apple Reinvents the Phone with iPhone", url: "https://www.apple.com/newsroom/2007/01/09Apple-Reinvents-the-Phone-with-iPhone/" }],
      imageStatus: "zu_pruefen",
      size: [1200, 803],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "Das Bild zeigt eine Präsentationsfolie mit dem Produktnamen und einem Apple-Slogan (Marken im Bild).",
          "Urheber unklar: Commons nennt Blake Patterson (Flickr-Konto), die Flickr-Beschreibung nennt „@arnoldkim“ als Fotografen. Vor Nutzung klären, wer die Rechte hält.",
          "Flickr-Lizenzprüfung auf Commons stammt von 2009; die Flickr-Seite zeigt weiterhin CC BY 2.0.",
          "Personenabbildung (Persönlichkeitsrechte); Apple-Marken im Bild.",
        ],
        image: {
          commonsFile: "Steve Jobs presents iPhone.jpg",
          commonsUrl: com("Steve Jobs presents iPhone.jpg"),
          originalUrl: "https://www.flickr.com/photos/35448539@N00/2411534862",
          originalReadable: true,
          author: "Blake Patterson (Flickr-Konto)",
          authorNote: "Flickr-Text nennt @arnoldkim als Fotografen",
          license: "CC BY 2.0",
          licenseUrl: CC.by2,
          photoDate: "2007-01-09",
          creditShort: "Foto: Blake Patterson (Flickr)",
          creditFull: "Foto: Blake Patterson (Flickr, „the very instant of announcement“), CC BY 2.0",
          altDraft: "Redner in dunklem Pullover steht auf einer Bühne vor einer großen Leinwand mit dem Schriftzug „iPhone“, im Vordergrund Silhouetten des Publikums",
          width: 1936,
          height: 1296,
          risks: ["Urheberfrage offen.", "Personenabbildung."],
        },
      },
    },
    {
      slug: "live-aid",
      category: "kultur",
      difficulty: 1,
      neutral_title: "Ein Konzert für die Welt",
      description:
        "Vor einem riesigen Bühnengerüst mit buntem Bühnenbild drängt sich das Publikum im Stadion. Das Konzert findet am selben Tag in zwei Ländern statt und wird weltweit im Fernsehen übertragen. Mit den Einnahmen soll Menschen in einer Hungersnot geholfen werden.",
      placeholderAlt: "Platzhalter für eine Fotografie: große Stadionbühne mit Gerüst und Publikum",
      correct_year: 1985,
      exact_date: "1985-07-13",
      public_title: "Live Aid",
      explanation_what:
        "Das Benefizkonzert Live Aid fand gleichzeitig im Wembley-Stadion in London und im John-F.-Kennedy-Stadion in Philadelphia statt. Organisiert wurde es von Bob Geldof und Midge Ure, um die Hungersnot in Äthiopien zu lindern.",
      explanation_why: "Nach Schätzungen verfolgten rund 1,9 Milliarden Menschen in 150 Ländern das Konzert am Fernseher.",
      explanation_detail:
        "Nach der Beschreibung auf Wikimedia Commons entstand das Foto in Philadelphia während des gemeinsamen Auftritts von Jimmy Page, Robert Plant und John Paul Jones, unterstützt von den Schlagzeugern Tony Thompson und Phil Collins.",
      background: "Das Konzert fand an einem Samstag statt. In London waren laut Angabe etwa 72.000, in Philadelphia etwa 89.000 Zuschauer im Stadion.",
      sources: [
        { label: "Wikipedia (Hilfsquelle): Live Aid – Primärquelle noch zu ergänzen", url: "https://en.wikipedia.org/wiki/Live_Aid" },
      ],
      imageStatus: "zu_pruefen",
      size: [1200, 965],
      research: {
        factsStatus: "teilweise_hilfsquellen",
        openPoints: [
          "Faktenquelle nur Wikipedia (Britannica, Rock Hall, liveaid.org nicht lesbar). Die 1,9-Milliarden-Zahl stützt sich dort auf CNN – Primärquelle prüfen. Spendensumme nicht belegt, deshalb nicht genannt.",
          "Commons-Kategorien enthalten noch GFDL-/Lizenzmigrationshinweise; Wikitext-Lizenzstand prüfen.",
          "Personenabbildung (Bühnenauftritt bekannter Musiker); die Musiker sind auf dem Foto nur klein zu erkennen – die Namen stammen aus der Commons-Beschreibung, nicht aus dem Bild.",
          "Im Bild sind eine Kodak-Werbetafel und der Schriftzug „Live Aid“ zu sehen (Marken).",
        ],
        image: {
          commonsFile: "Live Aid at JFK Stadium, Philadelphia, PA.jpg",
          commonsUrl: com("Live Aid at JFK Stadium, Philadelphia, PA.jpg"),
          originalUrl: com("Live Aid at JFK Stadium, Philadelphia, PA.jpg"),
          originalReadable: true,
          author: "Squelle (Commons-Benutzer, „Own work“)",
          license: "CC BY-SA 3.0",
          licenseUrl: CC.bysa3,
          photoDate: "1985-07-13",
          creditShort: "Foto: Squelle (Wikimedia Commons)",
          creditFull: "Foto: Squelle (Wikimedia Commons), CC BY-SA 3.0",
          altDraft: "Große Stadionbühne mit buntem Bühnenbild und Gerüst, auf der Bühne Musiker, im Vordergrund das Publikum; auf dem Bühnenbild der Schriftzug „Live Aid“",
          width: 1263,
          height: 1015,
          risks: ["Selbstveröffentlichtes Foto eines Commons-Nutzers; kein Archiv.", "Lizenzmigration/GFDL prüfen.", "Personenabbildung."],
        },
      },
    },
    {
      slug: "kennedy-in-berlin",
      category: "politik",
      difficulty: 2,
      neutral_title: "Ein Gast vor jubelnder Menge",
      description:
        "Ein ausländischer Staatsgast spricht vor einem Rathaus zu einer riesigen Menschenmenge. Er will der geteilten Stadt zeigen, dass sie nicht allein ist, und endet mit einem berühmt gewordenen deutschen Satz. Die Zuhörer jubeln ihm zu.",
      placeholderAlt: "Platzhalter für eine Fotografie: Redner am Pult vor einer großen Menschenmenge",
      correct_year: 1963,
      exact_date: "1963-06-26",
      public_title: "John F. Kennedys Rede in Berlin",
      explanation_what:
        "US-Präsident John F. Kennedy sprach in West-Berlin vor dem Rathaus Schöneberg. Anlass seines Besuchs war der 15. Jahrestag der Berliner Luftbrücke. Seine Rede endete mit dem Satz „Ich bin ein Berliner“.",
      explanation_why:
        "Die Rede brachte Solidarität mit Berlin und der Bundesrepublik zum Ausdruck. Der Satz gehört bis heute zu den meistzitierten Ansprachen der Stadt.",
      explanation_detail: "Im Redemanuskript Kennedys ist der Satz handschriftlich als „I am a Berliner“ ergänzt.",
      background:
        "Kennedys Programm führte ihn vom Flughafen Tegel zum Rathaus Schöneberg und weiter zur Freien Universität, wo er die Ehrenbürgerwürde erhielt. Zur Zahl der Zuhörer nennt die Quelle widersprüchliche Angaben (etwa 450.000 bis zwei Millionen).",
      sources: [
        { label: "Land Berlin: John F. Kennedy in Berlin", url: "https://www.berlin.de/geschichte/john-f-kennedy-in-berlin/" },
        { label: "Land Berlin: Besuchsprogramm von John F. Kennedy", url: "https://www.berlin.de/geschichte/john-f-kennedy-in-berlin/8482364-8481929-besuchsprogramm-von-john-f-kennedy-in-be.html" },
        { label: "Land Berlin: Rede vor dem Rathaus Schöneberg", url: "https://www.berlin.de/geschichte/john-f-kennedy-in-berlin/8481884-8481929-rede-john-f-kennedy-rathaus-schoeneberg.html" },
      ],
      imageStatus: "recherchiert",
      size: [1200, 1186],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "JFK-Library-Katalog war nicht lesbar (HTTP 403). Fotograf prüfen: Commons nennt Robert Knudsen, eine Schwesterdatei mit derselben Kennung KN-C29248 nennt Cecil Stoughton.",
          "Ortsangabe der Datei: Rudolph-Wilde-Platz (vor dem Rathaus Schöneberg).",
          "Zuschauerzahl in den Quellen widersprüchlich; nur als Spanne genannt.",
        ],
        image: {
          commonsFile: "JFK speech Ich bin ein berliner 1.jpg",
          commonsUrl: com("JFK speech Ich bin ein berliner 1.jpg"),
          originalUrl: "https://www.jfklibrary.org/asset-viewer/archives/JFKWHP/1963/Month%2006/Day%2026/JFKWHP-1963-06-26-D?image_identifier=JFKWHP-KN-C29248",
          originalReadable: false,
          author: "Robert Knudsen, White House",
          authorNote: "Schwesterdatei nennt Cecil Stoughton",
          license: "Public Domain (US-Regierungswerk)",
          licenseUrl: CC.pdm,
          photoDate: "1963-06-26",
          creditShort: "Foto: Robert Knudsen / White House, John F. Kennedy Presidential Library",
          creditFull: "Robert Knudsen, White House Photographs, John F. Kennedy Presidential Library and Museum, Boston (KN-C29248)",
          altDraft: "Redner an einem Pult vor einer großen Menschenmenge auf einem Platz",
          width: 3000,
          height: 2964,
          risks: ["JFK-Library-Seite nicht lesbar.", "Widersprüchliche Fotografenangabe.", "Datei ist ca. 8,5 MB groß."],
        },
      },
    },
    {
      slug: "fliessband-bei-ford",
      category: "wirtschaft",
      difficulty: 2,
      neutral_title: "Das Band läuft",
      description:
        "In einer großen Fabrikhalle rollen unfertige Fahrzeuge mit Rädern auf einem langen Band an Maschinen vorbei. Von Station zu Station kommen neue Teile hinzu. Auf diese Weise sollen Autos schneller und billiger entstehen.",
      placeholderAlt: "Platzhalter für eine Fotografie: Fahrgestelle auf einem Montageband in einer Fabrikhalle",
      correct_year: 1913,
      exact_date: "1913-10-07",
      public_title: "Ford führt das Fließband ein",
      explanation_what:
        "Im Werk Highland Park in Michigan führte Ford die erste Autofabrik mit einem beweglichen Fließband ein. Hier wurde das Model T gebaut.",
      explanation_why:
        "Laut Angaben zum Werk sank die Montagezeit für das Model T von 728 auf 93 Minuten, und der Preis fiel von 700 Dollar (1910) auf 350 Dollar (1917).",
      explanation_detail: "Am 5. Januar 1914 hob Ford den Tageslohn von 2,34 auf 5,00 Dollar an und verkürzte die Schicht von neun auf acht Stunden.",
      background: "Das Werk Highland Park (91 Manchester Street, Michigan) wurde 1910 eröffnet; Architekt war Albert Kahn Associates.",
      sources: [
        { label: "Wikipedia (Hilfsquelle): Highland Park Ford Plant – Primärquelle (Henry Ford Museum/NPS) noch zu ergänzen", url: "https://en.wikipedia.org/wiki/Highland_Park_Ford_Plant" },
        { label: "Wikipedia (Hilfsquelle): Fließbandfertigung", url: "https://de.wikipedia.org/wiki/Flie%C3%9Fbandfertigung" },
      ],
      imageStatus: "zu_pruefen",
      size: [1200, 966],
      research: {
        factsStatus: "teilweise_hilfsquellen",
        openPoints: [
          "Fakten nur aus Wikipedia (thehenryford.org und Britannica nicht lesbar). Insbesondere 728→93 Minuten, Preise und Lohn mit Primärquelle belegen.",
          "Foto nur auf das Jahr 1913 datiert; Bildinhalt zeigt laut Metadaten nicht eindeutig das Model-T-Chassisband. LoC-Seite (HTTP 403) nicht lesbar.",
          "Urheber nicht genannt (Abteilung statt Fotograf).",
        ],
        image: {
          commonsFile: "Assembly line at the Ford Motor Company's Highland Park plant LCCN2011661021.jpg",
          commonsUrl: com("Assembly line at the Ford Motor Company's Highland Park plant LCCN2011661021.jpg"),
          originalUrl: "https://www.loc.gov/pictures/item/2011661021/",
          originalReadable: false,
          author: "Unbekannt (Library of Congress)",
          license: "Public Domain",
          licenseUrl: CC.pdm,
          photoDate: "1913 (nur Jahr)",
          photoDateNote: "nur Jahr belegt",
          creditShort: "Foto: Library of Congress (Urheber nicht genannt)",
          creditFull: "Library of Congress, Prints and Photographs Division (LCCN 2011661021, Digital ID cph.3a20510); Urheber nicht genannt",
          altDraft: "Schwarz-Weiß-Foto: unfertige Fahrgestelle mit Rädern auf einem langen Montageband in einer hohen Fabrikhalle, darüber Maschinen und Transmissionen",
          width: 1536,
          height: 1236,
          risks: ["Datum nur Jahr.", "Motiv nicht eindeutig.", "LoC-Seite nicht lesbar."],
        },
      },
    },
    {
      slug: "sonnenfinsternis-expedition",
      category: "wissenschaft",
      difficulty: 3,
      neutral_title: "Eine Probe aufs Weltall",
      description:
        "Forscher reisen eigens an weit entfernte Orte, um den Moment festzuhalten, in dem der Mond die Sonne verdunkelt. Auf Fotoplatten vermessen sie die Positionen von Sternen am Rand der Sonne. Ihr Ergebnis soll eine berühmte Theorie bestätigen oder widerlegen.",
      placeholderAlt: "Platzhalter für eine astronomische Fotoplatte einer Sonnenfinsternis",
      correct_year: 1919,
      exact_date: "1919-05-29",
      public_title: "Die Sonnenfinsternis-Expedition zur Prüfung der Relativitätstheorie",
      explanation_what:
        "Bei einer totalen Sonnenfinsternis fotografierten zwei Expeditionen Sterne am Sonnenrand: Eddington auf Príncipe vor Westafrika sowie Crommelin und Davidson in Sobral in Brasilien. Sie prüften, ob die Sonne Licht ablenkt, wie es Einsteins Allgemeine Relativitätstheorie vorhersagte.",
      explanation_why:
        "Die gemessene Ablenkung entsprach etwa dem, was die Relativitätstheorie vorhersagt, und war doppelt so groß wie nach Newtons Theorie. Der Astronom Frank Dyson sagte nach der Auswertung, die Platten bestätigten Einsteins Vorhersage.",
      explanation_detail:
        "Die Totalität dauerte fast sieben Minuten und war die längste Sonnenfinsternis seit über 500 Jahren. Die Originalplatten gingen verloren; Kopien blieben erhalten, etwa in Heidelberg.",
      background: "Dyson koordinierte die Expeditionen von England aus. Das heute gezeigte Bild ist eine digital restaurierte Kopie einer Platte aus Sobral.",
      sources: [
        { label: "ESO: Highest resolution image of the 1919 solar eclipse (potw1926a)", url: "https://eso.org/public/images/potw1926a/" },
        { label: "Wikipedia (Hilfsquelle): Solar eclipse of May 29, 1919", url: "https://en.wikipedia.org/wiki/Solar_eclipse_of_May_29,_1919" },
      ],
      imageStatus: "zu_pruefen",
      size: [1200, 716],
      research: {
        factsStatus: "teilweise_hilfsquellen",
        openPoints: [
          "Das ESO-Bild ist eine restaurierte Kopie der Sobral-Platte (nicht von Eddington auf Príncipe); der ESO-Credit nennt dennoch Dyson, Eddington und Davidson – Zuschreibung klären, Bearbeitung (Restaurierung) kennzeichnen.",
          "Datum der Ergebnisverkündung (Royal Society) nicht belegt und nicht im Text.",
          "Primärquelle der Expeditionsberichte (Royal Society) war nicht lesbar (HTTP 403).",
          "Sehr große Datei (23.800 × 14.191 px); Import skaliert herunter.",
        ],
        image: {
          commonsFile: "Highest resolution image of the 1919 solar eclipse (potw1926a).jpg",
          commonsUrl: com("Highest resolution image of the 1919 solar eclipse (potw1926a).jpg"),
          originalUrl: "https://www.eso.org/public/images/potw1926a",
          originalReadable: true,
          author: "ESO/Landessternwarte Heidelberg-Königstuhl (Kopie einer Sobral-Platte)",
          license: "CC BY 4.0",
          licenseUrl: CC.by4,
          photoDate: "1919-05-29 (Ereignisdatum; Commons nennt nur das Upload-Datum)",
          creditShort: "Aufnahme: ESO / Landessternwarte Heidelberg-Königstuhl",
          creditFull:
            "ESO/Landessternwarte Heidelberg-Königstuhl/F. W. Dyson, A. S. Eddington & C. Davidson – digital restaurierte Kopie einer Fotoplatte der Sobral-Expedition, CC BY 4.0",
          altDraft: "Fotoplatte einer totalen Sonnenfinsternis mit dunkler Mondscheibe, umgeben von der Korona und kleinen Sternen",
          width: 23800,
          height: 14191,
          risks: ["Restauriert (Rauschreduktion).", "Zuschreibung irreführend.", "Kopie, keine Originalplatte."],
        },
      },
    },
  ],

  // ───────────────────────────── Paket 3 ─────────────────────────────
  [
    {
      slug: "tag-der-deutschen-einheit",
      category: "politik",
      difficulty: 1,
      neutral_title: "Mitternacht vor dem Reichstag",
      description:
        "Mitten in der Nacht versammeln sich Hunderttausende vor einem großen Gebäude in der Hauptstadt. Zu feierlicher Musik wird eine Fahne gehisst. Zwei Staaten, die lange getrennt waren, werden zu einem.",
      placeholderAlt: "Platzhalter für eine Fotografie: Menschenmenge bei Nacht vor einem beleuchteten Parlamentsgebäude mit Fahnenmast",
      correct_year: 1990,
      exact_date: "1990-10-03",
      public_title: "Tag der Deutschen Einheit: Die Wiedervereinigung",
      explanation_what:
        "Um Mitternacht wurde vor dem Reichstagsgebäude in Berlin zu den Klängen der Freiheitsglocke die Bundesflagge gehisst. Zugleich trat der Einigungsvertrag in Kraft: Das Grundgesetz galt nun auch in den fünf neuen Ländern und in ganz Berlin.",
      explanation_why:
        "Deutschland war wiedervereint. Berlin wurde Hauptstadt des wiedervereinigten Deutschlands, Bonn Bundesstadt. Der 3. Oktober ist seither Nationalfeiertag.",
      explanation_detail: "Den Staatsakt in der Berliner Philharmonie hatte Bundespräsident Richard von Weizsäcker angeordnet.",
      background: "Hunderttausende Berlinerinnen und Berliner und Gäste feierten am Reichstag, darunter die höchsten Vertreter der Bundesrepublik und der DDR.",
      sources: [
        { label: "Bundesregierung: Die Einheit ist Wirklichkeit", url: "https://www.bundesregierung.de/breg-de/schwerpunkte/deutsche-einheit/die-einheit-ist-wirklichkeit-432814" },
        { label: "Wikipedia (Hilfsquelle): Tag der Deutschen Einheit", url: "https://de.wikipedia.org/wiki/Tag_der_Deutschen_Einheit" },
      ],
      imageStatus: "zu_pruefen",
      size: [1200, 794],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "Kandidatenbild hat nur 736 px Breite – für große Darstellung zu klein; höher aufgelöste Bundesarchiv-Fassung suchen.",
          "Bundesarchiv-Bildunterschriften (ADN) können tendenziös sein; Wortlaut „Bundesfahne“ vs. „Fahne der Einheit“ im Text neutral gehalten.",
          "Personen im Bild nicht geprüft. Share-Alike (CC BY-SA 3.0 DE).",
        ],
        image: {
          commonsFile: "Bundesarchiv Bild 183-1990-1003-400, Berlin, deutsche Vereinigung, vor dem Reichstag.jpg",
          commonsUrl: com("Bundesarchiv Bild 183-1990-1003-400, Berlin, deutsche Vereinigung, vor dem Reichstag.jpg"),
          originalUrl: "https://bild.bundesarchiv.de/",
          originalReadable: false,
          author: "Peer Grimm (ADN-ZB, Bundesarchiv)",
          license: "CC BY-SA 3.0 DE",
          licenseUrl: CC.bysa3de,
          photoDate: "1990-10-03",
          creditShort: "Foto: Peer Grimm / Bundesarchiv",
          creditFull: "Bundesarchiv, Bild 183-1990-1003-400 / Grimm, Peer / CC-BY-SA 3.0",
          altDraft: "Nachtaufnahme einer großen Menschenmenge vor einem beleuchteten Reichstagsgebäude, daneben eine gehisste Fahne",
          width: 736,
          height: 487,
          risks: ["Niedrige Auflösung.", "Share-Alike.", "Bundesarchiv-Originalseite nicht geöffnet."],
        },
      },
    },
    {
      slug: "erster-start-des-space-shuttle",
      category: "technik",
      difficulty: 1,
      neutral_title: "Feuer unter dem Raumgleiter",
      description:
        "Eine gewaltige Feuer- und Rauchsäule trägt ein Raumfahrzeug mit zwei Raketen an den Seiten in den Himmel. Zum ersten Mal fliegt ein Raumgleiter ins All, der nach der Rückkehr auf einer Landebahn aufsetzen soll. Zwei Astronauten sitzen an Bord.",
      placeholderAlt: "Platzhalter für eine Fotografie: Raumfähre mit zwei seitlichen Raketen beim Start über einer Rauchwolke",
      correct_year: 1981,
      exact_date: "1981-04-12",
      public_title: "Der erste Flug des Space Shuttle",
      explanation_what:
        "Das Space Shuttle „Columbia“ startete mit John Young und Robert Crippen von Startrampe 39A zum ersten Flug des Shuttle-Programms (STS-1). Ziel war, sicher in den Orbit zu starten und Orbiter und Besatzung sicher zurückzubringen. Nach gut zwei Tagen landete „Columbia“ auf der Edwards Air Force Base.",
      explanation_why: "STS-1 war der erste Orbitalflug des Space Shuttles.",
      explanation_detail: "Beim Start gingen 16 Hitzeschutzkacheln verloren, 148 weitere wurden beschädigt.",
      background: "Der Flug dauerte 2 Tage, 6 Stunden, 20 Minuten und 53 Sekunden. Start war kurz nach 7 Uhr Ortszeit.",
      sources: [{ label: "NASA: STS-1", url: "https://www.nasa.gov/mission/sts-1/" }],
      imageStatus: "recherchiert",
      size: [1100, 1100],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "NASA-Bilddatensatz (81pc0382) war nicht lesbar; Hinweise zu NASA-Logos/Rechten Dritter am Original prüfen.",
          "NASA nennt die Startzeit mit „EST“; im Text steht nur „kurz nach 7 Uhr Ortszeit“.",
        ],
        image: {
          commonsFile: "Space Shuttle Columbia launching.jpg",
          commonsUrl: com("Space Shuttle Columbia launching.jpg"),
          originalUrl: "https://images.nasa.gov/details/81pc0382",
          originalReadable: false,
          author: "NASA",
          license: "Public Domain (NASA)",
          licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
          photoDate: "1981-04-12",
          creditShort: "Foto: NASA",
          creditFull: "NASA, Start von STS-1 von Pad 39A (Bild 81pc0382, GRIN GPN-2000-000650)",
          altDraft: "Raumfähre mit großem Außentank und zwei Feststoffraketen hebt über einer Feuer- und Rauchwolke von der Startrampe ab",
          width: 6084,
          height: 6084,
          risks: ["NASA-Originalseite nicht lesbar.", "Datei ca. 5 MB, quadratisch."],
        },
      },
    },
    {
      slug: "eroeffnung-der-olympischen-spiele-muenchen",
      category: "sport",
      difficulty: 2,
      neutral_title: "Einzug ins Stadion",
      description:
        "Tausende Sportlerinnen und Sportler ziehen nach Nationen geordnet in ein Stadion mit einem markanten Zeltdach ein. Das Gastgeberland will sich freundlich und weltoffen zeigen. Die Zuschauer auf den Rängen winken, und die Fahnen der Nationen wehen.",
      placeholderAlt: "Platzhalter für eine Fotografie: Sportlerinnen und Sportler beim Einzug in ein Stadion",
      correct_year: 1972,
      exact_date: "1972-08-26",
      public_title: "Eröffnung der Olympischen Spiele in München",
      explanation_what:
        "Bundespräsident Gustav Heinemann eröffnete die Olympischen Sommerspiele in München. Nach Olympedia nahmen Sportlerinnen und Sportler aus 121 Ländern teil.",
      explanation_why:
        "Die Spiele sollten ein heiteres, weltoffenes Deutschland zeigen; die Sicherheit war bewusst locker gehalten. Am 5. September wurden elf Mitglieder der israelischen Mannschaft ermordet. Die Spiele wurden für einen Tag unterbrochen.",
      explanation_detail:
        "Maskottchen war der Dackel Waldi, das erste offizielle Maskottchen Olympischer Sommerspiele. Entworfen hat ihn Elena Winschermann aus dem Büro von Otl Aicher.",
      background:
        "Den Generalentwurf für den Olympiapark lieferte das Stuttgarter Büro Behnisch & Partner, erster Preisträger des Wettbewerbs von 1967. Die Spiele dauerten bis zum 11. September.",
      sources: [
        { label: "Olympedia: Olympische Sommerspiele München", url: "https://www.olympedia.org/editions/18" },
        { label: "Olympiapark München: Rückblick auf die Spiele", url: "https://www.olympiapark.de/de/der-olympiapark/50-jahre/rueckblick-auf-ein-sensationelles-jubilaeum" },
        { label: "Wikipedia (Hilfsquelle): Münchner Olympia-Attentat", url: "https://de.wikipedia.org/wiki/M%C3%BCnchner_Olympia-Attentat" },
      ],
      imageStatus: "recherchiert",
      size: [1200, 818],
      research: {
        factsStatus: "teilweise_hilfsquellen",
        openPoints: [
          "Teilnehmerzahl: Olympedia 7.114 Teilnehmende aus 121 Ländern, Wikipedia 7.170 Athleten – im Text nur „121 Länder“.",
          "Die Zahl „elf“ ermordeter Israelis stammt aus Wikipedia (Hilfsquelle); IOC/Olympedia-Wortlaut abweichend – sachlich prüfen und sensibel formulieren.",
          "„Heitere Spiele“ nicht als offizielles Motto belegt; nur sinngemäß verwendet.",
          "Fortepan-Originalseite zeigte keine Metadaten (Skript-Nachladung); Lizenz, Donor und Datum dort bestätigen. Schreibweise des Spenders: „Romák Éva“ (Attribution-Feld) vs. „Románk Éva“.",
        ],
        image: {
          commonsFile: "Olimpiai Stadion, az olimpia megnyitóünnepsége. Fortepan 73755.jpg",
          commonsUrl: com("Olimpiai Stadion, az olimpia megnyitóünnepsége. Fortepan 73755.jpg"),
          originalUrl: "https://fortepan.hu/en/photos/?id=73755",
          originalReadable: false,
          author: "Fotograf nicht benannt; Spenderin Romák Éva (Fortepan)",
          license: "CC BY-SA 3.0",
          licenseUrl: CC.bysa3,
          photoDate: "1972-08-26",
          creditShort: "Foto: FORTEPAN / Romák Éva",
          creditFull: "FOTO:FORTEPAN / Romák Éva (Fortepan ID 73755), CC BY-SA 3.0",
          altDraft: "Mannschaften marschieren in einem Stadion ein, im Hintergrund die Zuschauerränge",
          width: 3892,
          height: 2652,
          risks: ["Fotograf unbekannt.", "Fortepan-Seite nicht verifizierbar.", "Share-Alike."],
        },
      },
    },
    {
      slug: "marsch-auf-washington",
      category: "gesellschaft",
      difficulty: 2,
      neutral_title: "Eine Rede vor dem Denkmal",
      description:
        "Ein Redner spricht eindringlich in ein ganzes Bündel von Mikrofonen. Neben ihm stehen Männer, einer trägt einen breitkrempigen Hut. Anlass ist ein großer Marsch für Arbeit und Freiheit, bei dem gleiche Rechte für alle Menschen gefordert werden.",
      placeholderAlt: "Platzhalter für eine Fotografie: Redner vor einem Bündel von Mikrofonen",
      correct_year: 1963,
      exact_date: "1963-08-28",
      public_title: "Der Marsch auf Washington und Martin Luther Kings Rede",
      explanation_what:
        "Martin Luther King hielt am Lincoln Memorial in Washington, D.C. beim „Marsch auf Washington für Arbeit und Freiheit“ seine Rede „I Have a Dream“. Nach der meistzitierten Schätzung kamen etwa 250.000 Menschen.",
      explanation_why:
        "King sagte, Amerika habe gegenüber seinen schwarzen Bürgern einen Schuldschein nicht eingelöst – ein Bild für das uneingelöste Versprechen von Freiheit und Gleichheit in der Verfassung.",
      explanation_detail:
        "Nach eigener Erinnerung stellte King den Text erst gegen 3:30 Uhr in der Nacht zur Rede fertig. An einer Stelle legte er das Manuskript beiseite und sprach frei.",
      background: "Der Redenschreiber Clarence Jones schlug die Metapher vom Schuldschein vor, die in die Rede einging.",
      sources: [
        { label: "King Institute (Stanford): I Have a Dream", url: "https://kinginstitute.stanford.edu/encyclopedia/i-have-dream" },
        { label: "Wikipedia (Hilfsquelle): March on Washington for Jobs and Freedom (Teilnehmerzahl)", url: "https://en.wikipedia.org/wiki/March_on_Washington_for_Jobs_and_Freedom" },
      ],
      imageStatus: "zu_pruefen",
      size: [1100, 1190],
      research: {
        factsStatus: "teilweise_hilfsquellen",
        openPoints: [
          "NARA-Katalogeintrag (NAID 542069) war nicht lesbar. Urheber: Commons nennt Rowland Scherman, der NARA-Datensatz „U.S. Information Agency“ – Credit entsprechend neutral formuliert.",
          "Das King Institute weist darauf hin, keine Rechte an Bildern/Texten von M. L. King vergeben zu können (Nachlass-Lizenzgeber IPM). Rechtsfrage für kommerzielle Nutzung klären (Foto selbst gilt als gemeinfreies US-Regierungswerk).",
          "Die Reihenfolge der Redner ist in Quellen widersprüchlich und steht deshalb nicht im Text.",
          "Teilnehmerzahl nur aus Wikipedia (Hilfsquelle).",
          "Commons-Fassung wurde zugeschnitten/gedreht; NARA-Original ist ein TIFF.",
        ],
        image: {
          commonsFile: "Martin Luther King - March on Washington.jpg",
          commonsUrl: com("Martin Luther King - March on Washington.jpg"),
          originalUrl: "https://catalog.archives.gov/id/542069",
          originalReadable: false,
          author: "U.S. Information Agency (häufig Rowland Scherman zugeschrieben)",
          license: "Public Domain (US-Regierungswerk)",
          licenseUrl: CC.pdm,
          photoDate: "1963-08-28",
          creditShort: "Foto: U.S. Information Agency / National Archives",
          creditFull: "U.S. Information Agency, Press and Publications Service / National Archives (NAID 542069); häufig Rowland Scherman zugeschrieben",
          altDraft: "Schwarz-Weiß-Nahaufnahme eines Redners vor mehreren Mikrofonen, neben ihm ein Mann mit breitkrempigem Hut",
          width: 1296,
          height: 1403,
          risks: ["Nachlass-Hinweis des King Institute.", "Urheberangabe abweichend.", "Bearbeitete Commons-Fassung."],
        },
      },
    },
    {
      slug: "eroeffnung-des-panamakanals",
      category: "technik",
      difficulty: 3,
      neutral_title: "Ein Frachter am Ende der Wasserstraße",
      description:
        "Ein Frachtschiff nähert sich dem Ende einer langen künstlichen Wasserstraße, die zwei Ozeane verbindet. Der geplante große Festakt fällt bescheiden aus. Das Schiff ist das erste, das die Strecke offiziell durchfährt.",
      placeholderAlt: "Platzhalter für eine Fotografie: Frachtschiff nähert sich einer Hafenanlage am Ende eines Kanals",
      correct_year: 1914,
      exact_date: "1914-08-15",
      public_title: "Die Eröffnung des Panamakanals",
      explanation_what:
        "Der Zementfrachter „Ancón“ unternahm unter Kapitän John A. Constantine die erste offizielle Durchfahrt durch den Panamakanal. Die Feier fiel bescheiden aus.",
      explanation_why:
        "Der Kanal ist etwa 80 Kilometer lang und hat drei Schleusenanlagen (Gatún, Pedro Miguel, Miraflores). Der Bau kostete rund 375 Millionen US-Dollar.",
      explanation_detail:
        "Die geplanten Festlichkeiten wurden wegen des Ersten Weltkriegs abgesagt. Bereits am 7. Januar 1914 hatte das Motorschiff „Alexander La Valley“ als erstes Hochseeschiff den Kanal durchquert – allerdings ohne offizielle Eröffnung.",
      background: "Jede Schleusenkammer misst 304,8 mal 33,53 Meter; der Culebra-Einschnitt ist rund 13,7 Kilometer lang.",
      sources: [
        { label: "Panama Canal Authority: Culminación de la construcción", url: "https://pancanal.com/culminacion-de-la-construccion/" },
        { label: "Panama Canal Authority: Conoce la historia del Canal de Panamá", url: "https://pancanal.com/conoce-la-historia-del-canal-de-panama/" },
      ],
      imageStatus: "recherchiert",
      size: [1100, 915],
      research: {
        factsStatus: "primaerquellen",
        openPoints: [
          "Ob die „Cristóbal“ schon am 3. August 1914 als erstes Schiff den Kanal querte, ist in den gelesenen Quellen nicht belegt – deshalb nur „erste offizielle Durchfahrt“.",
          "NARA-Katalog (NAID 100996362) war nicht lesbar; Urheber laut Commons „Panama Railroad Company“, Bildunterschrift: Annäherung der Ancon bei Balboa, 15. August 1914.",
          "Das Bild zeigt die Annäherung, nicht die Schleusung.",
          "Auf dem Archivfoto steht unten eine Beschriftung mit Ereignis und Datum – sie würde die Lösung verraten und wird deshalb beim Import abgeschnitten (cropBottomPct). Nach dem Zuschnitt am Bild prüfen, ob kein Text mehr sichtbar ist.",
        ],
        image: {
          commonsFile: "SS Ancon (1902 ship) NARA 185-G-0891.jpg",
          commonsUrl: com("SS Ancon (1902 ship) NARA 185-G-0891.jpg"),
          originalUrl: "https://catalog.archives.gov/id/100996362",
          originalReadable: false,
          author: "Panama Railroad Company (laut Commons)",
          license: "Public Domain (US-Regierungsbestand)",
          licenseUrl: CC.pdm,
          photoDate: "1914-08-15 (Bildunterschrift)",
          creditShort: "Foto: Panama Railroad Company / National Archives",
          creditFull: "Panama Railroad Company / National Archives and Records Administration (NARA 185-G-0891, NAID 100996362)",
          cropBottomPct: 6.5,
          altDraft: "Frachtschiff auf einem Kanal in Richtung einer Hafenanlage, am Ufer Schaulustige",
          width: 1496,
          height: 1244,
          risks: ["NARA-Seite nicht lesbar.", "Urheberangabe nur laut Commons."],
        },
      },
    },
  ],
];
