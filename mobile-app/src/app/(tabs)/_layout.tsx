import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { LoadingScreen } from '@/components/loading-screen';
import { useOnboarding } from '@/providers/onboarding-context';

export default function TabsLayout() {
  const { completed, isReady } = useOnboarding();

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
