import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Apple, Dumbbell, Edit3, TrendingUp } from 'lucide-react-native';
import { useUIStore } from '../lib/store';
import { DARK_THEME } from '../theme/theme';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { CoachProfileModal } from '../components/CoachProfileModal';
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
        <View style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}>
          {/* Brand: Official Logo + FITTRACK */}
          <TouchableOpacity
            onPress={() => setClientActiveTab('home')}
            style={styles.brandRow}
            activeOpacity={0.8}
          >
            <View style={styles.logoBadge}>
              <Dumbbell size={16} color="#C7F000" strokeWidth={2.4} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              FIT<Text style={styles.neonText}>TRACK</Text>
            </Text>
          </TouchableOpacity>

          {/* Desktop Navigation Tabs */}
          {isDesktop && (
            <View style={styles.desktopNavRow}>
              <TouchableOpacity
                onPress={() => setClientActiveTab('home')}
                style={[
                  styles.desktopNavTab,
                  clientActiveTab === 'home' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Home
                  size={16}
                  color={clientActiveTab === 'home' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: clientActiveTab === 'home' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Home
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setClientActiveTab('diet')}
                style={[
                  styles.desktopNavTab,
                  clientActiveTab === 'diet' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Apple
                  size={16}
                  color={clientActiveTab === 'diet' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: clientActiveTab === 'diet' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Diet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setClientActiveTab('workout')}
                style={[
                  styles.desktopNavTab,
                  clientActiveTab === 'workout' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Dumbbell
                  size={16}
                  color={clientActiveTab === 'workout' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: clientActiveTab === 'workout' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Workout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setClientActiveTab('log')}
                style={[
                  styles.desktopNavTab,
                  clientActiveTab === 'log' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Edit3
                  size={16}
                  color={clientActiveTab === 'log' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: clientActiveTab === 'log' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Daily Log
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setClientActiveTab('progress')}
                style={[
                  styles.desktopNavTab,
                  clientActiveTab === 'progress' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <TrendingUp
                  size={16}
                  color={clientActiveTab === 'progress' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: clientActiveTab === 'progress' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Progress
                </Text>
              </TouchableOpacity>
            </View>
          )}

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

      {/* Main Canvas with Responsive Container */}
      <View style={styles.canvas}>
        <View style={[styles.canvasInner, isDesktop && styles.desktopCanvasInner]}>
          {renderScreen()}
        </View>
      </View>

      {/* Bottom Navigation (Mobile Only) */}
      {!isDesktop && (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  desktopHeaderInner: {
    maxWidth: 1160,
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#151A1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  neonText: {
    color: '#C7F000',
  },
  desktopNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  desktopNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  desktopNavTabActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  desktopNavText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 10,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 90,
  },
  canvas: {
    flex: 1,
  },
  canvasInner: {
    flex: 1,
    width: '100%',
  },
  desktopCanvasInner: {
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
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
