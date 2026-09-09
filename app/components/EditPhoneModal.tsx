import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Phone, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useUpdatePhoneNumber } from '../lib/queries/profiles';
import { useUIStore } from '../lib/store';
import { isCoachEmail } from '../config/auth';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/theme';

interface EditPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditPhoneModal: React.FC<EditPhoneModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, setUser } = useUIStore();
  const updatePhone = useUpdatePhoneNumber();
  const isCoach = isCoachEmail(user?.email);

  const existingDigits = user?.phone?.startsWith('+92')
    ? user.phone.slice(3)
    : '';

  const [phoneDigits, setPhoneDigits] = useState(existingDigits);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const digits = user?.phone?.startsWith('+92')
        ? user.phone.slice(3)
        : '';
      setPhoneDigits(digits);
      setErrorMsg(null);
    }
  }, [isOpen, user?.phone]);

  const handleSave = async () => {
    const digits = phoneDigits.replace(/\s/g, '');

    if (!digits) {
      if (!user) return;
      try {
        await updatePhone.mutateAsync({ userId: user.id, phoneNumber: null });
        setUser({ ...user, phone: undefined });
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Could not update. Please try again.');
      }
      return;
    }

    if (!/^\d{10}$/.test(digits)) {
      setErrorMsg('Please enter exactly 10 digits after +92.');
      return;
    }

    if (!user) return;

    try {
      const fullNumber = `+92${digits}`;
      await updatePhone.mutateAsync({ userId: user.id, phoneNumber: fullNumber });
      setUser({ ...user, phone: fullNumber });
      onClose();
    } catch (err: any) {
      console.error('Error updating phone:', err);
      setErrorMsg(err.message || 'Could not update phone number. Please try again.');
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Phone size={22} color={COLORS.brand} />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.title}>Edit Phone Number</Text>
                <Text style={styles.subtitle}>
                  {isCoach
                    ? 'Visible to your athletes in your public coaching dossier.'
                    : 'Confidential line used directly by your coach for accountability.'}
                </Text>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color={COLORS.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+92</Text>
                </View>
                <TextInput
                  value={phoneDigits}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setPhoneDigits(cleaned);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="3001234567"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  autoFocus={true}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  maxLength={10}
                />
              </View>

              <Text style={styles.hintText}>
                Leave empty and save to remove phone number.
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={updatePhone.isPending}
                  style={styles.saveBtn}
                  activeOpacity={0.85}
                >
                  {updatePhone.isPending ? (
                    <ActivityIndicator size="small" color="#080A0C" />
                  ) : (
                    <Text style={styles.saveText}>Save Number</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 92, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    width: '100%',
  },
  inputFocused: {
    borderColor: COLORS.brand,
  },
  prefixBox: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
    letterSpacing: 1,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: -SPACING.xs,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfacePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080A0C',
  },
});
