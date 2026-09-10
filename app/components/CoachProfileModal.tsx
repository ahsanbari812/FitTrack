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
  LayoutChangeEvent,
  ActivityIndicator,
  Platform,
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
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Columns,
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

const FALLBACK_TRANSFORMATIONS: CoachTransformation[] = [
  {
    id: 'fallback-tf-1',
    coach_id: 'coach-ahsan',
    before_image_url:
      'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=600&auto=format&fit=crop&q=80',
    after_image_url:
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    is_published: true,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-tf-2',
    coach_id: 'coach-ahsan',
    before_image_url:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    after_image_url:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    is_published: true,
    sort_order: 1,
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  },
];

// ============================================================================
// CLEAN BEFORE / AFTER TRANSFORMATION CARD (WEB & MOBILE OPTIMIZED)
// ============================================================================
type TransformationViewMode = 'compare' | 'before' | 'after';

interface TransformationCardProps {
  transformation: CoachTransformation;
  cardWidth: number;
  clientLabel: string;
  index: number;
  totalCount: number;
  onPrev?: () => void;
  onNext?: () => void;
}

const TransformationCard: React.FC<TransformationCardProps> = ({
  transformation,
  cardWidth,
  clientLabel,
  index,
  totalCount,
  onPrev,
  onNext,
}) => {
  const [viewMode, setViewMode] = useState<TransformationViewMode>('compare');
  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);

  const beforeUrl = transformation.before_image_url;
  const afterUrl = transformation.after_image_url;

  // Responsive height calculations based on container width
  const contentWidth = Math.max(cardWidth - SPACING.md * 2, 240);
  const sideBySideHeight = Math.round(Math.min(Math.max(contentWidth * 0.7, 230), 280));
  const singleViewHeight = Math.round(Math.min(Math.max(contentWidth * 0.85, 270), 320));

  if (!beforeUrl && !afterUrl) {
    return (
      <View style={[cStyles.cardContainer, { width: cardWidth }]}>
        <View style={cStyles.cardHeader}>
          <View style={cStyles.clientBadge}>
            <View style={cStyles.clientDot} />
            <Text style={cStyles.clientLabelText}>{clientLabel}</Text>
          </View>
        </View>
        <View style={[cStyles.imageFallback, { height: 180 }]}>
          <Camera size={26} color={COLORS.textMuted} />
          <Text style={cStyles.imageFallbackText}>Images unavailable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[cStyles.cardContainer, { width: cardWidth }]}>
      {/* Card Header: Client Label + Quick Navigation Controls */}
      <View style={cStyles.cardHeader}>
        <View style={cStyles.clientBadge}>
          <View style={cStyles.clientDot} />
          <Text style={cStyles.clientLabelText}>{clientLabel}</Text>
        </View>

        {totalCount > 1 && (
          <View style={cStyles.navPaging}>
            <TouchableOpacity
              onPress={onPrev}
              disabled={index === 0}
              style={[cStyles.navArrowBtn, index === 0 && cStyles.navArrowBtnDisabled]}
              activeOpacity={0.7}
              accessibilityLabel="Previous client"
            >
              <ChevronLeft size={13} color={index === 0 ? COLORS.textMuted : COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={cStyles.counterText}>
              {index + 1} / {totalCount}
            </Text>
            <TouchableOpacity
              onPress={onNext}
              disabled={index === totalCount - 1}
              style={[cStyles.navArrowBtn, index === totalCount - 1 && cStyles.navArrowBtnDisabled]}
              activeOpacity={0.7}
              accessibilityLabel="Next client"
            >
              <ChevronRight size={13} color={index === totalCount - 1 ? COLORS.textMuted : COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Segmented View Mode Switcher */}
      {beforeUrl && afterUrl && (
        <View style={cStyles.viewSwitcherRow}>
          <TouchableOpacity
            style={[cStyles.viewTab, viewMode === 'compare' && cStyles.viewTabActive]}
            onPress={() => setViewMode('compare')}
            activeOpacity={0.7}
          >
            <Columns size={11} color={viewMode === 'compare' ? COLORS.brand : COLORS.textMuted} />
            <Text style={[cStyles.viewTabText, viewMode === 'compare' && cStyles.viewTabTextActive]}>
              Side-by-Side
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[cStyles.viewTab, viewMode === 'before' && cStyles.viewTabActive]}
            onPress={() => setViewMode('before')}
            activeOpacity={0.7}
          >
            <Text style={[cStyles.viewTabText, viewMode === 'before' && cStyles.viewTabTextActive]}>
              Before
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[cStyles.viewTab, viewMode === 'after' && cStyles.viewTabActive]}
            onPress={() => setViewMode('after')}
            activeOpacity={0.7}
          >
            <Text style={[cStyles.viewTabText, viewMode === 'after' && cStyles.viewTabTextActive]}>
              After
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Visual Content: Side-by-Side View */}
      {viewMode === 'compare' && beforeUrl && afterUrl ? (
        <View style={[cStyles.imagesRow, { height: sideBySideHeight }]}>
          {/* BEFORE Frame */}
          <TouchableOpacity
            style={cStyles.photoCol}
            onPress={() => setViewMode('before')}
            activeOpacity={0.85}
          >
            {beforeError ? (
              <View style={cStyles.imageFallback}>
                <Camera size={20} color={COLORS.textMuted} />
                <Text style={cStyles.imageFallbackText}>Image error</Text>
              </View>
            ) : (
              <Image
                source={{ uri: beforeUrl }}
                style={cStyles.photoImage}
                resizeMode="cover"
                onError={() => setBeforeError(true)}
              />
            )}
            <View style={cStyles.badgeBefore}>
              <Text style={cStyles.badgeTextBefore}>BEFORE</Text>
            </View>
          </TouchableOpacity>

          {/* Central Progression Flow Indicator */}
          <View style={cStyles.centerIndicator} pointerEvents="none">
            <View style={cStyles.centerBadge}>
              <ArrowRight size={12} color={COLORS.brand} />
            </View>
          </View>

          {/* AFTER Frame */}
          <TouchableOpacity
            style={[cStyles.photoCol, cStyles.photoColAfter]}
            onPress={() => setViewMode('after')}
            activeOpacity={0.85}
          >
            {afterError ? (
              <View style={cStyles.imageFallback}>
                <Camera size={20} color={COLORS.textMuted} />
                <Text style={cStyles.imageFallbackText}>Image error</Text>
              </View>
            ) : (
              <Image
                source={{ uri: afterUrl }}
                style={cStyles.photoImage}
                resizeMode="cover"
                onError={() => setAfterError(true)}
              />
            )}
            <View style={cStyles.badgeAfter}>
              <Text style={cStyles.badgeTextAfter}>AFTER</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'before' || (!afterUrl && beforeUrl) ? (
        /* Single BEFORE View */
        <TouchableOpacity
          style={[cStyles.singleCard, { height: singleViewHeight }]}
          onPress={() => setViewMode('compare')}
          activeOpacity={0.9}
        >
          {beforeError || !beforeUrl ? (
            <View style={cStyles.imageFallback}>
              <Camera size={24} color={COLORS.textMuted} />
              <Text style={cStyles.imageFallbackText}>Before image unavailable</Text>
            </View>
          ) : (
            <Image
              source={{ uri: beforeUrl }}
              style={cStyles.photoImage}
              resizeMode="cover"
              onError={() => setBeforeError(true)}
            />
          )}
          <View style={cStyles.badgeBefore}>
            <Text style={cStyles.badgeTextBefore}>BEFORE</Text>
          </View>
          {afterUrl && (
            <View style={cStyles.tapHintBar}>
              <Text style={cStyles.tapHintText}>Tap to return to side-by-side</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        /* Single AFTER View */
        <TouchableOpacity
          style={[cStyles.singleCard, cStyles.singleCardAfter, { height: singleViewHeight }]}
          onPress={() => setViewMode('compare')}
          activeOpacity={0.9}
        >
          {afterError || !afterUrl ? (
            <View style={cStyles.imageFallback}>
              <Camera size={24} color={COLORS.textMuted} />
              <Text style={cStyles.imageFallbackText}>After image unavailable</Text>
            </View>
          ) : (
            <Image
              source={{ uri: afterUrl }}
              style={cStyles.photoImage}
              resizeMode="cover"
              onError={() => setAfterError(true)}
            />
          )}
          <View style={cStyles.badgeAfter}>
            <Text style={cStyles.badgeTextAfter}>AFTER</Text>
          </View>
          {beforeUrl && (
            <View style={cStyles.tapHintBar}>
              <Text style={cStyles.tapHintText}>Tap to return to side-by-side</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
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

  const cardWidth = containerWidth > 0 ? containerWidth : 320;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const onMomentumScrollEnd = useCallback((e: any) => {
    if (cardWidth <= 0) return;
    const offset = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / cardWidth);
    setActiveIndex(Math.max(0, Math.min(idx, transformations.length - 1)));
  }, [cardWidth, transformations.length]);

  const handleGoTo = useCallback((targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < transformations.length) {
      setActiveIndex(targetIndex);
      scrollRef.current?.scrollTo({ x: targetIndex * cardWidth, animated: true });
    }
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
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumScrollEnd}
            decelerationRate="fast"
            snapToInterval={cardWidth}
            snapToAlignment="start"
            contentContainerStyle={{ paddingRight: 0 }}
            style={{
              ...(Platform.OS === 'web'
                ? ({
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  } as any)
                : {}),
            }}
          >
            {transformations.map((t, index) => {
              const clientLabel = `CLIENT ${String(index + 1).padStart(2, '0')}`;
              return (
                <View key={t.id} style={{ width: cardWidth }}>
                  <TransformationCard
                    transformation={t}
                    cardWidth={cardWidth}
                    clientLabel={clientLabel}
                    index={index}
                    totalCount={transformations.length}
                    onPrev={() => handleGoTo(index - 1)}
                    onNext={() => handleGoTo(index + 1)}
                  />
                </View>
              );
            })}
          </ScrollView>

          {/* Clean Interactive Pagination Dots */}
          {transformations.length > 1 && (
            <View style={cStyles.pagination}>
              {transformations.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleGoTo(i)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <View
                    style={[
                      cStyles.dot,
                      i === activeIndex && cStyles.dotActive,
                    ]}
                  />
                </TouchableOpacity>
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

  const displayTransformations =
    publishedTransformations.length > 0 ? publishedTransformations : FALLBACK_TRANSFORMATIONS;

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

              {/* ====== TRANSFORMATIONS CAROUSEL ====== */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Camera size={13} color={COLORS.brand} />
                  <Text style={styles.sectionHeaderTitle}>CLIENT TRANSFORMATIONS</Text>
                </View>
                <TransformationsCarousel transformations={displayTransformations} />
              </View>

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
    ...(Platform.OS === 'web'
      ? ({
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as any)
      : {}),
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
  cardContainer: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brand,
  },
  clientLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
  },
  navPaging: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.3,
  },
  counterText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  viewSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 2,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm - 2,
    gap: 4,
  },
  viewTabActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.3)',
  },
  viewTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  viewTabTextActive: {
    color: COLORS.brand,
    fontWeight: '700',
  },
  imagesRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs + 2,
  },
  photoCol: {
    flex: 1,
    height: '100%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#080A0C',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  photoColAfter: {
    borderColor: 'rgba(199, 240, 0, 0.35)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  badgeBefore: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(8, 10, 12, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 5,
  },
  badgeTextBefore: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  badgeAfter: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(8, 10, 12, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.35)',
    zIndex: 5,
  },
  badgeTextAfter: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 0.8,
  },
  centerIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -13 }, { translateY: -13 }],
    zIndex: 10,
  },
  centerBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: 'rgba(199, 240, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 8,
  },
  singleCard: {
    width: '100%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#080A0C',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  singleCardAfter: {
    borderColor: 'rgba(199, 240, 0, 0.4)',
  },
  tapHintBar: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(8, 10, 12, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tapHintText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
  },
  dotActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
    width: 16,
    borderRadius: 3,
  },
  imageFallback: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: SPACING.md,
  },
  imageFallbackText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
