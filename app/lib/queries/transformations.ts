import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { CoachTransformation } from '../../types/database';
import * as ImagePicker from 'expo-image-picker';

// ---------------------------------------------------------------------------
// Image picker helper
// ---------------------------------------------------------------------------

/**
 * Pick an image from the device gallery via expo-image-picker.
 * Returns a data URI string (data:image/jpeg;base64,...) or null if cancelled.
 *
 * This stores images the same way the existing avatar upload works —
 * as base64 data URIs directly in the database. No Supabase Storage
 * bucket is required.
 */
export async function pickTransformationImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to select transformation images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  // Build a data URI from base64 (same as avatar upload pattern)
  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }

  // Fallback: return the local URI directly
  return asset.uri;
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/** Fetch all transformations for the coach (editor view). */
export function useCoachTransformations(coachId?: string) {
  return useQuery<CoachTransformation[]>({
    queryKey: ['coachTransformations', coachId],
    enabled: Boolean(coachId),
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from('coach_transformations')
        .select('*')
        .eq('coach_id', coachId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as CoachTransformation[];
    },
  });
}

/** Fetch published transformations only (client modal view). */
export function usePublishedTransformations(coachId?: string | null) {
  return useQuery<CoachTransformation[]>({
    queryKey: ['publishedTransformations', coachId],
    enabled: Boolean(coachId),
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from('coach_transformations')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as CoachTransformation[];
    },
  });
}

/** Create a new transformation (unpublished, at the end of the list). */
export function useCreateTransformation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ coachId, sortOrder }: { coachId: string; sortOrder: number }) => {
      const { data, error } = await supabase
        .from('coach_transformations')
        .insert({
          coach_id: coachId,
          is_published: false,
          sort_order: sortOrder,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CoachTransformation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coachTransformations', variables.coachId] });
    },
  });
}

/** Update a transformation (image URLs, publish state, sort_order). */
export function useUpdateTransformation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<CoachTransformation, 'before_image_url' | 'after_image_url' | 'is_published' | 'sort_order'>>;
    }) => {
      const { data, error } = await supabase
        .from('coach_transformations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CoachTransformation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coachTransformations', data.coach_id] });
      queryClient.invalidateQueries({ queryKey: ['publishedTransformations', data.coach_id] });
    },
  });
}

/** Delete a transformation. */
export function useDeleteTransformation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transformation }: { transformation: CoachTransformation }) => {
      const { error } = await supabase
        .from('coach_transformations')
        .delete()
        .eq('id', transformation.id);
      if (error) throw error;

      return transformation;
    },
    onSuccess: (transformation) => {
      queryClient.invalidateQueries({ queryKey: ['coachTransformations', transformation.coach_id] });
      queryClient.invalidateQueries({ queryKey: ['publishedTransformations', transformation.coach_id] });
    },
  });
}

/** Batch reorder transformations by updating sort_order. */
export function useReorderTransformations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      coachId,
      orderedIds,
    }: {
      coachId: string;
      orderedIds: string[];
    }) => {
      // Update each transformation's sort_order
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('coach_transformations')
          .update({ sort_order: index, updated_at: new Date().toISOString() })
          .eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coachTransformations', variables.coachId] });
      queryClient.invalidateQueries({ queryKey: ['publishedTransformations', variables.coachId] });
    },
  });
}
