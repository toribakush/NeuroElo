export type UserRole = 'family' | 'professional';

export type EventType = 'crise' | 'ansiedade' | 'meltdown' | 'bom_dia';

export type Trigger = 
  | 'barulho' 
  | 'sono' 
  | 'rotina' 
  | 'fome' 
  | 'raiva' 
  | 'social'
  | 'escola'
  | 'transicao';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  connectionCode?: string; // Only for family
  createdAt: Date;
}

export interface EventEntry {
  id: string;
  userId: string;
  dateTime: Date;
  type: EventType;
  intensity: number; // 1-10
  triggers: Trigger[];
  notes?: string;
  createdAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  connectionCode: string;
  lastEventType?: EventType;
  lastEventDate?: Date;
  daysWithoutCrisis: number;
}

export interface ChartDataPoint {
  date: string;
  intensity: number;
  count?: number;
}

export interface TriggerCount {
  trigger: Trigger;
  count: number;
  percentage: number;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  crise: 'Crise',
  ansiedade: 'Ansiedade',
  meltdown: 'Meltdown',
  bom_dia: 'Bom Dia',
};

export const TRIGGER_LABELS: Record<Trigger, string> = {
  barulho: 'Barulho',
  sono: 'Sono',
  rotina: 'Rotina',
  fome: 'Fome',
  raiva: 'Raiva',
  social: 'Social',
  escola: 'Escola',
  transicao: 'Transição',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  crise: 'crisis',
  ansiedade: 'anxiety',
  meltdown: 'meltdown',
  bom_dia: 'goodday',
};
