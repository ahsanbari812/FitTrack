import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  Image,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface SplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ isReady, onFinish }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(10)).current;

  const progressBar = useRef(new Animated.Value(0)).current;
  const bottomBarOpacity = useRef(new Animated.Value(0)).current;

  // Master transition for smooth handoff to Login screen
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const screenFadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance Sequence
    Animated.sequence([
      // Stage 1: Official Logo Spring (0.7s)
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),

      // Stage 2: FITTRACK Brand Title Slide & Fade (0.5s)
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),

      // Stage 3: Tagline & Progress Bar Charging (1.3s)
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(bottomBarOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(progressBar, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),

      // Brief pause to admire the visual (0.4s)
      Animated.delay(400),
    ]).start(() => {
      // Stage 4: Seamless Morphed Transition into Login Screen
      Animated.parallel([
        Animated.timing(bottomBarOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        // Animate Header upward to match LoginScreen position
        Animated.timing(headerTranslateY, {
          toValue: -height * 0.15,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        Animated.timing(headerScale, {
          toValue: 0.9,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        // Overall crossfade
        Animated.timing(screenFadeOut, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]).start(() => {
        onFinish();
      });
    });
  }, []);

  const progressWidth = progressBar.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenFadeOut,
        },
      ]}
      pointerEvents="none"
    >
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* Main Center Emblem */}
      <View style={styles.centerContainer}>
        {/* Morphing Header Unit (Logo + Brand + Tagline completely inside) */}
        <Animated.View
          style={[
            styles.morphHeader,
            {
              transform: [
                { translateY: headerTranslateY },
                { scale: headerScale },
              ],
            },
          ]}
        >
          {/* Official App Logo Image */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../../assets/app-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Brand Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.brandTitle}>
              FIT<Text style={styles.neonText}>TRACK</Text>
            </Text>
          </Animated.View>

          {/* Tagline / Motto - Cleanly Centered Inside the Circle */}
          <Animated.View
            style={[
              styles.subtitleContainer,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              },
            ]}
          >
            <Text style={styles.brandMotto} numberOfLines={1}>
              PERFORMANCE  •  NUTRITION  •  DISCIPLINE
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Bottom Progress Bar & Indicator */}
      <Animated.View
        style={[
          styles.bottomBarContainer,
          { opacity: bottomBarOpacity },
        ]}
      >
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <View style={styles.footerRow}>
          <Sparkles size={12} color="#CCFF00" />
          <Text style={styles.footerText} numberOfLines={1}>
            HIGH-PERFORMANCE COACHING
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    width,
    height,
  },
  centerContainer: {
    width: 340,
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morphHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingHorizontal: 16,
  },
  logoWrapper: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 24,
  },
  titleContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  neonText: {
    color: '#CCFF00',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  brandMotto: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#94A3B8',
    textAlign: 'center',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 50,
    width: width * 0.7,
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    width: '100%',
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#1E293B',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
  },
});
