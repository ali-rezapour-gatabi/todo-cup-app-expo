import { useEffect } from 'react';

import { useTodoStore } from '@/stores/useTodoStore';

export const useAppInit = (date?: string | null) => {
  const loadProfile = useTodoStore((state) => state.loadProfile);
  const loadTasks = useTodoStore((state) => state.loadTasks);
  const runDailyRepeatCheck = useTodoStore((state) => state.runDailyRepeatCheck);

  useEffect(() => {
    (async () => {
      await loadProfile();
      await loadTasks(date);
      await runDailyRepeatCheck(date);
    })();
  }, [loadProfile, loadTasks, runDailyRepeatCheck, date]);
};
