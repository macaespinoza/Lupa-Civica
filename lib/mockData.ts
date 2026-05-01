import { Legislator, Project } from './types';
import { calculateEfficiencyScore } from './evaluator';

export const mockLegislators: Legislator[] = ([
  {
    id: 'l1',
    name: 'Karol Cariola Oliva',
    type: 'Deputy' as const,
    title: 'Diputada',
    gender: 'F',
    party: 'Partido Comunista',
    partySigla: 'PC',
    region: 'RM Metropolitana',
    district: 'N° 9',
    email: 'karol.cariola@congreso.cl',
    imageUrl: 'https://picsum.photos/seed/cariola/400/400',
    efficiencyScore: 0,
    coalition: 'Frente Amplio',
    bio: 'Matrona y política chilena. Presidenta de la Cámara de Diputados.',
    stats: {
      attendanceRate: 99.5,
      unjustifiedAbsences: 0,
      probityFinesUTM: 0,
      lobbyMeetingsCount: 52,
      missedLobbyRegistrations: 0,
      votingParticipation: 98.8
    }
  },
  {
    id: 'l2',
    name: 'Jorge Alessandri Vergara',
    type: 'Deputy' as const,
    title: 'Diputado',
    gender: 'M',
    party: 'Unión Demócrata Independiente',
    partySigla: 'UDI',
    region: 'RM Metropolitana',
    district: 'N° 10',
    email: 'jorge.alessandri@congreso.cl',
    imageUrl: 'https://picsum.photos/seed/alessandri/400/400',
    efficiencyScore: 0,
    coalition: 'Chile Vamos',
    bio: 'Abogado y político. Miembro de la bancada UDI.',
    stats: {
      attendanceRate: 94.2,
      unjustifiedAbsences: 1,
      probityFinesUTM: 0,
      lobbyMeetingsCount: 28,
      missedLobbyRegistrations: 1,
      votingParticipation: 91.5
    }
  },
  {
    id: 'l3',
    name: 'Paulina Núñez Urrutia',
    type: 'Senator' as const,
    title: 'Senadora',
    gender: 'F',
    party: 'Renovación Nacional',
    partySigla: 'RN',
    region: 'Región de Antofagasta',
    district: 'Circunscripción 3',
    email: 'paulina.nunez@congreso.cl',
    imageUrl: 'https://picsum.photos/seed/nunez/400/400',
    efficiencyScore: 0,
    coalition: 'Chile Vamos',
    bio: 'Abogada y política chilena. Presidenta del Senado.',
    stats: {
      attendanceRate: 97.8,
      unjustifiedAbsences: 0,
      probityFinesUTM: 0,
      lobbyMeetingsCount: 15,
      missedLobbyRegistrations: 0,
      votingParticipation: 96.5
    }
  },
  {
    id: 'l4',
    name: 'Vlado Mirosevic Verdugo',
    type: 'Deputy' as const,
    title: 'Diputado',
    gender: 'M',
    party: 'Partido Liberal',
    partySigla: 'PL',
    region: 'Arica y Parinacota',
    district: 'N° 1',
    email: 'vlado.mirosevic@congreso.cl',
    imageUrl: 'https://picsum.photos/seed/vlado/400/400',
    efficiencyScore: 0,
    coalition: 'Socialismo Democrático',
    bio: 'Cientista político y político chileno del Partido Liberal.',
    stats: {
      attendanceRate: 95.5,
      unjustifiedAbsences: 0,
      probityFinesUTM: 0,
      lobbyMeetingsCount: 22,
      missedLobbyRegistrations: 0,
      votingParticipation: 94.2
    }
  }
] as Legislator[]).map(l => ({
  ...l,
  efficiencyScore: calculateEfficiencyScore(l.stats)
}));

export const mockProjects: Project[] = [
  {
    id: 'p1',
    title: 'Ley sobre Protección de Datos Personales',
    bulletinNumber: '11144-07',
    summary: 'Modifica la Ley N° 19.628, sobre protección de la vida privada.',
    status: 'En tramitación',
    chamber: 'Senado',
    tags: ['Privacidad', 'Tecnología', 'Derechos'],
    createdAt: '2023-01-15'
  },
  {
    id: 'p2',
    title: 'Proyecto de Inteligencia Artificial',
    bulletinNumber: '16834-19',
    summary: 'Establece un marco ético y regulatorio para el desarrollo de IA.',
    status: 'Primer Trámite Constitucional',
    chamber: 'Cámara de Diputados',
    tags: ['IA', 'Ética', 'Futuro'],
    createdAt: '2024-03-10'
  }
];
