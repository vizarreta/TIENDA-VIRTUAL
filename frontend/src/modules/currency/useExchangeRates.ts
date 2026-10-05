import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getExchangeRates } from '../../services/exchange-rates.api';

const CACHE_DURATION_MS = 60 * 60 * 1000;
const CLOCK_REFRESH_MS = 60_000;

/** Shares public rates for one hour; changing the amount or language does not fetch again. */
export function useExchangeRates() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    // Keep the expiry warning accurate on long-lived tabs without polling the provider.
    const timer = setInterval(() => setNow(Date.now()), CLOCK_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ['external', 'exchange-rates', 'PEN'],
    queryFn: ({ signal }) => getExchangeRates(signal),
    staleTime: CACHE_DURATION_MS,
    gcTime: CACHE_DURATION_MS,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return { ...query, isOutdated: !!query.data && now >= query.data.nextUpdateAt };
}
