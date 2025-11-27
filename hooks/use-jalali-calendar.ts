import { useMemo } from 'react';
import { JalaliDateParts, formatJalaliDate, isoToJalaliParts, jalaliPartsToIso, todayIso } from '@/utils/date';

type InputValue = string | Date | null | undefined;

type Options = {
  fallbackToToday?: boolean;
};

const normalizeIsoDate = (value: InputValue, fallbackToToday: boolean) => {
  if (!value) {
    return fallbackToToday ? todayIso() : null;
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return fallbackToToday ? todayIso() : null;
  }

  if (Number.isNaN(value.getTime())) {
    return fallbackToToday ? todayIso() : null;
  }
  return value.toISOString().slice(0, 10);
};

export const useJalaliCalendar = (value: InputValue, options: Options = {}) => {
  const { fallbackToToday = false } = options;

  const isoDate = useMemo(() => normalizeIsoDate(value, fallbackToToday), [value, fallbackToToday]);

  const jalaliParts = useMemo(() => (isoDate ? isoToJalaliParts(isoDate) : null), [isoDate]);
  const jalaliLabel = useMemo(() => (isoDate ? formatJalaliDate(isoDate) : ''), [isoDate]);

  return {
    isoDate,
    jalaliParts,
    jalaliLabel,
    isValid: Boolean(isoDate && jalaliParts),
    toJalaliParts: isoToJalaliParts,
    toIsoFromParts: (parts: JalaliDateParts) => jalaliPartsToIso(parts),
  };
};
