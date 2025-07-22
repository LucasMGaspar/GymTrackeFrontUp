'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Zap,
} from 'lucide-react';

export default function StartWorkoutPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const checkActiveWorkout = useCallback(async () => {
    try {
      const activeWorkout = await workoutService.getActiveWorkout();
      if (activeWorkout) {
        const continueWorkout = confirm(
          `Você já tem um treino em andamento hoje (${activeWorkout.dayOfWeek}). 
           Deseja continuar esse treino ou criar um novo?`,
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
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    checkActiveWorkout();
  }, [isAuthenticated, router, checkActiveWorkout]);

  const handleMuscleGroupToggle = (group: string) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group],
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Erro ao iniciar treino:', error);

      if (err.response?.data?.message?.includes('já existe')) {
        alert('Já existe um treino para hoje! Redirecionando para o dashboard...');
        router.push('/dashboard');
      } else {
        alert('Erro ao iniciar treino: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const todayInfo = {
    date: new Date().toLocaleDateString('pt-BR'),
    dayOfWeek: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
    capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
  };

  const getMuscleGroupIcon = (group: string) => {
    const icons: Record<string, string> = {
      CHEST: '💪',
      BACK: '🦵',
      SHOULDERS: '🤲',
      BICEPS: '💪',
      TRICEPS: '🔥',
      LEGS: '🦵',
      GLUTES: '🍑',
      ABS: '⭐',
      CARDIO: '❤️',
    };
    return icons[group] || '💪';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-blue-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Iniciar Treino</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <ProgressDot current number={1} label="Configurar" />
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <ProgressDot number={2} label="Exercícios" />
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <ProgressDot number={3} label="Executar" />
          </div>
        </div>

        {/* Today Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {todayInfo.capitalize(todayInfo.dayOfWeek)}
              </h2>
              <p className="text-blue-700 font-medium">{todayInfo.date}</p>
            </div>
          </div>
        </div>

        {/* Muscle Groups Selection */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grupos Musculares</h3>
              <p className="text-sm text-gray-600">Selecione os músculos que você vai treinar hoje</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(MUSCLE_GROUPS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleMuscleGroupToggle(key)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:scale-105
                  ${
                    selectedMuscleGroups.includes(key)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getMuscleGroupIcon(key)}</span>
                  <div>
                    <div
                      className={`font-medium transition-colors ${
                        selectedMuscleGroups.includes(key) ? 'text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      {label}
                    </div>
                    <div
                      className={`text-xs uppercase tracking-wide ${
                        selectedMuscleGroups.includes(key) ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {key}
                    </div>
                  </div>
                </div>
                {selectedMuscleGroups.includes(key) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedMuscleGroups.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">
                    {selectedMuscleGroups.length} grupo
                    {selectedMuscleGroups.length > 1 ? 's' : ''} selecionado
                    {selectedMuscleGroups.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-green-700">
                    {selectedMuscleGroups.map(g => MUSCLE_GROUPS[g as MuscleGroup]).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
              <p className="text-sm text-gray-600">Adicione notas sobre seu treino (opcional)</p>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Foco em hipertrofia, sentindo-me energizado, treino pesado..."
            className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            rows={3}
          />
        </div>

        {/* Action Button */}
        <div className="text-center mb-8">
          <Button
            onClick={handleStartWorkout}
            disabled={loading || selectedMuscleGroups.length === 0}
            size="lg"
            className="px-8 py-4 text-lg font-medium flex items-center space-x-2 mx-auto"
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

        {/* Quick Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 mb-3">Dicas para um treino eficaz</h4>
              <ul className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Selecione múltiplos grupos musculares para treinos completos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Os exercícios serão filtrados automaticamente baseados na sua seleção</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Use as notas para registrar como está se sentindo ou objetivos específicos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">•</span>
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

function ProgressDot({
  number,
  label,
  current,
}: {
  number: number;
  label: string;
  current?: boolean;
}) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-8 h-8 ${
          current ? 'bg-blue-600' : 'bg-gray-300'
        } rounded-full flex items-center justify-center`}
      >
        <span className={`${current ? 'text-white' : 'text-gray-600'} text-sm font-medium`}>
          {number}
        </span>
      </div>
      <span className={`text-sm ${current ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}
