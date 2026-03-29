/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#17221D',
    textSecondary: '#5E6F66',
    background: '#F4F8F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E1EEE5',
    border: '#D3E1D8',
    tint: '#2F6A50',
    success: '#58C27D',
    muted: '#CFD7D2',
    heroBackground: '#163427',
    heroAccent: '#58C27D',
    heroAccentSecondary: '#2F6A50',
    heroOverlay: 'rgba(255,255,255,0.12)',
    heroSurface: 'rgba(255,255,255,0.94)',
    heroText: '#F5FFF7',
    heroSubtext: '#C7DED1',
    brandText: '#17553D',
    brandTextStrong: '#0F2B20',
    positiveSurface: '#D7F2E0',
    positiveSurfaceStrong: '#E7F6EC',
    positiveText: '#17553D',
    darkSurface: '#0F2B20',
    darkTextOnBrand: '#F6FFF7',
    chartTrack: '#DDE7E1',
  },
  dark: {
    text: '#EAF3EE',
    textSecondary: '#A7BBB1',
    background: '#09120E',
    backgroundElement: '#102019',
    backgroundSelected: '#173025',
    border: '#284437',
    tint: '#7DD8A0',
    success: '#7DD8A0',
    muted: '#335145',
    heroBackground: '#102019',
    heroAccent: '#58C27D',
    heroAccentSecondary: '#214D3A',
    heroOverlay: 'rgba(255,255,255,0.08)',
    heroSurface: '#EAF3EE',
    heroText: '#F5FFF7',
    heroSubtext: '#B8D0C2',
    brandText: '#8DE0AC',
    brandTextStrong: '#0B1A14',
    positiveSurface: '#173025',
    positiveSurfaceStrong: '#214131',
    positiveText: '#9DE5B8',
    darkSurface: '#0B1A14',
    darkTextOnBrand: '#F6FFF7',
    chartTrack: '#183126',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
