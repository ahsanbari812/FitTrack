import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Apple, Dumbbell, Edit3, TrendingUp, ShieldCheck } from 'lucide-react-native';
import { useUIStore } from '../lib/store';
import { DARK_THEME } from '../theme/theme';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { CoachProfileModal } from '../components/CoachProfileModal';
import { useHeadCoachProfile } from '../lib/queries/profiles';
import { ClientHomeScreen } from '../screens/client/HomeScreen';
import { ClientDietPlanScreen } from '../screens/client/DietPlanScreen';
import { ClientExercisePlanScreen } from '../screens/client/ExercisePlanScreen';
import { ClientLogEntryScreen } from '../screens/client/LogEntryScreen';
import { ClientProgressHistoryScreen } from '../screens/client/ProgressHistoryScreen';

export const ClientNavigator: React.FC = () => {
  const {
    clientActiveTab,
    setClientActiveTab,
    logout,
    user,
    isCoachProfileModalOpen,
    setCoachProfileModalOpen,
  } = useUIStore();
  const theme = DARK_THEME;
  const insets = useSafeAreaInsets();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { data: coachProfile } = useHeadCoachProfile();

  const renderScreen = () => {
    switch (clientActiveTab) {
      case 'home':
        return <ClientHomeScreen />;
      case 'diet':
        return <ClientDietPlanScreen />;
      case 'workout':
        return <ClientExercisePlanScreen />;
      case 'log':
        return <ClientLogEntryScreen />;
      case 'progress':
        return <ClientProgressHistoryScreen />;
      default:
        return <ClientHomeScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.glassBackground,
            borderColor: theme.cardBorder,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        {/* Brand: Official Logo + FITTRACK */}
        <TouchableOpacity
          onPress={() => setClientActiveTab('home')}
          style={styles.brandRow}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/app-logo.png')}
            style={styles.brandLogoImg}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            FIT<Text style={styles.neonText}>TRACK</Text>
          </Text>
        </TouchableOpacity>

        {/* Athlete Profile Button */}
        <TouchableOpacity
          onPress={() => setIsProfileMenuOpen(true)}
          style={[
            styles.profilePill,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.cardBorder,
            },
          ]}
          activeOpacity={0.75}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text
            style={[styles.profileName, { color: theme.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user?.name?.split(' ')[0] || 'Athlete'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meet Your Coach Floating Card Modal */}
      <CoachProfileModal
        isOpen={isCoachProfileModalOpen}
        onClose={() => setCoachProfileModalOpen(false)}
      />

      {/* Profile Dropdown Dark Menu */}
      <ProfileDropdown
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        user={user}
        role="Client"
        onLogout={logout}
      />

      {/* Main Canvas */}
      <View style={styles.canvas}>{renderScreen()}</View>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.glassBackground,
            borderColor: theme.cardBorder,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setClientActiveTab('home')}
          style={styles.navTab}
        >
          <Home size={20} color={clientActiveTab === 'home' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: clientActiveTab === 'home' ? '#CCFF00' : '#64748B' }]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setClientActiveTab('diet')}
          style={styles.navTab}
        >
          <Apple size={20} color={clientActiveTab === 'diet' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: clientActiveTab === 'diet' ? '#CCFF00' : '#64748B' }]}>
            Diet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setClientActiveTab('workout')}
          style={styles.navTab}
        >
          <Dumbbell size={20} color={clientActiveTab === 'workout' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: clientActiveTab === 'workout' ? '#CCFF00' : '#64748B' }]}>
            Workout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setClientActiveTab('log')}
          style={styles.navTab}
        >
          <Edit3 size={20} color={clientActiveTab === 'log' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: clientActiveTab === 'log' ? '#CCFF00' : '#64748B' }]}>
            Daily Log
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setClientActiveTab('progress')}
          style={styles.navTab}
        >
          <TrendingUp size={20} color={clientActiveTab === 'progress' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: clientActiveTab === 'progress' ? '#CCFF00' : '#64748B' }]}>
            Progress
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandLogoImg: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  neonText: {
    color: '#CCFF00',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 3,
    paddingRight: 8,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  profileName: {
    fontSize: 11.5,
    fontWeight: '800',
    maxWidth: 72,
  },
  canvas: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  navTab: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
