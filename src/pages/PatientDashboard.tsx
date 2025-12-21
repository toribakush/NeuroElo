import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { mockPatients, generateMockEvents, generateTriggerData, generateIntensityTrend } from '@/data/mockData';
import { EVENT_TYPE_LABELS, TRIGGER_LABELS, EVENT_TYPE_COLORS } from '@/types';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['hsl(215, 45%, 20%)', 'hsl(158, 40%, 45%)', 'hsl(32, 75%, 55%)', 'hsl(12, 60%, 55%)', 'hsl(280, 45%, 55%)', 'hsl(210, 20%, 70%)'];

const PatientDashboard: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const patient = mockPatients.find(p => p.id === patientId);
  const events = generateMockEvents(patientId || '');
  const triggerData = generateTriggerData(events);
  const intensityData = generateIntensityTrend(events);

  if (!patient) return <div className="p-6">Paciente não encontrado</div>;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="p-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground mt-4">{patient.name}</h1>
        <p className="text-muted-foreground">{patient.daysWithoutCrisis} dias sem crise severa</p>
      </header>

      <main className="px-6 space-y-6">
        {/* Intensity Chart */}
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-foreground mb-4">Intensidade (30 dias)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intensityData}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="intensity" stroke="hsl(215, 45%, 20%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Triggers Pie Chart */}
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-foreground mb-4">Principais Gatilhos</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={triggerData.slice(0, 5)} dataKey="count" nameKey="trigger" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {triggerData.slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, TRIGGER_LABELS[name as keyof typeof TRIGGER_LABELS] || name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {triggerData.slice(0, 5).map((t, i) => (
              <span key={t.trigger} className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                {TRIGGER_LABELS[t.trigger as keyof typeof TRIGGER_LABELS]} ({t.percentage}%)
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Histórico</h3>
          <div className="space-y-3">
            {events.slice(0, 10).map((event) => (
              <div key={event.id} className="card-elevated p-4">
                <div className="flex items-start gap-3">
                  <div className={`status-dot mt-1.5 ${EVENT_TYPE_COLORS[event.type]}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{EVENT_TYPE_LABELS[event.type]}</p>
                      <span className="text-xs text-muted-foreground">{format(event.dateTime, 'dd/MM HH:mm')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                    {event.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.triggers.map(t => <span key={t} className="text-2xs bg-muted px-2 py-0.5 rounded-full">{TRIGGER_LABELS[t]}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
