import React, { useState } from 'react';
import { EditDisplayNameModal } from './EditDisplayNameModal';
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
import { LogOut, ShieldCheck, User, Award, Edit3 } from 'lucide-react-native';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { useUIStore } from '../lib/store';

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

  const rightOffset = width > 1160 ? Math.round((width - 1160) / 2) + 16 : 16;

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
                  { top: Math.max(insets.top, 12) + 50, right: rightOffset },
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
                      <ShieldCheck size={12} color="#CCFF00" />
                    ) : (
                      <User size={12} color="#38BDF8" />
                    )}
                    <Text
                      style={[
                        styles.roleText,
                        isCoach ? { color: '#CCFF00' } : { color: '#38BDF8' },
                      ]}
                    >
                      {isCoach ? 'HEAD COACH' : 'CLIENT ATHLETE'}
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
                  <Edit3 size={15} color="#CCFF00" />
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
                    <Award size={15} color="#CCFF00" />
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
                    <ShieldCheck size={16} color="#CCFF00" />
                    <Text style={styles.actionBtnText}>View Coach Profile</Text>
                  </TouchableOpacity>
                )}

                {/* Logout Button */}
                <TouchableOpacity
                  onPress={handleLogoutBtnTap}
                  style={styles.logoutBtn}
                  activeOpacity={0.75}
                >
                  <LogOut size={16} color="#EF4444" />
                  <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Themed Dark Confirmation Modal */}
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
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dropdownContainer: {
    position: 'absolute',
    right: 16,
    width: 250,
    backgroundColor: '#090D16',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  userTextCol: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 11,
    color: '#94A3B8',
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  coachBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  clientBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CCFF00',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
});
