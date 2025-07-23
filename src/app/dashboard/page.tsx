// src/app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { workoutService } from '@/services/workout.service';
import { exerciseService } from '@/services/exercise.service';
import { WorkoutExecution } from '@/types/workout';
import { Exercise } from '@/types/exercise';
import { 
  Play, 
  Dumbbell, 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Activity,
  User,
  LogOut,
  ChevronRight,
  Zap,
  FileText,
  Menu
} from 'lucide-react';

// ✅ FUNÇÃO AUXILIAR PARA CORRIGIR A DATA
const formatDateCorrectly = (dateString: string | Date): string => {
  const date = new Date(dateString);
  
  // Adicionar um dia para compensar a conversão UTC
  const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  return correctedDate.toLocaleDateString('pt-BR');
};

// ✅ FUNÇÃO PARA VERIFICAR SE É HOJE
const isTodayBrazil = (dateString: string | Date): boolean => {
  const date = new Date(dateString);
  const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const today = new Date();
  
  return (
    correctedDate.getDate() === today.getDate() &&
    correctedDate.getMonth() === today.getMonth() &&
    correctedDate.getFullYear() === today.getFullYear()
  );
};

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutExecution[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    weeklyWorkouts: 0,
    monthlyWorkouts: 0,
    currentStreak: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [workouts, exercises] = await Promise.all([
        workoutService.getUserWorkouts(),
        exerciseService.getAll(),
      ]);
      
      // Verificar se tem treino em andamento
      const inProgressWorkout = workouts.find(w => w.status === 'IN_PROGRESS');
      setActiveWorkout(inProgressWorkout || null);
      
      // Calcular estatísticas
      const completedWorkouts = workouts.filter(w => w.status === 'COMPLETED');
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const weeklyWorkouts = completedWorkouts.filter(w => new Date(w.date) >= weekAgo).length;
      const monthlyWorkouts = completedWorkouts.filter(w => new Date(w.date) >= monthAgo).length;
      
      setStats({
        totalWorkouts: completedWorkouts.length,
        weeklyWorkouts,
        monthlyWorkouts,
        currentStreak: calculateStreak(completedWorkouts)
      });
      
      setRecentWorkouts(workouts.slice(0, 5));
      setTotalExercises(exercises.length);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (workouts: WorkoutExecution[]) => {
    // Implementação simplificada do cálculo de sequência
    const sortedWorkouts = workouts
      .filter(w => w.status === 'COMPLETED')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      const diffDays = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const handleStartWorkout = () => {
    router.push('/workout/start');
  };

  const handleContinueWorkout = () => {
    if (activeWorkout) {
      if (activeWorkout.exerciseExecutions && activeWorkout.exerciseExecutions.length > 0) {
        router.push(`/workout/${activeWorkout.id}/execute`);
      } else {
        router.push(`/workout/${activeWorkout.id}/exercises`);
      }
    }
  };

  const handleViewExercises = () => {
    router.push('/dashboard/exercises/create');
  };

  const handleViewHistory = () => {
    router.push('/dashboard/history');
  };

  const handleViewReports = () => {
    router.push('/dashboard/reports');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
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
            {/* Logo e título - otimizado para mobile */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GT</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">Gym Tracker</span>
                <span className="sm:hidden">GT</span>
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile Menu Button */}
            <div className="md:hidden">
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
        {/* Welcome Section - responsivo */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo{user?.name && `, ${user.name.split(' ')[0]}`}!
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Acompanhe seu progresso e mantenha-se consistente com seus treinos.
          </p>
        </div>

        {/* Active Workout Alert - responsivo */}
        {activeWorkout && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-orange-900 mb-1">
                    Treino em Andamento
                  </h3>
                  <p className="text-sm text-orange-700">
                    {activeWorkout.dayOfWeek} • {Array.isArray(activeWorkout.muscleGroups) ? activeWorkout.muscleGroups.join(', ') : 'N/A'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleContinueWorkout}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Play className="h-4 w-4" />
                <span>Continuar Treino</span>
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards - grid responsivo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalWorkouts}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Semana</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.weeklyWorkouts}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Mês</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.monthlyWorkouts}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Sequência</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
                <Target className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - grid responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Play className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Iniciar Treino</h3>
            <p className="text-gray-600 text-sm mb-4">Comece um novo treino personalizado</p>
            <Button 
              className="w-full text-sm sm:text-base"
              onClick={handleStartWorkout}
              disabled={!!activeWorkout}
            >
              {activeWorkout ? 'Treino em Andamento' : 'Iniciar Agora'}
            </Button>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Exercícios</h3>
            <p className="text-gray-600 text-sm mb-4">{totalExercises} exercícios disponíveis</p>
            <Button 
              variant="secondary"
              className="w-full text-sm sm:text-base"
              onClick={handleViewExercises}
            >
              Cadastrar Exercícios
            </Button>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Histórico</h3>
            <p className="text-gray-600 text-sm mb-4">Acompanhe sua evolução</p>
            <Button 
              variant="secondary"
              className="w-full text-sm sm:text-base"
              onClick={handleViewHistory}
            >
              Ver Histórico
            </Button>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Relatórios</h3>
            <p className="text-gray-600 text-sm mb-4">Análises detalhadas e progresso</p>
            <Button 
              variant="secondary"
              className="w-full text-sm sm:text-base"
              onClick={handleViewReports}
            >
              Ver Relatórios
            </Button>
          </div>
        </div>

        {/* Recent Workouts - responsivo COM CORREÇÃO DA DATA */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Treinos Recentes
            </h3>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleViewHistory}
              className="flex items-center justify-center space-x-1 w-full sm:w-auto"
            >
              <span>Ver todos</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <div 
                  key={workout.id} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors space-y-3 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                      workout.status === 'COMPLETED' ? 'bg-green-100' : 
                      workout.status === 'IN_PROGRESS' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {workout.status === 'COMPLETED' ? (
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      ) : workout.status === 'IN_PROGRESS' ? (
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      ) : (
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                        <span className="font-medium text-gray-900 text-sm sm:text-base">
                          {workout.dayOfWeek}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                          {/* ✅ CORREÇÃO APLICADA AQUI */}
                          {formatDateCorrectly(workout.date)}
                          {isTodayBrazil(workout.date) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Hoje
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        {Array.isArray(workout.muscleGroups) ? workout.muscleGroups.join(', ') : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      workout.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workout.status === 'COMPLETED' ? 'Concluído' : 
                       workout.status === 'IN_PROGRESS' ? 'Em andamento' : 'Cancelado'}
                    </span>
                    {workout.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={handleContinueWorkout}
                        className="flex items-center space-x-1 text-xs"
                      >
                        <Play className="h-3 w-3" />
                        <span>Continuar</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum treino realizado</h4>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Comece sua jornada fitness hoje mesmo!</p>
              <Button onClick={handleStartWorkout} className="w-full sm:w-auto">
                Fazer Primeiro Treino
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
