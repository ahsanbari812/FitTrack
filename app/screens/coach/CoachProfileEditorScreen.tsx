import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Save,
  Award,
  Trophy,
  Sparkles,
  ShieldCheck,
  Plus,
  X,
  Instagram,
  User,
  Check,
  Briefcase,
  Image as ImageIcon,
  Trash2,
  Phone,
  Layers,
  Flame,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useHeadCoachProfile, useUpdateCoachProfile } from '../../lib/queries/profiles';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';

const CERTIFICATION_SUGGESTIONS = [
  'CSCS Certified',
  'NASM-CPT',
  'ISSA Master Trainer',
  'Precision Nutrition L2',
  'ACE Certified',
  'CrossFit L2',
  'NSCA-CPT',
  'USA Weightlifting L1',
];

const ACHIEVEMENT_SUGGESTIONS = [
  '10+ Years High-Performance Coaching',
  '150+ Proven Body Transformations',
  'National Powerlifting Medalist',
  'Former Elite Athlete',
  'Featured Fitness Expert',
  'Coached 20+ Competitive Athletes',
];

const SPECIALTY_SUGGESTIONS = [
  'Hypertrophy',
  'Strength & Power',
  'Body Recomposition',
  'Fat Loss',
  'Athletic Conditioning',
  'Mobility & Recovery',
  'Powerlifting',
  'Lifestyle Nutrition',
];

interface CoachProfileEditorProps {
  isOnboarding?: boolean;
  onFinishOnboarding?: () => void;
}

export const CoachProfileEditorScreen: React.FC<CoachProfileEditorProps> = ({
  isOnboarding = false,
  onFinishOnboarding,
}) => {
  const { user, setUser, setCoachActiveTab } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();

  const { data: coachProfile } = useHeadCoachProfile();
  const updateProfileMutation = useUpdateCoachProfile();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [coachTitle, setCoachTitle] = useState('Head Coach & Elite Performance Specialist');
  const [coachBio, setCoachBio] = useState(
    'High-performance coach dedicated to evidence-based strength, metabolic conditioning, and physique transformations.'
  );
  const [coachPhilosophy, setCoachPhilosophy] = useState(
    'Science-backed programming tailored to your unique biomechanics, lifestyle, and goals. We train with purpose, eat with precision, and build lasting habits.'
  );
  const [experienceYears, setExperienceYears] = useState(10);
  const [certifications, setCertifications] = useState<string[]>([
    'Level 2 Certified Fitness Trainer - GFT (Global Fitness Trainer)'
  ]);
  const [achievements, setAchievements] = useState<string[]>([
    '5++ Years High-Performance Coaching',
    '20+ Proven Athlete Transformations',
    'Specialized in Strength & Body Recomposition',
  ]);
  const [specialties, setSpecialties] = useState<string[]>([
    'Hypertrophy',
    'Muscle gain',
    'Weight Loss',
    'Strength & Power',
    'Body Recomposition',
    'Fat Loss',
  ]);
  const [instagramHandle, setInstagramHandle] = useState('@coach.ahsan');
  const [phoneDigits, setPhoneDigits] = useState('');

  // Input states for adding custom items
  const [customCertInput, setCustomCertInput] = useState('');
  const [customAchieveInput, setCustomAchieveInput] = useState('');
  const [customSpecInput, setCustomSpecInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Focus states for input borders
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Bottom Toast Animation
  const toastTranslateY = useRef(new Animated.Value(60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (coachProfile) {
      if (coachProfile.avatar_url) setAvatarUrl(coachProfile.avatar_url);
      if (coachProfile.coach_title) setCoachTitle(coachProfile.coach_title);
      if (coachProfile.coach_bio) setCoachBio(coachProfile.coach_bio);
      if (coachProfile.coach_philosophy) setCoachPhilosophy(coachProfile.coach_philosophy);
      if (coachProfile.experience_years) setExperienceYears(coachProfile.experience_years);
      if (coachProfile.certifications && coachProfile.certifications.length > 0)
        setCertifications(coachProfile.certifications);
      if (coachProfile.achievements && coachProfile.achievements.length > 0)
        setAchievements(coachProfile.achievements);
      if (coachProfile.specialties && coachProfile.specialties.length > 0)
        setSpecialties(coachProfile.specialties);
      if (coachProfile.instagram_handle) setInstagramHandle(coachProfile.instagram_handle);
      if (coachProfile.phone_number) {
        const digits = coachProfile.phone_number.startsWith('+92')
          ? coachProfile.phone_number.slice(3)
          : coachProfile.phone_number;
        setPhoneDigits(digits);
      }
    }
  }, [coachProfile]);

  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to select a coach profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setAvatarUrl(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setAvatarUrl(asset.uri);
        }
      }
    } catch (err) {
      console.error('Failed to pick image from gallery:', err);
      Alert.alert('Error', 'Could not load the selected photo. Please try again.');
    }
  };

  const handleToggleCert = (cert: string) => {
    if (certifications.includes(cert)) {
      setCertifications(certifications.filter((c) => c !== cert));
    } else {
      setCertifications([...certifications, cert]);
    }
  };

  const handleAddCustomCert = () => {
    const trimmed = customCertInput.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed]);
      setCustomCertInput('');
    }
  };

  const handleToggleAchievement = (achieve: string) => {
    if (achievements.includes(achieve)) {
      setAchievements(achievements.filter((a) => a !== achieve));
    } else {
      setAchievements([...achievements, achieve]);
    }
  };

  const handleAddCustomAchievement = () => {
    const trimmed = customAchieveInput.trim();
    if (trimmed && !achievements.includes(trimmed)) {
      setAchievements([...achievements, trimmed]);
      setCustomAchieveInput('');
    }
  };

  const handleToggleSpecialty = (spec: string) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter((s) => s !== spec));
    } else {
      setSpecialties([...specialties, spec]);
    }
  };

  const handleAddCustomSpecialty = () => {
    const trimmed = customSpecInput.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      setSpecialties([...specialties, trimmed]);
      setCustomSpecInput('');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSuccessToast(null);

    try {
      const cleanPhone = phoneDigits.replace(/[^0-9]/g, '');
      const fullPhoneNumber = cleanPhone.length > 0 ? `+92${cleanPhone}` : null;

      await updateProfileMutation.mutateAsync({
        coachId: user?.id || '',
        updates: {
          avatar_url: avatarUrl.trim() || undefined,
          coach_title: coachTitle.trim() || 'Head Coach & Elite Performance Specialist',
          coach_bio: coachBio.trim() || undefined,
          coach_philosophy: coachPhilosophy.trim() || undefined,
          experience_years: experienceYears,
          certifications: certifications,
          achievements: achievements,
          specialties: specialties,
          instagram_handle: instagramHandle.trim(),
          phone_number: fullPhoneNumber,
        },
      });

      if (user) {
        setUser({
          ...user,
          avatar: avatarUrl.trim() || user.avatar,
          hasSetCoachProfile: true,
          phone: fullPhoneNumber || undefined,
        });
      }

      setSuccessToast('Coach Profile updated successfully!');
      Animated.parallel([
        Animated.spring(toastTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setSuccessToast(null);
        if (isOnboarding && onFinishOnboarding) {
          onFinishOnboarding();
        } else {
          setCoachActiveTab('dashboard');
        }
      }, 1800);
    } catch (err) {
      console.error('Failed to save coach profile:', err);
      Alert.alert('Error', 'Failed to save coach profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const coachName = user?.name?.trim() || 'Coach Ahsan';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'height' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: isDesktop ? LAYOUT.paddingDesktop : LAYOUT.paddingMobile,
            paddingBottom: isDesktop ? SPACING.xxl : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={[styles.innerWrapper, isDesktop && styles.desktopInnerWrapper]}>
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              {!isOnboarding && (
                <TouchableOpacity
                  onPress={() => setCoachActiveTab('dashboard')}
                  style={styles.backBtn}
                  activeOpacity={0.75}
                >
                  <ArrowLeft size={16} color={COLORS.brand} />
                  <Text style={styles.backBtnText}>DASHBOARD</Text>
                </TouchableOpacity>
              )}

              {/* Desktop Top-Right Save */}
              {isDesktop && (
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  style={styles.desktopSaveBtn}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#080A0C" />
                  ) : (
                    <>
                      <Save size={15} color="#080A0C" strokeWidth={2.4} />
                      <Text style={styles.desktopSaveBtnText}>SAVE PROFILE</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.headerTitlesCol}>
              <Text style={styles.headerKicker}>HEAD COACH</Text>
              <Text style={styles.screenTitle}>COACH PROFILE</Text>
              <Text style={styles.screenSubtitle}>
                Build your professional coaching identity.
              </Text>
            </View>
          </View>

          {/* ================= PROFILE PREVIEW SURFACE ================= */}
          <View style={styles.previewSurface}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.previewKicker}>LIVE PROFILE PREVIEW</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>ATHLETE VIEW</Text>
              </View>
            </View>

            <View style={styles.previewContentRow}>
              {/* Avatar with Verified Dot */}
              <View style={styles.previewAvatarWrap}>
                {avatarUrl || user?.avatar ? (
                  <Image
                    source={{ uri: avatarUrl || user?.avatar }}
                    style={styles.previewAvatarImg}
                  />
                ) : (
                  <View style={styles.previewAvatarFallback}>
                    <Text style={styles.previewAvatarLetter}>
                      {(coachName[0] || 'C').toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={13} color="#080A0C" strokeWidth={2.6} />
                </View>
              </View>

              {/* Info Column */}
              <View style={styles.previewInfoCol}>
                <Text style={styles.previewCoachName}>{coachName}</Text>
                <Text style={styles.previewCoachTitle} numberOfLines={2}>
                  {coachTitle || 'Head Coach & Performance Specialist'}
                </Text>

                <View style={styles.previewMetaRow}>
                  <View style={styles.experiencePill}>
                    <Flame size={12} color={COLORS.brand} />
                    <Text style={styles.experiencePillText}>
                      {experienceYears} Years Experience
                    </Text>
                  </View>
                  {instagramHandle ? (
                    <View style={styles.socialPill}>
                      <Instagram size={11} color={COLORS.info} />
                      <Text style={styles.socialPillText}>{instagramHandle}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Live Specialties Preview */}
            {specialties.length > 0 && (
              <View style={styles.previewSpecialtiesRow}>
                {specialties.slice(0, 4).map((spec) => (
                  <View key={spec} style={styles.previewSpecPill}>
                    <Text style={styles.previewSpecText}>{spec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Photo Action Row */}
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={styles.changePhotoBtn}
                activeOpacity={0.8}
              >
                <ImageIcon size={14} color={COLORS.textPrimary} />
                <Text style={styles.changePhotoText}>
                  {avatarUrl ? 'Change Photo' : 'Upload Avatar'}
                </Text>
              </TouchableOpacity>

              {avatarUrl ? (
                <TouchableOpacity
                  onPress={() => setAvatarUrl('')}
                  style={styles.removePhotoBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={13} color="#FF5C5C" />
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* ================= SECTION 1: IDENTITY ================= */}
          <View style={styles.sectionSurface}>
            <View style={styles.sectionTitleRow}>
              <User size={15} color={COLORS.brand} />
              <Text style={styles.sectionHeading}>IDENTITY</Text>
            </View>

            {/* Coach Title */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>COACH TITLE / HEADLINE</Text>
              <TextInput
                value={coachTitle}
                onChangeText={setCoachTitle}
                placeholder="e.g. Head Coach & Elite Performance Specialist"
                placeholderTextColor={COLORS.textMuted}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                style={[
                  styles.standardInput,
                  focusedField === 'title' && styles.inputFocused,
                ]}
              />
            </View>

            {/* Bio */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>COACH BIO</Text>
              <TextInput
                value={coachBio}
                onChangeText={setCoachBio}
                placeholder="Tell athletes about your background, coaching journey, and mission..."
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={3}
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
                style={[
                  styles.textAreaInput,
                  focusedField === 'bio' && styles.inputFocused,
                ]}
              />
            </View>
          </View>

          {/* ================= SECTION 2: COACHING ================= */}
          <View style={styles.sectionSurface}>
            <View style={styles.sectionTitleRow}>
              <Briefcase size={15} color={COLORS.brand} />
              <Text style={styles.sectionHeading}>COACHING</Text>
            </View>

            {/* Training Philosophy */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>TRAINING PHILOSOPHY</Text>
              <TextInput
                value={coachPhilosophy}
                onChangeText={setCoachPhilosophy}
                placeholder="Share your core methodology, standards, and what athletes can expect..."
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={3}
                onFocus={() => setFocusedField('philosophy')}
                onBlur={() => setFocusedField(null)}
                style={[
                  styles.textAreaInput,
                  focusedField === 'philosophy' && styles.inputFocused,
                ]}
              />
            </View>

            {/* Specialties */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>SPECIALTIES & METHODOLOGIES</Text>

              {/* Active Selected Specialties */}
              <View style={styles.chipsContainer}>
                {specialties.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    onPress={() => handleToggleSpecialty(spec)}
                    style={styles.activePill}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activePillText}>{spec}</Text>
                    <X size={12} color={COLORS.brand} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Suggestions */}
              <Text style={styles.suggestionsMicroLabel}>SUGGESTIONS:</Text>
              <View style={styles.chipsContainer}>
                {SPECIALTY_SUGGESTIONS.map((sug) => {
                  if (specialties.includes(sug)) return null;
                  return (
                    <TouchableOpacity
                      key={sug}
                      onPress={() => handleToggleSpecialty(sug)}
                      style={styles.sugPill}
                      activeOpacity={0.7}
                    >
                      <Plus size={11} color={COLORS.textMuted} />
                      <Text style={styles.sugPillText}>{sug}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Add Custom Specialty */}
              <View style={styles.addInputRow}>
                <TextInput
                  value={customSpecInput}
                  onChangeText={setCustomSpecInput}
                  placeholder="Add custom specialty..."
                  placeholderTextColor={COLORS.textMuted}
                  onSubmitEditing={handleAddCustomSpecialty}
                  style={[styles.standardInput, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={handleAddCustomSpecialty}
                  style={styles.inlineAddBtn}
                  activeOpacity={0.8}
                >
                  <Plus size={15} color={COLORS.textPrimary} />
                  <Text style={styles.inlineAddBtnText}>ADD</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Years of Experience Stepper */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>YEARS OF EXPERIENCE</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  onPress={() => setExperienceYears(Math.max(1, experienceYears - 1))}
                  style={styles.stepBtn}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperNumber}>{experienceYears}</Text>
                  <Text style={styles.stepperUnit}>YEARS COACHING</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setExperienceYears(experienceYears + 1)}
                  style={styles.stepBtn}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ================= SECTION 3: CREDENTIALS ================= */}
          <View style={styles.sectionSurface}>
            <View style={styles.sectionTitleRow}>
              <Award size={15} color={COLORS.brand} />
              <Text style={styles.sectionHeading}>CREDENTIALS</Text>
            </View>

            {/* Certifications */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>CERTIFICATIONS & LICENSES</Text>

              {/* Active Certifications */}
              <View style={styles.chipsContainer}>
                {certifications.map((cert) => (
                  <TouchableOpacity
                    key={cert}
                    onPress={() => handleToggleCert(cert)}
                    style={styles.activePill}
                    activeOpacity={0.7}
                  >
                    <Check size={12} color={COLORS.brand} />
                    <Text style={styles.activePillText}>{cert}</Text>
                    <X size={12} color={COLORS.brand} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Suggestions */}
              <Text style={styles.suggestionsMicroLabel}>SUGGESTIONS:</Text>
              <View style={styles.chipsContainer}>
                {CERTIFICATION_SUGGESTIONS.map((sug) => {
                  if (certifications.includes(sug)) return null;
                  return (
                    <TouchableOpacity
                      key={sug}
                      onPress={() => handleToggleCert(sug)}
                      style={styles.sugPill}
                      activeOpacity={0.7}
                    >
                      <Plus size={11} color={COLORS.textMuted} />
                      <Text style={styles.sugPillText}>{sug}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Add Custom Certification */}
              <View style={styles.addInputRow}>
                <TextInput
                  value={customCertInput}
                  onChangeText={setCustomCertInput}
                  placeholder="Add custom certification..."
                  placeholderTextColor={COLORS.textMuted}
                  onSubmitEditing={handleAddCustomCert}
                  style={[styles.standardInput, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={handleAddCustomCert}
                  style={styles.inlineAddBtn}
                  activeOpacity={0.8}
                >
                  <Plus size={15} color={COLORS.textPrimary} />
                  <Text style={styles.inlineAddBtnText}>ADD</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Key Achievements */}
            <View style={[styles.formGroup, { marginTop: SPACING.md }]}>
              <Text style={styles.fieldLabel}>KEY ACHIEVEMENTS & ACCOLADES</Text>

              {/* Active Achievements */}
              <View style={{ gap: 8 }}>
                {achievements.map((achieve) => (
                  <View key={achieve} style={styles.achievementRow}>
                    <Trophy size={14} color={COLORS.warning} />
                    <Text style={styles.achievementText}>{achieve}</Text>
                    <TouchableOpacity
                      onPress={() => handleToggleAchievement(achieve)}
                      style={{ padding: 4 }}
                    >
                      <X size={13} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Suggestions */}
              <Text style={styles.suggestionsMicroLabel}>SUGGESTIONS:</Text>
              <View style={styles.chipsContainer}>
                {ACHIEVEMENT_SUGGESTIONS.map((sug) => {
                  if (achievements.includes(sug)) return null;
                  return (
                    <TouchableOpacity
                      key={sug}
                      onPress={() => handleToggleAchievement(sug)}
                      style={styles.sugPill}
                      activeOpacity={0.7}
                    >
                      <Plus size={11} color={COLORS.textMuted} />
                      <Text style={styles.sugPillText}>{sug}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Add Custom Achievement */}
              <View style={styles.addInputRow}>
                <TextInput
                  value={customAchieveInput}
                  onChangeText={setCustomAchieveInput}
                  placeholder="Add custom achievement..."
                  placeholderTextColor={COLORS.textMuted}
                  onSubmitEditing={handleAddCustomAchievement}
                  style={[styles.standardInput, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={handleAddCustomAchievement}
                  style={styles.inlineAddBtn}
                  activeOpacity={0.8}
                >
                  <Plus size={15} color={COLORS.textPrimary} />
                  <Text style={styles.inlineAddBtnText}>ADD</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ================= SECTION 4: SOCIAL & CONTACT ================= */}
          <View style={styles.sectionSurface}>
            <View style={styles.sectionTitleRow}>
              <Instagram size={15} color={COLORS.brand} />
              <Text style={styles.sectionHeading}>SOCIAL & CONTACT</Text>
            </View>

            {/* Instagram */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>INSTAGRAM HANDLE</Text>
              <View
                style={[
                  styles.iconInputBox,
                  focusedField === 'instagram' && styles.inputFocused,
                ]}
              >
                <Instagram size={16} color={COLORS.info} />
                <TextInput
                  value={instagramHandle}
                  onChangeText={setInstagramHandle}
                  placeholder="@coach.ahsan"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('instagram')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.iconTextInput}
                />
              </View>
            </View>

            {/* Phone Number (+92) */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>DIRECT ATHLETE PHONE (+92)</Text>
              <View
                style={[
                  styles.iconInputBox,
                  focusedField === 'phone' && styles.inputFocused,
                ]}
              >
                <Phone size={15} color={COLORS.brand} />
                <Text style={styles.phoneCountryPrefix}>+92</Text>
                <TextInput
                  value={phoneDigits}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setPhoneDigits(cleaned);
                  }}
                  placeholder="3001234567"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.iconTextInput}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================= MOBILE STICKY SAVE BUTTON ================= */}
      {!isDesktop && (
        <View
          style={[
            styles.mobileStickyBottom,
            { paddingBottom: Math.max(insets.bottom, SPACING.md) },
          ]}
        >
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isSaving}
            style={styles.mobileSaveBtn}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#080A0C" />
            ) : (
              <>
                <Save size={18} color="#080A0C" strokeWidth={2.4} />
                <Text style={styles.mobileSaveBtnText}>SAVE PROFILE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ================= SUCCESS FLOATING TOAST ================= */}
      {successToast && (
        <Animated.View
          style={[
            styles.bottomToastContainer,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.bottomToastCard}>
            <View style={styles.toastIconWrap}>
              <Check size={16} color="#080A0C" strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.bottomToastTitle}>Coach Profile Saved</Text>
              <Text style={styles.bottomToastSub}>{successToast}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
  innerWrapper: {
    width: '100%',
    gap: SPACING.xl,
  },
  desktopInnerWrapper: {
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },

  // Header
  header: {
    gap: SPACING.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.2,
  },
  desktopSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: RADIUS.sm,
  },
  desktopSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },
  headerTitlesCol: {
    gap: 2,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Live Profile Preview Surface
  previewSurface: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 14,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brand,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  previewContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewAvatarWrap: {
    position: 'relative',
  },
  previewAvatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.brand,
  },
  previewAvatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.brand,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfacePrimary,
  },
  previewInfoCol: {
    flex: 1,
    gap: 3,
  },
  previewCoachName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  previewCoachTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  experiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  experiencePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.info,
  },
  previewSpecialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 43, 49, 0.6)',
  },
  previewSpecPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewSpecText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 43, 49, 0.6)',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removePhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5C5C',
  },

  // Form Section Surfaces
  sectionSurface: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  standardInput: {
    height: 50,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  textAreaInput: {
    minHeight: 130,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  inputFocused: {
    borderColor: COLORS.brand,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brand,
  },
  stepperValueBox: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  stepperNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepperUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
  },
  suggestionsMicroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sugPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sugPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inlineAddBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  // Achievements
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  achievementText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Icon Input Boxes
  iconInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  iconTextInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  phoneCountryPrefix: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
  },

  // Mobile Sticky Save Bottom
  mobileStickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfacePrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    paddingHorizontal: LAYOUT.paddingMobile,
  },
  mobileSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
  },
  mobileSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },

  // Floating Toast
  bottomToastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 99999,
  },
  bottomToastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    width: '100%',
    maxWidth: 420,
  },
  toastIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomToastTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bottomToastSub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.brand,
  },
});
