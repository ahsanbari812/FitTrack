import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, AppState } from 'react-native';
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

export const RootNavigator: React.FC = () => {
  const { user, setUser } = useUIStore();
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
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
          onFinish={() => setIsSplashDone(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
