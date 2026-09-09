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
import { Edit3, CircleAlert as AlertCircle, User } from 'lucide-react-native';
import { useUpdateDisplayName } from '../lib/queries/profiles';
import { useUIStore } from '../lib/store';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/theme';

interface EditDisplayNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditDisplayNameModal: React.FC<EditDisplayNameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, setUser } = useUIStore();
  const updateDisplayName = useUpdateDisplayName();

  const [name, setName] = useState(user?.name || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '');
      setErrorMsg(null);
    }
  }, [isOpen, user?.name]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a display name.');
      return;
    }
    if (trimmed.length < 2) {
      setErrorMsg('Display name must be at least 2 characters.');
      return;
    }
    if (!user) return;

    try {
      await updateDisplayName.mutateAsync({
        userId: user.id,
        displayName: trimmed,
      });

      setUser({
        ...user,
        name: trimmed,
        hasSetName: true,
      });

      onClose();
    } catch (err: any) {
      console.error('Error updating display name:', err);
      setErrorMsg(err.message || 'Could not update display name. Please try again.');
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
                <Edit3 size={22} color={COLORS.brand} />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.title}>Edit Display Name</Text>
                <Text style={styles.subtitle}>
                  Update how your identity appears across the platform.
                </Text>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color={COLORS.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <User size={16} color={isFocused ? COLORS.brand : COLORS.textMuted} />
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter display name"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  autoFocus={true}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  maxLength={40}
                />
              </View>

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
                  disabled={updateDisplayName.isPending}
                  style={styles.saveBtn}
                  activeOpacity={0.85}
                >
                  {updateDisplayName.isPending ? (
                    <ActivityIndicator size="small" color="#080A0C" />
                  ) : (
                    <Text style={styles.saveText}>Save Changes</Text>
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
    gap: SPACING.sm,
    height: 50,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    width: '100%',
  },
  inputFocused: {
    borderColor: COLORS.brand,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
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
