import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, AppState, Platform, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useUIStore } from '../lib/store';
import { isCoachEmail } from '../config/auth';
import { SplashScreen } from '../components/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DisplayNameScreen } from '../screens/auth/DisplayNameScreen';
import { CoachNavigator } from './CoachNavigator';
import { ClientNavigator } from './ClientNavigator';
import { DARK_THEME } from '../theme/theme';
import { supabase } from '../lib/supabase';

const shouldSkipSplashScreen = (): boolean => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const isOAuthReturn =
      window.location.href.includes('code=') ||
      window.location.href.includes('access_token=') ||
      window.location.hash.includes('access_token=');
    const hasSeenSplash = Boolean(window.sessionStorage?.getItem('fittrack_splash_seen'));
    return isOAuthReturn || hasSeenSplash;
  }
  return false;
};

export const RootNavigator: React.FC = () => {
  const { user, setUser } = useUIStore();
  const [isSplashDone, setIsSplashDone] = useState<boolean>(() => shouldSkipSplashScreen());
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
    const cleanUrlOnWeb = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    const fetchUserProfile = async (sessionUser: any) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, has_set_coach_profile')
          .eq('id', sessionUser.id)
          .maybeSingle();

        const hasConfirmedName = sessionUser.user_metadata?.has_set_name === true;
        const savedName =
          profile?.full_name?.trim() || sessionUser.user_metadata?.full_name?.trim() || '';

        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: hasConfirmedName ? savedName : '',
          suggestedName: savedName && !savedName.includes('@') ? savedName : '',
          avatar:
            profile?.avatar_url ||
            sessionUser.user_metadata?.avatar_url ||
            sessionUser.user_metadata?.picture,
          hasSetName: hasConfirmedName,
          hasSetCoachProfile:
            profile?.has_set_coach_profile === true ||
            sessionUser.user_metadata?.has_set_coach_profile === true,
        });
        cleanUrlOnWeb();
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: '',
          suggestedName: '',
          avatar:
            sessionUser.user_metadata?.avatar_url ||
            sessionUser.user_metadata?.picture,
          hasSetName: false,
        });
      } finally {
        setIsSessionLoaded(true);
      }
    };

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setIsSessionLoaded(true);
        }
      } catch (err) {
        console.error('Session sync error:', err);
        setIsSessionLoaded(true);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setIsSessionLoaded(true);
      }
    });

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncSession();
      }
    });

    const handleDeepLinkUrl = async (url: string) => {
      if (!url) return;
      if (url.includes('code=') || url.includes('access_token=')) {
        try {
          const urlParts = url.includes('#')
            ? url.split('#')[1]
            : url.includes('?')
            ? url.split('?')[1]
            : '';
          const params = new URLSearchParams(urlParts);
          const code = params.get('code');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (code) {
            const { data: sessionData, error } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!error && sessionData?.user) {
              await fetchUserProfile(sessionData.user);
            }
          } else if (accessToken && refreshToken) {
            const { data: sessionData, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && sessionData?.user) {
              await fetchUserProfile(sessionData.user);
            }
          }
        } catch (e) {
          console.warn('Deep link session exchange error:', e);
        }
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.href.includes('code=') || window.location.href.includes('access_token=')) {
        handleDeepLinkUrl(window.location.href);
      }
    }

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleDeepLinkUrl(initialUrl);
      }
    });

    const linkingSub = Linking.addEventListener('url', (event) => {
      handleDeepLinkUrl(event.url);
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
      linkingSub.remove();
    };
  }, [setUser]);

  // Render the current screen underneath
  const renderAppContent = () => {
    if (!isSessionLoaded) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color="#CCFF00" />
        </View>
      );
    }

    if (!user) {
      return <LoginScreen />;
    }

    if (!user.hasSetName) {
      return <DisplayNameScreen />;
    }

    const isCoach = isCoachEmail(user.email);
    return isCoach ? <CoachNavigator /> : <ClientNavigator />;
  };

  const theme = DARK_THEME;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      {renderAppContent()}

      {/* Animated Splash Screen Overlay */}
      {!isSplashDone && (
        <SplashScreen
          isReady={isSessionLoaded}
          onFinish={() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.sessionStorage?.setItem('fittrack_splash_seen', '1');
            }
            setIsSplashDone(true);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
