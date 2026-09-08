import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Circle,
} from 'react-native-svg';
import {
  Check,
  ShieldCheck,
  CircleAlert as AlertCircle,
  Dumbbell,
  Sparkles,
  TrendingUp,
  UserCheck,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '../../lib/store';
import { DARK_THEME } from '../../theme/theme';
import { supabase } from '../../lib/supabase';
import { GoogleIcon } from '../../components/GoogleIcon';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export const LoginScreen: React.FC = () => {
  const { setUser } = useUIStore();
  const theme = DARK_THEME;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;
  const isTablet = width >= 640 && width < 900;
  const isMobile = width < 640;

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGoogleHovered, setIsGoogleHovered] = useState(false);

  // Motion values
  const heroAnim = useRef(new Animated.Value(0)).current;
  const visualAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(visualAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem('fittrack_splash_seen', '1');
        }
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              prompt: 'select_account',
              access_type: 'offline',
            },
          },
        });
        if (error) throw error;
        // On web, the browser will seamlessly redirect to Google login and return
        return;
      }

      // Android Native flow:
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'fittrack' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          const urlParts = result.url.includes('#')
            ? result.url.split('#')[1]
            : result.url.includes('?')
              ? result.url.split('?')[1]
              : '';

          const params = new URLSearchParams(urlParts);
          const code = params.get('code');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (code) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (sessionError) throw sessionError;
            if (sessionData?.user) {
              const hasConfirmedName =
                sessionData.user.user_metadata?.has_set_name === true;
              setUser({
                id: sessionData.user.id,
                email: sessionData.user.email || '',
                name: hasConfirmedName
                  ? sessionData.user.user_metadata?.full_name || ''
                  : '',
                suggestedName:
                  sessionData.user.user_metadata?.full_name ||
                  sessionData.user.user_metadata?.name ||
                  '',
                avatar:
                  sessionData.user.user_metadata?.avatar_url ||
                  sessionData.user.user_metadata?.picture,
                hasSetName: hasConfirmedName,
              });
              return;
            }
          } else if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            if (sessionError) throw sessionError;
            if (sessionData?.user) {
              const hasConfirmedName =
                sessionData.user.user_metadata?.has_set_name === true;
              setUser({
                id: sessionData.user.id,
                email: sessionData.user.email || '',
                name: hasConfirmedName
                  ? sessionData.user.user_metadata?.full_name || ''
                  : '',
                suggestedName:
                  sessionData.user.user_metadata?.full_name ||
                  sessionData.user.user_metadata?.name ||
                  '',
                avatar:
                  sessionData.user.user_metadata?.avatar_url ||
                  sessionData.user.user_metadata?.picture,
                hasSetName: hasConfirmedName,
              });
              return;
            }
          }
        }

        // Secondary check: verify if session was synced into Supabase storage
        await new Promise((r) => setTimeout(r, 600));
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const hasConfirmedName =
            session.user.user_metadata?.has_set_name === true;
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: hasConfirmedName
              ? session.user.user_metadata?.full_name || ''
              : '',
            suggestedName:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              '',
            avatar:
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture,
            hasSetName: hasConfirmedName,
          });
        }
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setAuthError(err.message || 'Could not connect to Google authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Subdued Benefits List
  const benefits = [
    { id: '1', title: 'Personalized workouts', icon: Dumbbell },
    { id: '2', title: 'Performance tracking', icon: TrendingUp },
    { id: '3', title: '1-on-1 coaching', icon: UserCheck },
  ];

  return (
    <View style={styles.root}>
      {/* Ambient background glow — Apple / Linear style, strictly subtle */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="heroGlow"
              cx={isDesktop ? '30%' : '50%'}
              cy="18%"
              rx={isDesktop ? '45%' : '70%'}
              ry="35%"
              fx={isDesktop ? '30%' : '50%'}
              fy="18%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#C7F000" stopOpacity="0.065" />
              <Stop offset="40%" stopColor="#C7F000" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#080A0C" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="subtleBlueGlow"
              cx={isDesktop ? '80%' : '90%'}
              cy="65%"
              rx="40%"
              ry="40%"
              fx={isDesktop ? '80%' : '90%'}
              fy="65%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#080A0C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#subtleBlueGlow)" />
        </Svg>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 28),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
          {/* Top App Header (Compact, native mobile app feel) */}
          <View style={styles.topHeader}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Dumbbell size={16} color="#C7F000" strokeWidth={2.4} />
              </View>
              <Text style={styles.brandText}>
                FIT<Text style={styles.brandAccent}>TRACK</Text>
              </Text>
            </View>

            <View style={styles.appStatusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>PERFORMANCE SYSTEM</Text>
            </View>
          </View>

          {/* Core Content Layout: Mobile Vertical / Desktop Asymmetric 2-Column */}
          <View style={[styles.contentLayout, isDesktop && styles.contentLayoutDesktop]}>
            {/* LEFT / HERO SECTION */}
            <View style={[styles.heroColumn, isDesktop && styles.heroColumnDesktop]}>
              {/* Animated Hero Headline */}
              <Animated.View
                style={[
                  styles.heroTextGroup,
                  {
                    opacity: heroAnim,
                    transform: [
                      {
                        translateY: heroAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [14, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>1-ON-1 COACHING</Text>
                </View>

                <Text
                  style={[
                    styles.headline,
                    isDesktop ? styles.headlineDesktop : styles.headlineMobile,
                  ]}
                >
                  TRAIN SMARTER.{'\n'}
                  GET <Text style={styles.headlineAccent}>STRONGER.</Text>
                </Text>

                <Text style={styles.heroDescription}>
                  Personalized training, performance tracking, and coaching built around your
                  progress.
                </Text>
              </Animated.View>

              {/* Cinematic Fitness Visual (blends seamlessly into #080A0C) */}
              <Animated.View
                style={[
                  styles.visualCard,
                  isDesktop ? styles.visualCardDesktop : styles.visualCardMobile,
                  {
                    opacity: visualAnim,
                    transform: [
                      {
                        translateY: visualAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={require('../../../assets/hero-athlete.jpg')}
                  style={styles.visualImage}
                  resizeMode="cover"
                />

                {/* Gradient Overlays to melt image into the dark UI */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Svg width="100%" height="100%">
                    <Defs>
                      <SvgLinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#080A0C" stopOpacity="0.8" />
                        <Stop offset="40%" stopColor="#080A0C" stopOpacity="0" />
                      </SvgLinearGradient>
                      <SvgLinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="45%" stopColor="#101418" stopOpacity="0" />
                        <Stop offset="90%" stopColor="#101418" stopOpacity="0.88" />
                        <Stop offset="100%" stopColor="#101418" stopOpacity="1" />
                      </SvgLinearGradient>
                      <SvgLinearGradient id="sideFade" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0%" stopColor="#080A0C" stopOpacity="0.45" />
                        <Stop offset="30%" stopColor="#080A0C" stopOpacity="0" />
                        <Stop offset="70%" stopColor="#080A0C" stopOpacity="0" />
                        <Stop offset="100%" stopColor="#080A0C" stopOpacity="0.45" />
                      </SvgLinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#topFade)" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomFade)" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#sideFade)" />
                  </Svg>
                </View>

                {/* Athletic metric tag floating on visual */}
                <View style={styles.floatingMetricCard}>
                  <View style={styles.metricPulse}>
                    <View style={styles.pulseInner} />
                  </View>
                  <View>
                    <Text style={styles.floatingMetricTitle}>TARGET: STRENGTH TRAINING</Text>
                    <Text style={styles.floatingMetricSub}>Real-time volume & coach synchronization</Text>
                  </View>
                </View>
              </Animated.View>

              {/* 3 Concise Benefits with subtle icons */}
              <View style={styles.benefitsRow}>
                {benefits.map((benefit) => (
                  <View key={benefit.id} style={styles.benefitItem}>
                    <View style={styles.benefitCheckBadge}>
                      <Check size={12} color="#C7F000" strokeWidth={3} />
                    </View>
                    <Text style={styles.benefitText}>{benefit.title}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* RIGHT / AUTH CARD SECTION */}
            <Animated.View
              style={[
                styles.authColumn,
                isDesktop && styles.authColumnDesktop,
                {
                  opacity: cardAnim,
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [22, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.authCard}>
                {/* Subtle top accent bar */}
                <View style={styles.cardAccentEdge} />

                <View style={styles.cardHeader}>
                  <Text style={styles.cardEyebrow}>WELCOME TO FITTRACK</Text>
                  <Text style={styles.cardMainHeading}>
                    Your personalized fitness journey starts here.
                  </Text>
                </View>

                {/* Error Banner */}
                {authError && (
                  <View style={styles.errorBox}>
                    <AlertCircle size={15} color="#FB7185" />
                    <Text style={styles.errorText}>{authError}</Text>
                  </View>
                )}

                {/* High Contrast Google Sign In Button */}
                <Pressable
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.googleButton,
                    pressed && styles.googleButtonPressed,
                    Platform.OS === 'web' && isGoogleHovered && styles.googleButtonHovered,
                  ]}
                  // @ts-ignore Web hover support
                  onMouseEnter={() => setIsGoogleHovered(true)}
                  onMouseLeave={() => setIsGoogleHovered(false)}
                  accessibilityLabel="Continue with Google"
                  accessibilityRole="button"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#080A0C" />
                  ) : (
                    <>
                      <View style={styles.googleIconContainer}>
                        <GoogleIcon size={20} />
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </Pressable>

                {/* Authentication Trust & Security Footer */}
                <View style={styles.securityContainer}>
                  <View style={styles.securityRow}>
                    <ShieldCheck size={13} color="#8B949E" />
                    <Text style={styles.securityText}>Secure authentication</Text>
                  </View>
                  <Text style={styles.legalLinks}>Privacy Policy · Terms</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const fontBase = Platform.select({
  web: "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  default: undefined,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080A0C',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 440,
    gap: 20,
  },
  mainWrapperDesktop: {
    maxWidth: 1240,
    paddingHorizontal: 24,
    gap: 32,
  },

  /* App Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#151A1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#F5F7F8',
    fontFamily: fontBase,
  },
  brandAccent: {
    color: '#C7F000',
  },
  appStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#101418',
    borderWidth: 1,
    borderColor: '#20262D',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7F000',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8B949E',
    fontFamily: fontBase,
  },

  /* Content Layout */
  contentLayout: {
    width: '100%',
    flexDirection: 'column',
    gap: 24,
  },
  contentLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 56,
    marginTop: 24,
    marginBottom: 40,
  },

  /* Left / Hero Column */
  heroColumn: {
    width: '100%',
    gap: 18,
  },
  heroColumnDesktop: {
    flex: 1.15,
    maxWidth: 640,
    gap: 24,
  },
  heroTextGroup: {
    gap: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.22)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C7F000',
    letterSpacing: 0.6,
    fontFamily: fontBase,
  },
  headline: {
    fontWeight: '800',
    color: '#F5F7F8',
    fontFamily: fontBase,
  },
  headlineMobile: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  headlineDesktop: {
    fontSize: 54,
    lineHeight: 60,
    letterSpacing: -2.2,
  },
  headlineAccent: {
    color: '#C7F000',
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#8B949E',
    fontFamily: fontBase,
    maxWidth: 520,
  },

  /* Fitness Visual */
  visualCard: {
    width: '100%',
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#20262D',
    backgroundColor: '#101418',
  },
  visualCardMobile: {
    height: 220,
  },
  visualCardDesktop: {
    height: 310,
  },
  visualImage: {
    width: '100%',
    height: '100%',
  },
  floatingMetricCard: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 20, 24, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(32, 38, 45, 0.9)',
  },
  metricPulse: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(199, 240, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7F000',
  },
  floatingMetricTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F5F7F8',
    letterSpacing: 0.6,
    fontFamily: fontBase,
  },
  floatingMetricSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8B949E',
    fontFamily: fontBase,
    marginTop: 1,
  },

  /* Benefits Row */
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#101418',
    borderWidth: 1,
    borderColor: '#20262D',
  },
  benefitCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(199, 240, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F5F7F8',
    letterSpacing: -0.1,
    fontFamily: fontBase,
  },

  /* Right / Auth Column */
  authColumn: {
    width: '100%',
  },
  authColumnDesktop: {
    flex: 0.85,
    maxWidth: 440,
  },
  authCard: {
    width: '100%',
    backgroundColor: '#101418',
    borderWidth: 1,
    borderColor: '#20262D',
    borderRadius: 24,
    padding: 24,
    gap: 20,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 8,
  },
  cardAccentEdge: {
    position: 'absolute',
    top: 0,
    left: 36,
    right: 36,
    height: 2,
    backgroundColor: '#C7F000',
    opacity: 0.45,
    borderRadius: 2,
  },
  cardHeader: {
    gap: 8,
    marginTop: 4,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#C7F000',
    fontFamily: fontBase,
  },
  cardMainHeading: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#F5F7F8',
    letterSpacing: -0.3,
    fontFamily: fontBase,
  },

  /* Error Box */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.22)',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FB7185',
    flex: 1,
    fontFamily: fontBase,
  },

  /* Google Sign In CTA */
  googleButton: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 12,
    paddingHorizontal: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    // @ts-ignore Web touch / cursor
    cursor: 'pointer',
    userSelect: 'none',
  },
  googleButtonPressed: {
    transform: [{ scale: 0.985 }],
    backgroundColor: '#EAEAEA',
  },
  googleButtonHovered: {
    transform: [{ translateY: -1 }],
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: -0.2,
    fontFamily: fontBase,
  },

  /* Security Footer */
  securityContainer: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8B949E',
    fontFamily: fontBase,
  },
  legalLinks: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748B',
    fontFamily: fontBase,
  },
});
