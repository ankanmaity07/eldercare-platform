import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationApi } from '../services/api.js';
import toast from 'react-hot-toast';
import type { Medication } from '../types/index.js';

/** Query key constants */
const MEDICATIONS_KEY = ['medications'] as const;

/**
 * Hook for fetching and managing medications.
 * Provides list, create, update, delete operations with optimistic UI.
 */
export function useMedications() {
  const qc = useQueryClient();

  const medicationsQuery = useQuery({
    queryKey: MEDICATIONS_KEY,
    queryFn: async () => {
      const { data } = await medicationApi.list();
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof medicationApi.create>[0]) => medicationApi.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MEDICATIONS_KEY });
      toast.success('Medication added successfully');
    },
    onError: () => toast.error('Failed to add medication'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Medication> }) => medicationApi.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MEDICATIONS_KEY });
      toast.success('Medication updated');
    },
    onError: () => toast.error('Failed to update medication'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => medicationApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MEDICATIONS_KEY });
      toast.success('Medication removed');
    },
    onError: () => toast.error('Failed to remove medication'),
  });

  return {
    medications: medicationsQuery.data ?? [],
    isLoading: medicationsQuery.isLoading,
    isError: medicationsQuery.isError,
    createMedication: createMutation.mutate,
    updateMedication: updateMutation.mutate,
    deleteMedication: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
