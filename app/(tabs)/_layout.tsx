import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="add-todo-screen"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
