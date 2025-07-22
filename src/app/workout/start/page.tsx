'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { workoutService } from '@/services/workout.service';
import { MUSCLE_GROUPS, MuscleGroup } from '@/types/exercise';
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  FileText, 
  Play, 
  Clock,
  CheckCircle,
  Lightbulb,
  Zap
} from 'lucide-react';

export default function StartWorkoutPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    checkActiveWorkout();
  }, [isAuthenticated, router]);

  const checkActiveWorkout = async () => {
    try {
      const activeWorkout = await workoutService.getActiveWorkout();
      if (activeWorkout) {
        const continueWorkout = confirm(
          `Você já tem um treino em andamento hoje (${activeWorkout.dayOfWeek}). 
           Deseja continuar esse treino ou criar um novo?`
        );
        
        if (continueWorkout) {
          if (activeWorkout.exerciseExecutions && activeWorkout.exerciseExecutions.length > 0) {
            router.push(`/workout/${activeWorkout.id}/execute`);
          } else {
            router.push(`/workout/${activeWorkout.id}/exercises`);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar treino ativo:', error);
    }
  };

  const handleMuscleGroupToggle = (group: string) => {
    setSelectedMuscleGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleStartWorkout = async () => {
    if (selectedMuscleGroups.length === 0) {
      alert('Selecione pelo menos um grupo muscular!');
      return;
    }

    try {
      setLoading(true);
      const workout = await workoutService.startWorkout({
        muscleGroups: selectedMuscleGroups,
        notes: notes || undefined,
      });

      router.push(`/workout/${workout.id}/exercises`);
    } catch (error) {
      console.error('Erro ao iniciar treino:', error);
      
      if (error instanceof Error && error.message?.includes('já existe')) {
        alert('Já existe um treino para hoje! Redirecionando para o dashboard...');
        router.push('/dashboard');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        alert('Erro ao iniciar treino: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const todayInfo = {
    date: new Date().toLocaleDateString('pt-BR'),
    dayOfWeek: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
    capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
  };

  const getMuscleGroupIcon = (group: string) => {
    const icons: { [key: string]: string } = {
      chest: '💪',
      back: '🦵',
      shoulders: '🤲',
      biceps: '💪',
      triceps: '🔥',
      legs: '🦵',
      glutes: '🍑',
      abs: '⭐',
      cardio: '❤️'
    };
    return icons[group] || '💪';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-blue-600" />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  <span className="hidden sm:inline">Iniciar Treino</span>
                  <span className="sm:hidden">Treino</span>
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Progress Indicator - responsivo */}
        <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-max px-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-medium">1</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-600">Configurar</span>
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs sm:text-sm font-medium">2</span>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">Exercícios</span>
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs sm:text-sm font-medium">3</span>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">Executar</span>
            </div>
          </div>
        </div>

        {/* Today Info - responsivo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                {todayInfo.capitalize(todayInfo.dayOfWeek)}
              </h2>
              <p className="text-sm sm:text-base text-blue-700 font-medium">
                {todayInfo.date}
              </p>
            </div>
          </div>
        </div>

        {/* Muscle Groups Selection - responsivo */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Grupos Musculares
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione os músculos que você vai treinar hoje
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(MUSCLE_GROUPS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleMuscleGroupToggle(key)}
                className={`
                  relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:scale-105 active:scale-95
                  ${selectedMuscleGroups.includes(key)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg sm:text-2xl">{getMuscleGroupIcon(key)}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm sm:text-base transition-colors ${
                      selectedMuscleGroups.includes(key) ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {label}
                    </div>
                    <div className={`text-xs uppercase tracking-wide ${
                      selectedMuscleGroups.includes(key) ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {key}
                    </div>
                  </div>
                </div>
                {selectedMuscleGroups.includes(key) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedMuscleGroups.length > 0 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">
                    {selectedMuscleGroups.length} grupo{selectedMuscleGroups.length > 1 ? 's' : ''} selecionado{selectedMuscleGroups.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-green-700 break-words">
                    {selectedMuscleGroups.map(g => MUSCLE_GROUPS[g as MuscleGroup]).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes - responsivo */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Observações
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Adicione notas sobre seu treino (opcional)
              </p>
            </div>
          </div>
          
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Foco em hipertrofia, sentindo-me energizado, treino pesado..."
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
            rows={3}
          />
        </div>

        {/* Action Button - responsivo */}
        <div className="text-center mb-6 sm:mb-8">
          <Button
            onClick={handleStartWorkout}
            disabled={loading || selectedMuscleGroups.length === 0}
            size="lg"
            className="w-full sm:w-auto sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Iniciando...</span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                <span>Iniciar Treino</span>
              </>
            )}
          </Button>
          
          {selectedMuscleGroups.length === 0 && (
            <p className="text-sm text-gray-500 mt-3 flex items-center justify-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Selecione pelo menos um grupo muscular para continuar</span>
            </p>
          )}
        </div>

        {/* Quick Tips - responsivo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-900 mb-3 text-sm sm:text-base">
                Dicas para um treino eficaz
              </h4>
              <ul className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1 flex-shrink-0">•</span>
                  <span>Selecione múltiplos grupos musculares para treinos completos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1 flex-shrink-0">•</span>
                  <span>Os exercícios serão filtrados automaticamente baseados na sua seleção</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1 flex-shrink-0">•</span>
                  <span>Use as notas para registrar como está se sentindo ou objetivos específicos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1 flex-shrink-0">•</span>
                  <span>Você pode pausar e retomar seu treino a qualquer momento</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
