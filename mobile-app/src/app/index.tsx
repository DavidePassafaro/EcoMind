import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useOnboarding } from '@/providers/onboarding-context';

export default function IndexRoute() {
  const { completed, isReady } = useOnboarding();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return <Redirect href={completed ? '/(tabs)' : '/onboarding'} />;
}
