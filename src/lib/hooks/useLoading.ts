// src/lib/hooks/useLoading.ts
import { useState, useCallback } from 'react'

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false)

  const startLoading = useCallback(() => setIsLoading(true), [])
  const stopLoading = useCallback(() => setIsLoading(false), [])
  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    startLoading()
    try {
      return await promise
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  }
}