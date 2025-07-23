'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { workoutService } from '@/services/workout.service';
import { SeriesExecution, WorkoutExecution } from '@/types/workout';
import {
  ArrowLeft,
  Activity,
  Target,
  Timer,
  Weight,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Play,
  Hash,
  Settings,
  Menu,
  X,
  User,
  LogOut,
} from 'lucide-react';

type SeriesMap = Record<number, SeriesExecution>;

export default function ExecuteWorkoutPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workoutId = params.workoutId as string;

  const [workout, setWorkout] = useState<WorkoutExecution | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [seriesCount, setSeriesCount] = useState<number>(3);
  const [currentSeries, setCurrentSeries] = useState<SeriesMap>({});
  const [loading, setLoading] = useState(true);
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const loadWorkoutData = useCallback(async () => {
    try {
      setLoading(true);
      const workoutDetails = await workoutService.getWorkoutDetails(workoutId);
      setWorkout(workoutDetails);
    } catch (error) {
      console.error('Erro ao carregar treino:', error);
      alert('Erro ao carregar treino. Tente novamente.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [router, workoutId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadWorkoutData();
  }, [isAuthenticated, router, loadWorkoutData]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const currentExercise = workout?.exerciseExecutions?.[currentExerciseIndex];

  const handleDefineSeriesCount = async () => {
    if (!currentExercise) return;

    try {
      await workoutService.defineSeries(workoutId, currentExercise.id, seriesCount);

      setWorkout(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.exerciseExecutions![currentExerciseIndex].plannedSeries = seriesCount;
        return updated;
      });

      const emptySeries: SeriesMap = {};
      for (let i = 1; i <= seriesCount; i++) {
        emptySeries[i] = {
          id: '',
          exerciseExecutionId: currentExercise.id,
          seriesNumber: i,
          weight: 0,
          reps: 0,
          restTime: 90,
          createdAt: '',
          updatedAt: '',
        };
      }
      setCurrentSeries(emptySeries);
    } catch (error) {
      console.error('Erro ao definir séries:', error);
      alert('Erro ao definir séries. Tente novamente.');
    }
  };

  const handleRegisterSeries = async (seriesNumber: number) => {
    if (!currentExercise) return;

    const seriesData = currentSeries[seriesNumber];
    if (!seriesData || seriesData.weight <= 0 || seriesData.reps <= 0) {
      alert('Preencha peso e repetições válidos!');
      return;
    }

    try {
      const registeredSeries = await workoutService.registerSeries(
        workoutId,
        currentExercise.id,
        seriesNumber,
        {
          weight: seriesData.weight,
          reps: seriesData.reps,
          restTime: seriesData.restTime,
        },
      );

      setCurrentSeries(prev => ({
        ...prev,
        [seriesNumber]: { ...registeredSeries },
      }));

      if ((seriesData.restTime ?? 0) > 0 && seriesNumber < currentExercise.plannedSeries) {
        setRestTimer(seriesData.restTime ?? 90);
        setIsResting(true);
      }
    } catch (error) {
      console.error('Erro ao registrar série:', error);
      alert('Erro ao registrar série. Tente novamente.');
    }
  };

  const handleCompleteExercise = async () => {
    if (!currentExercise) return;

    try {
      await workoutService.completeExercise(workoutId, currentExercise.id);

      if (currentExerciseIndex < (workout?.exerciseExecutions?.length || 0) - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setSeriesCount(3);
        setCurrentSeries({});
        setIsResting(false);
        setRestTimer(0);
      } else {
        await workoutService.finishWorkout(workoutId, 'Treino concluído com sucesso!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erro ao completar exercício:', error);
      alert('Erro ao completar exercício. Tente novamente.');
    }
  };

  const updateSeriesData = (seriesNumber: number, field: 'weight' | 'reps' | 'restTime', value: number) => {
    setCurrentSeries(prev => ({
      ...prev,
      [seriesNumber]: {
        ...prev[seriesNumber],
        [field]: value,
      },
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletedSeries = () => Object.values(currentSeries).filter(series => series.id).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum exercício encontrado</h3>
          <p className="text-gray-600 mb-4">Não foi possível carregar os exercícios do treino.</p>
          <Button onClick={() => router.push('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </div>
                <h1 className="text-sm sm:text-xl font-semibold text-gray-900">
                  <span className="hidden sm:inline">Executando Treino</span>
                  <span className="sm:hidden">Treino</span>
                </h1>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-600 flex items-center space-x-2">
                <Hash className="h-4 w-4" />
                <span>
                  {currentExerciseIndex + 1} de {workout?.exerciseExecutions?.length || 0}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
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

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              <div className="text-xs text-gray-600 flex items-center space-x-1">
                <Hash className="h-3 w-3" />
                <span>
                  {currentExerciseIndex + 1}/{workout?.exerciseExecutions?.length || 0}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white pb-4">
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="w-full justify-center"
                >
                  Ver Exercícios
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={logout}
                  className="w-full justify-center flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Rest Timer Alert - Mobile Friendly */}
        {isResting && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Timer className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Tempo de Descanso</h3>
                  <p className="text-sm text-blue-700">Relaxe e prepare-se para a próxima série</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-2xl font-bold text-blue-600 mb-2">{formatTime(restTimer)}</div>
                <button
                  onClick={() => setIsResting(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Pular descanso
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Exercise Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Weight className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{currentExercise.exerciseName}</h2>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{currentExercise.exercise?.muscleGroups?.join(', ')}</span>
                  </span>
                  {currentExercise.exercise?.equipment && (
                    <span className="flex items-center space-x-1">
                      <Settings className="h-4 w-4" />
                      <span>{currentExercise.exercise.equipment}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar - Mobile Friendly */}
              <div className="mb-6 sm:mb-8">
                <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                  <span>Progresso do Treino</span>
                  <span>
                    {Math.round(
                      ((currentExerciseIndex + 1) / (workout?.exerciseExecutions?.length || 1)) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        ((currentExerciseIndex + 1) / (workout?.exerciseExecutions?.length || 1)) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Series Count Selection - Mobile Optimized */}
              {currentExercise.plannedSeries === 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Planejamento</h3>
                      <p className="text-sm text-gray-600">Quantas séries você vai fazer?</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSeriesCount(Math.max(1, seriesCount - 1))}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors text-lg font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={seriesCount}
                        onChange={e => setSeriesCount(parseInt(e.target.value) || 1)}
                        className="w-16 h-10 px-3 py-2 border border-gray-300 rounded-lg text-center bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => setSeriesCount(Math.min(10, seriesCount + 1))}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-gray-600 font-medium">séries</span>
                    <Button 
                      onClick={handleDefineSeriesCount} 
                      className="flex items-center space-x-2 w-full sm:w-auto"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirmar</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Series Execution - Mobile Optimized */}
              {currentExercise.plannedSeries > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">Registrar Séries</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {getCompletedSeries()} de {currentExercise.plannedSeries} completas
                      </span>
                    </div>
                  </div>

                  {Array.from({ length: currentExercise.plannedSeries }, (_, i) => i + 1).map(
                    seriesNumber => {
                      const isCompleted = currentSeries[seriesNumber]?.id;
                      const isCurrentSeries = !isCompleted && getCompletedSeries() + 1 === seriesNumber;

                      return (
                        <div
                          key={seriesNumber}
                          className={`p-4 sm:p-5 border-2 rounded-xl transition-all ${
                            isCompleted
                              ? 'border-green-200 bg-green-50'
                              : isCurrentSeries
                              ? 'border-blue-200 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-700'
                                    : isCurrentSeries
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : seriesNumber}
                              </div>
                              <h4 className="font-medium text-gray-900">Série {seriesNumber}</h4>
                            </div>
                            {isCompleted && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Concluída
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <InputNumber
                              label="Peso (kg)"
                              icon={<Weight className="h-4 w-4 text-gray-400" />}
                              value={currentSeries[seriesNumber]?.weight ?? ''}
                              disabled={!!isCompleted}
                              onChange={v => updateSeriesData(seriesNumber, 'weight', v)}
                              step="0.5"
                            />
                            <InputNumber
                              label="Repetições"
                              icon={<RotateCcw className="h-4 w-4 text-gray-400" />}
                              value={currentSeries[seriesNumber]?.reps ?? ''}
                              disabled={!!isCompleted}
                              onChange={v => updateSeriesData(seriesNumber, 'reps', v)}
                            />
                            <InputNumber
                              label="Descanso (seg)"
                              icon={<Timer className="h-4 w-4 text-gray-400" />}
                              value={currentSeries[seriesNumber]?.restTime ?? 90}
                              disabled={!!isCompleted}
                              onChange={v => updateSeriesData(seriesNumber, 'restTime', v)}
                            />
                          </div>

                          {!isCompleted && isCurrentSeries && (
                            <div className="mt-4 text-center sm:text-right">
                              <Button
                                onClick={() => handleRegisterSeries(seriesNumber)}
                                disabled={
                                  !currentSeries[seriesNumber]?.weight ||
                                  !currentSeries[seriesNumber]?.reps
                                }
                                className="flex items-center space-x-2 w-full sm:w-auto justify-center"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Registrar Série</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}

                  {/* Complete Exercise Button */}
                  {getCompletedSeries() === currentExercise.plannedSeries && (
                    <div className="text-center pt-6">
                      <Button
                        onClick={handleCompleteExercise}
                        size="lg"
                        className="w-full sm:w-auto sm:px-8 py-4 text-lg font-medium flex items-center justify-center space-x-2"
                      >
                        {currentExerciseIndex <
                        (workout?.exerciseExecutions?.length || 0) - 1 ? (
                          <>
                            <Play className="h-5 w-5" />
                            <span>Próximo Exercício</span>
                          </>
                        ) : (
                          <>
                            <Trophy className="h-5 w-5" />
                            <span>Finalizar Treino</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Hidden on mobile by default */}
          <div className={`lg:col-span-1 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Exercícios do Treino</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Exercise Progress */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Progresso do Exercício</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Séries completas</span>
                  <span className="font-medium">
                    {getCompletedSeries()}/{currentExercise.plannedSeries}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width:
                        currentExercise.plannedSeries > 0
                          ? `${(getCompletedSeries() / currentExercise.plannedSeries) * 100}%`
                          : '0%',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Workout Overview */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Exercícios do Treino</h3>
              <div className="space-y-2">
                {workout?.exerciseExecutions?.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      index === currentExerciseIndex
                        ? 'border-blue-200 bg-blue-50'
                        : index < currentExerciseIndex
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === currentExerciseIndex
                            ? 'bg-blue-100 text-blue-700'
                            : index < currentExerciseIndex
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index < currentExerciseIndex ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          index === currentExerciseIndex ? 'text-blue-900' : 'text-gray-700'
                        }`}
                      >
                        {exercise.exerciseName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Toggle Button */}
        <div className="lg:hidden fixed bottom-6 right-6">
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
          >
            <Hash className="h-6 w-6" />
          </Button>
        </div>
      </main>
    </div>
  );
}

function InputNumber({
  label,
  icon,
  value,
  disabled,
  onChange,
  step,
}: {
  label: string;
  icon: React.ReactNode;
  value: number | string;
  disabled: boolean;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type="number"
          step={step}
          min="0"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          disabled={disabled}
          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
    </div>
  );
}
