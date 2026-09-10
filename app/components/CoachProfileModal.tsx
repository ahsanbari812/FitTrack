import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  PanResponder,
  LayoutChangeEvent,
  ActivityIndicator,
  useWindowDimensions,
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
  Camera,
} from 'lucide-react-native';
import { useHeadCoachProfile } from '../lib/queries/profiles';
import { usePublishedTransformations } from '../lib/queries/transformations';
import { CoachTransformation } from '../types/database';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/theme';

interface CoachProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTimeOnboarding?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80';

// ============================================================================
// BEFORE / AFTER INTERACTIVE SLIDER
// ============================================================================
interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  width: number;
  height: number;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUrl,
  afterUrl,
  width,
  height,
}) => {
  const [sliderWidth, setSliderWidth] = useState(width);
  const sliderPos = useRef(new Animated.Value(width / 2)).current;
  const currentPos = useRef(width / 2);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setSliderWidth(width);
    sliderPos.setValue(width / 2);
    currentPos.current = width / 2;
  }, [width]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          sliderPos.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          const newPos = Math.max(0, Math.min(sliderWidth, currentPos.current + gestureState.dx));
          sliderPos.setValue(newPos);
        },
        onPanResponderRelease: (_, gestureState) => {
          const finalPos = Math.max(0, Math.min(sliderWidth, currentPos.current + gestureState.dx));
          currentPos.current = finalPos;
          sliderPos.setValue(finalPos);
        },
      }),
    [sliderWidth]
  );

  if (imageError) {
    return (
      <View style={[cStyles.imageFallback, { width, height }]}>
        <Camera size={28} color={COLORS.textMuted} />
        <Text style={cStyles.imageFallbackText}>Unable to load transformation images</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' }} {...panResponder.panHandlers}>
      {/* AFTER Image (Full Background) */}
      <Image
        source={{ uri: afterUrl }}
        style={{ width, height, position: 'absolute', top: 0, left: 0 }}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />

      {/* Floating AFTER Label */}
      <View style={cStyles.sliderLabelAfter}>
        <Text style={[cStyles.sliderLabelText, { color: COLORS.brand }]}>AFTER</Text>
      </View>

      {/* BEFORE Image (Clipped overlay) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sliderPos,
          height,
          overflow: 'hidden',
        }}
      >
        <Image
          source={{ uri: beforeUrl }}
          style={{ width, height }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
        {/* Floating BEFORE Label */}
        <View style={cStyles.sliderLabelBefore}>
          <Text style={cStyles.sliderLabelText}>BEFORE</Text>
        </View>
      </Animated.View>

      {/* Draggable Divider Line & Handle */}
      <Animated.View
        style={[
          cStyles.sliderDivider,
          {
            transform: [{ translateX: Animated.subtract(sliderPos, new Animated.Value(1)) }],
            height,
          },
        ]}
      >
        <View style={cStyles.sliderLine} />
        <View style={cStyles.sliderHandle}>
          <View style={cStyles.sliderHandleInner}>
            <View style={cStyles.sliderArrow}>
              <Text style={cStyles.sliderArrowText}>‹</Text>
            </View>
            <View style={cStyles.sliderArrow}>
              <Text style={cStyles.sliderArrowText}>›</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// TRANSFORMATIONS CAROUSEL
// ============================================================================
interface TransformationsCarouselProps {
  transformations: CoachTransformation[];
}

const TransformationsCarousel: React.FC<TransformationsCarouselProps> = ({ transformations }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(Math.min(SCREEN_WIDTH - 64, 400));
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const CARD_PADDING = SPACING.sm;
  const cardWidth = containerWidth > 0 ? containerWidth : 300;
  const imageHeight = Math.min(cardWidth * 1.15, 380);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onMomentumScrollEnd = useCallback((e: any) => {
    if (cardWidth <= 0) return;
    const offset = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / cardWidth);
    setActiveIndex(Math.max(0, Math.min(idx, transformations.length - 1)));
  }, [cardWidth, transformations.length]);

  if (transformations.length === 0) return null;

  return (
    <View style={cStyles.carouselContainer} onLayout={onLayout}>
      {containerWidth > 0 && (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumScrollEnd}
            decelerationRate="fast"
            snapToInterval={cardWidth}
            snapToAlignment="start"
            contentContainerStyle={{ paddingRight: 0 }}
          >
            {transformations.map((t, index) => {
              const clientLabel = `CLIENT ${String(index + 1).padStart(2, '0')}`;
              const inputRange = [
                (index - 1) * cardWidth,
                index * cardWidth,
                (index + 1) * cardWidth,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.92, 1, 0.92],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.6, 1, 0.6],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={t.id}
                  style={[
                    cStyles.slide,
                    {
                      width: cardWidth,
                      transform: [{ scale }],
                      opacity,
                    },
                  ]}
                >
                  <View style={cStyles.slideCard}>
                    {t.before_image_url && t.after_image_url ? (
                      <BeforeAfterSlider
                        beforeUrl={t.before_image_url}
                        afterUrl={t.after_image_url}
                        width={cardWidth - CARD_PADDING * 2}
                        height={imageHeight}
                      />
                    ) : (
                      <View style={[cStyles.imageFallback, { width: cardWidth - CARD_PADDING * 2, height: imageHeight }]}>
                        <Camera size={28} color={COLORS.textMuted} />
                        <Text style={cStyles.imageFallbackText}>Images unavailable</Text>
                      </View>
                    )}
                    <Text style={cStyles.slideClientLabel}>{clientLabel}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>

          {/* Pagination dots */}
          {transformations.length > 1 && (
            <View style={cStyles.pagination}>
              {transformations.map((_, i) => (
                <View
                  key={i}
                  style={[
                    cStyles.dot,
                    i === activeIndex && cStyles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export const CoachProfileModal: React.FC<CoachProfileModalProps> = ({
  isOpen,
  onClose,
  isFirstTimeOnboarding = false,
}) => {
  const { data: coachProfile } = useHeadCoachProfile();
  const coachId = coachProfile?.id;
  const { data: publishedTransformations = [], isLoading: transformationsLoading } = usePublishedTransformations(coachId);
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
              showsVerticalScrollIndicator={true}
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

              {/* ====== TRANSFORMATIONS CAROUSEL ====== */}
              {!transformationsLoading && publishedTransformations.length > 0 && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Camera size={13} color={COLORS.brand} />
                    <Text style={styles.sectionHeaderTitle}>CLIENT TRANSFORMATIONS</Text>
                  </View>
                  <TransformationsCarousel transformations={publishedTransformations} />
                </View>
              )}

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
    maxHeight: Math.min(680, SCREEN_HEIGHT * 0.85),
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

// ============================================================================
// CAROUSEL & SLIDER STYLES
// ============================================================================
const cStyles = StyleSheet.create({
  carouselContainer: {
    width: '100%',
    marginTop: 4,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideCard: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  slideClientLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
  },
  dotActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  imageFallback: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageFallbackText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  sliderDivider: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.textPrimary,
    opacity: 0.8,
  },
  sliderHandle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  sliderHandleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sliderArrow: {
    width: 10,
    alignItems: 'center',
  },
  sliderArrowText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  sliderLabelBefore: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(8, 10, 12, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 5,
  },
  sliderLabelAfter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(8, 10, 12, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 5,
  },
  sliderLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});
