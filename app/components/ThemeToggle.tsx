import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useUIStore } from '../lib/store';
import { LIGHT_THEME, DARK_THEME } from '../theme/theme';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { themeMode, toggleTheme } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={toggleTheme}
        style={[
          styles.compactBtn,
          {
            backgroundColor: theme.surfaceVariant,
            borderColor: theme.cardBorder,
          },
        ]}
        activeOpacity={0.7}
      >
        {themeMode === 'dark' ? (
          <Sun size={17} color="#FBBF24" />
        ) : (
          <Moon size={17} color="#0EA5E9" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.button,
        {
          backgroundColor: theme.surfaceVariant,
          borderColor: theme.cardBorder,
        },
      ]}
      activeOpacity={0.7}
    >
      {themeMode === 'dark' ? (
        <>
          <Sun size={16} color="#FBBF24" />
          <Text style={[styles.text, { color: theme.textPrimary }]}>Light</Text>
        </>
      ) : (
        <>
          <Moon size={16} color="#0EA5E9" />
          <Text style={[styles.text, { color: theme.textPrimary }]}>Dark</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  compactBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
