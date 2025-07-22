'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { workoutService } from '@/services/workout.service';
import { exerciseService } from '@/services/exercise.service';
import { WorkoutExecution } from '@/types/workout';
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
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutExecution[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    weeklyWorkouts: 0,
    monthlyWorkouts: 0,
    currentStreak: 0,
  });

  const calculateStreak = useCallback((workouts: WorkoutExecution[]) => {
    const sortedWorkouts = workouts
      .filter(w => w.status === 'COMPLETED')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      const diffDays = Math.floor(
        (currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays <= 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }

    return streak;
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [workouts, exercises] = await Promise.all([
        workoutService.getUserWorkouts(),
        exerciseService.getAll(),
      ]);

      const inProgressWorkout = workouts.find(w => w.status === 'IN_PROGRESS');
      setActiveWorkout(inProgressWorkout || null);

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
        currentStreak: calculateStreak(completedWorkouts),
      });

      setRecentWorkouts(workouts.slice(0, 5));
      setTotalExercises(exercises.length);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateStreak]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, router, loadDashboardData]);

  const handleStartWorkout = () => router.push('/workout/start');

  const handleContinueWorkout = () => {
    if (!activeWorkout) return;
    if (activeWorkout.exerciseExecutions && activeWorkout.exerciseExecutions.length > 0) {
      router.push(`/workout/${activeWorkout.id}/execute`);
    } else {
      router.push(`/workout/${activeWorkout.id}/exercises`);
    }
  };

  const handleViewExercises = () => router.push('/dashboard/exercises/create');
  const handleViewHistory = () => router.push('/dashboard/history');
  const handleViewReports = () => router.push('/dashboard/reports');

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">Acompanhe seu progresso e mantenha-se consistente com seus treinos.</p>
        </div>

        {/* Active Workout Alert */}
        {activeWorkout && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-1">Treino em Andamento</h3>
                  <p className="text-orange-700 text-sm">
                    {activeWorkout.dayOfWeek} •{' '}
                    {Array.isArray(activeWorkout.muscleGroups)
                      ? activeWorkout.muscleGroups.join(', ')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleContinueWorkout}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Continuar Treino</span>
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total de Treinos"
            value={stats.totalWorkouts}
            icon={<Activity className="h-6 w-6 text-blue-600" />}
            bg="bg-blue-100"
          />
          <StatCard
            label="Esta Semana"
            value={stats.weeklyWorkouts}
            icon={<Calendar className="h-6 w-6 text-green-600" />}
            bg="bg-green-100"
          />
          <StatCard
            label="Este Mês"
            value={stats.monthlyWorkouts}
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            bg="bg-purple-100"
          />
          <StatCard
            label="Sequência"
            value={stats.currentStreak}
            icon={<Target className="h-6 w-6 text-orange-600" />}
            bg="bg-orange-100"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickActionCard
            icon={<Play className="h-6 w-6 text-blue-600" />}
            bg="bg-blue-100"
            title="Iniciar Treino"
            description="Comece um novo treino personalizado"
            buttonText={activeWorkout ? 'Treino em Andamento' : 'Iniciar Agora'}
            onClick={handleStartWorkout}
            disabled={!!activeWorkout}
          />

          <QuickActionCard
            icon={<Dumbbell className="h-6 w-6 text-green-600" />}
            bg="bg-green-100"
            title="Exercícios"
            description={`${totalExercises} exercícios disponíveis`}
            buttonText="Cadastrar Exercícios"
            onClick={handleViewExercises}
            variant="secondary"
          />

          <QuickActionCard
            icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
            bg="bg-purple-100"
            title="Histórico"
            description="Acompanhe sua evolução"
            buttonText="Ver Histórico"
            onClick={handleViewHistory}
            variant="secondary"
          />

          <QuickActionCard
            icon={<FileText className="h-6 w-6 text-indigo-600" />}
            bg="bg-indigo-100"
            title="Relatórios"
            description="Análises detalhadas e progresso"
            buttonText="Ver Relatórios"
            onClick={handleViewReports}
            variant="secondary"
          />
        </div>

        {/* Recent Workouts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Treinos Recentes</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleViewHistory}
              className="flex items-center space-x-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map(workout => (
                <RecentWorkoutRow
                  key={workout.id}
                  workout={workout}
                  onContinue={handleContinueWorkout}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum treino realizado</h4>
              <p className="text-gray-600 mb-6">Comece sua jornada fitness hoje mesmo!</p>
              <Button onClick={handleStartWorkout}>Fazer Primeiro Treino</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );
}

type QuickActionProps = {
  icon: React.ReactNode;
  bg: string;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

function QuickActionCard({
  icon,
  bg,
  title,
  description,
  buttonText,
  onClick,
  disabled,
  variant = 'primary',
}: QuickActionProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Button className="w-full" onClick={onClick} disabled={disabled} variant={variant}>
        {buttonText}
      </Button>
    </div>
  );
}

function RecentWorkoutRow({
  workout,
  onContinue,
}: {
  workout: WorkoutExecution;
  onContinue: () => void;
}) {
  const statusProps =
    workout.status === 'COMPLETED'
      ? { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluído', icon: 'completed' as const }
      : workout.status === 'IN_PROGRESS'
      ? { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Em andamento', icon: 'progress' as const }
      : { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado', icon: 'canceled' as const };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            statusProps.bg
          }`}
        >
          {statusProps.icon === 'completed' ? (
            <Activity className="h-5 w-5 text-green-600" />
          ) : statusProps.icon === 'progress' ? (
            <Clock className="h-5 w-5 text-blue-600" />
          ) : (
            <Activity className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-medium text-gray-900">{workout.dayOfWeek}</span>
            <span className="text-sm text-gray-500">
              {new Date(workout.date).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {Array.isArray(workout.muscleGroups) ? workout.muscleGroups.join(', ') : 'N/A'}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusProps.bg} ${statusProps.text}`}
        >
          {statusProps.label}
        </span>
        {workout.status === 'IN_PROGRESS' && (
          <Button size="sm" onClick={onContinue} className="flex items-center space-x-1">
            <Play className="h-3 w-3" />
            <span>Continuar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
