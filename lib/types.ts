export interface AttendanceRecord {
  date: string;
  session: string;
  present: boolean;
  justified?: boolean;
  justificationType?: 'Médica' | 'Comisión' | 'Personal' | 'Licencia' | 'Injustificada';
}

export interface VotingRecord {
  bulletinNumber: string;
  billName: string;
  date: string;
  vote: 'A favor' | 'En contra' | 'Abstención' | 'Pareo' | 'Ausente';
  chamber: 'Senado' | 'Cámara de Diputados';
}

export interface ProbityRecord {
  year: number;
  sanctionType: 'Multa UTM' | 'Amonestación' | 'Cierre de Investigación';
  amount?: number;
  reason: string;
  ley: '20.880' | '20.730' | 'Otro';
}

export interface LobbyRecord {
  date: string;
  subject: string;
  attendee: string;
  institution: string;
}

export interface LegislatorStats {
  attendanceRate: number;
  unjustifiedAbsences: number;
  probityFinesUTM: number;
  lobbyMeetingsCount: number;
  missedLobbyRegistrations: number;
  votingParticipation: number;
  attendanceRecords?: AttendanceRecord[];
  votingRecords?: VotingRecord[];
  probityRecords?: ProbityRecord[];
  lobbyRecords?: LobbyRecord[];
  votingSummary?: {
    inFavor: number;
    against: number;
    abstention: number;
    paired: number;
    absent: number;
  };
}

export interface Legislator {
  id: string;
  name: string;
  type: 'Senator' | 'Deputy';
  title: string;
  gender: 'M' | 'F';
  party: string;
  partySigla?: string;
  coalition?: string;
  region: string;
  district: string;
  email: string;
  imageUrl: string;
  efficiencyScore: number;
  stats: LegislatorStats;
  bio: string;
  lastLobbyMeeting?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface Project {
  id: string;
  title: string;
  bulletinNumber: string;
  summary: string;
  status: string;
  chamber: string;
  tags: string[];
  createdAt: string;
}
