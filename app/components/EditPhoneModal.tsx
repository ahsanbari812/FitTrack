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

  // Strip +92 prefix from existing number for the input field
  const existingDigits = user?.phone?.startsWith('+92')
    ? user.phone.slice(3)
    : '';

  const [phoneDigits, setPhoneDigits] = useState(existingDigits);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      // Allow clearing the phone number
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
              {/* Icon Badge */}
              <View style={styles.iconCircle}>
                <Phone size={24} color="#CCFF00" />
              </View>

              {/* Header */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>Edit Phone Number</Text>
                <Text style={styles.subtitle}>
                  {isCoach
                    ? 'Update your contact number. Visible to your athletes in your coach profile.'
                    : 'Update your contact number. Only visible to your coach.'}
                </Text>
              </View>

              {/* Error */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color="#FB7185" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Input */}
              <View style={styles.inputContainer}>
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
                  placeholder="3001234567"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                  autoFocus={true}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  maxLength={10}
                />
              </View>

              <Text style={styles.hintText}>
                Leave empty and save to remove your phone number.
              </Text>

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelBtn}
                  activeOpacity={0.75}
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
                    <ActivityIndicator size="small" color="#0F172A" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#090D16',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 20,
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
  },
  textContainer: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
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
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  prefixBox: {
    paddingHorizontal: 14,
    paddingVertical: 13,
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
    color: '#FFFFFF',
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
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});
