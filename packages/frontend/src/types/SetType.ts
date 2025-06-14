import React from 'react'

// Frontend set type configuration (mirrors backend)
export enum SetType {
    BASIC = 'basic',
    BIDIRECTIONAL = 'bidirectional',
    MULTIPLE_CHOICE = 'multipleChoice',
    FILL_IN_BLANK = 'fillInBlank'
}

export interface SetTypeOption {
    value: SetType
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    status: string
    available: boolean
    cardMultiplier: number
} 