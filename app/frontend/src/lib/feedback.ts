import { useCallback, useEffect, useState } from 'react';
import { client } from '@/lib/api';

/** Number of feedback rows saved so far (count only; rows are not exposed). */
export function useFeedbackCount() {
  const [count, setCount] = useState<number | null>(null);

  const reload = useCallback(() => {
    client.entities.feedback
      .query({ limit: 1 })
      .then((res) => setCount(res.data?.total ?? (res.data?.items?.length ?? 0)))
      .catch(() => setCount(null));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { count, reload };
}
