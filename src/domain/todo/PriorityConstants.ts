export const PRIORITY_VALUES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
} as const

export const PRIORITY_CHOICES = [
  { title: "Low", value: PRIORITY_VALUES.LOW },
  { title: "Medium", value: PRIORITY_VALUES.MEDIUM },
  { title: "High", value: PRIORITY_VALUES.HIGH }
] as const

export const PRIORITY_ARRAY = [
  PRIORITY_VALUES.LOW,
  PRIORITY_VALUES.MEDIUM,
  PRIORITY_VALUES.HIGH
] as const

export const DEFAULT_PRIORITY = PRIORITY_VALUES.MEDIUM
