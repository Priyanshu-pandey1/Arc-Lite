import { useEffect, useState } from 'react'
import * as analyticsService from '../services/analyticsService'

/**
 * useAnalytics — owns dashboard state: the selected time period
 * (7D / 30D / 90D / ALL), the datasets fetched for it, plus the
 * loading/error states the page renders. The UI stays decoupled from
 * how the metrics are loaded.
 */
export default function useAnalytics(initialPeriod = '7D') {
  const [period, setPeriod] = useState(initialPeriod)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryToken, setRetryToken] = useState(0)

  // Loading/error transitions happen in event handlers (first load
  // starts in isLoading state), the effect only settles the fetch.
  const changePeriod = (next) => {
    setPeriod(next)
    setIsLoading(true)
    setError(null)
  }

  const retry = () => {
    setIsLoading(true)
    setError(null)
    setRetryToken((token) => token + 1)
  }

  useEffect(() => {
    let cancelled = false

    analyticsService
      .getAnalytics(period)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null)
          setError(
            err?.response?.data?.error ||
              err?.message ||
              'Unable to load analytics.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [period, retryToken])

  return { period, setPeriod: changePeriod, data, isLoading, error, retry }
}
