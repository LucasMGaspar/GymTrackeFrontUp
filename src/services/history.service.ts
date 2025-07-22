const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  private static getAuthHeader() {
    const token = localStorage.getItem('token');  // ← USAR 'token'
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    return { Authorization: `Bearer ${token}` };
  }

  private static async fetchWithParams<T>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}/history/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

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
    const cleanFilters: Record<string, unknown> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanFilters[key] = value;
        }
      });
    }
    return this.fetchWithParams('', cleanFilters);
  }

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
    const response = await fetch(`${API_BASE_URL}/history/${workoutId}`, {
      headers: this.getAuthHeader(),
    });
    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes: ${response.statusText}`);
    }
    return response.json();
  }

  static async getHistoryStats(
    period: 'week' | 'month' | 'year' | 'all' = 'month',
    startDate?: string,
    endDate?: string,
  ): Promise<HistoryStats> {
    return this.fetchWithParams('stats/overview', { period, startDate, endDate });
  }

  static async getWeeklyPattern(startDate?: string, endDate?: string): Promise<WeeklyPattern[]> {
    return this.fetchWithParams('stats/weekly-pattern', { startDate, endDate });
  }

  static async getMuscleGroupStats(startDate?: string, endDate?: string): Promise<MuscleGroupStat[]> {
    return this.fetchWithParams('stats/muscle-groups', { startDate, endDate });
  }

  static async deleteWorkout(workoutId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/history/${workoutId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });
    if (!response.ok) {
      throw new Error(`Erro ao deletar treino: ${response.statusText}`);
    }
    return response.json();
  }

  static async duplicateWorkout(workoutId: string): Promise<{ id: string }> {
    return this.fetchWithParams(`${workoutId}/duplicate`);
  }
}