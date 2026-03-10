export const NEWS_PREFIX = '/news'
export const BOT_PREFIX = '/botWeb'

export const NEWS_STATUS = {
  WAIT: 'wait',
  PUBLISH: 'publish',
  DOWN: 'down',
} as const

export type NewsStatus = typeof NEWS_STATUS[keyof typeof NEWS_STATUS]
