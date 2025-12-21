import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, UserPlus, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPE_COLORS } from '@/types';

const ProfessionalHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // --- BUSCA SOMENTE MEUS PACIENTES VINCULADOS ---
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['my_linked_patients'],
    queryFn: async () => {
      // 1. Busca os IDs dos pacientes na SUA tabela existente
      const { data: links, error: linkError } = await supabase
        .from('professional_links') 
        .select('patient_id')
        .eq('professional_id', user?.id);

      if (linkError) throw linkError;

      if (!links || links.length === 0) return [];

      const patientIds = links.map(link => link.patient_id);

      // 2. Busca os perfis desses IDs
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      if (profileError) throw profileError;

      // 3. Busca o último status (crise/humor) para cada um
      const patientsWithStatus = await Promise.all(profiles.map(async (profile) => {
        const { data: lastLog } = await supabase
          .from('daily_logs')
          .select('mood, date')
          .eq('user_id', profile.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        const daysWithout = lastLog && lastLog.mood === 'crise' 
          ? Math.floor((Date.now() - new Date(lastLog.date).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          ...profile,
          lastEventType: lastLog?.mood || null,
          daysWithoutCrisis: daysWithout
        };
      }));

      return patientsWithStatus;
    },
    enabled: !!user?.id
  });

  // --- LÓGICA DO BOTÃO CONECTAR ---
  const handleConnect = async () => {
    if (!code) {
      toast({ title: "Digite um código", variant: "destructive" });
      return;
    }

    setIsConnecting(true);
    try {
      // 1. Procura o paciente dono desse código na tabela profiles
      const { data: patientProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('connection_code', code) // Busca pelo código exato
        .single();

      if (searchError || !patientProfile) {
        toast({ 
          title: "Paciente não encontrado", 
          description: "Verifique o código e tente novamente.", 
          variant: "destructive" 
        });
        return;
      }

      // 2. Cria o vínculo na SUA tabela existente
      const { error: linkError } = await supabase
        .from('professional_links')
        .insert({
          professional_id: user?.id,
          patient_id: patientProfile.id
        });

      if (linkError) {
        // Verifica erro de duplicidade (código 23505 no Postgres)
        if (linkError.code === '23505') { 
           toast({ title: "Vocês já estão conectados!", description: "Este paciente já está na sua lista." });
        } else {
           console.error(linkError);
           throw linkError;
        }
      } else {
        toast({ 
          title: "Sucesso!", 
          description: `Você agora está conectado a ${patientProfile.full_name || 'paciente'}.` 
        });
        setCode(''); // Limpa o campo
        queryClient.invalidateQueries({ queryKey: ['my_linked_patients'] }); // Atualiza a lista na hora
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao conectar", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Área Profissional</p>
            <h1 className="text-2xl font-bold text-foreground mt-1">
              Olá, {user?.name?.split(' ')[0] || 'Doutor(a)'}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* Card de Adicionar */}
        <div className="card-elevated p-4">
          <p className="text-sm font-medium text-foreground mb-3">Conectar Novo Paciente</p>
          <div className="flex gap-2">
            <Input 
              placeholder="Digite o código (ex: #X9Y2)" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              className="h-11 rounded-xl uppercase" 
            />
            <Button size="default" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Peça para a família gerar o código no aplicativo deles.
          </p>
        </div>

        {/* Lista de Pacientes */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Meus Pacientes Monitorados</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed rounded-xl border-muted bg-muted/30">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground">Nenhum paciente ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use o código acima para adicionar seu primeiro paciente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient: any) => (
                <button 
                  key={patient.id} 
                  onClick={() => navigate(`/patient/${patient.id}`)} 
                  className="w-full card-interactive p-4 text-left transition-all hover:translate-x-1"
                >
                  <div className="flex items-center gap-4">
                    {/* Bolinha de Status */}
                    <div className="relative">
                      <div 
                        className={`status-dot w-3 h-3 ${patient.lastEventType ? EVENT_TYPE_COLORS[patient.lastEventType as keyof typeof EVENT_TYPE_COLORS] : 'bg-gray-300'}`} 
                      />
                      {patient.lastEventType === 'crise' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {patient.full_name || "Paciente Identificado"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                           {patient.lastEventType ? 'Ativo' : 'Sem dados'}
                        </span>
                        {patient.daysWithoutCrisis !== null && (
                          <span className="text-xs text-muted-foreground">
                            • {patient.daysWithoutCrisis} dias sem crise
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfessionalHome;
