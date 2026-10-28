import { useCallback, useEffect, useState } from 'react';
import { feedbackTotal } from '@/lib/data';

/** Number of feedback rows saved so far (count only; rows are not exposed). */
export function useFeedbackCount() {
  const [count, setCount] = useState<number | null>(null);

  const reload = useCallback(() => {
    feedbackTotal()
      .then(setCount)
      .catch(() => setCount(null));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { count, reload };
}
