import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const SETTINGS_KEY = 'global';

export function useAppSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const results = await base44.entities.AppSettings.filter({ key: SETTINGS_KEY });
      return results[0] || { allergen_display_enabled: false };
    },
    staleTime: 30000,
  });

  const mutation = useMutation({
    mutationFn: async (updates) => {
      const results = await base44.entities.AppSettings.filter({ key: SETTINGS_KEY });
      if (results[0]) {
        return base44.entities.AppSettings.update(results[0].id, updates);
      } else {
        return base44.entities.AppSettings.create({ key: SETTINGS_KEY, ...updates });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appSettings'] }),
  });

  return {
    settings: settings || { allergen_display_enabled: false },
    isLoading,
    updateSettings: mutation.mutate,
    isSaving: mutation.isPending,
  };
}