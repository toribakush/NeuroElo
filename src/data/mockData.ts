import { EventEntry, Patient, EventType, Trigger } from '@/types';
import { subDays, format, startOfMonth, addDays } from 'date-fns';

// Generate realistic mock events for the last 60 days
export const generateMockEvents = (userId: string): EventEntry[] => {
  const events: EventEntry[] = [];
  const today = new Date();
  
  const eventPatterns = [
    { type: 'bom_dia' as EventType, weight: 0.45, avgIntensity: 2 },
    { type: 'ansiedade' as EventType, weight: 0.25, avgIntensity: 5 },
    { type: 'meltdown' as EventType, weight: 0.15, avgIntensity: 7 },
    { type: 'crise' as EventType, weight: 0.15, avgIntensity: 8 },
  ];
  
  const triggerPool: Trigger[] = ['barulho', 'sono', 'rotina', 'fome', 'raiva', 'social', 'escola', 'transicao'];
  
  for (let i = 60; i >= 0; i--) {
    const date = subDays(today, i);
    const eventsForDay = Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 1 : 0;
    
    for (let j = 0; j < eventsForDay; j++) {
      const rand = Math.random();
      let cumulativeWeight = 0;
      let selectedType: EventType = 'bom_dia';
      let baseIntensity = 2;
      
      for (const pattern of eventPatterns) {
        cumulativeWeight += pattern.weight;
        if (rand <= cumulativeWeight) {
          selectedType = pattern.type;
          baseIntensity = pattern.avgIntensity;
          break;
        }
      }
      
      const intensity = Math.min(10, Math.max(1, baseIntensity + Math.floor(Math.random() * 4) - 2));
      
      const numTriggers = selectedType === 'bom_dia' ? 0 : Math.floor(Math.random() * 3) + 1;
      const shuffledTriggers = [...triggerPool].sort(() => Math.random() - 0.5);
      const triggers = shuffledTriggers.slice(0, numTriggers);
      
      const hour = 8 + Math.floor(Math.random() * 12);
      const minute = Math.floor(Math.random() * 60);
      const eventDate = new Date(date);
      eventDate.setHours(hour, minute, 0, 0);
      
      events.push({
        id: `event-${i}-${j}`,
        userId,
        dateTime: eventDate,
        type: selectedType,
        intensity,
        triggers,
        notes: generateNotes(selectedType, triggers),
        createdAt: eventDate,
      });
    }
  }
  
  return events.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
};

const generateNotes = (type: EventType, triggers: Trigger[]): string => {
  const noteTemplates: Record<EventType, string[]> = {
    crise: [
      'Episódio intenso após mudança de rotina. Precisou de 30min para se acalmar.',
      'Crise desencadeada por sobrecarga sensorial. Usamos técnicas de respiração.',
      'Momento difícil durante atividade em grupo. Conseguiu se recuperar com apoio.',
    ],
    ansiedade: [
      'Demonstrou sinais de ansiedade antes da escola. Melhorou após conversa.',
      'Ansiedade leve durante o jantar. Usamos estratégias de distração.',
      'Preocupação com mudança de planos. Explicação ajudou a acalmar.',
    ],
    meltdown: [
      'Meltdown causado por transição inesperada. Necessitou espaço calmo.',
      'Episódio durante atividade escolar. Professor ofereceu suporte adequado.',
      'Sobrecarga sensorial no supermercado. Saímos do ambiente rapidamente.',
    ],
    bom_dia: [
      'Dia tranquilo. Seguiu rotina sem dificuldades.',
      'Excelente dia! Participou bem das atividades.',
      'Dia positivo com boa regulação emocional.',
    ],
  };
  
  const templates = noteTemplates[type];
  return templates[Math.floor(Math.random() * templates.length)];
};

export const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    name: 'Lucas Silva',
    connectionCode: 'AB12',
    lastEventType: 'bom_dia',
    lastEventDate: subDays(new Date(), 0),
    daysWithoutCrisis: 5,
  },
  {
    id: 'patient-2',
    name: 'Sofia Oliveira',
    connectionCode: 'CD34',
    lastEventType: 'ansiedade',
    lastEventDate: subDays(new Date(), 1),
    daysWithoutCrisis: 12,
  },
  {
    id: 'patient-3',
    name: 'Gabriel Santos',
    connectionCode: 'EF56',
    lastEventType: 'crise',
    lastEventDate: subDays(new Date(), 0),
    daysWithoutCrisis: 0,
  },
  {
    id: 'patient-4',
    name: 'Isabella Costa',
    connectionCode: 'GH78',
    lastEventType: 'meltdown',
    lastEventDate: subDays(new Date(), 2),
    daysWithoutCrisis: 2,
  },
];

// Generate calendar heatmap data
export const generateHeatmapData = (events: EventEntry[]) => {
  const today = new Date();
  const start = startOfMonth(subDays(today, 60));
  const data: { date: string; count: number; intensity: number }[] = [];
  
  for (let i = 0; i < 90; i++) {
    const date = addDays(start, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(e.dateTime, 'yyyy-MM-dd') === dateStr);
    
    const crisisEvents = dayEvents.filter(e => e.type === 'crise' || e.type === 'meltdown');
    const avgIntensity = crisisEvents.length > 0 
      ? crisisEvents.reduce((sum, e) => sum + e.intensity, 0) / crisisEvents.length 
      : 0;
    
    data.push({
      date: dateStr,
      count: crisisEvents.length,
      intensity: Math.round(avgIntensity),
    });
  }
  
  return data;
};

// Generate trigger distribution data
export const generateTriggerData = (events: EventEntry[]) => {
  const triggerCounts: Record<string, number> = {};
  
  events.forEach(event => {
    event.triggers.forEach(trigger => {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    });
  });
  
  const total = Object.values(triggerCounts).reduce((sum, count) => sum + count, 0);
  
  return Object.entries(triggerCounts)
    .map(([trigger, count]) => ({
      trigger,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

// Generate line chart data for last 30 days
export const generateIntensityTrend = (events: EventEntry[]) => {
  const today = new Date();
  const data: { date: string; intensity: number; label: string }[] = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(e.dateTime, 'yyyy-MM-dd') === dateStr);
    
    const avgIntensity = dayEvents.length > 0
      ? dayEvents.reduce((sum, e) => sum + e.intensity, 0) / dayEvents.length
      : 0;
    
    data.push({
      date: dateStr,
      intensity: Math.round(avgIntensity * 10) / 10,
      label: format(date, 'dd/MM'),
    });
  }
  
  return data;
};
