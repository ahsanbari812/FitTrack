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
} from 'react-native';
import { CircleAlert as AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
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

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Smooth entrance animation for login card
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
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
        // On web, the browser will seamlessly redirect to Google login and then return to the app origin
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

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        {/* Brand Header (Identical proportions to Splash Screen) */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/app-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            FIT<Text style={{ color: '#CCFF00' }}>TRACK</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            1-on-1 Fitness Coaching & Performance Tracking
          </Text>
        </View>

        {/* Auth Card with smooth entrance */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Sign In to FitTrack
          </Text>
          <Text style={styles.cardSubtitle}>
            Sign in with your Google account to access your customized fitness plans and coaching dashboard.
          </Text>

          {authError && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#FB7185" />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          {/* Google Sign In Button with Clean Google Logo */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            style={styles.signInButton}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={styles.signInText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 28,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 8,
  },
  logoWrapper: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 86,
    height: 86,
    borderRadius: 24,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.2)',
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#FB7185',
    flex: 1,
  },
  signInButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  signInText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
});
