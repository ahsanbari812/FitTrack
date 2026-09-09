import React, { useState } from 'react';
import { EditDisplayNameModal } from './EditDisplayNameModal';
import { EditPhoneModal } from './EditPhoneModal';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, ShieldCheck, User, Award, Edit3, Phone } from 'lucide-react-native';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { useUIStore } from '../lib/store';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, LAYOUT } from '../theme/theme';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  role: 'Head Coach' | 'Client';
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  user,
  role,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCoach = role === 'Head Coach';
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);

  const rightOffset = width > LAYOUT.maxContentWidth
    ? Math.round((width - LAYOUT.maxContentWidth) / 2) + LAYOUT.paddingDesktop
    : SPACING.md;

  const handleLogoutBtnTap = () => {
    onClose();
    setShowConfirmModal(true);
  };

  return (
    <>
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownContainer,
                  { top: Math.max(insets.top, SPACING.md) + 48, right: rightOffset },
                ]}
              >
                {/* User Info Header */}
                <View style={styles.userHeader}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarLetter}>
                        {(user?.name || user?.email || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userTextCol}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user?.name || 'Account'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user?.email || ''}
                    </Text>
                  </View>
                </View>

                {/* Role Badge */}
                <View style={styles.roleContainer}>
                  <View
                    style={[
                      styles.roleBadge,
                      isCoach ? styles.coachBadge : styles.clientBadge,
                    ]}
                  >
                    {isCoach ? (
                      <ShieldCheck size={12} color={COLORS.brand} />
                    ) : (
                      <User size={12} color={COLORS.info} />
                    )}
                    <Text
                      style={[
                        styles.roleText,
                        isCoach ? { color: COLORS.brand } : { color: COLORS.info },
                      ]}
                    >
                      {isCoach ? 'HEAD COACH' : 'ATHLETE'}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Edit Display Name */}
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    setShowEditNameModal(true);
                  }}
                  style={styles.actionBtn}
                  activeOpacity={0.75}
                >
                  <Edit3 size={15} color={COLORS.textSecondary} />
                  <Text style={styles.actionBtnText}>Edit Display Name</Text>
                </TouchableOpacity>

                {/* Profile Actions */}
                {isCoach ? (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      useUIStore.getState().setCoachActiveTab('coach-profile');
                    }}
                    style={styles.actionBtn}
                    activeOpacity={0.75}
                  >
                    <Award size={15} color={COLORS.textSecondary} />
                    <Text style={styles.actionBtnText}>Edit Coach Profile</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      useUIStore.getState().setCoachProfileModalOpen(true);
                    }}
                    style={styles.actionBtn}
                    activeOpacity={0.75}
                  >
                    <ShieldCheck size={15} color={COLORS.textSecondary} />
                    <Text style={styles.actionBtnText}>View Coach Profile</Text>
                  </TouchableOpacity>
                )}

                {/* Edit Phone Number */}
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    setShowEditPhoneModal(true);
                  }}
                  style={styles.actionBtn}
                  activeOpacity={0.75}
                >
                  <Phone size={15} color={COLORS.textSecondary} />
                  <Text style={styles.actionBtnText}>Edit Phone Number</Text>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity
                  onPress={handleLogoutBtnTap}
                  style={styles.logoutBtn}
                  activeOpacity={0.75}
                >
                  <LogOut size={15} color={COLORS.error} />
                  <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Themed Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={onLogout}
      />

      {/* Edit Display Name Modal */}
      <EditDisplayNameModal
        isOpen={showEditNameModal}
        onClose={() => setShowEditNameModal(false)}
      />

      {/* Edit Phone Number Modal */}
      <EditPhoneModal
        isOpen={showEditPhoneModal}
        onClose={() => setShowEditPhoneModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  dropdownContainer: {
    position: 'absolute',
    right: SPACING.md,
    width: 256,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfacePrimary,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },
  userTextCol: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  roleContainer: {
    flexDirection: 'row',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  coachBadge: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  clientBadge: {
    backgroundColor: 'rgba(85, 185, 232, 0.1)',
    borderColor: 'rgba(85, 185, 232, 0.25)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 9,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255, 92, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.2)',
    paddingVertical: 9,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    marginTop: 2,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },
});
