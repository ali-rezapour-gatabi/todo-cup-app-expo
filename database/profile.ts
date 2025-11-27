import { getFirst, run } from '@/database';
import { Profile, ProfileInput, ProfileRow, ProfileSettings } from '@/database/types';
import { validateProfileInput } from '@/utils/validation';

const parseSettings = (settingsJson: string | null): ProfileSettings => {
  if (!settingsJson) return {};
  try {
    return JSON.parse(settingsJson) as ProfileSettings;
  } catch {
    return {};
  }
};

const normalizeProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  name: row.name ?? 'کاربر',
  avatar: row.avatar,
  settings: parseSettings(row.settingsJson),
});

export const fetchProfile = async (): Promise<Profile | null> => {
  const row = await getFirst<ProfileRow>('SELECT * FROM profile LIMIT 1');
  return row ? normalizeProfile(row) : null;
};

export const upsertProfile = async (input: ProfileInput): Promise<Profile> => {
  validateProfileInput(input);
  const existing = await fetchProfile();
  const nextSettings = {
    ...(existing?.settings ?? {}),
    ...(input.settings ?? {}),
  };
  const payload = {
    name: input.name ?? existing?.name ?? 'کاربر',
    avatar: input.avatar ?? existing?.avatar ?? null,
    settingsJson: JSON.stringify(nextSettings),
  };

  if (existing) {
    await run('UPDATE profile SET name = ?, avatar = ?, settingsJson = ? WHERE id = ?', [payload.name, payload.avatar, payload.settingsJson, existing.id]);
    return (await fetchProfile()) as Profile;
  }

  const result = await run('INSERT INTO profile (name, avatar, settingsJson) VALUES (?, ?, ?)', [payload.name, payload.avatar, payload.settingsJson]);

  const inserted = await getFirst<ProfileRow>('SELECT * FROM profile WHERE id = ?', [result.lastInsertRowId]);
  if (!inserted) {
    throw new Error('ذخیره پروفایل ناموفق بود.');
  }
  return normalizeProfile(inserted);
};
