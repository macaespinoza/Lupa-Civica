/**
 * Lógica del Algoritmo Evaluador: Índice de Eficiencia y Probidad
 * Basado en Ley 20.880, Ley 20.730 y Ley de Transparencia.
 */

export interface LegislatorStats {
  attendanceRate: number; // 0-100
  unjustifiedAbsences: number;
  probityFinesUTM: number; // Multas de 5 a 50 UTM
  lobbyMeetingsCount: number;
  missedLobbyRegistrations: number; // Penalizaciones registradas
  votingParticipation: number; // 0-100
}

export function calculateEfficiencyScore(stats: LegislatorStats): number {
  let score = 100;

  // 1. Asistencia y Votaciones (Base matemática principal)
  // Descontar por asistencia baja
  const attendancePenalty = (100 - stats.attendanceRate) * 0.5;
  score -= attendancePenalty;

  // Descontar por inasistencias injustificadas
  score -= stats.unjustifiedAbsences * 2;

  // Participación en sala
  const participationBonus = stats.votingParticipation >= 95 ? 5 : 0;
  score += participationBonus;

  // 2. Probidad (Ley 20.880)
  // Descontar puntos proporcionalmente si reciben multas de 5 a 50 UTM
  if (stats.probityFinesUTM > 0) {
    // 1 UTM fine = -1 point, up to -50
    score -= Math.min(stats.probityFinesUTM, 50);
  }

  // 3. Lobby (Ley 20.730)
  // Penalizar omisiones en el registro de audiencias, viajes y donativos
  score -= stats.missedLobbyRegistrations * 5;

  // Bonus por transparencia activa (muchos registros de lobby puede ser bueno si son transparentes)
  // Pero aquí premiamos la consistencia.
  
  // Normalizar entre 0 y 100
  return Math.max(0, Math.min(100, score));
}

export function getScoreGrade(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Alto', color: 'text-score-high' };
  if (score >= 40) return { label: 'Medio', color: 'text-score-mid' };
  return { label: 'Bajo', color: 'text-score-low' };
}
