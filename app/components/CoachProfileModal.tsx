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
  Phone,
  MessageCircle,
} from 'lucide-react-native';
import { useHeadCoachProfile } from '../lib/queries/profiles';
import { DARK_THEME } from '../theme/theme';

interface CoachProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTimeOnboarding?: boolean;
}

const { width, height } = Dimensions.get('window');

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80';

export const CoachProfileModal: React.FC<CoachProfileModalProps> = ({
  isOpen,
  onClose,
  isFirstTimeOnboarding = false,
}) => {
  const theme = DARK_THEME;
  const { data: coachProfile } = useHeadCoachProfile();

  const [modalVisible, setModalVisible] = useState(isOpen);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      // Parallel entrance animation: Butter-smooth spring + fade
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.92,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(cardTranslateY, {
          toValue: 20,
          duration: 220,
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

  // Resolved coach credentials with rich fallbacks
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
    } catch (err) {
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
    } catch (err) {
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
          {/* Floating Glass Card Content */}
          <View style={styles.cardContent}>
            {/* Top Bar with Badge and Close */}
            <View style={styles.topBar}>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={13} color="#CCFF00" />
                <Text style={styles.verifiedPillText}>CERTIFIED HEAD COACH</Text>
              </View>

              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
              bounces={true}
            >
              {/* Coach Avatar & Hero Unit */}
              <View style={styles.heroSection}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  <View style={styles.avatarBadge}>
                    <ShieldCheck size={14} color="#0F172A" />
                  </View>
                </View>

                <Text style={styles.coachNameText}>{coachName}</Text>
                <Text style={styles.coachTitleText}>{coachTitle}</Text>

                {/* Experience & Status Pill Row */}
                <View style={styles.heroPillRow}>
                  <View style={styles.statPill}>
                    <Briefcase size={12} color="#CCFF00" />
                    <Text style={styles.statPillText}>{experienceYears}+ Years Exp</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Flame size={12} color="#F97316" />
                    <Text style={[styles.statPillText, { color: '#F97316' }]}>Active Coach</Text>
                  </View>
                  {instagram ? (
                    <TouchableOpacity
                      onPress={handleOpenInstagram}
                      style={[styles.statPill, styles.statPillInstagram]}
                      activeOpacity={0.7}
                    >
                      <Instagram size={12} color="#38BDF8" />
                      <Text style={[styles.statPillText, { color: '#38BDF8' }]}>{instagram}</Text>
                      <ExternalLink size={10} color="#38BDF8" />
                    </TouchableOpacity>
                  ) : null}
                  {coachPhone ? (
                    <TouchableOpacity
                      onPress={handleOpenWhatsApp}
                      style={[styles.statPill, styles.statPillWhatsApp]}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={11} color="#25D366" />
                      <Text style={[styles.statPillText, { color: '#25D366' }]}>{coachPhone}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Direct Coach Contact Card - WhatsApp */}
              {coachPhone ? (
                <TouchableOpacity
                  onPress={handleOpenWhatsApp}
                  style={styles.contactCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.contactIconCircle}>
                      <MessageCircle size={16} color="#090D16" />
                    </View>
                    <View style={styles.contactTextCol}>
                      <Text style={styles.contactSubhead}>DIRECT CONTACT</Text>
                      <Text style={styles.contactPhoneNum}>{coachPhone}</Text>
                    </View>
                  </View>
                  <View style={styles.whatsAppBadge}>
                    <MessageCircle size={13} color="#25D366" />
                    <Text style={styles.whatsAppBadgeText}>WhatsApp</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* Coaching Philosophy Quote Card */}
              {philosophy ? (
                <View style={styles.quoteCard}>
                  <View style={styles.quoteHeader}>
                    <Quote size={14} color="#CCFF00" />
                    <Text style={styles.quoteTitle}>COACHING PHILOSOPHY</Text>
                  </View>
                  <Text style={styles.quoteText}>"{philosophy}"</Text>
                </View>
              ) : null}

              {/* Certifications Section */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Award size={14} color="#CCFF00" />
                  <Text style={styles.sectionHeaderTitle}>VERIFIED CERTIFICATIONS</Text>
                </View>
                <View style={styles.certPillsWrap}>
                  {certifications.map((cert, i) => (
                    <View key={i} style={styles.certPill}>
                      <CheckCircle size={12} color="#34D399" />
                      <Text style={styles.certPillText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Key Achievements */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Trophy size={14} color="#FBBF24" />
                  <Text style={[styles.sectionHeaderTitle, { color: '#FBBF24' }]}>KEY ACHIEVEMENTS</Text>
                </View>
                <View style={styles.achievementsList}>
                  {achievements.map((item, i) => (
                    <View key={i} style={styles.achievementItem}>
                      <View style={styles.starBullet}>
                        <Sparkles size={11} color="#FBBF24" />
                      </View>
                      <Text style={styles.achievementText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Specialties */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Sparkles size={14} color="#38BDF8" />
                  <Text style={[styles.sectionHeaderTitle, { color: '#38BDF8' }]}>TRAINING SPECIALTIES</Text>
                </View>
                <View style={styles.specialtiesWrap}>
                  {specialties.map((spec, i) => (
                    <View key={i} style={styles.specChip}>
                      <Text style={styles.specChipText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Dismiss / Continue Button */}
              <TouchableOpacity onPress={handleClose} style={styles.continueBtn} activeOpacity={0.85}>
                <Text style={styles.continueBtnText}>
                  {isFirstTimeOnboarding ? 'Start My Journey With Coach' : 'Close Profile'}
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
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    height: Math.min(680, height * 0.82),
    borderRadius: 28,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: 'rgba(204, 255, 0, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#CCFF00',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollBody: {
    gap: 16,
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#CCFF00',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#090D16',
  },
  coachNameText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  coachTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statPillInstagram: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  statPillWhatsApp: {
    backgroundColor: 'rgba(37, 211, 102, 0.08)',
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  statPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CCFF00',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(37, 211, 102, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
    borderRadius: 16,
    padding: 12,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  contactIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextCol: {
    gap: 2,
  },
  contactSubhead: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  contactPhoneNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  whatsAppBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  whatsAppBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#25D366',
    letterSpacing: 0.2,
  },
  quoteCard: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  quoteText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#E2E8F0',
    fontStyle: 'italic',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  certPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  certPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
  },
  achievementsList: {
    gap: 6,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
    borderRadius: 12,
  },
  starBullet: {
    marginTop: 2,
  },
  achievementText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#F1F5F9',
    lineHeight: 16,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  specChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  continueBtn: {
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
});
