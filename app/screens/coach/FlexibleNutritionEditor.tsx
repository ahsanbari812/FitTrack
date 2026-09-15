import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Check,
  X,
  Apple,
  Sparkles,
  Save,
  CircleAlert as AlertCircle,
  MessageSquare,
  Utensils,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, BUTTONS, INPUTS } from '../../theme/theme';
import { MealOption, DietPlan, Profile } from '../../types/database';
import {
  useMealOptions,
  useCreateMealOption,
  useUpdateMealOption,
  useDeleteMealOption,
  useDuplicateMealOption,
} from '../../lib/queries/mealOptions';
import { useUpdateNutritionTargets } from '../../lib/queries/dietPlans';

interface FlexibleNutritionEditorProps {
  clientId: string;
  clientProfile?: Profile | null;
  existingPlan?: DietPlan | null;
  onBack: () => void;
  coachId?: string;
  renderModeSwitcher?: React.ReactNode;
}

export const FlexibleNutritionEditor: React.FC<FlexibleNutritionEditorProps> = ({
  clientId,
  clientProfile,
  existingPlan,
  onBack,
  coachId,
  renderModeSwitcher,
}) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;

  // React Query hooks
  const {
    data: mealOptions = [],
    isLoading: isOptionsLoading,
    isError: isOptionsError,
    refetch: refetchOptions,
  } = useMealOptions(clientId);

  const createOptionMutation = useCreateMealOption();
  const updateOptionMutation = useUpdateMealOption();
  const deleteOptionMutation = useDeleteMealOption();
  const duplicateOptionMutation = useDuplicateMealOption();
  const updateTargetsMutation = useUpdateNutritionTargets();

  // Daily Targets Form State
  const [targetCalories, setTargetCalories] = useState('2000');
  const [targetProtein, setTargetProtein] = useState('150');
  const [targetCarbs, setTargetCarbs] = useState('200');
  const [targetFat, setTargetFat] = useState('65');
  const [isTargetsDirty, setIsTargetsDirty] = useState(false);
  const [targetsSuccessToast, setTargetsSuccessToast] = useState<string | null>(null);

  // Modal State for Add / Edit Option
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<MealOption | null>(null);
  const [formName, setFormName] = useState('');
  const [formServing, setFormServing] = useState('');
  const [formCalories, setFormCalories] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarbs, setFormCarbs] = useState('');
  const [formFat, setFormFat] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoachNotes, setFormCoachNotes] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline delete confirmation state (maps option id -> boolean)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync initial targets from existingPlan
  useEffect(() => {
    if (existingPlan) {
      setTargetCalories(String(existingPlan.daily_calorie_target || 2000));
      setTargetProtein(String(existingPlan.protein_grams || 150));
      setTargetCarbs(String(existingPlan.carbs_grams || 200));
      setTargetFat(String(existingPlan.fat_grams || 65));
      setIsTargetsDirty(false);
    }
  }, [existingPlan]);

  const athleteName = clientProfile?.full_name?.trim() || 'Athlete';

  // Save Daily Targets
  const handleSaveTargets = async () => {
    const kcal = parseInt(targetCalories, 10) || 0;
    const prot = parseInt(targetProtein, 10) || 0;
    const carb = parseInt(targetCarbs, 10) || 0;
    const fat = parseInt(targetFat, 10) || 0;

    await updateTargetsMutation.mutateAsync({
      clientId,
      coachId,
      dietPlanId: existingPlan?.id,
      targets: {
        daily_calorie_target: kcal,
        protein_grams: prot,
        carbs_grams: carb,
        fat_grams: fat,
        plan_type: 'flexible_options',
        title: existingPlan?.title || 'Flexible Nutrition Protocol',
      },
    });

    setIsTargetsDirty(false);
    setTargetsSuccessToast('Nutrition targets updated');
    setTimeout(() => setTargetsSuccessToast(null), 2500);
  };

  // Open Modal to Add New Option
  const handleOpenAdd = () => {
    setEditingOption(null);
    setFormName('');
    setFormServing('1 serving');
    setFormCalories('500');
    setFormProtein('35');
    setFormCarbs('50');
    setFormFat('15');
    setFormDescription('');
    setFormCoachNotes('');
    setFormImageUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Option
  const handleOpenEdit = (option: MealOption) => {
    setEditingOption(option);
    setFormName(option.name);
    setFormServing(option.serving_size || '1 serving');
    setFormCalories(String(option.calories || 0));
    setFormProtein(String(option.protein_g || 0));
    setFormCarbs(String(option.carbs_g || 0));
    setFormFat(String(option.fat_g || 0));
    setFormDescription(option.description || '');
    setFormCoachNotes(option.coach_notes || '');
    setFormImageUrl(option.image_url || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Option (Create or Update)
  const handleSaveOption = async () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Please enter a food name.');
      return;
    }

    const kcal = parseInt(formCalories, 10);
    const prot = parseInt(formProtein, 10);
    const carb = parseInt(formCarbs, 10);
    const fat = parseInt(formFat, 10);

    if (isNaN(kcal) || kcal < 0) {
      setFormError('Please enter a valid calorie amount.');
      return;
    }

    try {
      if (editingOption) {
        await updateOptionMutation.mutateAsync({
          id: editingOption.id,
          updates: {
            name: trimmedName,
            serving_size: formServing.trim() || '1 serving',
            calories: Math.max(0, kcal),
            protein_g: Math.max(0, isNaN(prot) ? 0 : prot),
            carbs_g: Math.max(0, isNaN(carb) ? 0 : carb),
            fat_g: Math.max(0, isNaN(fat) ? 0 : fat),
            description: formDescription.trim() || null,
            coach_notes: formCoachNotes.trim() || null,
            image_url: formImageUrl.trim() || null,
          },
        });
      } else {
        await createOptionMutation.mutateAsync({
          client_id: clientId,
          coach_id: coachId || clientId,
          diet_plan_id: existingPlan?.id || null,
          name: trimmedName,
          serving_size: formServing.trim() || '1 serving',
          calories: Math.max(0, kcal),
          protein_g: Math.max(0, isNaN(prot) ? 0 : prot),
          carbs_g: Math.max(0, isNaN(carb) ? 0 : carb),
          fat_g: Math.max(0, isNaN(fat) ? 0 : fat),
          description: formDescription.trim() || null,
          coach_notes: formCoachNotes.trim() || null,
          image_url: formImageUrl.trim() || null,
          sort_order: mealOptions.length,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save meal option.');
    }
  };

  // Duplicate Option
  const handleDuplicate = async (option: MealOption) => {
    try {
      await duplicateOptionMutation.mutateAsync({
        optionId: option.id,
        clientId,
      });
    } catch (err: any) {
      console.error('Error duplicating option:', err);
    }
  };

  // Delete Option
  const handleDelete = async (optionId: string) => {
    try {
      await deleteOptionMutation.mutateAsync({
        id: optionId,
        clientId,
      });
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Error deleting option:', err);
    }
  };

  const isOptionSubmitting =
    createOptionMutation.isPending || updateOptionMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Toast Feedback */}
      {targetsSuccessToast && (
        <View style={styles.toastBanner}>
          <Check size={14} color={COLORS.brand} strokeWidth={2.4} />
          <Text style={styles.toastText}>{targetsSuccessToast}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            activeOpacity={0.75}
          >
            <ArrowLeft size={16} color={COLORS.brand} strokeWidth={2.2} />
            <Text style={styles.backBtnText}>ATHLETE</Text>
          </TouchableOpacity>

          <View style={styles.headerActionsRow}>
            {isTargetsDirty && (
              <TouchableOpacity
                onPress={handleSaveTargets}
                disabled={updateTargetsMutation.isPending}
                style={styles.saveTargetsBtn}
                activeOpacity={0.85}
              >
                {updateTargetsMutation.isPending ? (
                  <ActivityIndicator size="small" color="#080A0C" />
                ) : (
                  <>
                    <Save size={14} color="#080A0C" strokeWidth={2.4} />
                    <Text style={styles.saveTargetsBtnText}>SAVE TARGETS</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.headerTitlesCol}>
          <Text style={styles.headerKicker}>FLEXIBLE NUTRITION</Text>
          <Text style={styles.athleteNameText}>{athleteName}</Text>
          <Text style={styles.headerDescription}>
            Curate dynamic meal options and set daily targets for your athlete.
          </Text>
        </View>

        {/* Optional Mode Switcher Slot (e.g. between Flexible vs Weekly) */}
        {renderModeSwitcher}
      </View>

      {/* ================= SECTION 1: DAILY TARGETS ================= */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionKicker}>DAILY NUTRITION TARGETS</Text>
            <Text style={styles.sectionSub}>
              Baseline calories and macronutrient goals for this athlete.
            </Text>
          </View>

          {isTargetsDirty && (
            <TouchableOpacity
              onPress={handleSaveTargets}
              disabled={updateTargetsMutation.isPending}
              style={styles.inlineSaveBtn}
              activeOpacity={0.8}
            >
              {updateTargetsMutation.isPending ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : (
                <Text style={styles.inlineSaveText}>SAVE</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 4 Macro Input Boxes */}
        <View style={styles.macroGrid}>
          {/* Calories */}
          <View style={styles.macroInputBox}>
            <Text style={styles.macroInputLabel}>CALORIES</Text>
            <View style={styles.macroInputValueRow}>
              <TextInput
                value={targetCalories}
                onChangeText={(val) => {
                  setTargetCalories(val);
                  setIsTargetsDirty(true);
                }}
                keyboardType="numeric"
                returnKeyType="done"
                placeholder="2000"
                placeholderTextColor={COLORS.textMuted}
                style={styles.macroTextInput}
              />
              <Text style={styles.macroUnitText}>kcal</Text>
            </View>
          </View>

          {/* Protein */}
          <View style={styles.macroInputBox}>
            <Text style={[styles.macroInputLabel, { color: COLORS.brand }]}>
              PROTEIN
            </Text>
            <View style={styles.macroInputValueRow}>
              <TextInput
                value={targetProtein}
                onChangeText={(val) => {
                  setTargetProtein(val);
                  setIsTargetsDirty(true);
                }}
                keyboardType="numeric"
                returnKeyType="done"
                placeholder="150"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.macroTextInput, { color: COLORS.brand }]}
              />
              <Text style={styles.macroUnitText}>g</Text>
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroInputBox}>
            <Text style={[styles.macroInputLabel, { color: COLORS.info }]}>
              CARBS
            </Text>
            <View style={styles.macroInputValueRow}>
              <TextInput
                value={targetCarbs}
                onChangeText={(val) => {
                  setTargetCarbs(val);
                  setIsTargetsDirty(true);
                }}
                keyboardType="numeric"
                returnKeyType="done"
                placeholder="200"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.macroTextInput, { color: COLORS.info }]}
              />
              <Text style={styles.macroUnitText}>g</Text>
            </View>
          </View>

          {/* Fats */}
          <View style={styles.macroInputBox}>
            <Text style={[styles.macroInputLabel, { color: COLORS.warning }]}>
              FATS
            </Text>
            <View style={styles.macroInputValueRow}>
              <TextInput
                value={targetFat}
                onChangeText={(val) => {
                  setTargetFat(val);
                  setIsTargetsDirty(true);
                }}
                keyboardType="numeric"
                returnKeyType="done"
                placeholder="65"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.macroTextInput, { color: COLORS.warning }]}
              />
              <Text style={styles.macroUnitText}>g</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= SECTION 2: MEAL OPTIONS ================= */}
      <View style={styles.optionsSection}>
        <View style={styles.optionsHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.optionsTitleWithCount}>
              <Text style={styles.optionsSectionTitle}>MEAL OPTIONS</Text>
              <View style={styles.optionsCountBadge}>
                <Text style={styles.optionsCountText}>{mealOptions.length}</Text>
              </View>
            </View>
            <Text style={styles.optionsSectionSub}>
              Recommended food choices for your client to eat throughout the day.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleOpenAdd}
            style={styles.addOptionBtn}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#080A0C" strokeWidth={2.4} />
            <Text style={styles.addOptionBtnText}>
              {width > 420 ? 'ADD MEAL OPTION' : 'ADD OPTION'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isOptionsLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading meal options...</Text>
          </View>
        )}

        {/* Error State */}
        {isOptionsError && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={COLORS.error} />
            <Text style={styles.errorText}>
              Failed to load meal options. Please try again.
            </Text>
            <TouchableOpacity
              onPress={() => refetchOptions()}
              style={styles.retryBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isOptionsLoading && !isOptionsError && mealOptions.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Utensils size={28} color={COLORS.brand} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No meal options created yet</Text>
            <Text style={styles.emptySub}>
              Add flexible food choices and recommended portions for {athleteName}.
              They will be able to log any option anytime without fixed day or meal schedules.
            </Text>
            <TouchableOpacity
              onPress={handleOpenAdd}
              style={styles.emptyCtaBtn}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#080A0C" strokeWidth={2.4} />
              <Text style={styles.emptyCtaText}>ADD FIRST MEAL OPTION</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Options List */}
        {!isOptionsLoading && mealOptions.length > 0 && (
          <View style={styles.optionsList}>
            {mealOptions.map((option) => {
              const isDeleting = confirmDeleteId === option.id;

              return (
                <View key={option.id} style={styles.optionCard}>
                  {/* Top Row: Name + Serving Badge + Actions */}
                  <View style={styles.optionCardTop}>
                    <View style={styles.optionTitleCol}>
                      <Text style={styles.optionName} numberOfLines={1}>
                        {option.name}
                      </Text>
                      <View style={styles.servingPill}>
                        <Text style={styles.servingText}>
                          {option.serving_size || '1 serving'}
                        </Text>
                      </View>
                    </View>

                    {/* Actions Row */}
                    <View style={styles.optionActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleOpenEdit(option)}
                        style={styles.actionIconBtn}
                        accessibilityLabel="Edit Option"
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Pencil size={15} color={COLORS.textSecondary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDuplicate(option)}
                        disabled={duplicateOptionMutation.isPending}
                        style={styles.actionIconBtn}
                        accessibilityLabel="Duplicate Option"
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Copy size={15} color={COLORS.textSecondary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setConfirmDeleteId(isDeleting ? null : option.id)}
                        style={[styles.actionIconBtn, isDeleting && styles.actionIconBtnActive]}
                        accessibilityLabel="Delete Option"
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Trash2 size={15} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Inline Delete Confirmation Prompt */}
                  {isDeleting && (
                    <View style={styles.deleteConfirmBanner}>
                      <Text style={styles.deleteConfirmText}>
                        Delete this option? Historical logs will not be affected.
                      </Text>
                      <View style={styles.deleteConfirmActions}>
                        <TouchableOpacity
                          onPress={() => setConfirmDeleteId(null)}
                          style={styles.deleteCancelBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.deleteCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(option.id)}
                          disabled={deleteOptionMutation.isPending}
                          style={styles.deleteConfirmBtn}
                          activeOpacity={0.8}
                        >
                          {deleteOptionMutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Macros Bar */}
                  <View style={styles.optionMacrosRow}>
                    <View style={styles.macroPill}>
                      <Text style={styles.macroPillVal}>{option.calories}</Text>
                      <Text style={styles.macroPillUnit}>kcal</Text>
                    </View>

                    <View style={styles.macroPill}>
                      <Text style={[styles.macroPillVal, { color: COLORS.brand }]}>
                        {option.protein_g || 0}g
                      </Text>
                      <Text style={styles.macroPillUnit}>Protein</Text>
                    </View>

                    <View style={styles.macroPill}>
                      <Text style={[styles.macroPillVal, { color: COLORS.info }]}>
                        {option.carbs_g || 0}g
                      </Text>
                      <Text style={styles.macroPillUnit}>Carbs</Text>
                    </View>

                    <View style={styles.macroPill}>
                      <Text style={[styles.macroPillVal, { color: COLORS.warning }]}>
                        {option.fat_g || 0}g
                      </Text>
                      <Text style={styles.macroPillUnit}>Fat</Text>
                    </View>
                  </View>

                  {/* Description (if provided) */}
                  {Boolean(option.description) && (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  )}

                  {/* Coach Notes (if provided) */}
                  {Boolean(option.coach_notes) && (
                    <View style={styles.coachNotesBox}>
                      <MessageSquare size={13} color={COLORS.brand} style={{ marginTop: 2 }} />
                      <Text style={styles.coachNotesText}>
                        <Text style={styles.coachNotesBold}>Coach note: </Text>
                        {option.coach_notes}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ================= ADD / EDIT MODAL ================= */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalOpen(false)}>
          <View
            style={[
              styles.modalOverlay,
              isDesktop ? styles.desktopModalOverlay : styles.mobileModalOverlay,
            ]}
          >
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[
                  styles.modalContent,
                  isDesktop ? styles.desktopModalContent : styles.mobileModalContent,
                ]}
              >
                {!isDesktop && <View style={styles.sheetHandle} />}

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>
                      {editingOption ? 'EDIT MEAL OPTION' : 'ADD MEAL OPTION'}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {editingOption
                        ? 'Update this food choice for your athlete.'
                        : 'Create a flexible food choice with accurate nutrition.'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsModalOpen(false)}
                    style={styles.closeBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {formError && (
                  <View style={styles.formErrorBox}>
                    <AlertCircle size={14} color={COLORS.error} />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                )}

                <ScrollView
                  style={[
                    styles.modalScroll,
                    { maxHeight: isDesktop ? 480 : Math.min(420, height * 0.52) },
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Food Name */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>FOOD NAME *</Text>
                    <TextInput
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="e.g. Chicken & Jasmine Rice Bowl"
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.textInput}
                    />
                  </View>

                  {/* Serving Size */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>SERVING SIZE *</Text>
                    <TextInput
                      value={formServing}
                      onChangeText={setFormServing}
                      placeholder="e.g. 1 bowl (200g chicken, 150g rice)"
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.textInput}
                    />
                  </View>

                  {/* Macros 4-Grid */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>NUTRITIONAL VALUES (PER SERVING)</Text>
                    <View style={styles.formMacroGrid}>
                      <View style={styles.formMacroCol}>
                        <Text style={styles.formMacroLabel} numberOfLines={1}>CALORIES *</Text>
                        <TextInput
                          value={formCalories}
                          onChangeText={setFormCalories}
                          keyboardType="numeric"
                          returnKeyType="done"
                          placeholder="500"
                          placeholderTextColor={COLORS.textMuted}
                          style={styles.macroFormFieldInput}
                        />
                      </View>

                      <View style={styles.formMacroCol}>
                        <Text style={[styles.formMacroLabel, { color: COLORS.brand }]} numberOfLines={1}>
                          PROTEIN (G)
                        </Text>
                        <TextInput
                          value={formProtein}
                          onChangeText={setFormProtein}
                          keyboardType="numeric"
                          returnKeyType="done"
                          placeholder="35"
                          placeholderTextColor={COLORS.textMuted}
                          style={[styles.macroFormFieldInput, { color: COLORS.brand }]}
                        />
                      </View>

                      <View style={styles.formMacroCol}>
                        <Text style={[styles.formMacroLabel, { color: COLORS.info }]} numberOfLines={1}>
                          CARBS (G)
                        </Text>
                        <TextInput
                          value={formCarbs}
                          onChangeText={setFormCarbs}
                          keyboardType="numeric"
                          returnKeyType="done"
                          placeholder="50"
                          placeholderTextColor={COLORS.textMuted}
                          style={[styles.macroFormFieldInput, { color: COLORS.info }]}
                        />
                      </View>

                      <View style={styles.formMacroCol}>
                        <Text style={[styles.formMacroLabel, { color: COLORS.warning }]} numberOfLines={1}>
                          FAT (G)
                        </Text>
                        <TextInput
                          value={formFat}
                          onChangeText={setFormFat}
                          keyboardType="numeric"
                          returnKeyType="done"
                          placeholder="15"
                          placeholderTextColor={COLORS.textMuted}
                          style={[styles.macroFormFieldInput, { color: COLORS.warning }]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
                    <TextInput
                      value={formDescription}
                      onChangeText={setFormDescription}
                      placeholder="Brief details or ingredients breakdown..."
                      placeholderTextColor={COLORS.textMuted}
                      multiline={true}
                      style={[styles.textInput, styles.textAreaInput]}
                    />
                  </View>

                  {/* Coach Notes */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>COACH NOTES / GUIDANCE (OPTIONAL)</Text>
                    <TextInput
                      value={formCoachNotes}
                      onChangeText={setFormCoachNotes}
                      placeholder="e.g. Great post-workout meal or lunch option."
                      placeholderTextColor={COLORS.textMuted}
                      multiline={true}
                      style={[styles.textInput, styles.textAreaInput]}
                    />
                  </View>

                  {/* Image URL */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>IMAGE URL (OPTIONAL)</Text>
                    <TextInput
                      value={formImageUrl}
                      onChangeText={setFormImageUrl}
                      placeholder="https://..."
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.textInput}
                    />
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() => setIsModalOpen(false)}
                    style={styles.modalCancelBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveOption}
                    disabled={isOptionSubmitting}
                    style={styles.modalSubmitBtn}
                    activeOpacity={0.85}
                  >
                    {isOptionSubmitting ? (
                      <ActivityIndicator size="small" color="#080A0C" />
                    ) : (
                      <>
                        <Check size={16} color="#080A0C" strokeWidth={2.4} />
                        <Text style={styles.modalSubmitText}>
                          {editingOption ? 'UPDATE OPTION' : 'SAVE OPTION'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },

  // Toast
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(199, 240, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brand,
  },

  // Header
  header: {
    gap: SPACING.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: SPACING.md,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 0.8,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  saveTargetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  saveTargetsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.4,
  },
  headerTitlesCol: {
    gap: 3,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  athleteNameText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },

  // Section 1: Targets Card
  sectionCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  inlineSaveBtn: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  inlineSaveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  macroInputBox: {
    flex: 1,
    minWidth: 110,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    gap: 4,
  },
  macroInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  macroInputValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroTextInput: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    padding: 0,
    minWidth: 50,
  },
  macroUnitText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Section 2: Meal Options
  optionsSection: {
    gap: SPACING.md,
  },
  optionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  optionsTitleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  optionsCountBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  optionsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
  },
  optionsSectionSub: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brand,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  addOptionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.3,
  },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 19,
    marginBottom: SPACING.xs,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brand,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  emptyCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.3,
  },

  // Options List & Cards
  optionsList: {
    gap: SPACING.sm,
  },
  optionCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  optionCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  optionTitleCol: {
    flex: 1,
    gap: 4,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  servingPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  servingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  optionActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnActive: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
  },

  // Delete Confirm Banner
  deleteConfirmBanner: {
    backgroundColor: 'rgba(255, 92, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    gap: 8,
  },
  deleteConfirmText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  deleteCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteCancelText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deleteConfirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.error,
  },
  deleteConfirmBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Macros Pills
  optionMacrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  macroPillVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroPillUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Description & Coach Notes
  optionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  coachNotesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(199, 240, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.15)',
    borderRadius: RADIUS.sm,
    padding: 8,
  },
  coachNotesText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 17,
  },
  coachNotesBold: {
    fontWeight: '700',
    color: COLORS.brand,
  },

  // Loading & Error
  loadingBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 92, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Modal / Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  desktopModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  mobileModalOverlay: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  desktopModalContent: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    borderRadius: RADIUS.lg,
  },
  mobileModalContent: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderBottomWidth: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: SPACING.md,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 92, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  formErrorText: {
    fontSize: 12,
    color: COLORS.error,
    flex: 1,
  },
  modalScroll: {
    padding: SPACING.md,
    maxHeight: 460,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textAreaInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  formMacroGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  formMacroCol: {
    flex: 1,
    gap: 4,
  },
  formMacroLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  macroFormFieldInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelBtn: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.4,
  },
});
