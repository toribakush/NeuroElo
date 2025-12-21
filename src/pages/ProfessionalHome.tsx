import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // <--- Importante
import { LogOut, UserPlus, ChevronRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client'; // <--- Conexão real
import { EVENT_TYPE_COLORS } from '@/types';

const ProfessionalHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [code, setCode] = useState('');

  // --- BUSCA PACIENTES REAIS ---
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['my_patients'],
    queryFn: async () => {
      // 1. Busca perfis (Assumindo que você quer ver todos por enquanto ou tem uma lógica de vínculo)
      // Nota: Idealmente você filtraria apenas os pacientes vinculados a este médico.
      // Por enquanto, vou buscar todos os perfis que NÃO são o próprio médico.
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || ''); // Não mostrar a si mesmo

      if (error) throw error;

      // 2. Para cada paciente, busca o log mais recente para saber o status
      const patientsWithStatus = await Promise.all(profiles.map(async (profile) => {
        const { data: lastLog } = await supabase
          .from('daily_logs')
          .select('mood, date')
          .eq('user_id', profile.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Calcula dias sem crise (simplificado)
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
  // -----------------------------

  const handleConnect = async () => {
     // Lógica futura: buscar usuário pelo 'code' e criar vínculo
     console.log("Conectar com código:", code);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Área Profissional</p>
            <h1 className="text-2xl font-bold text-foreground mt-1">
              Olá, Dr(a). {user?.name?.split(' ')[0] || 'Profissional'}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* Add Patient */}
        <div className="card-elevated p-4">
          <p className="text-sm font-medium text-foreground mb-3">Conectar Paciente</p>
          <div className="flex gap-2">
            <Input 
              placeholder="Código do paciente (ex: #A1B2)" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              className="h-11 rounded-xl" 
            />
            <Button size="default" onClick={handleConnect}>
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Patient List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Meus Pacientes</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : patients.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border rounded-xl border-dashed">
              <p>Nenhum paciente encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient: any) => (
                <button 
                  key={patient.id} 
                  onClick={() => navigate(`/patient/${patient.id}`)} 
                  className="w-full card-interactive p-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    {/* Bolinha de Status */}
                    <div 
                      className={`status-dot ${patient.lastEventType ? EVENT_TYPE_COLORS[patient.lastEventType as keyof typeof EVENT_TYPE_COLORS] : 'bg-gray-300'}`} 
                      title={patient.lastEventType || 'Sem registros'}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {patient.full_name || patient.email || "Paciente sem nome"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {patient.daysWithoutCrisis !== null 
                          ? `${patient.daysWithoutCrisis} dias sem crise` 
                          : 'Monitoramento iniciado'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
