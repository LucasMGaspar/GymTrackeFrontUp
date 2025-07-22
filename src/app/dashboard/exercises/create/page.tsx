'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { exerciseService } from '@/services/exercise.service';
import HydrationWrapper from '@/components/ui/HydrationWrapper';
import { CreateExerciseData, MUSCLE_GROUPS, MuscleGroup } from '@/types/exercise';
import {
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Save,
  X,
  Dumbbell,
  Target,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface ExerciseForm {
  name: string;
  muscleGroups: string[];
  equipment: string;
  instructions: string;
}

const MUSCLE_GROUPS_ARRAY = Object.values(MUSCLE_GROUPS);

const MUSCLE_GROUPS_REVERSE_MAP: Record<string, MuscleGroup> = {};
Object.entries(MUSCLE_GROUPS).forEach(([key, value]) => {
  MUSCLE_GROUPS_REVERSE_MAP[value] = key as MuscleGroup;
});

const EQUIPMENT_OPTIONS = [
  'Peso corporal',
  'Halteres',
  'Barra',
  'Máquina',
  'Cabo',
  'Kettlebell',
  'Elástico',
  'Bola suíça',
  'TRX',
  'Outro',
];

function CreateExerciseContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<ExerciseForm>({
    name: '',
    muscleGroups: [],
    equipment: '',
    instructions: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof ExerciseForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscleGroup)
        ? prev.muscleGroups.filter(mg => mg !== muscleGroup)
        : [...prev.muscleGroups, muscleGroup],
    }));

    if (errors.muscleGroups) {
      setErrors(prev => ({ ...prev, muscleGroups: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do exercício é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (formData.muscleGroups.length === 0) {
      newErrors.muscleGroups = 'Selecione pelo menos um grupo muscular';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const muscleGroupsInEnglish = formData.muscleGroups.map(
        group => MUSCLE_GROUPS_REVERSE_MAP[group],
      );

      const exerciseData: CreateExerciseData = {
        name: formData.name.trim(),
        muscleGroups: muscleGroupsInEnglish,
        equipment: formData.equipment || undefined,
        instructions: formData.instructions || undefined,
      };

      await exerciseService.create(exerciseData);

      setSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('❌ Erro ao criar exercício:', error);
      setErrors({ submit: err.message || 'Erro ao criar exercício. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      formData.name ||
      formData.muscleGroups.length > 0 ||
      formData.equipment ||
      formData.instructions
    ) {
      if (confirm('Tem certeza que deseja cancelar? Todas as informações serão perdidas.')) {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Exercício criado com sucesso!</h3>
          <p className="text-gray-600 mb-4">Redirecionando para o dashboard...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                onClick={() => router.push('/dashboard/exercises')}
                className="text-gray-500 hover:text-gray-700"
              >
                Exercícios
              </button>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-900 font-medium">Novo Exercício</span>
            </li>
          </ol>
        </nav>

        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">💪 Criar Novo Exercício</h2>
              <p className="text-gray-600">Adicione um novo exercício ao seu banco de dados pessoal.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Dumbbell className="h-5 w-5 text-blue-600" />
              <span>Informações Básicas</span>
            </h3>

            <div className="space-y-4">
              {/* Nome do Exercício */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Supino reto com barra"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Equipamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipamento</label>
                <select
                  value={formData.equipment}
                  onChange={e => handleInputChange('equipment', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="">Selecione o equipamento (opcional)</option>
                  {EQUIPMENT_OPTIONS.map(equipment => (
                    <option key={equipment} value={equipment}>
                      {equipment}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grupos Musculares */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Grupos Musculares *</span>
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Selecione todos os grupos musculares que este exercício trabalha:
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MUSCLE_GROUPS_ARRAY.map(muscleGroup => (
                <button
                  key={muscleGroup}
                  type="button"
                  onClick={() => handleMuscleGroupToggle(muscleGroup)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.muscleGroups.includes(muscleGroup)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {muscleGroup}
                </button>
              ))}
            </div>

            {errors.muscleGroups && (
              <div className="mt-3 flex items-center space-x-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.muscleGroups}</span>
              </div>
            )}

            {formData.muscleGroups.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-2">Grupos selecionados:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.muscleGroups.map(group => (
                    <span
                      key={group}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {group}
                      <button
                        type="button"
                        onClick={() => handleMuscleGroupToggle(group)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Instruções de Execução</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Como executar o exercício (opcional)
              </label>
              <textarea
                value={formData.instructions}
                onChange={e => handleInputChange('instructions', e.target.value)}
                placeholder="Ex: Deite no banco, segure a barra com pegada pronada..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 resize-vertical"
              />
              <p className="mt-1 text-xs text-gray-500">
                Descreva a forma correta de executar o exercício, posicionamento, movimento, etc.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">* Campos obrigatórios</div>

              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </Button>

                <Button type="submit" disabled={loading} className="flex items-center space-x-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Salvar Exercício</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{errors.submit}</span>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Preview Card */}
        {(formData.name || formData.muscleGroups.length > 0) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview do Exercício:</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Dumbbell className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {formData.name || 'Nome do exercício'}
                  </h4>
                  {formData.muscleGroups.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">{formData.muscleGroups.join(' • ')}</p>
                  )}
                  {formData.equipment && (
                    <p className="text-sm text-gray-500 mt-1">Equipamento: {formData.equipment}</p>
                  )}
                  {formData.instructions && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{formData.instructions}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CreateExercisePage() {
  return (
    <HydrationWrapper>
      <CreateExerciseContent />
    </HydrationWrapper>
  );
}
