import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AdminLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#f5f5f5',
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="sites" />
      <Stack.Screen name="sites/create" />
      <Stack.Screen name="sites/edit" />
      <Stack.Screen name="workers" />
      <Stack.Screen name="workers/invite" />
      <Stack.Screen name="workers/invite-admin" />
      <Stack.Screen name="workers/admins" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="support" />
    </Stack>
  );
} 