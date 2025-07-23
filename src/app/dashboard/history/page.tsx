'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { HistoryService, WorkoutHistoryItem, HistoryStats, WeeklyPattern, MuscleGroupStat } from '@/services/history.service';
import { 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Activity,
  User,
  LogOut,
  ChevronRight,
  Search,
  Filter,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  XCircle,
  Pause,
  BarChart3,
  Dumbbell,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function HistoryPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Estados principais
  const [mounted, setMounted] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPattern[]>([]);
  const [muscleGroupStats, setMuscleGroupStats] = useState<MuscleGroupStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
    muscleGroup: '',
  });

  // Estados de paginação
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Componente montado (evita hidratação)
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [historyData, statsData, weeklyData, muscleData] = await Promise.all([
        HistoryService.getWorkoutHistory({
          page: currentPage,
          limit: 10,
          ...filters,
        }),
        HistoryService.getHistoryStats('month'),
        HistoryService.getWeeklyPattern(),
        HistoryService.getMuscleGroupStats(),
      ]);

      setWorkouts(historyData.data);
      setPagination(historyData.pagination);
      setStats(statsData);
      setWeeklyPattern(weeklyData);
      setMuscleGroupStats(muscleData.slice(0, 5)); // Top 5
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar histórico';
      setError(errorMessage);
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadHistoryData();
  }, [mounted, isAuthenticated, router, loadHistoryData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset para primeira página
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      search: '',
      muscleGroup: '',
    });
    setCurrentPage(1);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Tem certeza que deseja deletar este treino?')) return;

    try {
      await HistoryService.deleteWorkout(workoutId);
      loadHistoryData(); // Recarregar dados
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar treino';
      alert(errorMessage);
    }
  };

  const handleDuplicateWorkout = async (workoutId: string) => {
    try {
      const result = await HistoryService.duplicateWorkout(workoutId);
      alert('Treino duplicado com sucesso!');
      router.push(`/workout/${result.id}/exercises`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao duplicar treino';
      alert(errorMessage);
    }
  };

  const handleViewDetails = (workoutId: string) => {
    router.push(`/dashboard/history/${workoutId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
      case 'IN_PROGRESS':
        return <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
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
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Prevenir renderização até componente estar montado
  if (!mounted) {
    return null;
  }

  if (loading && workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile Optimized */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">GT</span>
              </div>
              <h1 className="text-sm sm:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">Gym Tracker</span>
                <span className="sm:hidden">GT</span>
              </h1>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
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
                  <span>{user?.name || 'Usuário'}</span>
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
        {/* Breadcrumb Mobile */}
        <nav className="flex mb-4 sm:mb-6 overflow-x-auto" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm whitespace-nowrap">
            <li>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-900 font-medium">Histórico</span>
            </li>
          </ol>
        </nav>

        {/* Header da página */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            📚 Histórico de Treinos
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Acompanhe todos os seus treinos realizados e estatísticas de progresso.
          </p>
        </div>

        {/* Stats Cards - Mobile Toggleable */}
        {stats && (
          <>
            <div className="md:hidden mb-6">
              <Button
                variant="secondary"
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between"
              >
                <span>Ver Estatísticas</span>
                {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8 ${showStats ? 'block' : 'hidden md:grid'}`}>
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Treinos</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totals.workouts}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
                    <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{Math.round(stats.completionRate)}%</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
                    <Target className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Volume Total (kg)</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totals.volume.toLocaleString()}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
