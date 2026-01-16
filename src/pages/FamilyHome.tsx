import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Activity, Pill, Calendar, Settings, ChevronRight, User, Bell, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FamilyHome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id) {
          const { data } = await supabase
            .from('event_logs')
            .select('*')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          if (data) setEvents(data);
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header Amigável */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NeuroElo • Família</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Olá, <span className="text-indigo-600">{user?.name?.split(' ')[0] || 'Felipe'}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Como está o dia hoje?</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 text-slate-400">
              <Bell size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full bg-slate-50 text-slate-400 hover:text-red-500">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8">
        {/* Ação Principal: Novo Registro */}
        <div 
          onClick={() => navigate('/log-event')}
          className="relative overflow-hidden bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200 cursor-pointer active:scale-[0.98] transition-all group"
        >
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Novo Registro</h2>
              <p className="text-indigo-100 text-sm mt-1">Relate um comportamento ou evento</p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm group-hover:bg-white group-hover:text-indigo-600 transition-all">
              <Plus size={32} strokeWidth={3} />
            </div>
          </div>
          {/* Elementos Decorativos */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-4 -top-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl" />
        </div>

        {/* Atalhos Rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            onClick={() => navigate('/medications')}
            className="border-none shadow-sm bg-white rounded-[28px] p-6 cursor-pointer hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Pill size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Remédios</h3>
            <p className="text-xs text-slate-400 mt-1">Rotina e estoque</p>
          </Card>

          <Card 
            onClick={() => navigate('/history')}
            className="border-none shadow-sm bg-white rounded-[28px] p-6 cursor-pointer hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Calendar size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Histórico</h3>
            <p className="text-xs text-slate-400 mt-1">Ver registros</p>
          </Card>
        </div>

        {/* Últimos Registros */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" />
              Atividade Recente
            </h3>
            <Button variant="link" onClick={() => navigate('/history')} className="text-indigo-600 font-bold text-xs">
              Ver tudo
            </Button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400 italic text-sm">Carregando registros...</div>
            ) : events.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-transparent rounded-[28px] p-8 text-center">
                <Heart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum registro hoje.</p>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id} className="border-none shadow-sm bg-white rounded-2xl p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{event.event_type}</h4>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Menu Inferior Flutuante */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-lg border border-white/20 h-20 rounded-[24px] shadow-2xl flex items-center justify-around px-4 z-50">
        <Button variant="ghost" className="flex flex-col gap-1 text-indigo-600">
          <Activity size={24} />
          <span className="text-[10px] font-bold">Início</span>
        </Button>
        <Button variant="ghost" onClick={() => navigate('/history')} className="flex flex-col gap-1 text-slate-400">
          <Calendar size={24} />
          <span className="text-[10px] font-bold">Histórico</span>
        </Button>
        <Button variant="ghost" onClick={() => navigate('/medications')} className="flex flex-col gap-1 text-slate-400">
          <Pill size={24} />
          <span className="text-[10px] font-bold">Remédios</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 text-slate-400">
          <Settings size={24} />
          <span className="text-[10px] font-bold">Ajustes</span>
        </Button>
      </nav>
    </div>
  );
};

export default FamilyHome;
