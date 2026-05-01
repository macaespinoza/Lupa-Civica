import { LegislatorStats } from './evaluator';

export interface Legislator {
  id: string;
  name: string;
  type: 'Senator' | 'Deputy';
  title: string; // "Diputado", "Diputada", "Senador", "Senadora"
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
