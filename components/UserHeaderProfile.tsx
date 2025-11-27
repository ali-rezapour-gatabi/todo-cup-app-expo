import { Image, StyleSheet, View, Pressable } from 'react-native';
import { ThemedView } from './themed-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { useJalaliCalendar } from '@/hooks/use-jalali-calendar';
import { router } from 'expo-router';

const UserHeaderProfile = ({ count = 0 }) => {
  const today = new Date();
  const { jalaliLabel: todayJalali } = useJalaliCalendar(today, { fallbackToToday: true });

  return (
    <Pressable onPress={() => router.push('/profile')}>
      <ThemedView style={styles.container}>
        <LinearGradient colors={[Colors.light.tint, Colors.dark.tint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarWrapper}>
          <View style={styles.avatarInner}>
            <Image source={require('@/assets/images/personIcons.png')} style={styles.avatarImage} />
          </View>
        </LinearGradient>

        <ThemedView style={{ marginTop: 10, backgroundColor: 'transparent', gap: 10 }}>
          <ThemedText type="subtitle" style={{ fontSize: 17 }}>
            تاریخ امروز {todayJalali}
          </ThemedText>

          <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>
            تعداد فعالیت‌های امروز شما {count}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
};

export default UserHeaderProfile;

const styles = StyleSheet.create({
  container: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.border + '50',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    zIndex: 1,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    borderRadius: 45,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 65,
    height: 65,
    borderRadius: 40,
  },
});
