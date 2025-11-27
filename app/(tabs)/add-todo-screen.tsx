import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddTodoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) {
      Alert.alert('Missing title', 'Please add a short title before saving.');
      return;
    }

    Alert.alert('Todo created', 'Your todo was created successfully.');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title" style={styles.heading}>
        New Todo
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subheading}>
        Capture the task, add a note, and pick a priority.
      </ThemedText>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Title</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Buy groceries"
          placeholderTextColor={palette.icon}
          style={[styles.input, { color: palette.text, borderColor: palette.icon }]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add details, links, or context..."
          placeholderTextColor={palette.icon}
          multiline
          numberOfLines={4}
          style={[
            styles.input,
            styles.multilineInput,
            { color: palette.text, borderColor: palette.icon },
          ]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Priority</ThemedText>
        <View style={styles.priorityRow}>
          {(['low', 'medium', 'high'] as const).map((level) => {
            const isSelected = priority === level;
            return (
              <Pressable
                key={level}
                onPress={() => setPriority(level)}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? palette.tint : palette.icon,
                    backgroundColor: isSelected ? palette.tint + '22' : 'transparent',
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: isSelected ? palette.tint : palette.text },
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        <Button title="Create" variant="primary" onPress={handleSave} disabled={!canSave} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  heading: {
    marginTop: 8,
  },
  subheading: {
    opacity: 0.8,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: '600',
  },
  actions: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 12,
  },
});
