import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, UserPlus, ChevronRight, Loader2, AlertCircle, Edit2, X, Save } from 'lucide-react';
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
  
  // Estado para editar nome
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // --- BUSCA PACIENTES ---
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['my_linked_patients'],
    queryFn: async () => {
      // 1. Busca IDs e APELIDOS na tabela de vínculo
      const { data: links, error: linkError } = await supabase
        .from('professional_links') 
        .select('patient_id, nickname') // <--- Pegamos o nickname aqui
        .eq('professional_id', user?.id);

      if (linkError) throw linkError;
      if (!links || links.length === 0) return [];

      const patientIds = links.map(link => link.patient_id);

      // 2. Busca os perfis
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      if (profileError) throw profileError;

      // 3. Busca status e junta tudo
      const patientsWithStatus = await Promise.all(profiles.map(async (profile) => {
        // Encontra o apelido correspondente neste link
        const linkData = links.find(l => l.patient_id === profile.id);
        const displayName = linkData?.nickname || profile.full_name || "Paciente Sem Nome";

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
          displayName, // Nome oficial para exibição (Apelido ou Original)
          originalName: profile.full_name, // Mantemos o original guardado
          lastEventType: lastLog?.mood || null,
          daysWithoutCrisis: daysWithout
        };
      }));

      return patientsWithStatus;
    },
    enabled: !!user?.id
  });

  // --- CONECTAR NOVO ---
  const handleConnect = async () => {
    if (!code) {
      toast({ title: "Digite um código", variant: "destructive" });
      return;
    }
    setIsConnecting(true);
    try {
      const { data: patientProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('connection_code', code)
        .single();

      if (searchError || !patientProfile) {
        toast({ title: "Paciente não encontrado", description: "Verifique o código.", variant: "destructive" });
        return;
      }

      const { error: linkError } = await supabase
        .from('professional_links')
        .insert({ professional_id: user?.id, patient_id: patientProfile.id });

      if (linkError) {
        if (linkError.code === '23505') toast({ title: "Já conectado!" });
        else throw linkError;
      } else {
        toast({ title: "Sucesso!", description: `Conectado a ${patientProfile.full_name}.` });
        setCode('');
        queryClient.invalidateQueries({ queryKey: ['my_linked_patients'] });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao conectar", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  // --- RENOMEAR PACIENTE ---
  const openEditModal = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation(); // Impede de abrir o dashboard ao clicar no lápis
    setEditingId(patient.id);
    setNewName(patient.displayName);
  };

  const handleSaveName = async () => {
    if (!editingId) return;

    try {
      // Atualiza APENAS na tabela de links (privado para o médico)
      const { error } = await supabase
        .from('professional_links')
        .update({ nickname: newName })
        .eq('professional_id', user?.id)
        .eq('patient_id', editingId);

      if (error) throw error;

      toast({ title: "Nome atualizado!" });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['my_linked_patients'] }); // Recarrega a lista
    } catch (error) {
      toast({ title: "Erro ao salvar nome", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
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
        {/* Add Patient */}
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
        </div>

        {/* Patient List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Meus Pacientes Monitorados</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed rounded-xl border-muted bg-muted/30">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground">Nenhum paciente ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">Use o código acima para adicionar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient: any) => (
                <div key={patient.id} className="w-full relative group">
                  <button 
                    onClick={() => navigate(`/patient/${patient.id}`)} 
                    className="w-full card-interactive p-4 text-left transition-all hover:translate-x-1 pr-12"
                  >
                    <div className="flex items-center gap-4">
                      {/* Bolinha de Status */}
                      <div className="relative">
                        <div className={`status-dot w-3 h-3 ${patient.lastEventType ? EVENT_TYPE_COLORS[patient.lastEventType as keyof typeof EVENT_TYPE_COLORS] : 'bg-gray-300'}`} />
                        {patient.lastEventType === 'crise' && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="font-medium text-foreground truncate">
                             {patient.displayName}
                           </p>
                           {/* Ícone de Editar (Só aparece se o usuário tiver mouse ou clicar na área) */}
                           <div 
                              role="button"
                              onClick={(e) => openEditModal(e, patient)}
                              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors z-10"
                           >
                             <Edit2 className="w-3 h-3" />
                           </div>
                        </div>
                        
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE EDIÇÃO DE NOME */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background w-full max-w-sm rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Renomear Paciente</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Este nome será visível apenas para você.
            </p>
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder="Novo nome (ex: Paciente 01)"
              className="mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveName}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfessionalHome;
