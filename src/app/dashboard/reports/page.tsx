'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ReportsService } from '@/services/reports.service';
import { exerciseService } from '@/services/exercise.service';
import HydrationWrapper from '@/components/ui/HydrationWrapper';
import { 
  BarChart3, 
  TrendingUp,
  Activity,
  User,
  LogOut,
  Target,
  Trophy,
  Dumbbell,
  Clock,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowLeft
} from 'lucide-react';
import { Exercise } from '@/types/exercise';

interface WorkoutOverview {
  period: { startDate: string; endDate: string };
  totals: { workouts: number; exercises: number; series: number; volume: number };
  averages: { exercisesPerWorkout: number; seriesPerWorkout: number; durationMinutes: number };
  workoutDates: string[];
}

interface ExerciseEvolution {
  exerciseName: string;
  exerciseId: string;
  data: Array<{
    date: string;
    maxWeight?: { weight: number; reps: number };
    maxReps?: { weight: number; reps: number };
  }>;
  analysis?: {
    weightProgress?: { initial: number; current: number; percentage: number };
    repsProgress?: { initial: number; current: number; percentage: number };
    volumeProgress?: { initial: number; current: number; percentage: number };
    overallTrend?: 'improving' | 'mixed' | 'declining';
    sessionsAnalyzed?: number;
  };
}

interface PersonalRecord {
  exerciseName: string;
  record: {
    value: number;
    date: string;
    reps?: number;
    weight?: number;
  };
  type: string;
}

export default function ReportsPage() {
  return (
    <HydrationWrapper>
      <ReportsContent />
    </HydrationWrapper>
  );
}

function ReportsContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Estados
  const [overview, setOverview] = useState<WorkoutOverview | null>(null);
  const [evolution, setEvolution] = useState<ExerciseEvolution | null>(null);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [exercises, setExercises] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Carregando dados dos relatórios...');
      
      const [overviewData, recordsData] = await Promise.all([
        ReportsService.getWorkoutOverview(dateRange.startDate ? dateRange : undefined),
        ReportsService.getPersonalRecords({ type: 'weight' })
      ]);
      
      console.log('✅ Dados carregados:', { overviewData, recordsData });
      
      setOverview(overviewData);
      setRecords(recordsData || []);
    } catch (error: unknown) {
      console.error('❌ Erro detalhado:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Sessão expirada. Faça login novamente.');
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError('Erro ao carregar dados dos relatórios: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, router]);

  const loadExercises = useCallback(async () => {
    try {
      const exercisesData = await exerciseService.getAll();
      setExercises(exercisesData?.map((ex: Exercise) => ({ id: ex.id, name: ex.name })) || []);
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
      setExercises([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadInitialData();
    loadExercises();
  }, [isAuthenticated, router, loadInitialData, loadExercises]);

  const loadExerciseEvolution = async (exerciseId: string) => {
    try {
      setLoading(true);
      const evolutionData = await ReportsService.getExerciseEvolution(
        exerciseId, 
        { 
          seriesType: 'max',
          ...(dateRange.startDate ? dateRange : {})
        }
      );
      setEvolution(evolutionData);
    } catch (error) {
      setError('Erro ao carregar evolução do exercício');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseChange = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    if (exerciseId) {
      loadExerciseEvolution(exerciseId);
    }
  };

  const applyDateFilter = () => {
    loadInitialData();
    if (selectedExercise) {
      loadExerciseEvolution(selectedExercise);
    }
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (percentage < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (percentage: number) => {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📊 Relatórios de Treino
              </h2>
              <p className="text-gray-600">
                Acompanhe sua evolução e progresso nos exercícios.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={applyDateFilter}
                className="w-full"
              >
                Aplicar Filtro
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
                { id: 'evolution', label: 'Evolução', icon: TrendingUp },
                { id: 'records', label: 'Recordes', icon: Trophy }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Treinos</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.totals?.workouts || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Exercícios</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.totals?.exercises || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Dumbbell className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Séries</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.totals?.series || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Volume Total (kg)</p>
                    <p className="text-2xl font-bold text-gray-900">{(overview.totals?.volume || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Average Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Exercícios por Treino</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(overview.averages?.exercisesPerWorkout || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Dumbbell className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Séries por Treino</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(overview.averages?.seriesPerWorkout || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duração Média</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.averages?.durationMinutes || 0} min</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evolution Tab */}
        {activeTab === 'evolution' && (
          <div className="space-y-6">
            {/* Exercise Selector */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Exercício</h3>
              <select
                value={selectedExercise}
                onChange={(e) => handleExerciseChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Escolha um exercício para ver a evolução...</option>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Evolution Chart */}
            {evolution && !loading && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    📈 Evolução - {evolution.exerciseName}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weight Progress */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Peso Máximo (kg)</h4>
                      <div className="space-y-3">
                        {evolution.data?.slice(-5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">
                              {new Date(item.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="font-medium text-gray-900">
                              {item.maxWeight?.weight}kg × {item.maxWeight?.reps} reps
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reps Progress */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Repetições Máximas</h4>
                      <div className="space-y-3">
                        {evolution.data?.slice(-5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">
                              {new Date(item.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="font-medium text-gray-900">
                              {item.maxReps?.reps} reps × {item.maxReps?.weight}kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Analysis */}
                {evolution.analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {evolution.analysis.weightProgress && (
                      <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Progresso no Peso</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {evolution.analysis.weightProgress.current}kg
                            </p>
                            <p className="text-xs text-gray-500">
                              Anterior: {evolution.analysis.weightProgress.initial}kg
                            </p>
                          </div>
                          <div className={`flex items-center space-x-1 ${getTrendColor(evolution.analysis.weightProgress.percentage)}`}>
                            {getTrendIcon(evolution.analysis.weightProgress.percentage)}
                            <span className="text-sm font-medium">
                              {Math.abs(evolution.analysis.weightProgress.percentage).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {evolution.analysis.repsProgress && (
                      <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Progresso nas Reps</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {evolution.analysis.repsProgress.current} reps
                            </p>
                            <p className="text-xs text-gray-500">
                              Anterior: {evolution.analysis.repsProgress.initial} reps
                            </p>
                          </div>
                          <div className={`flex items-center space-x-1 ${getTrendColor(evolution.analysis.repsProgress.percentage)}`}>
                            {getTrendIcon(evolution.analysis.repsProgress.percentage)}
                            <span className="text-sm font-medium">
                              {Math.abs(evolution.analysis.repsProgress.percentage).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {evolution.analysis.volumeProgress && (
                      <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Progresso no Volume</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {Math.round(evolution.analysis.volumeProgress.current)}kg
                            </p>
                            <p className="text-xs text-gray-500">
                              Anterior: {Math.round(evolution.analysis.volumeProgress.initial)}kg
                            </p>
                          </div>
                          <div className={`flex items-center space-x-1 ${getTrendColor(evolution.analysis.volumeProgress.percentage)}`}>
                            {getTrendIcon(evolution.analysis.volumeProgress.percentage)}
                            <span className="text-sm font-medium">
                              {Math.abs(evolution.analysis.volumeProgress.percentage).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!evolution && !loading && selectedExercise && (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sem dados de evolução</h3>
                <p className="text-gray-600">
                  Não foram encontrados dados para este exercício no período selecionado.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            {records && records.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <span>Recordes Pessoais</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {records.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{record.exerciseName}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(record.record.date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-blue-600">
                            {record.record.value}kg
                          </div>
                          {record.record.reps && (
                            <div className="text-sm text-gray-500">
                              {record.record.reps} repetições
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum recorde encontrado</h3>
                <p className="text-gray-600 mb-6">
                  Continue treinando para estabelecer seus primeiros recordes pessoais!
                </p>
                <Button onClick={() => router.push('/workout/start')}>
                  Iniciar Treino
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={loadInitialData}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}