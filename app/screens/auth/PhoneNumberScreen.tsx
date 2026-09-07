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
  Image,
} from 'react-native';
import { ArrowRight, Phone, CircleAlert as AlertCircle, SkipForward } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { DARK_THEME } from '../../theme/theme';
import { supabase } from '../../lib/supabase';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';
import { isCoachEmail } from '../../config/auth';

export const PhoneNumberScreen: React.FC = () => {
  const { user, setUser, logout } = useUIStore();
  const theme = DARK_THEME;
  const isCoach = isCoachEmail(user?.email);

  const [phoneDigits, setPhoneDigits] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleSkip = async () => {
    if (!user) return;
    try {
      await supabase.auth.updateUser({
        data: {
          has_set_phone: true,
        },
      });
    } catch (e) {
      console.warn('Failed to update user metadata on skip:', e);
    }
    setUser({
      ...user,
      hasSetPhone: true,
    });
  };

  const handleSavePhone = async () => {
    const digits = phoneDigits.replace(/\s/g, '');

    if (!digits) {
      setErrorMsg('Please enter your phone number or tap Skip.');
      return;
    }
    if (!/^\d{10}$/.test(digits)) {
      setErrorMsg('Please enter exactly 10 digits after +92.');
      return;
    }

    if (!user) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const fullNumber = `+92${digits}`;

      const { error } = await supabase
        .from('profiles')
        .update({
          phone_number: fullNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.warn('Phone update warning:', error);
      }

      await supabase.auth.updateUser({
        data: {
          has_set_phone: true,
        },
      });

      setUser({
        ...user,
        phone: fullNumber,
        hasSetPhone: true,
      });
    } catch (err: any) {
      console.error('Error saving phone number:', err);
      setErrorMsg(err.message || 'Could not save phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <View style={[styles.rolePill, isCoach && styles.coachRolePill]}>
              <Text style={[styles.roleText, isCoach && styles.coachRoleText]}>
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
            <View style={styles.iconCircle}>
              <Phone size={24} color="#CCFF00" />
            </View>

            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Add Your Phone Number
            </Text>
            <Text style={styles.cardSubtitle}>
              {isCoach
                ? 'Your phone number allows your athletes to reach out to you directly. This is optional — you can always add it later.'
                : 'Your phone number helps your coach reach out to you. This is optional — you can always add it later.'}
            </Text>

            {errorMsg && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#FB7185" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Phone Input Field */}
            <View style={styles.inputContainer}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+92</Text>
              </View>
              <TextInput
                value={phoneDigits}
                onChangeText={(text) => {
                  // Only allow digits
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setPhoneDigits(cleaned);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="3001234567"
                placeholderTextColor="#64748B"
                style={[styles.input, { color: theme.textPrimary }]}
                autoFocus={true}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleSavePhone}
                maxLength={10}
              />
            </View>

            <Text style={styles.hintText}>
              {isCoach
                ? 'Visible to your athletes in your coach profile — never shared publicly.'
                : 'Only visible to your coach — never shared publicly.'}
            </Text>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipBtn}
                activeOpacity={0.75}
              >
                <SkipForward size={14} color="#94A3B8" />
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePhone}
                disabled={isLoading}
                style={styles.continueBtn}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <>
                    <Text style={styles.continueText}>Continue</Text>
                    <ArrowRight size={16} color="#0F172A" />
                  </>
                )}
              </TouchableOpacity>
            </View>

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
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#38BDF8',
  },
  coachRolePill: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  coachRoleText: {
    color: '#CCFF00',
  },
  card: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 14,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
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
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#FB7185',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  prefixBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#CCFF00',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 12,
    letterSpacing: 1,
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 18,
  },
  continueText: {
    fontSize: 14,
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
