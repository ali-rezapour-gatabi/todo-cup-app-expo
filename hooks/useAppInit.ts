import { useEffect } from 'react';

import { useTodoStore } from '@/stores/useTodoStore';

export const useAppInit = () => {
  const loadProfile = useTodoStore((state) => state.loadProfile);
  const loadTasks = useTodoStore((state) => state.loadTasks);
  const runDailyRepeatCheck = useTodoStore((state) => state.runDailyRepeatCheck);

  useEffect(() => {
    (async () => {
      await loadProfile();
      await loadTasks();
      await runDailyRepeatCheck();
    })();
  }, [loadProfile, loadTasks, runDailyRepeatCheck]);
};
