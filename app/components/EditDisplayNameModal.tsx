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

  // Reset state when modal opens
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

      // Immediately update Zustand store so UI reflects the change
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
              {/* Icon Badge */}
              <View style={styles.iconCircle}>
                <Edit3 size={24} color="#CCFF00" />
              </View>

              {/* Header */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>Edit Display Name</Text>
                <Text style={styles.subtitle}>
                  Update how your name appears throughout FitTrack.
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
                <User size={16} color="#94A3B8" />
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter new display name"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                  autoFocus={true}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  maxLength={40}
                />
              </View>

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
                  disabled={updateDisplayName.isPending}
                  style={styles.saveBtn}
                  activeOpacity={0.85}
                >
                  {updateDisplayName.isPending ? (
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
    gap: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
