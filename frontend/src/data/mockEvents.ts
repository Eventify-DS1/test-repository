export interface Event {
  id: string;
  title: string;
  description: string;
  category: "académico" | "deportivo" | "cultural" | "social";
  dateStart: string;
  dateEnd: string;
  time: string;
  location: string;
  capacity: number;
  registered: number;
  attendees: string[];
  organizer: string;
  image?: string;
  ratings?: Array<{
    user: string;
    rating: number;
    comment: string;
  }>;
}

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Feria de Emprendimiento 2025",
    description: "Descubre proyectos innovadores de estudiantes emprendedores. Contaremos con stands, charlas motivacionales y networking. Una excelente oportunidad para conocer nuevas ideas de negocio y conectar con mentores del ecosistema empresarial.",
    category: "académico",
    dateStart: "2025-03-15",
    dateEnd: "2025-03-15",
    time: "14:00 - 18:00",
    location: "Auditorio Principal",
    capacity: 200,
    registered: 145,
    attendees: ["Ana García", "Carlos Ruiz", "María López"],
    organizer: "Facultad de Administración",
    ratings: [
      { user: "Ana García", rating: 5, comment: "Excelente evento, muy inspirador" },
      { user: "Carlos Ruiz", rating: 4, comment: "Buena organización" },
    ],
  },
  {
    id: "2",
    title: "Torneo Relámpago de Fútbol",
    description: "Participa en nuestro tradicional torneo de fútbol inter-facultades. Equipos de 7 jugadores. Premios para los tres primeros lugares. ¡Demuestra tu talento deportivo y representa a tu facultad!",
    category: "deportivo",
    dateStart: "2025-03-20",
    dateEnd: "2025-03-20",
    time: "09:00 - 17:00",
    location: "Cancha de Fútbol",
    capacity: 150,
    registered: 120,
    attendees: ["Pedro Sánchez", "Luis Martínez"],
    organizer: "Bienestar Estudiantil",
  },
  {
    id: "3",
    title: "Noche de Teatro Universitario",
    description: "Disfruta de las mejores obras teatrales interpretadas por el grupo de teatro estudiantil. Entrada libre. Esta noche presentaremos tres obras cortas escritas por estudiantes de Literatura.",
    category: "cultural",
    dateStart: "2025-03-25",
    dateEnd: "2025-03-25",
    time: "19:00 - 22:00",
    location: "Teatro Universidad",
    capacity: 300,
    registered: 250,
    attendees: ["Laura Fernández", "Diego Torres"],
    organizer: "Grupo de Teatro Estudiantil",
  },
  {
    id: "4",
    title: "Workshop: Inteligencia Artificial",
    description: "Aprende sobre los fundamentos de IA y Machine Learning. Sesión práctica con Python. Traer laptop. Se entregarán certificados de participación. Cupos limitados.",
    category: "académico",
    dateStart: "2025-04-01",
    dateEnd: "2025-04-01",
    time: "15:00 - 19:00",
    location: "Laboratorio de Computación 3",
    capacity: 40,
    registered: 40,
    attendees: ["Roberto Kim", "Sandra Vega"],
    organizer: "Carrera de Ingeniería de Sistemas",
  },
  {
    id: "5",
    title: "Fiesta de Bienvenida",
    description: "Celebra el inicio del semestre con música, comida y actividades recreativas. DJ en vivo, concursos con premios y mucho más. ¡No te lo pierdas!",
    category: "social",
    dateStart: "2025-03-10",
    dateEnd: "2025-03-10",
    time: "20:00 - 02:00",
    location: "Plaza Central",
    capacity: 500,
    registered: 380,
    attendees: ["Valeria Mora", "Andrés Castro"],
    organizer: "Centro Estudiantil",
  },
  {
    id: "6",
    title: "Hackathon 48 Horas",
    description: "Participa en nuestro hackathon anual. Forma equipos y desarrolla soluciones tecnológicas innovadoras. Premios en efectivo para los ganadores.",
    category: "académico",
    dateStart: "2025-04-15",
    dateEnd: "2025-04-17",
    time: "Evento de 48 horas",
    location: "Edificio de Ingeniería",
    capacity: 100,
    registered: 85,
    attendees: [],
    organizer: "IEEE Student Branch",
  },
];
