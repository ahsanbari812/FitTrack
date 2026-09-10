import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '../supabase';
import { CoachTransformation } from '../../types/database';
import * as ImagePicker from 'expo-image-picker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransformationUpdate = Partial<
  Pick<
    CoachTransformation,
    | 'before_image_url'
    | 'after_image_url'
    | 'is_published'
    | 'sort_order'
  >
>;

// ---------------------------------------------------------------------------
// Image picker helper
// ---------------------------------------------------------------------------

/**
 * Pick an image from the device gallery.
 *
 * Returns:
 *   data:image/...;base64,... when base64 is available
 *   local URI as fallback
 *   null when cancelled
 */
export async function pickTransformationImage(): Promise<
  string | null
> {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      'Photo library permission is required to select transformation images.'
    );
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    });

  if (
    result.canceled ||
    !result.assets ||
    result.assets.length === 0
  ) {
    return null;
  }

  const asset = result.assets[0];

  if (asset.base64) {
    const mime =
      asset.mimeType || 'image/jpeg';

    return `data:${mime};base64,${asset.base64}`;
  }

  return asset.uri;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const transformationQueryKeys = {
  all: ['transformations'] as const,

  coach: (coachId: string) =>
    ['coachTransformations', coachId] as const,

  published: (coachId: string) =>
    ['publishedTransformations', coachId] as const,
};

// ---------------------------------------------------------------------------
// Coach query
// ---------------------------------------------------------------------------

/**
 * Fetch all transformations belonging to a coach.
 *
 * Used by CoachProfileEditorScreen.
 */
export function useCoachTransformations(
  coachId?: string | null
) {
  return useQuery<CoachTransformation[], Error>({
    queryKey: coachId
      ? transformationQueryKeys.coach(coachId)
      : ['coachTransformations', 'disabled'],

    enabled: Boolean(coachId),

    queryFn: async () => {
      if (!coachId) {
        return [];
      }

      const {
        data,
        error,
      } = await supabase
        .from('coach_transformations')
        .select('*')
        .eq('coach_id', coachId)
        .order('sort_order', {
          ascending: true,
        });

      if (error) {
        console.error(
          '[Transformations] Coach query failed:',
          error
        );

        throw error;
      }

      return (
        (data || []) as CoachTransformation[]
      );
    },

    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Published client query
// ---------------------------------------------------------------------------

/**
 * Fetch ONLY published transformations for the coach.
 *
 * Used by CoachProfileModal on the client side.
 *
 * IMPORTANT:
 * We intentionally throw Supabase errors instead of returning [].
 * Returning [] hides RLS/query failures and makes a broken query
 * look like "the coach has no transformations."
 */
export function usePublishedTransformations(
  coachId?: string | null
) {
  return useQuery<CoachTransformation[], Error>({
    queryKey: coachId
      ? transformationQueryKeys.published(
        coachId
      )
      : ['publishedTransformations', 'disabled'],

    enabled: Boolean(coachId),

    queryFn: async () => {
      if (!coachId) {
        return [];
      }

      console.log(
        '[Transformations] Loading published transformations for coach:',
        coachId
      );

      const {
        data,
        error,
      } = await supabase
        .from('coach_transformations')
        .select(
          'id, coach_id, before_image_url, after_image_url, is_published, sort_order, created_at, updated_at'
        )
        .eq('coach_id', coachId)
        .eq('is_published', true)
        .order('sort_order', {
          ascending: true,
        });

      if (error) {
        console.error(
          '[Transformations] Published query failed:',
          error
        );

        throw error;
      }

      console.log(
        '[Transformations] Published transformations found:',
        data?.length ?? 0
      );

      return (
        (data || []) as CoachTransformation[]
      );
    },

    staleTime: 30_000,

    // Refetch when the modal is opened again.
    refetchOnMount: true,

    // Keep the client profile reasonably fresh.
    refetchOnWindowFocus: true,
  });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new transformation.
 *
 * New transformations are published by default.
 */
export function useCreateTransformation() {
  const queryClient =
    useQueryClient();

  return useMutation<
    CoachTransformation,
    Error,
    {
      coachId: string;
      sortOrder: number;
    }
  >({
    mutationFn: async ({
      coachId,
      sortOrder,
    }) => {
      const {
        data,
        error,
      } = await supabase
        .from('coach_transformations')
        .insert({
          coach_id: coachId,
          is_published: true,
          sort_order: sortOrder,
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return data as CoachTransformation;
    },

    onSuccess: async (
      transformation
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.coach(
              transformation.coach_id
            ),
        }),

        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.published(
              transformation.coach_id
            ),
        }),
      ]);
    },
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update transformation images,
 * publication state, or ordering.
 */
export function useUpdateTransformation() {
  const queryClient =
    useQueryClient();

  return useMutation<
    CoachTransformation,
    Error,
    {
      id: string;
      updates: TransformationUpdate;
    }
  >({
    mutationFn: async ({
      id,
      updates,
    }) => {
      const {
        data,
        error,
      } = await supabase
        .from('coach_transformations')
        .update({
          ...updates,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return data as CoachTransformation;
    },

    onSuccess: async (
      transformation
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.coach(
              transformation.coach_id
            ),
        }),

        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.published(
              transformation.coach_id
            ),
        }),
      ]);
    },
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export function useDeleteTransformation() {
  const queryClient =
    useQueryClient();

  return useMutation<
    CoachTransformation,
    Error,
    {
      transformation: CoachTransformation;
    }
  >({
    mutationFn: async ({
      transformation,
    }) => {
      const {
        error,
      } = await supabase
        .from('coach_transformations')
        .delete()
        .eq('id', transformation.id);

      if (error) {
        throw error;
      }

      return transformation;
    },

    onSuccess: async (
      transformation
    ) => {
      queryClient.setQueryData<
        CoachTransformation[]
      >(
        transformationQueryKeys.coach(
          transformation.coach_id
        ),
        (old) =>
          old
            ? old.filter(
              (item) =>
                item.id !==
                transformation.id
            )
            : []
      );

      queryClient.setQueryData<
        CoachTransformation[]
      >(
        transformationQueryKeys.published(
          transformation.coach_id
        ),
        (old) =>
          old
            ? old.filter(
              (item) =>
                item.id !==
                transformation.id
            )
            : []
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.coach(
              transformation.coach_id
            ),
        }),

        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.published(
              transformation.coach_id
            ),
        }),
      ]);
    },
  });
}

// ---------------------------------------------------------------------------
// Reorder
// ---------------------------------------------------------------------------

export function useReorderTransformations() {
  const queryClient =
    useQueryClient();

  return useMutation<
    void,
    Error,
    {
      coachId: string;
      orderedIds: string[];
    }
  >({
    mutationFn: async ({
      orderedIds,
    }) => {
      const now =
        new Date().toISOString();

      const updates =
        orderedIds.map(
          (id, index) =>
            supabase
              .from(
                'coach_transformations'
              )
              .update({
                sort_order: index,
                updated_at: now,
              })
              .eq('id', id)
        );

      const results =
        await Promise.all(
          updates
        );

      const failed =
        results.find(
          (result) =>
            result.error
        );

      if (failed?.error) {
        throw failed.error;
      }
    },

    onSuccess: async (
      _,
      variables
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.coach(
              variables.coachId
            ),
        }),

        queryClient.invalidateQueries({
          queryKey:
            transformationQueryKeys.published(
              variables.coachId
            ),
        }),
      ]);
    },
  });
}