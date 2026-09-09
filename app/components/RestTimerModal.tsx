import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { X, Play, Pause, RotateCcw, Plus } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface RestTimerModalProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

const RING_SIZE = 224;
const STROKE_WIDTH = 10;
const RADIUS_VAL = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_VAL;

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds = 60,
  isOpen,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  // Entrance animation: subtle fade + translateY (180ms, no bounce)
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setTotalSeconds(initialSeconds);
      setTimeLeft(initialSeconds);
      setIsRunning(true);

      enterAnim.setValue(0);
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [initialSeconds, isOpen, enterAnim]);

  useEffect(() => {
    if (!isOpen || !isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isRunning, timeLeft]);

  if (!isOpen) return null;

  // Time calculations
  const minutes = Math.floor(Math.max(0, timeLeft) / 60);
  const seconds = Math.max(0, timeLeft) % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Ring Progress Calculation (Depleting clockwise)
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalSeconds)) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Handlers
  const handleToggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  const handleAdd30Sec = () => {
    setTimeLeft((prev) => prev + 30);
    setTotalSeconds((prev) => Math.max(prev, timeLeft + 30));
  };

  const handleReset = () => {
    setTimeLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    setIsRunning(true);
  };

  const translateY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDesktop ? 12 : 60, 0],
  });

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, isDesktop ? styles.desktopOverlay : styles.mobileOverlay]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                isDesktop ? styles.desktopCard : styles.mobileSheet,
                {
                  paddingBottom: isDesktop ? 28 : Math.max(insets.bottom, 24),
                  opacity: enterAnim,
                  transform: [{ translateY }],
                },
              ]}
            >
              {/* Mobile Drag Handle */}
              {!isDesktop && <View style={styles.dragHandle} />}

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitlesCol}>
                  <Text style={styles.headerTitle}>REST TIMER</Text>
                  <Text style={styles.headerSubtitle}>RECOVER FOR THE NEXT SET</Text>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Circular Progress Ring & Large Countdown */}
              <View style={styles.ringWrapper}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  {/* Background Track */}
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS_VAL}
                    stroke="#252B31"
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                  />
                  {/* Depleting Progress */}
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS_VAL}
                    stroke="#C7F000"
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </Svg>

                {/* Central Countdown Number */}
                <View style={styles.ringCenterOverlay}>
                  <Text style={styles.countdownNumber}>{formattedTime}</Text>
                  <Text style={styles.countdownStateText}>
                    {timeLeft === 0
                      ? 'REST COMPLETE'
                      : isRunning
                      ? 'REMAINING'
                      : 'PAUSED'}
                  </Text>
                </View>
              </View>

              {/* Controls */}
              <View style={styles.controlsContainer}>
                {/* Primary Button: PAUSE or RESUME */}
                <TouchableOpacity
                  onPress={handleToggleRunning}
                  style={styles.primaryBtn}
                  activeOpacity={0.85}
                >
                  {isRunning ? (
                    <Pause size={18} color="#080A0C" strokeWidth={2.6} />
                  ) : (
                    <Play size={18} color="#080A0C" strokeWidth={2.6} fill="#080A0C" />
                  )}
                  <Text style={styles.primaryBtnText}>
                    {isRunning ? 'PAUSE' : 'RESUME'}
                  </Text>
                </TouchableOpacity>

                {/* Secondary & Tertiary Action Row */}
                <View style={styles.secondaryRow}>
                  {/* Secondary: +30 SEC */}
                  <TouchableOpacity
                    onPress={handleAdd30Sec}
                    style={styles.secondaryBtn}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color={COLORS.brand} strokeWidth={2.5} />
                    <Text style={styles.secondaryBtnText}>+30 SEC</Text>
                  </TouchableOpacity>

                  {/* Tertiary: RESET */}
                  <TouchableOpacity
                    onPress={handleReset}
                    style={styles.tertiaryBtn}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={15} color={COLORS.textSecondary} strokeWidth={2.2} />
                    <Text style={styles.tertiaryBtnText}>RESET</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  desktopOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  mobileOverlay: {
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#111519',
    borderWidth: 1,
    borderColor: '#252B31',
    alignItems: 'center',
  },
  desktopCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  mobileSheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingHorizontal: 24,
  },

  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#252B31',
    alignSelf: 'center',
    marginBottom: 14,
  },

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitlesCol: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Circular Ring Container
  ringWrapper: {
    position: 'relative',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  ringCenterOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#F5F7F8',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  countdownStateText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 1,
  },

  // Controls Layout
  controlsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: '#C7F000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  tertiaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tertiaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
});
