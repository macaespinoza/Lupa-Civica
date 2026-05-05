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

// ─── Activity Data (Scraped from Senate API / Chamber portals) ─────────────────

export interface BillSponsorship {
  bulletinNumber: string;
  title: string;
  status: string;
  urgencyLevel?: 'SUMA' | 'URGENTE' | 'DISCUSIÓN' | 'SÍ' | 'NO';
  date: string;
  chamber: 'Senado' | 'Cámara de Diputados';
}

export interface VoteRecord {
  bulletinNumber: string;
  billTitle: string;
  date: string;
  vote: 'A favor' | 'En contra' | 'Abstención' | 'Pareo' | 'Ausente';
  chamber: 'Senado' | 'Cámara de Diputados';
  session?: string;
}

export interface AttendanceDetail {
  period: string;
  present: number;
  absent: number;
  justifiedAbsences: {
    medical: number;
    commission: number;
    personal: number;
    license: number;
  };
  unjustifiedAbsences: number;
}

export interface LegislatorActivity {
  // Senate bills & voting
  totalBillsAuthored: number;
  totalBillsCoAuthored: number;
  recentBills: BillSponsorship[];
  votingHistory: VoteRecord[];
  votingSummary: {
    inFavor: number;
    against: number;
    abstention: number;
    paired: number;
    absent: number;
  };
  // Chamber attendance
  attendanceRate: number;
  attendanceDetails: AttendanceDetail[];
  unjustifiedAbsences: number;
  lastUpdated: string;
  source: 'senado.cl' | 'bcn.cl' | 'camara.cl';
}

export interface PropertyDeclaration {
  type: 'Urbana' | 'Rural' | 'Vehículo' | 'Otro';
  description: string;
  value?: number;
  acquisitionYear?: number;
}

export interface BusinessParticipation {
  companyName: string;
  rut?: string;
  role: string;
  participationPercentage?: number;
}

export interface LobbyMeeting {
  date: string;
  subject: string;
  institution: string;
  outcome?: string;
}

export interface ProbityFine {
  year: number;
  sanctionType: 'Multa UTM' | 'Amonestación' | 'Cierre de Investigación' | 'Suspensión';
  amount?: number;
  reason: string;
  ley: '20.880' | '20.730' | '20.800' | 'Otro';
  resolved: boolean;
}

export interface LegislatorProbity {
  // Lobby activity
  totalLobbyMeetings: number;
  recentLobbyMeetings: LobbyMeeting[];
  missedLobbyRegistrations: number;
  // Asset declarations (InfoProbidad)
  totalProperties: number;
  properties: PropertyDeclaration[];
  totalBusinessParticipations: number;
  businesses: BusinessParticipation[];
  // Probity sanctions
  totalFines: number;
  fines: ProbityFine[];
  pendingSanctions: number;
  lastUpdated: string;
  source: 'infoprobidad.cl' | 'infosegura.srcei.cl' | 'probaditud.chile';
}

// ─── Legacy stats interface retained for backward compatibility ─────────────────

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

// ─── Updated Legislator with Activity + Probity subdocuments ───────────────────

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
  // NEW: Enriched activity & probity data (merged, not replacing existing)
  activity?: LegislatorActivity;
  probity?: LegislatorProbity;
}
