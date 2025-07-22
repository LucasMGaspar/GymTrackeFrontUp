// src/services/reports.service.ts
import api from '@/lib/api';

function getAuthHeader() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('❌ Token não encontrado no localStorage');
    throw new Error('Usuário não autenticado');
  }
  console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
  return { Authorization: `Bearer ${token}` };
}

// Interface para dados de exercícios
interface ExerciseData {
  weight?: number;
  reps?: number;
  volume?: number;
  date: string;
}

// Interface para melhorias
interface ImprovementData {
  percentage: number;
  difference: number;
  initialValue: number;
  currentValue: number;
}

// Interfaces para tipagem
export interface WorkoutOverview {
  period: { startDate: string; endDate: string };
  totals: { workouts: number; exercises: number; series: number; volume: number };
  averages: { exercisesPerWorkout: number; seriesPerWorkout: number; durationMinutes: number };
  workoutDates: string[];
}

export interface ExerciseEvolution {
  exerciseName: string;
  exerciseId: string;
  data: Array<{
    date: string;
    maxWeight?: { weight: number; reps: number };
    maxReps?: { weight: number; reps: number };
    bestVolume?: { weight: number; reps: number; volume: number };
  }>;
  analysis?: {
    weightProgress?: { initial: number; current: number; percentage: number };
    repsProgress?: { initial: number; current: number; percentage: number };
    volumeProgress?: { initial: number; current: number; percentage: number };
    overallTrend?: 'improving' | 'mixed' | 'declining';
    sessionsAnalyzed?: number;
  };
}

export interface PersonalRecord {
  exerciseName: string;
  record: {
    value: number;
    date: string;
    reps?: number;
    weight?: number;
  };
  type: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  sessions: Array<{
    date: string;
    series: number;
    maxWeight: number;
    maxReps: number;
    volume: number;
    seriesData: Array<{
      weight: number;
      reps: number;
      difficulty: number;
    }>;
  }>;
  progress: {
    maxWeight: number;
    maxReps: number;
    maxVolume: number;
    totalSeries: number;
  };
}

export interface WorkoutFrequency {
  period: 'week' | 'month' | 'year';
  data: Array<{
    period: string;
    count: number;
    dates: string[];
  }>;
  summary: {
    total: number;
    average: number;
  };
}

export interface MuscleGroupAnalysis {
  muscleGroups: Array<{
    name: string;
    workouts: number;
    exercises: number;
    series: number;
    volume: number;
    lastWorkout: string | null;
  }>;
  total: number;
}

export interface VolumeAnalysis {
  data: Array<{
    date: string;
    exerciseName: string;
    volume: number;
    series: number;
    avgWeight: number;
    totalReps: number;
  }>;
  summary: {
    totalVolume: number;
    averageVolume: number;
    maxVolume: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface WorkoutDuration {
  data: Array<{
    date: string;
    duration: number;
    dayOfWeek: string;
  }>;
  summary: {
    average: number;
    shortest: number;
    longest: number;
    total: number;
  };
}

export interface WorkoutConsistency {
  data: Array<{
    dayOfWeek: string;
    count: number;
    percentage: number;
  }>;
  mostActiveDay: {
    dayOfWeek: string;
    count: number;
    percentage: number;
  };
  leastActiveDay: {
    dayOfWeek: string;
    count: number;
    percentage: number;
  };
}

export interface ExerciseComparison {
  metric: 'weight' | 'reps' | 'volume';
  period: {
    startDate: string;
    endDate: string;
  };
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    totalSessions: number;
    latestData: ExerciseData;
    firstData: ExerciseData;
    improvement: ImprovementData;
  }>;
  ranking: Array<{
    position: number;
    exerciseName: string;
    improvement: ImprovementData;
  }>;
}

export interface StrengthAnalysis {
  exercises: Array<{
    exerciseName: string;
    exerciseId: string;
    strengthCurve: Array<{
      date: string;
      weight: number;
      reps: number;
      estimated1RM: number;
      volume: number;
    }>;
    records: {
      heaviest1Rep: { weight: number; date: string } | null;
      heaviest5Reps: { weight: number; reps: number; date: string } | null;
      heaviest10Reps: { weight: number; reps: number; date: string } | null;
      estimated1RM: { value: number; basedOn: string; date: string } | null;
    };
  }>;
  summary: {
    totalExercises: number;
    overallStrengthTrend: 'strong_improvement' | 'improvement' | 'stable' | 'decline' | 'no_data';
  };
}

// Interface para o relatório completo
export interface CompleteReport {
  overview: WorkoutOverview;
  exerciseProgress: ExerciseProgress[];
  frequency: WorkoutFrequency;
  muscleGroups: MuscleGroupAnalysis;
  volume: VolumeAnalysis;
  records: PersonalRecord[];
  duration: WorkoutDuration;
  consistency: WorkoutConsistency;
  generatedAt: string;
}

export const ReportsService = {
  // Relatório geral de treinos
  async getWorkoutOverview(dateRange?: { startDate?: string; endDate?: string }): Promise<WorkoutOverview> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = `/reports/overview${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar overview dos treinos:', error);
      throw error;
    }
  },

  // Progresso por exercício
  async getExerciseProgress(
    exerciseId?: string, 
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<ExerciseProgress[]> {
    try {
      const params = new URLSearchParams();
      if (exerciseId) params.append('exerciseId', exerciseId);
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = `/reports/exercise-progress${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar progresso dos exercícios:', error);
      throw error;
    }
  },

  // Evolução detalhada de peso e repetições
  async getExerciseEvolution(
    exerciseId: string,
    options?: {
      seriesType?: 'max' | 'average' | 'all';
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ExerciseEvolution> {
    try {
      const params = new URLSearchParams();
      params.append('exerciseId', exerciseId);
      if (options?.seriesType) params.append('seriesType', options.seriesType);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      
      const url = `/reports/evolution?${params.toString()}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar evolução do exercício:', error);
      throw error;
    }
  },

  // Frequência de treinos
  async getWorkoutFrequency(
    period: 'week' | 'month' | 'year' = 'month',
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<WorkoutFrequency> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const url = `/reports/frequency?${params.toString()}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar frequência dos treinos:', error);
      throw error;
    }
  },

  // Análise por grupo muscular
  async getMuscleGroupAnalysis(
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<MuscleGroupAnalysis> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = `/reports/muscle-groups${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar análise dos grupos musculares:', error);
      throw error;
    }
  },

  // Análise de volume
  async getVolumeAnalysis(
    exerciseId?: string,
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<VolumeAnalysis> {
    try {
      const params = new URLSearchParams();
      if (exerciseId) params.append('exerciseId', exerciseId);
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = `/reports/volume${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar análise de volume:', error);
      throw error;
    }
  },

  // Recordes pessoais
  async getPersonalRecords(options?: {
    exerciseId?: string;
    type?: 'weight' | 'reps' | 'volume';
  }): Promise<PersonalRecord[]> {
    try {
      const params = new URLSearchParams();
      if (options?.exerciseId) params.append('exerciseId', options.exerciseId);
      if (options?.type) params.append('type', options.type);
      
      const queryString = params.toString();
      const url = `/reports/personal-records${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recordes pessoais:', error);
      throw error;
    }
  },

  // Duração dos treinos
  async getWorkoutDuration(
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<WorkoutDuration> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = `/reports/duration${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar duração dos treinos:', error);
      throw error;
    }
  },

  // Consistência (dias da semana)
  async getWorkoutConsistency(
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<WorkoutConsistency> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = `/reports/consistency${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar consistência dos treinos:', error);
      throw error;
    }
  },

  // Comparar múltiplos exercícios
  async compareExercises(
    exerciseIds: string[],
    metric: 'weight' | 'reps' | 'volume' = 'weight',
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<ExerciseComparison> {
    try {
      const params = new URLSearchParams();
      params.append('exerciseIds', exerciseIds.join(','));
      params.append('metric', metric);
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const url = `/reports/compare-exercises?${params.toString()}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao comparar exercícios:', error);
      throw error;
    }
  },

  // Análise de força
  async getStrengthAnalysis(
    exerciseId?: string,
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<StrengthAnalysis> {
    try {
      const params = new URLSearchParams();
      if (exerciseId) params.append('exerciseId', exerciseId);
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = `/reports/strength-analysis${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar análise de força:', error);
      throw error;
    }
  },

  // Relatório completo
  async getCompleteReport(
    format: 'json' | 'summary' = 'summary',
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<CompleteReport> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const url = `/reports/complete?${params.toString()}`;
      
      const response = await api.get(url, {
        headers: getAuthHeader(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatório completo:', error);
      throw error;
    }
  },
};