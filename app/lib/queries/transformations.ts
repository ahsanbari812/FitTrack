import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { CoachTransformation } from '../../types/database';
import * as ImagePicker from 'expo-image-picker';

const TRANSFORMATIONS_BUCKET = 'transformations';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

/**
 * Pick an image from the device gallery via expo-image-picker.
 * Returns base64 data and the MIME type, or null if cancelled.
 */
export async function pickTransformationImage(): Promise<{
  base64: string;
  mimeType: string;
  uri: string;
} | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to upload transformation images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset.base64) {
    // Fallback: return URI only (native platforms may not always provide base64)
    return { base64: '', mimeType: asset.mimeType || 'image/jpeg', uri: asset.uri };
  }

  return {
    base64: asset.base64,
    mimeType: asset.mimeType || 'image/jpeg',
    uri: asset.uri,
  };
}

/**
 * Upload an image to Supabase Storage from a local URI (file:// or data:).
 * Returns the public URL of the uploaded image.
 */
export async function uploadTransformationImage(
  coachId: string,
  image: { base64: string; mimeType: string; uri: string },
): Promise<string> {
  const fileExt = image.mimeType === 'image/png' ? 'png' : 'jpg';
  const contentType = image.mimeType || 'image/jpeg';
  const fileName = `${coachId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  // Always use the URI to fetch the image data — this works reliably
  // on both native (file:// URIs) and web (blob:/data: URIs).
  const sourceUri = image.base64
    ? `data:${contentType};base64,${image.base64}`
    : image.uri;

  const response = await fetch(sourceUri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(TRANSFORMATIONS_BUCKET)
    .upload(fileName, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(TRANSFORMATIONS_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Delete an image from Supabase Storage given its public URL.
 */
export async function deleteStorageImage(publicUrl: string): Promise<void> {
  try {
    // Extract the path from the public URL
    const bucketSegment = `/storage/v1/object/public/${TRANSFORMATIONS_BUCKET}/`;
    const idx = publicUrl.indexOf(bucketSegment);
    if (idx === -1) return;

    const filePath = decodeURIComponent(publicUrl.substring(idx + bucketSegment.length));
    await supabase.storage.from(TRANSFORMATIONS_BUCKET).remove([filePath]);
  } catch (err) {
    console.warn('Failed to delete storage image:', err);
  }
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

/** Delete a transformation and clean up storage images. */
export function useDeleteTransformation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transformation }: { transformation: CoachTransformation }) => {
      // Clean up storage images
      if (transformation.before_image_url) {
        await deleteStorageImage(transformation.before_image_url);
      }
      if (transformation.after_image_url) {
        await deleteStorageImage(transformation.after_image_url);
      }

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
