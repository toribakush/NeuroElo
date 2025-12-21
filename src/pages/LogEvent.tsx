import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Save, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // <--- Importei o Input
import { useToast } from '@/hooks/use-toast';
import { EventType, Trigger, EVENT_TYPE_LABELS, TRIGGER_LABELS } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const LogEvent: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState<Trigger[]>([]);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(''); // <--- NOVO ESTADO: LOCAL
  const [dateTime] = useState(new Date());

  // --- O PORTEIRO ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Login necessário", variant: "destructive" });
        navigate('/auth');
      }
    };
    checkUser();
  }, [navigate, toast]);

  const eventTypes: EventType[] = ['crise', 'ansiedade', 'meltdown', 'bom_dia'];
  const triggers: Trigger[] = ['barulho', 'sono', 'rotina', 'fome', 'raiva', 'social', 'escola', 'transicao'];
  
  // Lista de locais rápidos
  const commonLocations = ['Casa', 'Escola', 'Trabalho', 'Shopping', 'Rua', 'Carro', 'Terapia'];

  const toggleTrigger = (trigger: Trigger) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const handleSubmit = async () => {
    if (!eventType) {
      toast({ title: 'Selecione o tipo de evento', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth');
        return;
      }

      const { error } = await supabase
        .from('daily_logs')
        .insert({
          user_id: user.id,
          date: dateTime.toISOString(),
          mood: eventType,
          intensity: intensity,
          triggers: selectedTriggers,
          notes: notes,
          location: location // <--- SALVANDO O LOCAL
        });

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['daily_logs'] });

      toast({ title: 'Evento registrado!', description: 'O registro foi salvo com sucesso.' });
      navigate('/');

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getIntensityColor = () => {
    if (intensity <= 3) return 'text-goodday';
    if (intensity <= 6) return 'text-warning';
    return 'text-crisis';
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="p-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground mt-4">Registrar Evento</h1>
      </header>

      <main className="px-6 space-y-6">
        {/* Date/Time */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{format(dateTime, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{format(dateTime, 'HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Tipo de Evento</label>
          <div className="grid grid-cols-2 gap-3">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`chip ${type} ${eventType === type ? 'selected' : ''} justify-center py-3`}
              >
                {EVENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* --- NOVO: LOCALIZAÇÃO --- */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Onde aconteceu?</label>
          
          {/* Botões Rápidos */}
          <div className="flex flex-wrap gap-2 mb-3">
            {commonLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${location === loc 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Campo de Texto com Ícone */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Ou digite o local aqui..." 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Intensity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Intensidade</label>
            <span className={`text-2xl font-bold ${getIntensityColor()}`}>{intensity}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="intensity-slider"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Leve</span>
            <span>Severo</span>
          </div>
        </div>

        {/* Triggers */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Gatilhos</label>
          <div className="flex flex-wrap gap-2">
            {triggers.map((trigger) => (
              <button
                key={trigger}
                onClick={() => toggleTrigger(trigger)}
                className={`chip ${selectedTriggers.includes(trigger) ? 'selected' : ''}`}
              >
                {TRIGGER_LABELS[trigger]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Observações</label>
          <Textarea
            placeholder="Descreva o que aconteceu..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] rounded-xl resize-none"
          />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} size="xl" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Registro</>}
        </Button>
      </main>
    </div>
  );
};

export default LogEvent;
