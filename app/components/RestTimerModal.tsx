import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Timer, X, Play, Pause, RotateCcw, Plus, Check } from 'lucide-react-native';
import { useUIStore } from '../lib/store';
import { LIGHT_THEME, DARK_THEME } from '../theme/theme';

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
  const { themeMode } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

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
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Timer size={28} color="#CCFF00" />
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>Rest Timer</Text>
          <Text style={styles.subtitle}>Catch your breath before your next set</Text>

          <Text style={[styles.timerText, timeLeft === 0 ? styles.completeText : null]}>
            {formattedTime}
          </Text>

          {timeLeft === 0 && (
            <View style={styles.badge}>
              <Check size={14} color="#CCFF00" />
              <Text style={styles.badgeText}>Rest Complete! Ready for Next Set!</Text>
            </View>
          )}

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setTimeLeft((prev) => prev + 30)}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.actionText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause size={18} color="#0F172A" /> : <Play size={18} color="#0F172A" />}
              <Text style={styles.primaryText}>{isRunning ? 'Pause' : 'Start'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setTimeLeft(initialSeconds);
                setIsRunning(true);
              }}
            >
              <RotateCcw size={18} color="#CBD5E1" />
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginVertical: 12,
  },
  completeText: {
    color: '#CCFF00',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCFF00',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#CCFF00',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  iconButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
});
