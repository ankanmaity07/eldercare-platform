import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../services/api.js';
import toast from 'react-hot-toast';
import type { Appointment } from '../types/index.js';

const APPOINTMENTS_KEY = ['appointments'] as const;

/**
 * Hook for appointment management and calendar sync.
 */
export function useAppointments() {
  const qc = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: APPOINTMENTS_KEY,
    queryFn: async () => {
      const { data } = await appointmentApi.list();
      return data.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: appointmentApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      toast.success('Appointment scheduled!');
    },
    onError: () => toast.error('Failed to create appointment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      appointmentApi.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      toast.success('Appointment updated');
    },
    onError: () => toast.error('Failed to update appointment'),
  });

  const deleteMutation = useMutation({
    mutationFn: appointmentApi.delete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      toast.success('Appointment removed');
    },
    onError: () => toast.error('Failed to remove appointment'),
  });

  return {
    appointments: appointmentsQuery.data ?? [],
    isLoading: appointmentsQuery.isLoading,
    createAppointment: createMutation.mutate,
    updateAppointment: updateMutation.mutate,
    deleteAppointment: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
