import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCurrentLocationId } from '@/utils';

const DEFAULTS = {
  allergen_display_enabled: false,
  scan_label_enabled: false,
  wellness_corner_enabled: true,
};

async function fetchSettings(locationId) {
  const results = await base44.entities.AppSettings.filter({ key: locationId });
  if (results[0]) return results[0];
  // Fall back to global
  const global = await base44.entities.AppSettings.filter({ key: 'global' });
  return global[0] || { ...DEFAULTS, key: locationId };
}

export function useAppSettings(overrideLocationId) {
  const locationId = overrideLocationId || getCurrentLocationId();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['appSettings', locationId],
    queryFn: () => fetchSettings(locationId),
    staleTime: 30000,
  });

  const mutation = useMutation({
    mutationFn: async (updates) => {
      const results = await base44.entities.AppSettings.filter({ key: locationId });
      if (results[0]) {
        return base44.entities.AppSettings.update(results[0].id, updates);
      } else {
        return base44.entities.AppSettings.create({ key: locationId, location_id: locationId, ...DEFAULTS, ...updates });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings', locationId] });
      queryClient.invalidateQueries({ queryKey: ['appSettings', 'all'] });
    },
  });

  return {
    settings: settings || DEFAULTS,
    isLoading,
    updateSettings: mutation.mutate,
    isSaving: mutation.isPending,
    locationId,
  };
}

export function useAllLocationSettings() {
  return useQuery({
    queryKey: ['appSettings', 'all'],
    queryFn: () => base44.entities.AppSettings.list(),
    staleTime: 30000,
  });
}