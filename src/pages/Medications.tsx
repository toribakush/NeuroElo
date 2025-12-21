import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pill, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Medications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca Medicamentos
  const { data: meds = [], isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Adicionar Medicamento
  const handleAdd = async () => {
    if (!name) return toast({ title: "Nome obrigatório", variant: "destructive" });
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('medications').insert({
        user_id: user?.id,
        name,
        dosage,
        time
      });

      if (error) throw error;

      toast({ title: "Medicamento salvo!" });
      setName('');
      setDosage('');
      setTime('');
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir Medicamento
  const handleDelete = async (id: string) => {
    if(!confirm("Remover este medicamento?")) return;
    try {
      await supabase.from('medications').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({ title: "Removido" });
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="p-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" /><span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground mt-4">Medicamentos</h1>
        <p className="text-muted-foreground">Controle de receitas atuais</p>
      </header>

      <main className="px-6 space-y-6">
        
        {/* Formulário de Adição */}
        <div className="card-elevated p-4 space-y-3 bg-secondary/10">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Medicamento
          </h3>
          <div className="space-y-2">
            <Input 
              placeholder="Nome (ex: Ritalina)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="bg-background"
            />
            <div className="flex gap-2">
              <Input 
                placeholder="Dose (ex: 10mg)" 
                value={dosage} 
                onChange={e => setDosage(e.target.value)} 
                className="bg-background flex-1"
              />
              <Input 
                placeholder="Horário (ex: Manhã)" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="bg-background flex-1"
              />
            </div>
            <Button onClick={handleAdd} disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <><Save className="w-4 h-4 mr-2"/> Salvar</>}
            </Button>
          </div>
        </div>

        {/* Lista */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Em uso</h3>
          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin"/></div>
          ) : meds.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4 border-2 border-dashed rounded-xl">Nenhum medicamento cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {meds.map((med: any) => (
                <div key={med.id} className="card-elevated p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{med.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {med.dosage} • {med.time}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(med.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Medications;
