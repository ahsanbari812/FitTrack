import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Plus,
  Trash2,
  Clock,
  Pencil,
  X,
  Check,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from '../../lib/queries/reminders';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
import { Reminder } from '../../types/database';

const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ReminderEditorScreen: React.FC = () => {
  const { selectedClientId, setCoachActiveTab, user } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();

  const { data: reminders } = useReminders(selectedClientId);
  const createReminderMutation = useCreateReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  // Modal / Bottom Sheet State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00 AM');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [isActive, setIsActive] = useState(true);

  // Focused state for lime border
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleOpenCreateModal = () => {
    setEditingReminderId(null);
    setTitle('');
    setMessage('');
    setScheduledTime('08:00 AM');
    setSelectedDays(['Mon', 'Wed', 'Fri']);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reminder: Reminder) => {
    setEditingReminderId(reminder.id);
    setTitle(reminder.title);
    setMessage(reminder.message);
    setScheduledTime(reminder.scheduled_time);
    setSelectedDays(reminder.recurring_days || ['Mon', 'Wed', 'Fri']);
    setIsActive(reminder.is_active);
    setIsModalOpen(true);
  };

  const handleSaveReminder = () => {
    if (!title.trim() || !message.trim()) return;

    if (editingReminderId) {
      updateReminderMutation.mutate({
        id: editingReminderId,
        updates: {
          title: title.trim(),
          message: message.trim(),
          scheduled_time: scheduledTime.trim() || '08:00 AM',
          recurring_days: selectedDays.length > 0 ? selectedDays : ['Mon'],
          is_active: isActive,
        },
      });
    } else {
      createReminderMutation.mutate({
        client_id: selectedClientId,
        coach_id: user?.id || '',
        title: title.trim(),
        message: message.trim(),
        scheduled_time: scheduledTime.trim() || '08:00 AM',
        recurring_days: selectedDays.length > 0 ? selectedDays : ['Mon'],
        is_active: isActive,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleActiveState = (reminder: Reminder) => {
    updateReminderMutation.mutate({
      id: reminder.id,
      updates: { is_active: !reminder.is_active },
    });
  };

  const handleDeleteReminder = (id: string) => {
    deleteReminderMutation.mutate({ id, clientId: selectedClientId });
    if (editingReminderId === id) {
      setIsModalOpen(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'height' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: isDesktop ? LAYOUT.paddingDesktop : LAYOUT.paddingMobile,
            paddingBottom: isDesktop ? SPACING.xxl : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={[styles.innerWrapper, isDesktop && styles.desktopInnerWrapper]}>
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setCoachActiveTab('client-detail')}
              style={styles.backBtn}
              activeOpacity={0.75}
            >
              <ArrowLeft size={16} color={COLORS.brand} />
              <Text style={styles.backBtnText}>ATHLETE</Text>
            </TouchableOpacity>

            <View style={styles.headerTitlesRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.headerKicker}>ACCOUNTABILITY PROTOCOL</Text>
                <Text style={styles.screenTitle}>REMINDERS</Text>
                <Text style={styles.screenSubtitle}>
                  Keep athlete accountability on schedule.
                </Text>
              </View>

              {/* Desktop Top-Right Add CTA */}
              {isDesktop && (
                <TouchableOpacity
                  onPress={handleOpenCreateModal}
                  style={styles.desktopAddBtn}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color="#080A0C" strokeWidth={2.4} />
                  <Text style={styles.desktopAddBtnText}>ADD REMINDER</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Mobile Add CTA Button */}
          {!isDesktop && (
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              style={styles.mobileAddBtn}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#080A0C" strokeWidth={2.4} />
              <Text style={styles.mobileAddBtnText}>ADD REMINDER</Text>
            </TouchableOpacity>
          )}

          {/* ================= REMINDER LIST ================= */}
          <View style={styles.remindersSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>ACTIVE REMINDERS</Text>
              <Text style={styles.sectionCount}>
                {(reminders || []).length} Scheduled
              </Text>
            </View>

            <View style={styles.remindersTable}>
              {(!reminders || reminders.length === 0) ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Bell size={28} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>NO REMINDERS SCHEDULED</Text>
                  <Text style={styles.emptySubtitle}>
                    Create push notification reminders to keep your athlete consistent with check-ins, hydration, and nutrition logs.
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenCreateModal}
                    style={styles.emptyAddBtn}
                    activeOpacity={0.85}
                  >
                    <Plus size={15} color="#080A0C" strokeWidth={2.4} />
                    <Text style={styles.emptyAddBtnText}>CREATE FIRST REMINDER</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                reminders.map((rem, index) => {
                  const isLast = index === reminders.length - 1;

                  return (
                    <View
                      key={rem.id}
                      style={[styles.reminderRow, !isLast && styles.reminderRowBorder]}
                    >
                      {/* Bell Icon Box */}
                      <View
                        style={[
                          styles.bellBox,
                          rem.is_active ? styles.bellBoxActive : styles.bellBoxInactive,
                        ]}
                      >
                        <Bell
                          size={16}
                          color={rem.is_active ? COLORS.brand : COLORS.textMuted}
                        />
                      </View>

                      {/* Content Column */}
                      <View style={styles.reminderContentCol}>
                        <View style={styles.reminderTitleRow}>
                          <Text style={styles.reminderTitle} numberOfLines={1}>
                            {rem.title}
                          </Text>
                          <View style={styles.timeBadge}>
                            <Clock size={11} color={rem.is_active ? COLORS.brand : COLORS.textMuted} />
                            <Text
                              style={[
                                styles.timeBadgeText,
                                rem.is_active && { color: COLORS.brand },
                              ]}
                            >
                              {rem.scheduled_time}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.reminderMessage} numberOfLines={2}>
                          {rem.message}
                        </Text>

                        {/* Recurring Days Chips */}
                        <View style={styles.recurringDaysRow}>
                          {rem.recurring_days && rem.recurring_days.length > 0 ? (
                            rem.recurring_days.map((day) => (
                              <View key={day} style={styles.miniDayChip}>
                                <Text style={styles.miniDayText}>{day}</Text>
                              </View>
                            ))
                          ) : (
                            <View style={styles.miniDayChip}>
                              <Text style={styles.miniDayText}>Daily</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Right Controls: Active Toggle & Edit & Delete */}
                      <View style={styles.reminderRightControls}>
                        {/* Active Toggle */}
                        <TouchableOpacity
                          onPress={() => handleToggleActiveState(rem)}
                          style={[
                            styles.activeTogglePill,
                            rem.is_active
                              ? styles.activeTogglePillActive
                              : styles.activeTogglePillInactive,
                          ]}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              styles.activeIndicatorDot,
                              rem.is_active
                                ? styles.indicatorActive
                                : styles.indicatorInactive,
                            ]}
                          />
                          <Text
                            style={[
                              styles.activeToggleText,
                              rem.is_active
                                ? styles.activeToggleTextActive
                                : styles.activeToggleTextInactive,
                            ]}
                          >
                            {rem.is_active ? 'ACTIVE' : 'PAUSED'}
                          </Text>
                        </TouchableOpacity>

                        {/* Edit Action */}
                        <TouchableOpacity
                          onPress={() => handleOpenEditModal(rem)}
                          style={styles.actionBtn}
                          activeOpacity={0.7}
                        >
                          <Pencil size={14} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {/* Delete Action (Subtle Red #FF5C5C) */}
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(rem.id)}
                          style={styles.actionDeleteBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={14} color="#FF5C5C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================= EDITOR MODAL / BOTTOM SHEET ================= */}
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
              isDesktop ? styles.desktopModalOverlay : styles.mobileSheetOverlay,
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContentCard,
                  isDesktop
                    ? styles.desktopModalContentCard
                    : styles.mobileSheetContentCard,
                ]}
              >
                {!isDesktop && <View style={styles.mobileSheetHandle} />}

                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalHeading}>
                      {editingReminderId ? 'EDIT REMINDER' : 'NEW REMINDER'}
                    </Text>
                    <Text style={styles.modalSubheading}>
                      Set notification cues to reinforce athlete daily habits.
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsModalOpen(false)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Modal Body Form */}
                <ScrollView
                  style={styles.modalFormScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.formFieldsStack}>
                    {/* TITLE */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.fieldLabel}>TITLE</Text>
                      <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Morning Water & Weight Check-in"
                        placeholderTextColor={COLORS.textMuted}
                        onFocus={() => setFocusedField('title')}
                        onBlur={() => setFocusedField(null)}
                        style={[
                          styles.formInput,
                          focusedField === 'title' && styles.formInputFocused,
                        ]}
                      />
                    </View>

                    {/* MESSAGE */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.fieldLabel}>MESSAGE</Text>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="e.g. Drink 1L water and submit today's body weight."
                        placeholderTextColor={COLORS.textMuted}
                        onFocus={() => setFocusedField('message')}
                        onBlur={() => setFocusedField(null)}
                        style={[
                          styles.formInput,
                          focusedField === 'message' && styles.formInputFocused,
                        ]}
                      />
                    </View>

                    {/* TIME & ACTIVE STATUS ROW */}
                    <View style={styles.twoColRow}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.fieldLabel}>TIME</Text>
                        <TextInput
                          value={scheduledTime}
                          onChangeText={setScheduledTime}
                          placeholder="08:00 AM"
                          placeholderTextColor={COLORS.textMuted}
                          onFocus={() => setFocusedField('time')}
                          onBlur={() => setFocusedField(null)}
                          style={[
                            styles.formInput,
                            focusedField === 'time' && styles.formInputFocused,
                          ]}
                        />
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.fieldLabel}>ACTIVE STATUS</Text>
                        <TouchableOpacity
                          onPress={() => setIsActive((prev) => !prev)}
                          style={[
                            styles.formActiveBtn,
                            isActive
                              ? styles.formActiveBtnActive
                              : styles.formActiveBtnInactive,
                          ]}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.activeIndicatorDot,
                              isActive ? styles.indicatorActive : styles.indicatorInactive,
                            ]}
                          />
                          <Text
                            style={[
                              styles.formActiveBtnText,
                              isActive && styles.formActiveBtnTextActive,
                            ]}
                          >
                            {isActive ? 'ENABLED' : 'PAUSED'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* RECURRING DAYS */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.fieldLabel}>RECURRING DAYS</Text>
                      <View style={styles.chipsContainer}>
                        {DAYS_LIST.map((day) => {
                          const isSelected = selectedDays.includes(day);

                          return (
                            <TouchableOpacity
                              key={day}
                              onPress={() => toggleDay(day)}
                              style={[
                                styles.dayChip,
                                isSelected ? styles.dayChipSelected : styles.dayChipUnselected,
                              ]}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.dayChipText,
                                  isSelected
                                    ? styles.dayChipTextSelected
                                    : styles.dayChipTextUnselected,
                                ]}
                              >
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Modal Bottom Actions */}
                    <View style={styles.modalActionButtonsRow}>
                      {editingReminderId && (
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(editingReminderId)}
                          style={styles.modalDeleteBtn}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={16} color="#FF5C5C" />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={handleSaveReminder}
                        style={styles.modalSaveBtn}
                        activeOpacity={0.85}
                      >
                        <Check size={16} color="#080A0C" strokeWidth={2.4} />
                        <Text style={styles.modalSaveBtnText}>
                          {editingReminderId ? 'UPDATE REMINDER' : 'SCHEDULE REMINDER'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
  innerWrapper: {
    width: '100%',
    gap: SPACING.lg,
  },
  desktopInnerWrapper: {
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },

  // Header
  header: {
    gap: SPACING.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.2,
  },
  headerTitlesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  desktopAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  desktopAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },
  mobileAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    height: 48,
    borderRadius: RADIUS.sm,
  },
  mobileAddBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },

  // Reminders Section
  remindersSection: {
    gap: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Reminders Table (Clean Horizontal Rows)
  remindersTable: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  reminderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bellBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bellBoxActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  bellBoxInactive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  reminderContentCol: {
    flex: 1,
    gap: 4,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  reminderMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  recurringDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  miniDayChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniDayText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  reminderRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  activeTogglePillActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  activeTogglePillInactive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  activeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    backgroundColor: COLORS.brand,
  },
  indicatorInactive: {
    backgroundColor: COLORS.textMuted,
  },
  activeToggleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeToggleTextActive: {
    color: COLORS.brand,
  },
  activeToggleTextInactive: {
    color: COLORS.textMuted,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 92, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyCard: {
    padding: 36,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 400,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },

  // Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  desktopModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mobileSheetOverlay: {
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  desktopModalContentCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '85%',
    borderRadius: RADIUS.xl,
    padding: 24,
  },
  mobileSheetContentCard: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 20,
    paddingBottom: 36,
  },
  mobileSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  modalSubheading: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFormScroll: {
    maxHeight: 460,
  },
  formFieldsStack: {
    gap: 14,
  },
  formFieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  formInput: {
    height: 50,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  formInputFocused: {
    borderColor: COLORS.brand,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formActiveBtn: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  formActiveBtnActive: {
    borderColor: 'rgba(199, 240, 0, 0.3)',
    backgroundColor: 'rgba(199, 240, 0, 0.06)',
  },
  formActiveBtnInactive: {
    borderColor: COLORS.border,
  },
  formActiveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  formActiveBtnTextActive: {
    color: COLORS.brand,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  dayChipSelected: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  dayChipUnselected: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayChipTextSelected: {
    color: '#080A0C',
  },
  dayChipTextUnselected: {
    color: COLORS.textSecondary,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  modalDeleteBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 92, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },
});
