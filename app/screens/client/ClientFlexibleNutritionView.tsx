import React, { useState } from 'react';
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
} from 'react-native';
import {
  Apple,
  Plus,
  Check,
  X,
  Sparkles,
  Utensils,
  Trash2,
  Clock,
  MessageSquare,
  CircleAlert as AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, BUTTONS, INPUTS } from '../../theme/theme';
import { MealOption, LoggedFoodItem, DietPlan } from '../../types/database';
import { useMealOptions } from '../../lib/queries/mealOptions';
import {
  useNutritionTotals,
  useLogCoachOption,
  useLogCustomFood,
  useDeleteLoggedFood,
} from '../../lib/queries/logs';

interface ClientFlexibleNutritionViewProps {
  clientId: string;
  dietPlan?: DietPlan | null;
  renderModeSwitcher?: React.ReactNode;
}

const formatLogTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

export const ClientFlexibleNutritionView: React.FC<ClientFlexibleNutritionViewProps> = ({
  clientId,
  dietPlan,
  renderModeSwitcher,
}) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const today = new Date().toISOString().split('T')[0];

  // Queries
  const { data: mealOptions = [], isLoading: isOptionsLoading } = useMealOptions(clientId);
  const { totals, loggedFoods, isLoading: isLogsLoading } = useNutritionTotals(clientId, today);

  // Mutations
  const logCoachOptionMutation = useLogCoachOption();
  const logCustomFoodMutation = useLogCustomFood();
  const deleteLoggedFoodMutation = useDeleteLoggedFood();

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal 1: Log Coach Option State
  const [isLogOptionModalOpen, setIsLogOptionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MealOption | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);
  const [customServingInput, setCustomServingInput] = useState('1');
  const [logOptionError, setLogOptionError] = useState<string | null>(null);

  // Modal 2: Log Custom Food State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customServingSize, setCustomServingSize] = useState('1 serving');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customFormError, setCustomFormError] = useState<string | null>(null);

  // Targets from Diet Plan
  const targetCalories = dietPlan?.daily_calorie_target || 0;
  const targetProtein = dietPlan?.protein_grams || 0;
  const targetCarbs = dietPlan?.carbs_grams || 0;
  const targetFat = dietPlan?.fat_grams || 0;

  // Consumed Values
  const consumedCalories = totals.calories;
  const consumedProtein = totals.protein;
  const consumedCarbs = totals.carbs;
  const consumedFat = totals.fat;

  // Progress Ratios (safe for 0 targets)
  const caloriesRatio = targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;
  const proteinRatio = targetProtein > 0 ? Math.min(1, consumedProtein / targetProtein) : 0;
  const carbsRatio = targetCarbs > 0 ? Math.min(1, consumedCarbs / targetCarbs) : 0;
  const fatRatio = targetFat > 0 ? Math.min(1, consumedFat / targetFat) : 0;

  // Calorie remaining copy
  const remainingCalories = targetCalories > 0 ? targetCalories - consumedCalories : 0;

  // Handler: Open Log Option Modal
  const handleOpenLogOption = (option: MealOption) => {
    setSelectedOption(option);
    setServingMultiplier(1);
    setCustomServingInput('1');
    setLogOptionError(null);
    setIsLogOptionModalOpen(true);
  };

  // Handler: Confirm Log Coach Option
  const handleConfirmLogOption = async () => {
    if (!selectedOption) return;
    const quantity = Math.max(0.1, isNaN(servingMultiplier) ? 1 : Number(servingMultiplier) || 1);

    try {
      setLogOptionError(null);
      await logCoachOptionMutation.mutateAsync({
        clientId,
        date: today,
        mealOption: selectedOption,
        servings: quantity,
      });

      setIsLogOptionModalOpen(false);
      setToastMessage(`Logged ${selectedOption.name} (${quantity}x)`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      setLogOptionError(err.message || 'Failed to log food option.');
    }
  };

  // Handler: Open Custom Food Modal
  const handleOpenCustomFood = () => {
    setCustomName('');
    setCustomServingSize('1 serving');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    setCustomFormError(null);
    setIsCustomModalOpen(true);
  };

  // Handler: Confirm Log Custom Food
  const handleConfirmCustomFood = async () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      setCustomFormError('Please enter a food name.');
      return;
    }

    const kcal = parseInt(customCalories, 10);
    const prot = parseInt(customProtein, 10);
    const carb = parseInt(customCarbs, 10);
    const fat = parseInt(customFat, 10);

    if (isNaN(kcal) || kcal < 0) {
      setCustomFormError('Please enter valid calories.');
      return;
    }

    try {
      setCustomFormError(null);
      await logCustomFoodMutation.mutateAsync({
        clientId,
        date: today,
        food: {
          name: trimmed,
          serving_size: customServingSize.trim() || '1 serving',
          servings: 1,
          calories: Math.max(0, kcal),
          protein_g: Math.max(0, isNaN(prot) ? 0 : prot),
          carbs_g: Math.max(0, isNaN(carb) ? 0 : carb),
          fat_g: Math.max(0, isNaN(fat) ? 0 : fat),
        },
      });

      setIsCustomModalOpen(false);
      setToastMessage(`Logged ${trimmed}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      setCustomFormError(err.message || 'Could not log food.');
    }
  };

  // Handler: Delete Logged Food Item
  const handleDeleteFood = async (foodId: string, foodName: string) => {
    try {
      await deleteLoggedFoodMutation.mutateAsync({
        clientId,
        date: today,
        foodLogId: foodId,
      });
      setToastMessage(`Removed ${foodName}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      setToastMessage(`Failed to remove food.`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Toast Feedback */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Sparkles size={14} color={COLORS.brand} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerKicker}>NUTRITION</Text>
        <Text style={styles.headerTitle}>TODAY'S INTAKE</Text>
        <Text style={styles.headerDate}>{formattedToday}</Text>
        {renderModeSwitcher}
      </View>

      {/* ================= 1. TODAY'S NUTRITION SUMMARY CARD ================= */}
      <View style={styles.macroSummaryCard}>
        {/* Calories Top Section */}
        <View style={styles.caloriesHeaderRow}>
          <View>
            <Text style={styles.macroCardKicker}>ENERGY CONSUMED</Text>
            <View style={styles.caloriesBigRow}>
              <Text style={styles.caloriesBigVal}>{consumedCalories}</Text>
              {targetCalories > 0 && (
                <Text style={styles.caloriesTargetVal}> / {targetCalories} kcal</Text>
              )}
              {targetCalories === 0 && (
                <Text style={styles.caloriesTargetVal}> kcal</Text>
              )}
            </View>
          </View>

          {targetCalories > 0 && (
            <View style={styles.remainingPill}>
              <Text style={styles.remainingPillText}>
                {remainingCalories >= 0
                  ? `${remainingCalories} kcal left`
                  : `${Math.abs(remainingCalories)} kcal over`}
              </Text>
            </View>
          )}
        </View>

        {/* Calories Progress Bar */}
        {targetCalories > 0 && (
          <View style={styles.calorieProgressBarTrack}>
            <View
              style={[
                styles.calorieProgressBarFill,
                {
                  width: `${Math.round(caloriesRatio * 100)}%`,
                  backgroundColor: remainingCalories < 0 ? COLORS.warning : COLORS.brand,
                },
              ]}
            />
          </View>
        )}

        {/* 3 Macro Columns: Protein, Carbs, Fat */}
        <View style={styles.macroColumnsRow}>
          {/* Protein */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroColKicker, { color: COLORS.brand }]}>PROTEIN</Text>
            <Text style={styles.macroColValue}>
              {consumedProtein}
              {targetProtein > 0 ? (
                <Text style={styles.macroColTarget}>/{targetProtein}g</Text>
              ) : (
                <Text style={styles.macroColTarget}>g</Text>
              )}
            </Text>
            {targetProtein > 0 && (
              <View style={styles.macroSubTrack}>
                <View
                  style={[
                    styles.macroSubFill,
                    {
                      backgroundColor: COLORS.brand,
                      width: `${Math.round(proteinRatio * 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Carbs */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroColKicker, { color: COLORS.info }]}>CARBS</Text>
            <Text style={styles.macroColValue}>
              {consumedCarbs}
              {targetCarbs > 0 ? (
                <Text style={styles.macroColTarget}>/{targetCarbs}g</Text>
              ) : (
                <Text style={styles.macroColTarget}>g</Text>
              )}
            </Text>
            {targetCarbs > 0 && (
              <View style={styles.macroSubTrack}>
                <View
                  style={[
                    styles.macroSubFill,
                    {
                      backgroundColor: COLORS.info,
                      width: `${Math.round(carbsRatio * 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Fat */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroColKicker, { color: COLORS.warning }]}>FATS</Text>
            <Text style={styles.macroColValue}>
              {consumedFat}
              {targetFat > 0 ? (
                <Text style={styles.macroColTarget}>/{targetFat}g</Text>
              ) : (
                <Text style={styles.macroColTarget}>g</Text>
              )}
            </Text>
            {targetFat > 0 && (
              <View style={styles.macroSubTrack}>
                <View
                  style={[
                    styles.macroSubFill,
                    {
                      backgroundColor: COLORS.warning,
                      width: `${Math.round(fatRatio * 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ================= ACTION BAR: LOG CUSTOM FOOD ================= */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          onPress={handleOpenCustomFood}
          style={styles.logCustomFoodBtn}
          activeOpacity={0.85}
        >
          <Plus size={16} color={COLORS.brand} strokeWidth={2.4} />
          <Text style={styles.logCustomFoodText}>LOG CUSTOM FOOD</Text>
        </TouchableOpacity>
      </View>

      {/* ================= 2. COACH MEAL OPTIONS ================= */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR MEAL OPTIONS</Text>
          <Text style={styles.sectionSubtitle}>
            Choose from the options your coach has recommended, or log something else.
          </Text>
        </View>

        {/* Loading */}
        {isOptionsLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading your meal options...</Text>
          </View>
        )}

        {/* Empty Coach Options */}
        {!isOptionsLoading && mealOptions.length === 0 && (
          <View style={styles.emptyOptionsCard}>
            <Utensils size={24} color={COLORS.textMuted} />
            <Text style={styles.emptyOptionsTitle}>No coach options yet</Text>
            <Text style={styles.emptyOptionsSub}>
              Your coach hasn't configured meal options yet. You can still log any meal using
              "Log Custom Food" above.
            </Text>
          </View>
        )}

        {/* Options List */}
        {!isOptionsLoading && mealOptions.length > 0 && (
          <View style={styles.optionsList}>
            {mealOptions.map((option) => (
              <View key={option.id} style={styles.optionCard}>
                <View style={styles.optionContentCol}>
                  {/* Title & Serving */}
                  <View style={styles.optionTopRow}>
                    <Text style={styles.optionName} numberOfLines={1}>
                      {option.name}
                    </Text>
                  </View>

                  <Text style={styles.optionServingText}>
                    {option.serving_size || '1 serving'}
                  </Text>

                  {/* Macros Badges */}
                  <View style={styles.optionMacrosPillRow}>
                    <Text style={styles.optionMacroKcal}>{option.calories} kcal</Text>
                    <Text style={styles.optionMacroDot}>•</Text>
                    <Text style={[styles.optionMacroText, { color: COLORS.brand }]}>
                      {option.protein_g || 0}g P
                    </Text>
                    <Text style={styles.optionMacroDot}>•</Text>
                    <Text style={[styles.optionMacroText, { color: COLORS.info }]}>
                      {option.carbs_g || 0}g C
                    </Text>
                    <Text style={styles.optionMacroDot}>•</Text>
                    <Text style={[styles.optionMacroText, { color: COLORS.warning }]}>
                      {option.fat_g || 0}g F
                    </Text>
                  </View>

                  {/* Coach Note if present */}
                  {Boolean(option.coach_notes) && (
                    <View style={styles.optionCoachNotePill}>
                      <MessageSquare size={11} color={COLORS.brand} />
                      <Text style={styles.optionCoachNoteText} numberOfLines={2}>
                        {option.coach_notes}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Primary LOG Button */}
                <TouchableOpacity
                  onPress={() => handleOpenLogOption(option)}
                  style={styles.logOptionBtn}
                  activeOpacity={0.8}
                >
                  <Plus size={15} color="#080A0C" strokeWidth={2.6} />
                  <Text style={styles.logOptionBtnText}>LOG</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ================= 3. TODAY'S LOGGED FOODS ================= */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.loggedHeaderWithCount}>
            <Text style={styles.sectionTitle}>TODAY'S LOGGED FOODS</Text>
            <View style={styles.loggedCountPill}>
              <Text style={styles.loggedCountPillText}>{loggedFoods.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Review everything you have consumed today.
          </Text>
        </View>

        {/* Empty Foods Logged State */}
        {loggedFoods.length === 0 ? (
          <View style={styles.emptyLoggedCard}>
            <View style={styles.emptyLoggedIconCircle}>
              <Utensils size={24} color={COLORS.brand} />
            </View>
            <Text style={styles.emptyLoggedTitle}>No foods logged yet today</Text>
            <Text style={styles.emptyLoggedSub}>
              Start your daily tracking by selecting one of your coach's options above, or tap
              "Log Custom Food".
            </Text>
          </View>
        ) : (
          <View style={styles.loggedList}>
            {loggedFoods.map((item) => {
              const isCustom = item.source === 'custom';

              return (
                <View key={item.id} style={styles.loggedItemCard}>
                  <View style={styles.loggedItemLeftCol}>
                    {/* Source Badge */}
                    <View style={styles.sourceBadgeRow}>
                      <View
                        style={[
                          styles.sourceBadge,
                          isCustom ? styles.sourceBadgeCustom : styles.sourceBadgeCoach,
                        ]}
                      >
                        {isCustom ? (
                          <Sparkles size={10} color={COLORS.info} />
                        ) : (
                          <Apple size={10} color={COLORS.brand} />
                        )}
                        <Text
                          style={[
                            styles.sourceBadgeText,
                            { color: isCustom ? COLORS.info : COLORS.brand },
                          ]}
                        >
                          {isCustom ? 'CUSTOM FOOD' : 'COACH OPTION'}
                        </Text>
                      </View>

                      {Boolean(item.logged_at) && (
                        <View style={styles.timeBadgeRow}>
                          <Clock size={10} color={COLORS.textMuted} />
                          <Text style={styles.timeBadgeText}>
                            {formatLogTime(item.logged_at)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Food Name & Servings */}
                    <Text style={styles.loggedItemName}>{item.name}</Text>
                    <Text style={styles.loggedItemMeta}>
                      {item.servings_consumed !== 1 ? `${item.servings_consumed}x ` : ''}
                      {item.serving_size} • {item.calories} kcal
                    </Text>

                    {/* Macros breakdown */}
                    <View style={styles.loggedMacrosRow}>
                      <Text style={[styles.loggedMacroPillText, { color: COLORS.brand }]}>
                        {item.protein_g}g P
                      </Text>
                      <Text style={styles.loggedMacroDot}>•</Text>
                      <Text style={[styles.loggedMacroPillText, { color: COLORS.info }]}>
                        {item.carbs_g}g C
                      </Text>
                      <Text style={styles.loggedMacroDot}>•</Text>
                      <Text style={[styles.loggedMacroPillText, { color: COLORS.warning }]}>
                        {item.fat_g}g F
                      </Text>
                    </View>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => handleDeleteFood(item.id, item.name)}
                    disabled={deleteLoggedFoodMutation.isPending}
                    style={styles.deleteFoodBtn}
                    accessibilityLabel="Remove logged food"
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Trash2 size={15} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ================= MODAL 1: LOG COACH OPTION ================= */}
      <Modal
        visible={isLogOptionModalOpen}
        transparent={true}
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsLogOptionModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsLogOptionModalOpen(false)}>
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
                  styles.modalCard,
                  isDesktop ? styles.desktopModalCard : styles.mobileModalCard,
                ]}
              >
                {!isDesktop && <View style={styles.sheetHandle} />}

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>LOG FOOD OPTION</Text>
                    <Text style={styles.modalSub}>{selectedOption?.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsLogOptionModalOpen(false)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {logOptionError && (
                  <View style={styles.formErrorBox}>
                    <AlertCircle size={14} color={COLORS.error} />
                    <Text style={styles.formErrorText}>{logOptionError}</Text>
                  </View>
                )}

                {selectedOption && (
                  <ScrollView
                    style={[
                      styles.modalBody,
                      { maxHeight: isDesktop ? 480 : Math.min(420, height * 0.52) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Portion Size Multiplier */}
                    <Text style={styles.fieldSectionLabel}>SERVING QUANTITY</Text>
                    <Text style={styles.servingDescText}>
                      Standard Serving: {selectedOption.serving_size}
                    </Text>

                    {/* Quick Multiplier Buttons */}
                    <View style={styles.multiplierRow}>
                      {[0.5, 1.0, 1.5, 2.0].map((qty) => {
                        const isSelected = servingMultiplier === qty;
                        return (
                          <TouchableOpacity
                            key={qty}
                            onPress={() => {
                              setServingMultiplier(qty);
                              setCustomServingInput(String(qty));
                            }}
                            style={[
                              styles.multiplierPill,
                              isSelected && styles.multiplierPillActive,
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.multiplierPillText,
                                isSelected && styles.multiplierPillTextActive,
                              ]}
                            >
                              {qty}x
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Custom Decimal Multiplier Input */}
                    <View style={styles.customServingInputRow}>
                      <Text style={styles.customServingInputLabel}>Custom Servings:</Text>
                      <TextInput
                        value={customServingInput}
                        onChangeText={(val) => {
                          setCustomServingInput(val);
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed) && parsed > 0) {
                            setServingMultiplier(parsed);
                          }
                        }}
                        keyboardType="numeric"
                        returnKeyType="done"
                        placeholder="1.0"
                        placeholderTextColor={COLORS.textMuted}
                        style={styles.customServingTextInput}
                      />
                      <Text style={styles.customServingSuffix}>servings</Text>
                    </View>

                    {/* Calculated Macros Preview Box */}
                    <View style={styles.previewBox}>
                      <Text style={styles.previewBoxTitle}>NUTRITION PREVIEW</Text>
                      <View style={styles.previewMetricsRow}>
                        <View style={styles.previewMetricItem}>
                          <Text style={styles.previewMetricLabel}>CALORIES</Text>
                          <Text style={styles.previewMetricVal}>
                            {Math.round(selectedOption.calories * servingMultiplier)}
                            <Text style={styles.previewMetricUnit}> kcal</Text>
                          </Text>
                        </View>
                        <View style={styles.previewMetricItem}>
                          <Text style={[styles.previewMetricLabel, { color: COLORS.brand }]}>
                            PROTEIN
                          </Text>
                          <Text style={[styles.previewMetricVal, { color: COLORS.brand }]}>
                            {Math.round((selectedOption.protein_g || 0) * servingMultiplier)}
                            <Text style={styles.previewMetricUnit}>g</Text>
                          </Text>
                        </View>
                        <View style={styles.previewMetricItem}>
                          <Text style={[styles.previewMetricLabel, { color: COLORS.info }]}>
                            CARBS
                          </Text>
                          <Text style={[styles.previewMetricVal, { color: COLORS.info }]}>
                            {Math.round((selectedOption.carbs_g || 0) * servingMultiplier)}
                            <Text style={styles.previewMetricUnit}>g</Text>
                          </Text>
                        </View>
                        <View style={styles.previewMetricItem}>
                          <Text style={[styles.previewMetricLabel, { color: COLORS.warning }]}>
                            FAT
                          </Text>
                          <Text style={[styles.previewMetricVal, { color: COLORS.warning }]}>
                            {Math.round((selectedOption.fat_g || 0) * servingMultiplier)}
                            <Text style={styles.previewMetricUnit}>g</Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                )}

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() => setIsLogOptionModalOpen(false)}
                    style={styles.modalCancelBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmLogOption}
                    disabled={logCoachOptionMutation.isPending}
                    style={styles.modalConfirmBtn}
                    activeOpacity={0.85}
                  >
                    {logCoachOptionMutation.isPending ? (
                      <ActivityIndicator size="small" color="#080A0C" />
                    ) : (
                      <>
                        <Check size={16} color="#080A0C" strokeWidth={2.4} />
                        <Text style={styles.modalConfirmText}>LOG FOOD</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ================= MODAL 2: LOG CUSTOM FOOD ================= */}
      <Modal
        visible={isCustomModalOpen}
        transparent={true}
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsCustomModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCustomModalOpen(false)}>
          <View
            style={[
              styles.modalOverlay,
              isDesktop ? styles.desktopModalOverlay : styles.mobileModalOverlay,
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  isDesktop ? styles.desktopModalCard : styles.mobileModalCard,
                ]}
              >
                {!isDesktop && <View style={styles.sheetHandle} />}

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>LOG CUSTOM FOOD</Text>
                    <Text style={styles.modalSub}>
                      This food will be added to today's nutrition log.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsCustomModalOpen(false)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {customFormError && (
                  <View style={styles.formErrorBox}>
                    <AlertCircle size={14} color={COLORS.error} />
                    <Text style={styles.formErrorText}>{customFormError}</Text>
                  </View>
                )}

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Food Name */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>FOOD NAME *</Text>
                    <TextInput
                      value={customName}
                      onChangeText={setCustomName}
                      placeholder="e.g. Restaurant Biryani, Protein Shake..."
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.formTextInput}
                    />
                  </View>

                  {/* Serving Size */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>PORTION / SERVING SIZE</Text>
                    <TextInput
                      value={customServingSize}
                      onChangeText={setCustomServingSize}
                      placeholder="e.g. 1 plate (350g), 1 scoop"
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.formTextInput}
                    />
                  </View>

                  {/* Macros 4-Grid */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>NUTRITION TOTALS *</Text>
                    <View style={styles.customMacroGrid}>
                      <View style={styles.customMacroCol}>
                        <Text style={styles.customMacroColLabel}>CALORIES *</Text>
                        <TextInput
                          value={customCalories}
                          onChangeText={setCustomCalories}
                          keyboardType="numeric"
                          placeholder="650"
                          placeholderTextColor={COLORS.textMuted}
                          style={styles.customMacroInput}
                        />
                      </View>

                      <View style={styles.customMacroCol}>
                        <Text style={[styles.customMacroColLabel, { color: COLORS.brand }]}>
                          PROTEIN (G)
                        </Text>
                        <TextInput
                          value={customProtein}
                          onChangeText={setCustomProtein}
                          keyboardType="numeric"
                          placeholder="35"
                          placeholderTextColor={COLORS.textMuted}
                          style={[styles.customMacroInput, { color: COLORS.brand }]}
                        />
                      </View>

                      <View style={styles.customMacroCol}>
                        <Text style={[styles.customMacroColLabel, { color: COLORS.info }]}>
                          CARBS (G)
                        </Text>
                        <TextInput
                          value={customCarbs}
                          onChangeText={setCustomCarbs}
                          keyboardType="numeric"
                          placeholder="55"
                          placeholderTextColor={COLORS.textMuted}
                          style={[styles.customMacroInput, { color: COLORS.info }]}
                        />
                      </View>

                      <View style={styles.customMacroCol}>
                        <Text style={[styles.customMacroColLabel, { color: COLORS.warning }]}>
                          FAT (G)
                        </Text>
                        <TextInput
                          value={customFat}
                          onChangeText={setCustomFat}
                          keyboardType="numeric"
                          placeholder="18"
                          placeholderTextColor={COLORS.textMuted}
                          style={[styles.customMacroInput, { color: COLORS.warning }]}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() => setIsCustomModalOpen(false)}
                    style={styles.modalCancelBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmCustomFood}
                    disabled={logCustomFoodMutation.isPending}
                    style={styles.modalConfirmBtn}
                    activeOpacity={0.85}
                  >
                    {logCustomFoodMutation.isPending ? (
                      <ActivityIndicator size="small" color="#080A0C" />
                    ) : (
                      <>
                        <Check size={16} color="#080A0C" strokeWidth={2.4} />
                        <Text style={styles.modalConfirmText}>LOG TO TODAY</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
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
    gap: 3,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Summary Card
  macroSummaryCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  caloriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  macroCardKicker: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  caloriesBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  caloriesBigVal: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  caloriesTargetVal: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  remainingPill: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  remainingPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand,
  },
  calorieProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
  },
  calorieProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroColumnsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: 4,
  },
  macroCol: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    gap: 4,
  },
  macroColKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  macroColValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroColTarget: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  macroSubTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfacePrimary,
    overflow: 'hidden',
    marginTop: 2,
  },
  macroSubFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Quick Action
  quickActionRow: {
    flexDirection: 'row',
  },
  logCustomFoodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1.5,
    borderColor: 'rgba(199, 240, 0, 0.4)',
    borderRadius: RADIUS.sm,
  },
  logCustomFoodText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 0.4,
  },

  // Sections
  section: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  loadingBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Empty Options Card
  emptyOptionsCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 6,
  },
  emptyOptionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyOptionsSub: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 380,
  },

  // Options List
  optionsList: {
    gap: SPACING.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  optionContentCol: {
    flex: 1,
    gap: 4,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  optionServingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  optionMacrosPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  optionMacroKcal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  optionMacroDot: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  optionMacroText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  optionCoachNotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(199, 240, 0, 0.06)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 4,
  },
  optionCoachNoteText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    flex: 1,
  },
  logOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brand,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  logOptionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.4,
  },

  // Logged Foods Section
  loggedHeaderWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loggedCountPill: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  loggedCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
  },
  emptyLoggedCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emptyLoggedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyLoggedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyLoggedSub: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 18,
  },
  loggedList: {
    gap: SPACING.xs,
  },
  loggedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  loggedItemLeftCol: {
    flex: 1,
    gap: 3,
  },
  sourceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  sourceBadgeCoach: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
  },
  sourceBadgeCustom: {
    backgroundColor: 'rgba(85, 185, 232, 0.1)',
  },
  sourceBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeBadgeText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  loggedItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginTop: 1,
  },
  loggedItemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loggedMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  loggedMacroPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loggedMacroDot: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  deleteFoodBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modals Shared
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
  modalCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  desktopModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderRadius: RADIUS.lg,
  },
  mobileModalCard: {
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
  modalSub: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: SPACING.md,
    maxHeight: 460,
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  servingDescText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  multiplierRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  multiplierPill: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierPillActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  multiplierPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  multiplierPillTextActive: {
    color: '#080A0C',
  },
  customServingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  customServingInputLabel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  customServingTextInput: {
    width: 70,
    height: 38,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  customServingSuffix: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  previewBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: 4,
  },
  previewBoxTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  previewMetricsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  previewMetricItem: {
    flex: 1,
    gap: 2,
  },
  previewMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  previewMetricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  previewMetricUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
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
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.4,
  },
  formGroup: {
    marginBottom: SPACING.md,
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  formTextInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  customMacroGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  customMacroCol: {
    flex: 1,
    gap: 4,
  },
  customMacroColLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  customMacroInput: {
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
});
