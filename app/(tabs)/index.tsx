import { StyleSheet, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function Home() {

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Home</ThemedText>
      <Text>Track everything you need to do.</Text>
      <Button title={<Plus color={Colors.light.surface} />} variant="primary" style={styles.addButton} onPress={() => router.push('/(tabs)/add-todo-screen')} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 50,
    right: 50,
    width: 70,
    height: 70,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
});
