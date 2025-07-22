// src/services/exercise.service.ts
import api from '@/lib/api';
import { Exercise, CreateExerciseData, MUSCLE_GROUPS, MuscleGroup } from '@/types/exercise';

type ExercisePayload = {
  name: string;
  muscleGroups: MuscleGroup[];
  equipment?: string;
  instructions?: string;
};

const buildPayload = (data: CreateExerciseData): ExercisePayload => {
  const validMuscleGroups = data.muscleGroups.filter(group =>
    Object.keys(MUSCLE_GROUPS).includes(group),
  ) as MuscleGroup[];

  if (validMuscleGroups.length !== data.muscleGroups.length) {
    console.warn('⚠️ Alguns grupos musculares não são válidos:', data.muscleGroups);
  }

  const payload: ExercisePayload = {
    name: data.name.trim(),
    muscleGroups: validMuscleGroups,
  };

  if (data.equipment?.trim()) {
    payload.equipment = data.equipment.trim();
  }

  if (data.instructions?.trim()) {
    payload.instructions = data.instructions.trim();
  }

  return payload;
};

export const exerciseService = {
  async create(data: CreateExerciseData): Promise<Exercise> {
    try {
      console.log('🔍 Dados recebidos:', data);

      const payload = buildPayload(data);
      console.log('📤 Payload final:', payload);

      // ✅ USAR a instância centralizada da API
      const response = await api.post('/exercises', payload);

      console.log('✅ Exercício criado com sucesso:', response.data);
      return response.data as Exercise;
    } catch (error) {
      console.error('❌ Erro completo:', error);
      throw error;
    }
  },

  async getAll(): Promise<Exercise[]> {
    try {
      const response = await api.get('/exercises');
      return response.data as Exercise[];
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
      throw error;
    }
  },

  async getByMuscleGroups(muscleGroups: string[]): Promise<Exercise[]> {
    try {
      const params = muscleGroups.join(',');
      const response = await api.get(`/exercises?muscleGroups=${params}`);
      return response.data as Exercise[];
    } catch (error) {
      console.error('Erro ao buscar por grupo muscular:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<Exercise> {
    try {
      const response = await api.get(`/exercises/${id}`);
      return response.data as Exercise;
    } catch (error) {
      console.error('Erro ao buscar exercício:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<CreateExerciseData>): Promise<Exercise> {
    try {
      const payload: Partial<ExercisePayload> = {};

      if (data.name) payload.name = data.name.trim();

      if (data.muscleGroups) {
        const validMuscleGroups = data.muscleGroups.filter(group =>
          Object.keys(MUSCLE_GROUPS).includes(group),
        ) as MuscleGroup[];
        payload.muscleGroups = validMuscleGroups;
      }

      if (data.equipment?.trim()) {
        payload.equipment = data.equipment.trim();
      }

      if (data.instructions?.trim()) {
        payload.instructions = data.instructions.trim();
      }

      const response = await api.put(`/exercises/${id}`, payload);
      return response.data as Exercise;
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/exercises/${id}`);
    } catch (error) {
      console.error('Erro ao deletar exercício:', error);
      throw error;
    }
  },

  validateExercise(data: CreateExerciseData): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    if (!data.muscleGroups || data.muscleGroups.length === 0) {
      errors.push('Selecione pelo menos um grupo muscular');
    }

    const validGroups = Object.keys(MUSCLE_GROUPS);
    const invalidGroups = data.muscleGroups.filter(group => !validGroups.includes(group));
    if (invalidGroups.length > 0) {
      errors.push(`Grupos musculares inválidos: ${invalidGroups.join(', ')}`);
    }

    return errors;
  },
};
