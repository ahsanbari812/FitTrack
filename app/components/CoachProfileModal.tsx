import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Easing,
  Linking,
} from 'react-native';
import {
  X,
  Award,
  Trophy,
  Sparkles,
  ShieldCheck,
  Flame,
  Instagram,
  Quote,
  CheckCircle,
  Briefcase,
  ExternalLink,
  MessageCircle,
} from 'lucide-react-native';
import { useHeadCoachProfile } from '../lib/queries/profiles';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/theme';

interface CoachProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTimeOnboarding?: boolean;
}

const { height } = Dimensions.get('window');

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80';

export const CoachProfileModal: React.FC<CoachProfileModalProps> = ({
  isOpen,
  onClose,
  isFirstTimeOnboarding = false,
}) => {
  const { data: coachProfile } = useHeadCoachProfile();
  const [modalVisible, setModalVisible] = useState(isOpen);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.94,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 15,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const coachName = coachProfile?.full_name?.trim() || 'Coach Ahsan';
  const coachTitle =
    coachProfile?.coach_title?.trim() || 'Head Coach & Elite Performance Specialist';
  const experienceYears = coachProfile?.experience_years || 10;
  const avatarUri = coachProfile?.avatar_url || FALLBACK_AVATAR;

  const certifications =
    coachProfile?.certifications && coachProfile.certifications.length > 0
      ? coachProfile.certifications
      : ['CSCS Certified', 'ISSA Master Trainer', 'Precision Nutrition L2'];

  const achievements =
    coachProfile?.achievements && coachProfile.achievements.length > 0
      ? coachProfile.achievements
      : [
          '10+ Years High-Performance Coaching',
          '150+ Proven Athlete Transformations',
          'Specialized in Strength & Body Recomposition',
        ];

  const specialties =
    coachProfile?.specialties && coachProfile.specialties.length > 0
      ? coachProfile.specialties
      : ['Hypertrophy', 'Strength & Power', 'Body Recomposition', 'Fat Loss'];

  const philosophy =
    coachProfile?.coach_philosophy?.trim() ||
    coachProfile?.coach_bio?.trim() ||
    'Science-backed programming tailored to your unique biomechanics, lifestyle, and goals. We train with purpose, eat with precision, and build lasting habits.';

  const instagram = coachProfile?.instagram_handle?.trim() || '@coach.ahsan';
  const coachPhone = coachProfile?.phone_number?.trim();

  const handleOpenWhatsApp = async () => {
    if (!coachPhone) return;
    const digits = coachPhone.replace(/\D/g, '');
    const appUrl = `whatsapp://send?phone=${digits}`;
    const webUrl = `https://wa.me/${digits}`;

    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch (webErr) {
        console.error('Failed to open WhatsApp URL:', webErr);
      }
    }
  };

  const handleOpenInstagram = async () => {
    if (!instagram) return;

    let cleanHandle = instagram.trim();
    if (cleanHandle.startsWith('http://') || cleanHandle.startsWith('https://')) {
      try {
        await Linking.openURL(cleanHandle);
      } catch (err) {
        console.error('Failed to open Instagram link:', err);
      }
      return;
    }

    cleanHandle = cleanHandle.replace(/^@/, '').trim();
    const appUrl = `instagram://user?username=${cleanHandle}`;
    const webUrl = `https://www.instagram.com/${cleanHandle}/`;

    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch (webErr) {
        console.error('Failed to open Instagram URL:', webErr);
      }
    }
  };

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
            },
          ]}
        >
          <View style={styles.cardContent}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={13} color={COLORS.brand} />
                <Text style={styles.verifiedPillText}>HEAD COACH DOSSIER</Text>
              </View>

              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* Hero Unit */}
              <View style={styles.heroSection}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  <View style={styles.avatarBadge}>
                    <ShieldCheck size={12} color="#080A0C" />
                  </View>
                </View>

                <Text style={styles.coachNameText}>{coachName}</Text>
                <Text style={styles.coachTitleText}>{coachTitle}</Text>

                {/* Status Badges */}
                <View style={styles.heroPillRow}>
                  <View style={styles.statPill}>
                    <Briefcase size={12} color={COLORS.textSecondary} />
                    <Text style={styles.statPillText}>{experienceYears}+ Years Exp</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Flame size={12} color={COLORS.warning} />
                    <Text style={[styles.statPillText, { color: COLORS.warning }]}>Active Coach</Text>
                  </View>
                  {instagram ? (
                    <TouchableOpacity
                      onPress={handleOpenInstagram}
                      style={styles.statPill}
                      activeOpacity={0.7}
                    >
                      <Instagram size={12} color={COLORS.info} />
                      <Text style={[styles.statPillText, { color: COLORS.info }]}>{instagram}</Text>
                      <ExternalLink size={10} color={COLORS.info} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Direct WhatsApp Contact */}
              {coachPhone ? (
                <TouchableOpacity
                  onPress={handleOpenWhatsApp}
                  style={styles.contactCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.contactIconCircle}>
                      <MessageCircle size={16} color={COLORS.brand} />
                    </View>
                    <View style={styles.contactTextCol}>
                      <Text style={styles.contactSubhead}>DIRECT MESSAGING</Text>
                      <Text style={styles.contactPhoneNum}>{coachPhone}</Text>
                    </View>
                  </View>
                  <View style={styles.whatsAppBadge}>
                    <Text style={styles.whatsAppBadgeText}>WhatsApp</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* Coaching Philosophy */}
              {philosophy ? (
                <View style={styles.quoteCard}>
                  <View style={styles.quoteHeader}>
                    <Quote size={13} color={COLORS.brand} />
                    <Text style={styles.quoteTitle}>COACHING PHILOSOPHY</Text>
                  </View>
                  <Text style={styles.quoteText}>"{philosophy}"</Text>
                </View>
              ) : null}

              {/* Certifications */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Award size={13} color={COLORS.brand} />
                  <Text style={styles.sectionHeaderTitle}>VERIFIED CREDENTIALS</Text>
                </View>
                <View style={styles.certPillsWrap}>
                  {certifications.map((cert, i) => (
                    <View key={i} style={styles.certPill}>
                      <CheckCircle size={12} color={COLORS.brand} />
                      <Text style={styles.certPillText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Key Achievements */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Trophy size={13} color={COLORS.warning} />
                  <Text style={[styles.sectionHeaderTitle, { color: COLORS.warning }]}>TRACK RECORD</Text>
                </View>
                <View style={styles.achievementsList}>
                  {achievements.map((item, i) => (
                    <View key={i} style={styles.achievementItem}>
                      <View style={styles.starBullet}>
                        <Sparkles size={11} color={COLORS.warning} />
                      </View>
                      <Text style={styles.achievementText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Specialties */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Sparkles size={13} color={COLORS.info} />
                  <Text style={[styles.sectionHeaderTitle, { color: COLORS.info }]}>SPECIALIZATIONS</Text>
                </View>
                <View style={styles.specialtiesWrap}>
                  {specialties.map((spec, i) => (
                    <View key={i} style={styles.specChip}>
                      <Text style={styles.specChipText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity onPress={handleClose} style={styles.continueBtn} activeOpacity={0.85}>
                <Text style={styles.continueBtnText}>
                  {isFirstTimeOnboarding ? 'Continue With Coach' : 'Close Dossier'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 460,
    maxHeight: Math.min(680, height * 0.85),
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 20,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollBody: {
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  heroSection: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfaceElevated,
  },
  coachNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  coachTitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextCol: {
    gap: 2,
  },
  contactSubhead: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  contactPhoneNum: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  whatsAppBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  whatsAppBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quoteCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  quoteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  sectionBlock: {
    gap: SPACING.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  certPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  certPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  achievementsList: {
    gap: 6,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  starBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 165, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specChip: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  continueBtn: {
    height: 50,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.3,
  },
});
