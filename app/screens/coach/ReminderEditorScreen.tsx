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
} from 'react-native';
import { ArrowLeft, Bell, Plus, Trash2 } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useReminders, useCreateReminder, useDeleteReminder } from '../../lib/queries/reminders';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';

export const ReminderEditorScreen: React.FC = () => {
  const { themeMode, selectedClientId, setCoachActiveTab, user } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const { data: reminders } = useReminders(selectedClientId);
  const createReminderMutation = useCreateReminder();
  const deleteReminderMutation = useDeleteReminder();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00 AM');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreateReminder = () => {
    if (!title.trim() || !message.trim()) return;

    createReminderMutation.mutate({
      client_id: selectedClientId,
      coach_id: user?.id || '',
      title,
      message,
      scheduled_time: scheduledTime,
      recurring_days: selectedDays,
      is_active: true,
    });

    setTitle('');
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setCoachActiveTab('client-detail')}
          style={styles.backBtn}
        >
          <ArrowLeft size={14} color="#94A3B8" />
          <Text style={styles.backText}>Client</Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Client Reminders</Text>
      </View>

      {/* New Reminder Form */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={styles.formTitleRow}>
          <Bell size={16} color="#CCFF00" />
          <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Schedule Push Reminder</Text>
        </View>

        <Text style={styles.label}>REMINDER TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Morning Water Check-in"
          placeholderTextColor="#64748B"
          style={styles.input}
        />

        <Text style={styles.label}>PUSH NOTIFICATION MESSAGE</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="e.g. Drink 16oz water and log weight."
          placeholderTextColor="#64748B"
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>SCHEDULED TIME</Text>
            <TextInput
              value={scheduledTime}
              onChangeText={setScheduledTime}
              placeholder="08:00 AM"
              placeholderTextColor="#64748B"
              style={[styles.input, { color: '#CCFF00', fontWeight: '800' }]}
            />
          </View>
        </View>

        <Text style={styles.label}>RECURRING DAYS</Text>
        <View style={styles.daysRow}>
          {daysList.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => toggleDay(day)}
              style={[
                styles.dayPill,
                selectedDays.includes(day)
                  ? styles.dayPillActive
                  : styles.dayPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDays.includes(day) ? styles.dayTextActive : styles.dayTextInactive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleCreateReminder} style={styles.createBtn} activeOpacity={0.85}>
          <Plus size={16} color="#0F172A" />
          <Text style={styles.createBtnText}>Schedule Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Existing Reminders List */}
      <Text style={styles.sectionLabel}>ACTIVE SCHEDULED REMINDERS</Text>
      <View style={{ gap: 8 }}>
        {(reminders || []).map((rem) => (
          <View key={rem.id} style={styles.remCard}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.remTime}>{rem.scheduled_time}</Text>
                <Text style={styles.remTitle}>{rem.title}</Text>
              </View>
              <Text style={styles.remMsg}>{rem.message}</Text>
              <View style={styles.remDaysRow}>
                {rem.recurring_days.map((d) => (
                  <View key={d} style={styles.miniDayPill}>
                    <Text style={styles.miniDayText}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => deleteReminderMutation.mutate({ id: rem.id, clientId: selectedClientId })}
              style={styles.trashBtn}
            >
              <Trash2 size={16} color="#FB7185" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  backText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  card: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  input: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayPillActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  dayPillInactive: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
  },
  dayText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dayTextActive: {
    color: '#0F172A',
  },
  dayTextInactive: {
    color: '#64748B',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#CCFF00',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 6,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  remCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
  },
  remTime: {
    fontSize: 11,
    fontWeight: '900',
    color: '#CCFF00',
  },
  remTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  remMsg: {
    fontSize: 11,
    color: '#94A3B8',
  },
  remDaysRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  miniDayPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#090D16',
  },
  miniDayText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
  },
  trashBtn: {
    padding: 6,
  },
});
