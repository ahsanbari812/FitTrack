import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  ShieldCheck,
  User,
  Award,
  Phone,
  ChevronDown,
  Edit3,
} from 'lucide-react-native';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { EditDisplayNameModal } from './EditDisplayNameModal';
import { EditPhoneModal } from './EditPhoneModal';
import { useUIStore } from '../lib/store';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../theme/theme';

export interface ProfileDropdownTriggerProps {
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  onPress: () => void;
  isOpen?: boolean;
  role?: 'Head Coach' | 'Client';
  style?: StyleProp<ViewStyle>;
}

export const ProfileDropdownTrigger: React.FC<ProfileDropdownTriggerProps> = ({
  user,
  onPress,
  isOpen = false,
  style,
}) => {
  const displayName = user?.name?.split(' ')[0] || (user?.email?.split('@')[0] ?? 'Account');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.triggerBtn, style]}
      activeOpacity={0.75}
    >
      {user?.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.triggerAvatar} />
      ) : (
        <View style={styles.triggerAvatarFallback}>
          <Text style={styles.triggerAvatarLetter}>
            {(displayName[0] || 'U').toUpperCase()}
          </Text>
        </View>
      )}

      <Text style={styles.triggerName} numberOfLines={1}>
        {displayName}
      </Text>

      <ChevronDown
        size={14}
        color={isOpen ? COLORS.brand : COLORS.textMuted}
        style={{
          transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
        }}
      />
    </TouchableOpacity>
  );
};

export interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  role: 'Head Coach' | 'Client';
  onLogout: () => void;
  trigger?: React.ReactNode;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  user,
  role,
  onLogout,
  trigger,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCoach = role === 'Head Coach';

  const { setCoachActiveTab, setCoachProfileModalOpen } = useUIStore();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);

  // Subtle entry animation: fade + translateY 4px (160ms, no bounce)
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, animValue]);

  const menuOpacity = animValue;
  const menuTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });

  const rightOffset =
    width > LAYOUT.maxContentWidth
      ? Math.round((width - LAYOUT.maxContentWidth) / 2) + LAYOUT.paddingDesktop
      : SPACING.md;

  const handleLogoutBtnTap = () => {
    onClose();
    setShowConfirmModal(true);
  };

  const handleProfilePress = () => {
    onClose();
    if (isCoach) {
      setCoachActiveTab('coach-profile');
    } else {
      setCoachProfileModalOpen(true);
    }
  };

  const handlePhonePress = () => {
    onClose();
    setShowEditPhoneModal(true);
  };

  const modalContent = (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  top: Math.max(insets.top, SPACING.md) + 48,
                  right: rightOffset,
                  opacity: menuOpacity,
                  transform: [{ translateY: menuTranslateY }],
                },
              ]}
            >
              {/* Compact User Header with Display Name Edit */}
              <View style={styles.userHeaderCard}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
                ) : (
                  <View style={styles.headerAvatarFallback}>
                    <Text style={styles.headerAvatarLetter}>
                      {(user?.name || user?.email || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.userHeaderInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userNameText} numberOfLines={1}>
                      {user?.name || 'Account'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        setShowEditNameModal(true);
                      }}
                      style={styles.editNameBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Edit3 size={12} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.userEmailText} numberOfLines={1}>
                    {user?.email || ''}
                  </Text>
                </View>

                <View
                  style={[
                    styles.roleBadge,
                    isCoach ? styles.coachRoleBadge : styles.clientRoleBadge,
                  ]}
                >
                  {isCoach ? (
                    <ShieldCheck size={11} color={COLORS.brand} />
                  ) : (
                    <User size={11} color={COLORS.info} />
                  )}
                  <Text
                    style={[
                      styles.roleText,
                      isCoach ? { color: COLORS.brand } : { color: COLORS.info },
                    ]}
                  >
                    {isCoach ? 'COACH' : 'ATHLETE'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* ROW 1: PROFILE */}
              <TouchableOpacity
                onPress={handleProfilePress}
                style={styles.menuRow}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  {isCoach ? (
                    <Award size={18} color={COLORS.textSecondary} />
                  ) : (
                    <User size={18} color={COLORS.textSecondary} />
                  )}
                  <Text style={styles.rowLabel}>
                    {isCoach ? 'Coach Profile' : 'View Coach Profile'}
                  </Text>
                </View>
              </TouchableOpacity>


              {/* ROW 3: PHONE */}
              <TouchableOpacity
                onPress={handlePhonePress}
                style={styles.menuRow}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Phone size={18} color={COLORS.textSecondary} />
                  <Text style={styles.rowLabel}>Phone</Text>
                </View>

                <Edit3 size={13} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* ROW 4: SIGN OUT */}
              <TouchableOpacity
                onPress={handleLogoutBtnTap}
                style={[styles.menuRow, styles.signOutRow]}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <LogOut size={18} color={COLORS.error} />
                  <Text style={styles.signOutLabel}>Sign Out</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <>
      {trigger}
      {modalContent}

      {/* Logout Confirmation Modal */}
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
  // ================= TRIGGER =================
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  triggerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceElevated,
  },
  triggerAvatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerAvatarLetter: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  triggerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: 120,
  },

  // ================= MENU OVERLAY & CONTAINER =================
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownMenu: {
    position: 'absolute',
    width: 270,
    backgroundColor: '#171C21',
    borderWidth: 1,
    borderColor: '#252B31',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 20,
  },

  // ================= HEADER INSIDE MENU =================
  userHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfacePrimary,
  },
  headerAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarLetter: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
  },
  userHeaderInfo: {
    flex: 1,
    gap: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  editNameBtn: {
    padding: 2,
  },
  userEmailText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  coachRoleBadge: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  clientRoleBadge: {
    backgroundColor: 'rgba(85, 185, 232, 0.08)',
    borderColor: 'rgba(85, 185, 232, 0.25)',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#252B31',
    marginVertical: 4,
  },

  // ================= 48PX MENU ROWS =================
  menuRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },


  // ================= SIGN OUT =================
  signOutRow: {
    backgroundColor: 'rgba(255, 92, 92, 0.06)',
    marginTop: 2,
  },
  signOutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5C5C',
  },
});
