import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adherenceApi } from '../services/api.js';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * Hook for adherence logging and tracking.
 * @param daysBack - Number of days back to fetch logs (default: 7)
 */
export function useAdherence(daysBack = 7) {
  const qc = useQueryClient();
  const from = format(subDays(new Date(), daysBack), "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const to = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const logsKey = ['adherence', from, to] as const;
  const rateKey = ['adherence-rate', from, to] as const;

  const logsQuery = useQuery({
    queryKey: logsKey,
    queryFn: async () => {
      const { data } = await adherenceApi.list(from, to);
      return data.data ?? [];
    },
  });

  const rateQuery = useQuery({
    queryKey: rateKey,
    queryFn: async () => {
      const { data } = await adherenceApi.getRate(from, to);
      return data.data?.rate ?? 0;
    },
  });

  const logMutation = useMutation({
    mutationFn: adherenceApi.log,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['adherence'] });
      toast.success('Dose logged!');
    },
    onError: () => toast.error('Failed to log dose'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adherenceApi.updateStatus(id, status, notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['adherence'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return {
    logs: logsQuery.data ?? [],
    adherenceRate: rateQuery.data ?? 0,
    isLoading: logsQuery.isLoading,
    logDose: logMutation.mutate,
    updateStatus: updateMutation.mutate,
    isLogging: logMutation.isPending,
  };
}
