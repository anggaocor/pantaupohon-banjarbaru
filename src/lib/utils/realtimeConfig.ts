export const realtimeConfig = {
  enabled: process.env.NEXT_PUBLIC_REALTIME_ENABLED === 'true',
  pollInterval: parseInt(process.env.NEXT_PUBLIC_REALTIME_POLL_INTERVAL || '30000'),
  maxRetries: 3,
  retryDelay: 1000,
}