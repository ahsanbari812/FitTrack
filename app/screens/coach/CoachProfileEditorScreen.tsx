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
} from 'react-native';
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
  Quote,
  Check,
  Briefcase,
  Layers,
  Image as ImageIcon,
  Trash2,
  Phone,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useHeadCoachProfile, useUpdateCoachProfile } from '../../lib/queries/profiles';
import { DARK_THEME } from '../../theme/theme';
import { supabase } from '../../lib/supabase';

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
  const { themeMode, user, setUser, setCoachActiveTab } = useUIStore();
  const theme = DARK_THEME;

  const { data: coachProfile } = useHeadCoachProfile();
  const updateProfileMutation = useUpdateCoachProfile();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [coachTitle, setCoachTitle] = useState('Head Coach & Elite Performance Specialist');
  const [experienceYears, setExperienceYears] = useState(10);
  const [certifications, setCertifications] = useState<string[]>([
    'CSCS Certified',
    'ISSA Master Trainer',
    'Precision Nutrition L2',
  ]);
  const [achievements, setAchievements] = useState<string[]>([
    '10+ Years High-Performance Coaching',
    '150+ Proven Athlete Transformations',
    'Specialized in Strength & Body Recomposition',
  ]);
  const [specialties, setSpecialties] = useState<string[]>([
    'Hypertrophy',
    'Strength & Power',
    'Body Recomposition',
    'Fat Loss',
  ]);
  const [coachPhilosophy, setCoachPhilosophy] = useState(
    'Science-backed programming tailored to your unique biomechanics, lifestyle, and goals. We train with purpose, eat with precision, and build lasting habits.'
  );
  const [instagramHandle, setInstagramHandle] = useState('@coach.ahsan');
  const [phoneDigits, setPhoneDigits] = useState('');

  // Input states for adding custom items
  const [customCertInput, setCustomCertInput] = useState('');
  const [customAchieveInput, setCustomAchieveInput] = useState('');
  const [customSpecInput, setCustomSpecInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Bottom Toast Animation
  const toastTranslateY = useRef(new Animated.Value(60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (coachProfile) {
      if (coachProfile.avatar_url) setAvatarUrl(coachProfile.avatar_url);
      if (coachProfile.coach_title) setCoachTitle(coachProfile.coach_title);
      if (coachProfile.experience_years) setExperienceYears(coachProfile.experience_years);
      if (coachProfile.certifications && coachProfile.certifications.length > 0)
        setCertifications(coachProfile.certifications);
      if (coachProfile.achievements && coachProfile.achievements.length > 0)
        setAchievements(coachProfile.achievements);
      if (coachProfile.specialties && coachProfile.specialties.length > 0)
        setSpecialties(coachProfile.specialties);
      if (coachProfile.coach_philosophy) setCoachPhilosophy(coachProfile.coach_philosophy);
      if (coachProfile.instagram_handle) setInstagramHandle(coachProfile.instagram_handle);
      if (coachProfile.phone_number) {
        const digits = coachProfile.phone_number.startsWith('+92')
          ? coachProfile.phone_number.slice(3)
          : coachProfile.phone_number;
        setPhoneDigits(digits);
      }
    }
  }, [coachProfile]);

  // Photo Picker Helpers
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

  // Certifications Helpers
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

  // Achievements Helpers
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

  // Specialties Helpers
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

  // Save All Profile Details
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
          experience_years: experienceYears,
          certifications: certifications,
          achievements: achievements,
          specialties: specialties,
          coach_philosophy: coachPhilosophy.trim(),
          instagram_handle: instagramHandle.trim(),
          phone_number: fullPhoneNumber,
        },
      });

      // Update local Auth store so coach avatar & profile instantly reflect everywhere
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'height' : undefined}
      style={{ flex: 1, position: 'relative' }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation / Header Row */}
        <View style={styles.headerRow}>
          {!isOnboarding && (
            <TouchableOpacity
              onPress={() => setCoachActiveTab('dashboard')}
              style={styles.backBtn}
              activeOpacity={0.75}
            >
              <ArrowLeft size={16} color="#94A3B8" />
              <Text style={styles.backBtnText}>Dashboard</Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isOnboarding ? 'Complete Your Coach Profile' : 'Edit Coach Profile'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Your credentials, bio, and achievements shown to athletes
            </Text>
          </View>
        </View>

        {/* 1. Avatar Upload Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <User size={14} color="#CCFF00" />
            <Text style={styles.cardTitle}>COACH PROFILE PICTURE</Text>
          </View>

          <View style={styles.avatarCardBody}>
            <View style={styles.previewAvatarWrapLarge}>
              {avatarUrl || user?.avatar ? (
                <Image source={{ uri: avatarUrl || user?.avatar }} style={styles.previewAvatarLarge} />
              ) : (
                <View style={styles.previewAvatarFallbackLarge}>
                  <Text style={styles.fallbackInitialLarge}>{user?.name?.[0]?.toUpperCase() || 'C'}</Text>
                </View>
              )}
              <View style={styles.verifiedDotLarge}>
                <ShieldCheck size={14} color="#0F172A" />
              </View>
            </View>

            <View style={styles.uploadButtonsCol}>
              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={styles.uploadPrimaryBtn}
                activeOpacity={0.8}
              >
                <ImageIcon size={16} color="#0F172A" />
                <Text style={styles.uploadPrimaryBtnText}>Upload from Gallery</Text>
              </TouchableOpacity>

              {avatarUrl ? (
                <TouchableOpacity
                  onPress={() => setAvatarUrl('')}
                  style={styles.removePhotoBtn}
                  activeOpacity={0.75}
                >
                  <Trash2 size={13} color="#EF4444" />
                  <Text style={styles.removePhotoBtnText}>Remove Photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* 2. Professional Title & Experience */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Briefcase size={14} color="#CCFF00" />
            <Text style={styles.cardTitle}>PROFESSIONAL TITLE & EXPERIENCE</Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Headline / Professional Title</Text>
            <TextInput
              value={coachTitle}
              onChangeText={setCoachTitle}
              placeholder="e.g. Head Coach & Elite Performance Specialist"
              placeholderTextColor="#64748B"
              style={styles.textInput}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Years of Coaching Experience</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() => setExperienceYears(Math.max(1, experienceYears - 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>-</Text>
              </TouchableOpacity>
              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperValueText}>{experienceYears} Years</Text>
              </View>
              <TouchableOpacity
                onPress={() => setExperienceYears(experienceYears + 1)}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Instagram / Social Handle</Text>
            <View style={styles.inputWithIcon}>
              <Instagram size={14} color="#38BDF8" />
              <TextInput
                value={instagramHandle}
                onChangeText={setInstagramHandle}
                placeholder="@coach.handle"
                placeholderTextColor="#64748B"
                style={[styles.textInputBorderless, { color: '#38BDF8' }]}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Contact Phone Number (+92)</Text>
            <View style={styles.inputWithIcon}>
              <Phone size={14} color="#CCFF00" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#CCFF00', marginLeft: 2 }}>+92</Text>
              <TextInput
                value={phoneDigits}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setPhoneDigits(cleaned);
                }}
                placeholder="3001234567"
                placeholderTextColor="#64748B"
                style={[styles.textInputBorderless, { color: '#FFFFFF', flex: 1 }]}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <Text style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic' }}>
              Visible to athletes in your coach profile modal
            </Text>
          </View>
        </View>

        {/* 3. Certifications */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Award size={14} color="#34D399" />
            <Text style={[styles.cardTitle, { color: '#34D399' }]}>CERTIFICATIONS & CREDENTIALS</Text>
          </View>

          {/* Active Selected Certifications */}
          <View style={styles.chipsWrap}>
            {certifications.map((cert, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleToggleCert(cert)}
                style={styles.activeCertChip}
                activeOpacity={0.7}
              >
                <Check size={11} color="#34D399" />
                <Text style={styles.activeCertChipText}>{cert}</Text>
                <X size={11} color="#34D399" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Suggestions */}
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldSubLabel}>Tap to add credential suggestions:</Text>
            <View style={styles.chipsWrap}>
              {CERTIFICATION_SUGGESTIONS.map((sug) => {
                const isSelected = certifications.includes(sug);
                if (isSelected) return null;
                return (
                  <TouchableOpacity
                    key={sug}
                    onPress={() => handleToggleCert(sug)}
                    style={styles.sugChip}
                    activeOpacity={0.8}
                  >
                    <Plus size={11} color="#94A3B8" />
                    <Text style={styles.sugChipText}>{sug}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Add Custom Certification */}
          <View style={styles.addItemRow}>
            <TextInput
              value={customCertInput}
              onChangeText={setCustomCertInput}
              placeholder="Add custom certification..."
              placeholderTextColor="#64748B"
              style={[styles.textInput, { flex: 1 }]}
              onSubmitEditing={handleAddCustomCert}
            />
            <TouchableOpacity onPress={handleAddCustomCert} style={styles.addBtn} activeOpacity={0.8}>
              <Plus size={14} color="#0F172A" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Key Achievements */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Trophy size={14} color="#FBBF24" />
            <Text style={[styles.cardTitle, { color: '#FBBF24' }]}>KEY ACHIEVEMENTS & ACCOLADES</Text>
          </View>

          {/* Active Selected Achievements */}
          <View style={{ gap: 6 }}>
            {achievements.map((achieve, idx) => (
              <View key={idx} style={styles.activeAchieveItem}>
                <Sparkles size={12} color="#FBBF24" />
                <Text style={styles.activeAchieveText}>{achieve}</Text>
                <TouchableOpacity onPress={() => handleToggleAchievement(achieve)}>
                  <X size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Quick Suggestions */}
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldSubLabel}>Tap to add achievement suggestions:</Text>
            <View style={styles.chipsWrap}>
              {ACHIEVEMENT_SUGGESTIONS.map((sug) => {
                const isSelected = achievements.includes(sug);
                if (isSelected) return null;
                return (
                  <TouchableOpacity
                    key={sug}
                    onPress={() => handleToggleAchievement(sug)}
                    style={styles.sugChip}
                    activeOpacity={0.8}
                  >
                    <Plus size={11} color="#94A3B8" />
                    <Text style={styles.sugChipText}>{sug}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Add Custom Achievement */}
          <View style={styles.addItemRow}>
            <TextInput
              value={customAchieveInput}
              onChangeText={setCustomAchieveInput}
              placeholder="Add custom achievement..."
              placeholderTextColor="#64748B"
              style={[styles.textInput, { flex: 1 }]}
              onSubmitEditing={handleAddCustomAchievement}
            />
            <TouchableOpacity onPress={handleAddCustomAchievement} style={styles.addBtn} activeOpacity={0.8}>
              <Plus size={14} color="#0F172A" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Training Specialties */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Sparkles size={14} color="#38BDF8" />
            <Text style={[styles.cardTitle, { color: '#38BDF8' }]}>TRAINING & NUTRITION SPECIALTIES</Text>
          </View>

          {/* Active Specialties */}
          <View style={styles.chipsWrap}>
            {specialties.map((spec, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleToggleSpecialty(spec)}
                style={styles.activeSpecChip}
                activeOpacity={0.7}
              >
                <Text style={styles.activeSpecChipText}>{spec}</Text>
                <X size={11} color="#38BDF8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Suggestions */}
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldSubLabel}>Tap to add specialties:</Text>
            <View style={styles.chipsWrap}>
              {SPECIALTY_SUGGESTIONS.map((sug) => {
                const isSelected = specialties.includes(sug);
                if (isSelected) return null;
                return (
                  <TouchableOpacity
                    key={sug}
                    onPress={() => handleToggleSpecialty(sug)}
                    style={styles.sugChip}
                    activeOpacity={0.8}
                  >
                    <Plus size={11} color="#94A3B8" />
                    <Text style={styles.sugChipText}>{sug}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 6. Coaching Philosophy & Bio */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Quote size={14} color="#CCFF00" />
            <Text style={styles.cardTitle}>COACHING PHILOSOPHY & WELCOME MESSAGE</Text>
          </View>

          <TextInput
            value={coachPhilosophy}
            onChangeText={setCoachPhilosophy}
            placeholder="Share your coaching philosophy and what athletes can expect..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            style={[styles.textInput, styles.textArea]}
          />
        </View>

        {/* Submit / Save Button */}
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={isSaving}
          style={styles.saveMainBtn}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <>
              <Save size={16} color="#0F172A" />
              <Text style={styles.saveMainBtnText}>
                {isOnboarding ? 'Complete Coach Setup & Enter Dashboard' : 'Save Coach Profile'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Completion Pop-up */}
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
              <Check size={16} color="#0F172A" />
            </View>
            <View style={{ flex: 1 }}>
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
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
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
    backgroundColor: '#090D16',
    borderWidth: 1.5,
    borderColor: '#CCFF00',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
    width: '100%',
    maxWidth: 420,
  },
  toastIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomToastTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bottomToastSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCFF00',
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    gap: 8,
    paddingTop: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 4,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  avatarCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  previewAvatarWrapLarge: {
    position: 'relative',
  },
  previewAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#CCFF00',
  },
  previewAvatarFallbackLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitialLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifiedDotLarge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#090D16',
  },
  uploadButtonsCol: {
    flex: 1,
    gap: 8,
  },
  uploadPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#CCFF00',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  uploadPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  removePhotoBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  fieldSubLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  textInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  textInputBorderless: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#CCFF00',
  },
  stepperValueBox: {
    flex: 1,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeCertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  activeCertChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  sugChip: {
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
  sugChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFF00',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  activeAchieveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    padding: 10,
    borderRadius: 12,
  },
  activeAchieveText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  activeSpecChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  activeSpecChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#CCFF00',
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 6,
  },
  saveMainBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
});
