import { useState, useEffect, useCallback } from 'react';
import api from '../config/api';

/**
 * Generic fetch hook.
 * @param {string|null} url - endpoint to GET, null to skip
 * @param {any[]} deps - extra dependencies to re-fetch on
 */
export function useApi(url, deps = []) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]); // eslint-disable-line

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export default useApi;
