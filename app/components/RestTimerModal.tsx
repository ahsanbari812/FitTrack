import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Timer, X, Play, Pause, RotateCcw, Plus, Check } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/theme';

interface RestTimerModalProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds = 60,
  isOpen,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    if (!isOpen || !isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isRunning, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <X size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Timer size={22} color={COLORS.brand} />
          </View>

          <Text style={styles.title}>REST INTERVAL</Text>
          <Text style={styles.subtitle}>Recovery before next working set</Text>

          <Text style={[styles.timerText, timeLeft === 0 ? styles.completeText : null]}>
            {formattedTime}
          </Text>

          {timeLeft === 0 && (
            <View style={styles.badge}>
              <Check size={14} color={COLORS.brand} />
              <Text style={styles.badgeText}>Rest complete • Ready for next set</Text>
            </View>
          )}

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setTimeLeft((prev) => prev + 30)}
              activeOpacity={0.8}
            >
              <Plus size={14} color={COLORS.textPrimary} />
              <Text style={styles.actionText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setIsRunning(!isRunning)}
              activeOpacity={0.85}
            >
              {isRunning ? <Pause size={18} color="#080A0C" /> : <Play size={18} color="#080A0C" />}
              <Text style={styles.primaryText}>{isRunning ? 'Pause' : 'Resume'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setTimeLeft(initialSeconds);
                setIsRunning(true);
              }}
              activeOpacity={0.8}
            >
              <RotateCcw size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    marginVertical: SPACING.sm,
  },
  completeText: {
    color: COLORS.brand,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
    marginBottom: SPACING.md,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  primaryButton: {
    flex: 2,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080A0C',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
