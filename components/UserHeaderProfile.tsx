import { Image, StyleSheet, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { useJalaliCalendar } from '@/hooks/use-jalali-calendar';
import { router } from 'expo-router';
import { useTodoStore } from '@/stores/useTodoStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarClock, ChevronLeft } from 'lucide-react-native';

const UserHeaderProfile = () => {
  const profile = useTodoStore().profile;
  const scheme = useColorScheme();
  const palette = Colors[scheme];
  const today = new Date();
  const { jalaliLabel: todayJalali } = useJalaliCalendar(today, { fallbackToToday: true });
  const accentText = scheme === 'dark' ? '#F6F5FF' : '#FDFBFF';
  const name = profile?.name ?? 'کاربر';

  return (
    <Pressable onPress={() => router.push('/profile')} style={{ marginBottom: 10 }}>
      <LinearGradient
        colors={[palette.tint + 'f0', palette.tint + 'c8', palette.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { shadowColor: palette.tint, borderColor: palette.border }]}
      >
        <View style={styles.content}>
          <View style={styles.avatarColumn}>
            <LinearGradient colors={[palette.tabIconDefault, palette.background]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarWrapper}>
              <Image source={require('@/assets/images/personIcons.png')} style={styles.avatarImage} />
            </LinearGradient>
          </View>

          <View style={styles.textColumn}>
            <ThemedText type="subtitle" style={[styles.greeting, { color: accentText }]}>
              سلام {name}
            </ThemedText>
            <View style={styles.linkRow}>
              <View style={[styles.datePill, { backgroundColor: palette.surface + '25', borderColor: palette.surface + '35' }]}>
                <CalendarClock color={accentText} size={16} />
                <ThemedText weight="semiBold" style={[styles.dateText, { color: accentText }]}>
                  {todayJalali}
                </ThemedText>
              </View>
            </View>
          </View>
          <ChevronLeft color={accentText} size={28} />
        </View>
      </LinearGradient>
    </Pressable>
  );
};

export default UserHeaderProfile;

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 16,
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarColumn: {
    alignItems: 'center',
    gap: 5,
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  avatarInner: {
    width: 70,
    height: 70,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
  textColumn: {
    flex: 1,
    marginRight: 10,
  },
  greeting: {
    fontSize: 20,
  },
  helper: {
    fontSize: 12,
    lineHeight: 30,
  },
  linkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 15,
  },
  datePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
  },
});
