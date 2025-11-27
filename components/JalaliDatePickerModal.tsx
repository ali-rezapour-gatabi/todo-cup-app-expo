import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { JalaliDateParts, formatJalaliDate, isoToJalaliParts, jalaliMonthLength, jalaliPartsToIso, todayIso } from '@/utils/date';
import { Button } from '@/components/ui/button';

type Props = {
  visible: boolean;
  selectedIsoDate: string;
  onClose: () => void;
  onConfirm: (isoDate: string) => void;
};

const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

const weekDays = ['ج', 'پ', 'چ', 'س', 'د', 'ی', 'ش'];

export const JalaliDatePickerModal = ({ visible, selectedIsoDate, onClose, onConfirm }: Props) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const baseParts = useMemo(() => isoToJalaliParts(selectedIsoDate) ?? (isoToJalaliParts(todayIso()) as JalaliDateParts), [selectedIsoDate]);

  const [monthCursor, setMonthCursor] = useState({ jy: baseParts.jy, jm: baseParts.jm });
  const [selectedDay, setSelectedDay] = useState(baseParts.jd);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const parts = isoToJalaliParts(selectedIsoDate) ?? (isoToJalaliParts(todayIso()) as JalaliDateParts);
    setMonthCursor({ jy: parts.jy, jm: parts.jm });
    setSelectedDay(parts.jd);
  }, [visible, selectedIsoDate]);

  const daysInMonth = useMemo(() => jalaliMonthLength(monthCursor.jy, monthCursor.jm), [monthCursor]);

  const startOffset = useMemo(() => {
    const iso = jalaliPartsToIso({ jy: monthCursor.jy, jm: monthCursor.jm, jd: 1 });
    const utcDay = new Date(`${iso}T00:00:00Z`).getUTCDay();
    return (utcDay + 1) % 7;
  }, [monthCursor]);

  const handleMonthChange = (delta: number) => {
    let nextMonth = monthCursor.jm + delta;
    let nextYear = monthCursor.jy;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const maxDay = jalaliMonthLength(nextYear, nextMonth);
    setMonthCursor({ jy: nextYear, jm: nextMonth });
    setSelectedDay((prev) => Math.min(prev, maxDay));
  };

  const handleConfirm = () => {
    const iso = jalaliPartsToIso({ jy: monthCursor.jy, jm: monthCursor.jm, jd: selectedDay });
    onConfirm(iso);
  };

  const handleGoToToday = () => {
    const today = isoToJalaliParts(todayIso()) as JalaliDateParts;
    setMonthCursor({ jy: today.jy, jm: today.jm });
    setSelectedDay(today.jd);
  };

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, idx) => idx + 1), [daysInMonth]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.header}>
            <Pressable style={styles.navButton} onPress={() => handleMonthChange(-1)} hitSlop={8}>
              <ChevronRight color={palette.text} size={24} />
            </Pressable>
            <View style={styles.headerTitle}>
              <ThemedText style={styles.monthYear} weight="bold">
                {`${monthNames[monthCursor.jm - 1]} ${monthCursor.jy}`}
              </ThemedText>
              <View style={[styles.selectedDateBadge, { backgroundColor: palette.tint + '15', borderColor: palette.tint }]}>
                <ThemedText style={[styles.selectedDateLabel, { color: palette.tint }]} weight="semiBold">
                  {formatJalaliDate(jalaliPartsToIso({ jy: monthCursor.jy, jm: monthCursor.jm, jd: selectedDay }))}
                </ThemedText>
              </View>
            </View>
            <Pressable style={styles.navButton} onPress={() => handleMonthChange(1)} hitSlop={8}>
              <ChevronLeft color={palette.text} size={24} />
            </Pressable>
          </View>

          <View style={styles.calendar}>
            <View style={styles.weekRow}>
              {weekDays.map((label, index) => (
                <View key={label} style={styles.weekDayCell}>
                  <ThemedText style={[styles.weekDay, index === 6 && styles.weekDayFriday]} weight="bold">
                    {label}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {Array.from({ length: startOffset }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.dayCell} />
              ))}
              {days.map((day) => {
                const selected = day === selectedDay;
                const iso = jalaliPartsToIso({ jy: monthCursor.jy, jm: monthCursor.jm, jd: day });
                const utcDay = new Date(`${iso}T00:00:00Z`).getUTCDay();
                const isFriday = utcDay === 5;

                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.dayCell,
                      selected && {
                        backgroundColor: palette.tint,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.dayText, isFriday && !selected && { color: '#ef4444' }, selected && { color: '#fff' }]} weight={selected ? 'bold' : 'medium'}>
                      {day}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={handleGoToToday} style={[styles.todayButton, { borderColor: palette.border, backgroundColor: palette.background }]}>
              <CalendarCheck size={20} color={palette.tint} />
              <ThemedText style={{ color: palette.tint }} weight="semiBold">
                امروز
              </ThemedText>
            </Pressable>
            <Button title="انتخاب" variant="primary" fullWidth onPress={handleConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 10,
  },
  headerTitle: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  monthYear: {
    fontSize: 18,
  },
  selectedDateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedDateLabel: {
    fontSize: 13,
  },
  calendar: {
    gap: 8,
  },
  weekRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  weekDayCell: {
    width: 42,
    alignItems: 'center',
  },
  weekDay: {
    fontSize: 13,
    opacity: 0.7,
  },
  weekDayFriday: {
    color: '#ef4444',
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingTop: 8,
  },
  todayButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
