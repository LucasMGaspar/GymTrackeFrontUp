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
  X,
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
                    <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Tempo Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{Math.round(stats.totals.duration / 60)}h</p>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center ml-auto sm:ml-0">
                    <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Filtros e Busca - Mobile Optimized */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Filtros e Busca</span>
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>

          {/* Busca sempre visível */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por exercício, grupo muscular..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm sm:text-base"
            />
          </div>

          {/* Filtros expandidos */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
              >
                <option value="">Todos os status</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="IN_PROGRESS">Em andamento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="w-full flex items-center justify-center space-x-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Limpar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Treinos - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-sm border mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Treinos ({pagination.total})
            </h3>
          </div>

          {workouts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {workouts.map((workout) => (
                <div key={workout.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        {getStatusIcon(workout.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1">
                          <h4 className="font-medium text-gray-900">{workout.dayOfWeek}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(workout.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workout.status)} w-fit`}>
                            {getStatusText(workout.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{Array.isArray(workout.muscleGroups) ? workout.muscleGroups.join(', ') : 'N/A'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{workout.stats.totalExercises} exercícios</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{workout.stats.duration} min</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-bold text-gray-900">
                          {workout.stats.totalVolume.toLocaleString()}kg
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {workout.stats.totalSeries} séries
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewDetails(workout.id)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Ver</span>
                        </Button>

                        {workout.status === 'COMPLETED' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDuplicateWorkout(workout.id)}
                            className="flex items-center space-x-1"
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Duplicar</span>
                          </Button>
                        )}

                        {workout.status !== 'IN_PROGRESS' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {workout.notes && (
                    <div className="mt-3 px-0 sm:px-16">
                      <p className="text-sm text-gray-600 italic">&ldquo;{workout.notes}&rdquo;</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum treino encontrado</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {Object.values(filters).some(f => f) ? 
                  'Tente ajustar os filtros de busca.' : 
                  'Comece sua jornada fitness hoje mesmo!'
                }
              </p>
              <Button onClick={() => router.push('/workout/start')} className="w-full sm:w-auto">
                Iniciar Primeiro Treino
              </Button>
            </div>
          )}

          {/* Paginação Mobile */}
          {pagination.totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Página {pagination.page} de {pagination.totalPages} • {pagination.total} treinos
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1"
                >
                  <span>Próximo</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Semanais e Grupos Musculares - Mobile Collapsible */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Padrão Semanal */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Padrão Semanal</span>
            </h3>
            <div className="space-y-3">
              {weeklyPattern.map((day) => (
                <div key={day.dayOfWeek} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize min-w-0 truncate">
                    {day.dayOfWeek}
                  </span>
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 mx-2 sm:mx-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${day.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-[40px] text-right">
                      {day.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Grupos Musculares */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Grupos Musculares Mais Treinados</span>
            </h3>
            <div className="space-y-3">
              {muscleGroupStats.map((group, index) => (
                <div key={group.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <span className="text-sm font-bold text-gray-400 min-w-[20px]">
                      {index + 1}°
                    </span>
                    <span className="text-sm font-medium text-gray-700 capitalize truncate">
                      {group.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${group.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-[40px] text-right">
                      {group.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start">
              <div className="text-red-400 mr-3">⚠️</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={loadHistoryData}
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
