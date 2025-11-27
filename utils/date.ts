import jalaali from 'jalaali-js';

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const tomorrowIso = (): string => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().slice(0, 10);
};

export const nowIso = (): string => new Date().toISOString();

export type JalaliDateParts = {
  jy: number;
  jm: number;
  jd: number;
};

const pad = (value: number): string => String(value).padStart(2, '0');

export const isoToJalaliParts = (isoDate: string): JalaliDateParts | null => {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, y, m, d] = match;
  const gy = Number(y);
  const gm = Number(m);
  const gd = Number(d);

  try {
    const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
    return { jy, jm, jd };
  } catch (error) {
    console.error('Error converting to Jalali:', error);
    return null;
  }
};

export const jalaliPartsToIso = (parts: JalaliDateParts): string => {
  const { gy, gm, gd } = jalaali.toGregorian(parts.jy, parts.jm, parts.jd);
  return `${gy}-${pad(gm)}-${pad(gd)}`;
};

export const formatJalaliDate = (isoDate: string): string => {
  const parts = isoToJalaliParts(isoDate);
  if (!parts) {
    return isoDate;
  }
  return `${parts.jy}/${pad(parts.jm)}/${pad(parts.jd)}`;
};

export const jalaliMonthLength = (jy: number, jm: number): number => {
  if (jm <= 6) {
    return 31;
  }
  if (jm <= 11) {
    return 30;
  }
  return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
};

export const isJalaliLeapYear = (jy: number): boolean => {
  return jalaali.isLeapJalaaliYear(jy);
};

export const dateToJalaliParts = (date: Date): JalaliDateParts => {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return { jy, jm, jd };
};

export const jalaliPartsToDate = (parts: JalaliDateParts): Date => {
  return jalaali.toDateObject(parts.jy, parts.jm, parts.jd);
};

export const formatDateToJalali = (date: Date = new Date()): string => {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return `${jy}/${pad(jm)}/${pad(jd)}`;
};

export const todayJalali = (): string => {
  return formatDateToJalali(new Date());
};

export const tomorrowJalali = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateToJalali(tomorrow);
};
