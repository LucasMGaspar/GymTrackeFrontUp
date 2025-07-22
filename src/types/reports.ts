// src/types/reports.ts

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  exerciseId?: string;
  exerciseIds?: string[];
  metric?: 'weight' | 'reps' | 'volume';
  seriesType?: 'max' | 'average' | 'all';
  type?: 'weight' | 'reps' | 'volume';
  period?: 'week' | 'month' | 'year';
  format?: 'json' | 'summary';
}

export interface WorkoutOverview {
  period: {
    startDate: string;
    endDate: string;
  };
  totals: {
    workouts: number;
    exercises: number;
    series: number;
    volume: number;
  };
  averages: {
    exercisesPerWorkout: number;
    seriesPerWorkout: number;
    durationMinutes: number;
  };
  workoutDates: string[];
}

export interface ExerciseEvolution {
  exerciseName: string;
  exerciseId: string;
  seriesType: string;
  period: {
    startDate: string;
    endDate: string;
    totalSessions: number;
  };
  data: Array<{
    date: string;
    dayOfWeek: string;
    maxWeight?: {
      weight: number;
      reps: number;
      volume: number;
    };
    maxReps?: {
      weight: number;
      reps: number;
      volume: number;
    };
    bestVolume?: {
      weight: number;
      reps: number;
      volume: number;
    };
  }>;
  analysis: {
    weightProgress: {
      initial: number;
      current: number;
      difference: number;
      percentage: number;
    };
    repsProgress: {
      initial: number;
      current: number;
      difference: number;
      percentage: number;
    };
    volumeProgress: {
      initial: number;
      current: number;
      difference: number;
      percentage: number;
    };
    overallTrend: 'improving' | 'mixed' | 'declining';
    sessionsAnalyzed: number;
  };
}

// Interface para dados de exercícios
export interface ExerciseData {
  weight?: number;
  reps?: number;
  volume?: number;
  date: string;
}

// Interface para melhorias
export interface ImprovementData {
  percentage: number;
  difference: number;
  initialValue: number;
  currentValue: number;
}

export interface ExerciseComparison {
  metric: string;
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

export interface PersonalRecord {
  exerciseName: string;
  record: {
    value: number;
    date: string;
    reps?: number;
    weight?: number;
    basedOn?: string;
  };
  type: string;
}

export interface MuscleGroupAnalysis {
  muscleGroups: Array<{
    name: string;
    workouts: number;
    exercises: number;
    series: number;
    volume: number;
    lastWorkout: string;
  }>;
  total: number;
}

export interface WorkoutFrequency {
  period: string;
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

export interface CompleteReportSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalWorkouts: number;
    totalVolume: number;
    averageDuration: number;
    mostActiveDay: string;
    topMuscleGroup: string;
    currentStreak: number;
  };
  highlights: {
    personalRecords: PersonalRecord[];
    volumeTrend: 'up' | 'down' | 'stable';
    consistencyScore: number;
  };
}