import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { ArrowRight, User, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { DARK_THEME } from '../../theme/theme';
import { supabase } from '../../lib/supabase';
import { isCoachEmail } from '../../config/auth';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';
import { CoachProfileEditorScreen } from '../coach/CoachProfileEditorScreen';

export const DisplayNameScreen: React.FC = () => {
  const { user, setUser, logout, setCoachProfileModalOpen } = useUIStore();
  const theme = DARK_THEME;

  const [displayName, setDisplayName] = useState(user?.suggestedName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCoachProfileStep, setShowCoachProfileStep] = useState(false);

  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const isCoach = isCoachEmail(user?.email);

  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a display name to continue.');
      return;
    }
    if (trimmed.length < 2) {
      setErrorMsg('Display name must be at least 2 characters.');
      return;
    }

    if (!user) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Upsert profile into public.profiles with the chosen display name
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: trimmed,
            avatar_url: user.avatar || null,
            role: isCoach ? 'coach' : 'client',
            status: 'active',
            has_set_name: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        console.warn('Profile upsert warning:', profileError);
      }

      // 2. Update Supabase Auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: trimmed,
          name: trimmed,
          has_set_name: true,
        },
      });

      if (isCoach) {
        // Transition coach to Coach Profile Setup Step
        setShowCoachProfileStep(true);
      } else {
        // For new client, proceed to phone number step (handled by RootNavigator)
        setUser({
          ...user,
          name: trimmed,
          hasSetName: true,
          hasSetPhone: false,
        });
      }
    } catch (err: any) {
      console.error('Error saving display name:', err);
      setErrorMsg(err.message || 'Could not save display name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCoachProfileStep) {
    return (
      <CoachProfileEditorScreen
        isOnboarding={true}
        onFinishOnboarding={() => {
          if (user) {
            setUser({
              ...user,
              name: displayName.trim(),
              hasSetName: true,
              hasSetCoachProfile: true,
              hasSetPhone: false,
            });
          }
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'height' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Brand Logo & Welcome Badge */}
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
            <View style={[styles.rolePill, isCoach ? styles.coachPill : styles.clientPill]}>
              <Text
                style={[
                  styles.roleText,
                  isCoach ? { color: '#CCFF00' } : { color: '#38BDF8' },
                ]}
              >
                {isCoach ? 'HEAD COACH ONBOARDING' : 'ATHLETE ONBOARDING'}
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              What should we call you?
            </Text>
            <Text style={styles.cardSubtitle}>
              Enter your preferred display name. This is how your{' '}
              {isCoach ? 'clients' : 'coach'} will identify you in FitTrack.
            </Text>

            {errorMsg && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#FB7185" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Name Input Field */}
            <View style={styles.inputContainer}>
              <User size={18} color="#94A3B8" />
              <TextInput
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. Coach Ahsan or Alex Morgan"
                placeholderTextColor="#64748B"
                style={[styles.input, { color: theme.textPrimary }]}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                maxLength={40}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSaveName}
              disabled={isLoading}
              style={styles.continueBtn}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <Text style={styles.continueText}>Continue to FitTrack</Text>
                  <ArrowRight size={18} color="#0F172A" />
                </>
              )}
            </TouchableOpacity>

            {/* Switch Account / Logout */}
            <TouchableOpacity
              onPress={() => setShowConfirmLogout(true)}
              style={styles.switchBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                Signed in as <Text style={{ color: '#E2E8F0' }}>{user?.email}</Text> •{' '}
                <Text style={{ color: '#FB7185', fontWeight: '700' }}>Log Out</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Themed Dark Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        onConfirm={logout}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 24,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 8,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  coachPill: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  clientPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 16,
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
    lineHeight: 19,
    marginBottom: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.25)',
  },
  errorText: {
    fontSize: 12,
    color: '#FB7185',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 4,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  switchBtn: {
    alignItems: 'center',
    paddingTop: 6,
  },
  switchText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
