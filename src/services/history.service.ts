// src/services/history.service.ts
import api from '@/lib/api';

export interface HistoryFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  muscleGroup?: string;
  search?: string;
}

export interface WorkoutHistoryItem {
  id: string;
  date: string;
  dayOfWeek: string;
  muscleGroups: string[];
  status: 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
  startTime: string;
  endTime?: string;
  notes?: string;
  exerciseExecutions: Array<{
    id: string;
    exerciseName: string;
    isCompleted: boolean;
    seriesExecutions: Array<{
      weight: number;
      reps: number;
    }>;
  }>;
  stats: {
    totalExercises: number;
    completedExercises: number;
    totalSeries: number;
    totalVolume: number;
    duration: number;
    completionRate: number;
  };
}

export interface HistoryStats {
  period: string;
  totals: {
    workouts: number;
    completedWorkouts: number;
    cancelledWorkouts: number;
    inProgressWorkouts: number;
    exercises: number;
    series: number;
    volume: number;
    duration: number;
  };
  averages: {
    workoutsPerWeek: number;
    exercisesPerWorkout: number;
    seriesPerWorkout: number;
    volumePerWorkout: number;
    durationPerWorkout: number;
  };
  completionRate: number;
}

export interface WeeklyPattern {
  dayOfWeek: string;
  count: number;
  percentage: number;
}

export interface MuscleGroupStat {
  name: string;
  count: number;
  percentage: number;
}

export class HistoryService {
  // ✅ CORREÇÃO: Função auxiliar para construir parâmetros de query
  private static buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ✅ CORREÇÃO: Buscar histórico de treinos
  static async getWorkoutHistory(filters?: HistoryFilters): Promise<{
    data: WorkoutHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const cleanFilters: Record<string, unknown> = {};
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            cleanFilters[key] = value;
          }
        });
      }

      const queryString = this.buildQueryString(cleanFilters);
      const response = await api.get(`/history${queryString}`);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Buscar detalhes do treino
  static async getWorkoutDetails(workoutId: string): Promise<{
    id: string;
    date: string;
    dayOfWeek: string;
    muscleGroups: string[];
    status: 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
    startTime: string;
    endTime?: string;
    notes?: string;
    exerciseExecutions: Array<{
      id: string;
      exerciseName: string;
      order: number;
      isCompleted: boolean;
      plannedSeries: number;
      completedSeries: number;
      exercise: {
        id: string;
        name: string;
        muscleGroups: string[];
        equipment?: string;
        instructions?: string;
      };
      seriesExecutions: Array<{
        id: string;
        seriesNumber: number;
        weight: number;
        reps: number;
        restTime?: number;
        difficulty?: number;
        notes?: string;
      }>;
    }>;
    stats: {
      totalExercises: number;
      completedExercises: number;
      totalSeries: number;
      totalVolume: number;
      averageWeight: number;
      averageReps: number;
      duration: number;
    };
  }> {
    try {
      const response = await api.get(`/history/${workoutId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do treino:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Buscar estatísticas do histórico
  static async getHistoryStats(
    period: 'week' | 'month' | 'year' | 'all' = 'month',
    startDate?: string,
    endDate?: string,
  ): Promise<HistoryStats> {
    try {
      const params: Record<string, unknown> = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const queryString = this.buildQueryString(params);
      const response = await api.get(`/history/stats/overview${queryString}`);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do histórico:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Buscar padrão semanal
  static async getWeeklyPattern(startDate?: string, endDate?: string): Promise<WeeklyPattern[]> {
    try {
      const params: Record<string, unknown> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const queryString = this.buildQueryString(params);
      const response = await api.get(`/history/stats/weekly-pattern${queryString}`);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar padrão semanal:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Buscar estatísticas dos grupos musculares
  static async getMuscleGroupStats(startDate?: string, endDate?: string): Promise<MuscleGroupStat[]> {
    try {
      const params: Record<string, unknown> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const queryString = this.buildQueryString(params);
      const response = await api.get(`/history/stats/muscle-groups${queryString}`);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos grupos musculares:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Deletar treino
  static async deleteWorkout(workoutId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/history/${workoutId}`);
      return response.data || { success: true, message: 'Treino deletado com sucesso' };
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      throw error;
    }
  }

  // ✅ CORREÇÃO: Duplicar treino
  static async duplicateWorkout(workoutId: string): Promise<{ id: string; message: string; newWorkout: any }> {
    try {
      const response = await api.get(`/history/${workoutId}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Erro ao duplicar treino:', error);
      throw error;
    }
  }
}
