'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { HistoryService } from '@/services/history.service';
import HydrationWrapper from '@/components/ui/HydrationWrapper';
import { 
  Clock,
  Target,
  Activity,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Pause,
  BarChart3,
  Dumbbell,
  Copy,
  Trash2,
  Timer,
  Weight,
  RotateCcw,
  Star,
  MessageCircle
} from 'lucide-react';

interface WorkoutDetails {
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
}

function WorkoutDetailsContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<WorkoutDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkoutDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await HistoryService.getWorkoutDetails(workoutId);
      setWorkout(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar detalhes do treino';
      setError(errorMessage);
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (workoutId) {
      loadWorkoutDetails();
    }
  }, [isAuthenticated, router, workoutId, loadWorkoutDetails]);

  const handleDuplicateWorkout = async () => {
    if (!workout) return;
    
    try {
      const result = await HistoryService.duplicateWorkout(workout.id);
      alert('Treino duplicado com sucesso!');
      router.push(`/workout/${result.id}/exercises`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao duplicar treino';
      alert(errorMessage);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!workout) return;
    
    if (!confirm('Tem certeza que deseja deletar este treino?')) return;

    try {
      await HistoryService.deleteWorkout(workout.id);
      alert('Treino deletado com sucesso!');
      router.push('/dashboard/history');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar treino';
      alert(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'IN_PROGRESS':
        return <Pause className="h-6 w-6 text-blue-600" />;
      default:
        return <Activity className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Concluído';
      case 'CANCELLED':
        return 'Cancelado';
      case 'IN_PROGRESS':
        return 'Em andamento';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyStars = (difficulty?: number) => {
    if (!difficulty) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= difficulty ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do treino...</p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar treino</h3>
          <p className="text-gray-600 mb-6">{error || 'Treino não encontrado'}</p>
          <div className="space-x-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard/history')}
            >
              Voltar ao Histórico
            </Button>
            <Button onClick={loadWorkoutDetails}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GT</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Gym Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.name || 'Usuário'}</span>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={logout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                Dashboard
              </button>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            <li>
              <button 
                onClick={() => router.push('/dashboard/history')}
                className="text-gray-500 hover:text-gray-700"
              >
                Histórico
              </button>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-900 font-medium">Detalhes do Treino</span>
            </li>
          </ol>
        </nav>

        {/* Botão Voltar */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/history')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Histórico</span>
          </Button>
        </div>

        {/* Header do Treino */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                {getStatusIcon(workout.status)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workout.dayOfWeek}</h1>
                <p className="text-gray-600">
                  {new Date(workout.date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(workout.status)}`}>
                    {getStatusText(workout.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Array.isArray(workout.muscleGroups) ? workout.muscleGroups.join(', ') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {workout.status === 'COMPLETED' && (
                <Button
                  variant="secondary"
                  onClick={handleDuplicateWorkout}
                  className="flex items-center space-x-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>Duplicar Treino</span>
                </Button>
              )}
              
              {workout.status !== 'IN_PROGRESS' && (
                <Button
                  variant="secondary"
                  onClick={handleDeleteWorkout}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Deletar</span>
                </Button>
              )}
            </div>
          </div>

          {workout.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <MessageCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Observações:</p>
                  <p className="text-sm text-gray-600 italic">&ldquo;{workout.notes}&rdquo;</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estatísticas do Treino */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exercícios</p>
                <p className="text-2xl font-bold text-gray-900">{workout.stats.completedExercises}/{workout.stats.totalExercises}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Séries</p>
                <p className="text-2xl font-bold text-gray-900">{workout.stats.totalSeries}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volume Total</p>
                <p className="text-2xl font-bold text-gray-900">{workout.stats.totalVolume.toLocaleString()}kg</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duração</p>
                <p className="text-2xl font-bold text-gray-900">{workout.stats.duration}min</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Médias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peso Médio</h3>
            <div className="flex items-center space-x-3">
              <Weight className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{workout.stats.averageWeight}kg</p>
                <p className="text-sm text-gray-500">Por série</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Repetições Médias</h3>
            <div className="flex items-center space-x-3">
              <RotateCcw className="h-8 w-8 text-pink-600" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{workout.stats.averageReps}</p>
                <p className="text-sm text-gray-500">Por série</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Exercícios */}
        <div className="space-y-6">
          {workout.exerciseExecutions
            .sort((a, b) => a.order - b.order)
            .map((exerciseExecution, index) => (
            <div key={exerciseExecution.id} className="bg-white rounded-xl shadow-sm border">
              {/* Header do Exercício */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {exerciseExecution.exerciseName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{exerciseExecution.seriesExecutions.length} séries</span>
                        {exerciseExecution.exercise.equipment && (
                          <span>• {exerciseExecution.exercise.equipment}</span>
                        )}
                        <span>• {Array.isArray(exerciseExecution.exercise.muscleGroups) ? 
                          exerciseExecution.exercise.muscleGroups.join(', ') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {exerciseExecution.isCompleted ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Completo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Incompleto
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Séries */}
              <div className="p-6">
                {exerciseExecution.seriesExecutions.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Séries Realizadas:</h4>
                    {exerciseExecution.seriesExecutions
                      .sort((a, b) => a.seriesNumber - b.seriesNumber)
                      .map((series) => (
                      <div key={series.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-6">
                          <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                            Série {series.seriesNumber}
                          </span>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Weight className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-bold text-gray-900">{series.weight}kg</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <RotateCcw className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-bold text-gray-900">{series.reps} reps</span>
                            </div>
                            
                            {series.restTime && (
                              <div className="flex items-center space-x-2">
                                <Timer className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{series.restTime}s</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">
                              {(series.weight * series.reps).toLocaleString()}kg
                            </div>
                            <div className="text-xs text-gray-500">volume</div>
                          </div>

                          {series.difficulty && (
                            <div className="flex flex-col items-center">
                              <div className="text-xs text-gray-500 mb-1">dificuldade</div>
                              {getDifficultyStars(series.difficulty)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Notas da série */}
                    {exerciseExecution.seriesExecutions.some(s => s.notes) && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Observações:</h5>
                        {exerciseExecution.seriesExecutions
                          .filter(s => s.notes)
                          .map((series) => (
                          <div key={`notes-${series.id}`} className="text-sm text-gray-600 italic mb-1">
                            Série {series.seriesNumber}: &ldquo;{series.notes}&rdquo;
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Nenhuma série registrada para este exercício</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Informações de Tempo */}
        {workout.startTime && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Tempo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Início:</span>
                <span className="ml-2 font-medium">
                  {new Date(workout.startTime).toLocaleTimeString('pt-BR')}
                </span>
              </div>
              {workout.endTime && (
                <div>
                  <span className="text-gray-600">Fim:</span>
                  <span className="ml-2 font-medium">
                    {new Date(workout.endTime).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Duração:</span>
                <span className="ml-2 font-medium">{workout.stats.duration} minutos</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function WorkoutDetailsPage() {
  return (
    <HydrationWrapper>
      <WorkoutDetailsContent />
    </HydrationWrapper>
  );
}