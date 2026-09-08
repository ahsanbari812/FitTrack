import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
}

const COLORS = {
  black: '#050606',
  white: '#F5F7F6',
  lime: '#C8F000',
  muted: '#6F777A',
};

const useNativeDriver = Platform.OS !== 'web';
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * FITTRACK — MINIMAL SIGNATURE SPLASH
 *
 * Design direction:
 * - No orbitals
 * - No HUD
 * - No fake progress
 * - No particle explosion
 * - No unnecessary copy
 *
 * The animation is intentionally restrained:
 *
 *  0.00s  Near-black canvas
 *  0.18s  A single lime signal appears
 *  0.35s  The mark resolves
 *  0.65s  Signature line sweeps through
 *  0.85s  FITTRACK wordmark enters
 *  1.15s  Everything settles into a quiet breathing state
 *  1.15s+ Wait for real app readiness
 *
 * The goal is closer to a premium sports/luxury product identity
 * than a sci-fi loading screen.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  isReady,
  onFinish,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [reducedMotion, setReducedMotion] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  const hasFinished = useRef(false);
  const breathingAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // ------------------------------------------------------------
  // MASTER
  // ------------------------------------------------------------
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(0.985)).current;

  // ------------------------------------------------------------
  // ATMOSPHERE
  // ------------------------------------------------------------
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.72)).current;
  const ambientPulse = useRef(new Animated.Value(0)).current;

  // ------------------------------------------------------------
  // SINGLE SIGNAL
  // ------------------------------------------------------------
  const signalOpacity = useRef(new Animated.Value(0)).current;
  const signalScale = useRef(new Animated.Value(0.2)).current;

  // ------------------------------------------------------------
  // MARK
  // ------------------------------------------------------------
  const markOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0.82)).current;
  const markY = useRef(new Animated.Value(8)).current;

  // ------------------------------------------------------------
  // SIGNATURE LINE
  // ------------------------------------------------------------
  const lineScale = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;

  // ------------------------------------------------------------
  // WORDMARK
  // ------------------------------------------------------------
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(10)).current;
  const wordScale = useRef(new Animated.Value(0.985)).current;

  // ------------------------------------------------------------
  // MICRO LABEL
  // ------------------------------------------------------------
  const microOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      setReducedMotion(media?.matches ?? false);

      const listener = (event: MediaQueryListEvent) =>
        setReducedMotion(event.matches);

      media?.addEventListener?.('change', listener);

      return () => media?.removeEventListener?.('change', listener);
    }

    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );

    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      glowOpacity.setValue(1);
      glowScale.setValue(1);
      signalOpacity.setValue(0);
      signalScale.setValue(1);
      markOpacity.setValue(1);
      markScale.setValue(1);
      markY.setValue(0);
      lineOpacity.setValue(1);
      lineScale.setValue(1);
      wordOpacity.setValue(1);
      wordY.setValue(0);
      wordScale.setValue(1);
      microOpacity.setValue(0.65);
      setIntroFinished(true);
      return;
    }

    const intro = Animated.sequence([
      // ----------------------------------------------------------
      // 01 — ONE SIGNAL
      // ----------------------------------------------------------
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.78,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 760,
          easing: easeOut,
          useNativeDriver,
        }),
        Animated.timing(signalOpacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.spring(signalScale, {
          toValue: 1,
          friction: 8,
          tension: 110,
          useNativeDriver,
        }),
      ]),

      // ----------------------------------------------------------
      // 02 — MARK RESOLVES
      // ----------------------------------------------------------
      Animated.parallel([
        Animated.timing(markOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.spring(markScale, {
          toValue: 1,
          friction: 8,
          tension: 105,
          useNativeDriver,
        }),
        Animated.timing(markY, {
          toValue: 0,
          duration: 380,
          easing: easeOut,
          useNativeDriver,
        }),
        Animated.timing(signalOpacity, {
          toValue: 0,
          duration: 280,
          delay: 80,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.42,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
      ]),

      // ----------------------------------------------------------
      // 03 — SIGNATURE SWEEP
      // A single horizontal line is enough. No circles.
      // ----------------------------------------------------------
      Animated.parallel([
        Animated.timing(lineOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver,
        }),
        Animated.timing(lineScale, {
          toValue: 1,
          duration: 430,
          easing: easeOut,
          useNativeDriver,
        }),
      ]),

      // ----------------------------------------------------------
      // 04 — WORDMARK
      // ----------------------------------------------------------
      Animated.parallel([
        Animated.timing(wordOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(wordY, {
          toValue: 0,
          duration: 430,
          easing: easeOut,
          useNativeDriver,
        }),
        Animated.timing(wordScale, {
          toValue: 1,
          duration: 430,
          easing: easeOut,
          useNativeDriver,
        }),
        Animated.timing(microOpacity, {
          toValue: 0.65,
          duration: 260,
          delay: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.25,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
      ]),

      // Give the identity a moment to breathe before handoff.
      Animated.delay(420),
    ]);

    intro.start(({ finished }) => {
      if (finished) setIntroFinished(true);
    });

    return () => intro.stop();
  }, [reducedMotion]);

  useEffect(() => {
    if (!introFinished) return;

    // Once the intro is complete, do NOT restart it while the app
    // finishes booting. Hold a barely perceptible ambient pulse.
    if (!isReady && !reducedMotion && !breathingAnimation.current) {
      breathingAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(ambientPulse, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver,
          }),
          Animated.timing(ambientPulse, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver,
          }),
        ]),
      );

      breathingAnimation.current.start();
    }

    if (isReady && !hasFinished.current) {
      hasFinished.current = true;
      breathingAnimation.current?.stop();

      // The mark subtly moves toward the user as the app takes over.
      Animated.parallel([
        Animated.timing(contentScale, {
          toValue: 1.025,
          duration: 330,
          easing: easeOut,
          useNativeDriver,
        }),
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 300,
          delay: 40,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
      ]).start(() => onFinish());
    }
  }, [introFinished, isReady, reducedMotion, onFinish]);

  const markSize =
    Math.min(width, height) < 380
      ? 82
      : Math.min(width, height) < 700
        ? 92
        : 104;

  const glowSize = markSize * 2.55;

  const glowBreathingOpacity = Animated.add(
    Animated.multiply(glowOpacity, 0.92),
    Animated.multiply(ambientPulse, 0.08),
  );

  return (
    <Animated.View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          opacity: screenOpacity,
        },
      ]}
      pointerEvents="none"
      accessibilityRole="image"
      accessibilityLabel="FitTrack"
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* ----------------------------------------------------------
          ATMOSPHERIC LIGHT
          Almost invisible. It exists to give the black canvas depth.
      ----------------------------------------------------------- */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            opacity: glowBreathingOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: contentScale }],
          },
        ]}
      >
        {/* --------------------------------------------------------
            BRAND MARK
        --------------------------------------------------------- */}
        <View
          style={[
            styles.markArea,
            {
              width: markSize,
              height: markSize,
            },
          ]}
        >
          {/* Tiny initial signal */}
          <Animated.View
            style={[
              styles.signal,
              {
                opacity: signalOpacity,
                transform: [{ scale: signalScale }],
              },
            ]}
          />

          {/* Mark */}
          <Animated.View
            style={[
              styles.mark,
              {
                width: markSize,
                height: markSize,
                borderRadius: markSize * 0.24,
                opacity: markOpacity,
                transform: [
                  { translateY: markY },
                  { scale: markScale },
                ],
              },
            ]}
          >
            <Dumbbell
              size={Math.round(markSize * 0.46)}
              color={COLORS.lime}
              strokeWidth={2.15}
            />
          </Animated.View>
        </View>

        {/* --------------------------------------------------------
            SIGNATURE LINE
            A tiny brand gesture rather than a decorative effect.
        --------------------------------------------------------- */}
        <Animated.View
          style={[
            styles.signatureLine,
            {
              opacity: lineOpacity,
              transform: [{ scaleX: lineScale }],
            },
          ]}
        />

        {/* --------------------------------------------------------
            WORDMARK
        --------------------------------------------------------- */}
        <Animated.View
          style={[
            styles.wordmark,
            {
              opacity: wordOpacity,
              transform: [
                { translateY: wordY },
                { scale: wordScale },
              ],
            },
          ]}
        >
          <Text style={styles.brand}>
            FIT<Text style={styles.brandAccent}>TRACK</Text>
          </Text>

          <Animated.Text
            style={[
              styles.micro,
              {
                opacity: microOpacity,
              },
            ]}
          >
            1—ON—1 COACHING
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 999999,
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  ambientGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(200,240,0,0.035)',
    shadowColor: COLORS.lime,
    shadowOpacity: 0.24,
    shadowRadius: 70,
    shadowOffset: { width: 0, height: 0 },
  },

  markArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  signal: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.lime,
    shadowColor: COLORS.lime,
    shadowOpacity: 0.95,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },

  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0D0E',
    borderWidth: 1,
    borderColor: 'rgba(200,240,0,0.22)',
    shadowColor: COLORS.lime,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  signatureLine: {
    width: 42,
    height: 1,
    marginTop: 24,
    backgroundColor: COLORS.lime,
    transformOrigin: 'center',
    shadowColor: COLORS.lime,
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },

  wordmark: {
    alignItems: 'center',
    marginTop: 12,
  },

  brand: {
    color: COLORS.white,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    textAlign: 'center',
    fontFamily:
      Platform.OS === 'web'
        ? "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif"
        : undefined,
  },

  brandAccent: {
    color: COLORS.lime,
  },

  micro: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '700',
    letterSpacing: 2.3,
    textAlign: 'center',
    fontFamily:
      Platform.OS === 'web'
        ? "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif"
        : undefined,
  },
});
