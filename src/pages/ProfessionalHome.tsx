import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { mockPatients } from '@/data/mockData';
import { EVENT_TYPE_COLORS } from '@/types';

const ProfessionalHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [code, setCode] = React.useState('');

  return (
    <div className="min-h-screen bg-background">
      <header className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Área Profissional</p>
            <h1 className="text-2xl font-bold text-foreground mt-1">Olá, Dr. {user?.name?.split(' ')[0]}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* Add Patient */}
        <div className="card-elevated p-4">
          <p className="text-sm font-medium text-foreground mb-3">Conectar Paciente</p>
          <div className="flex gap-2">
            <Input placeholder="Código (ex: #AB12)" value={code} onChange={(e) => setCode(e.target.value)} className="h-11 rounded-xl" />
            <Button size="default"><UserPlus className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Patient List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Meus Pacientes</h2>
          <div className="space-y-3">
            {mockPatients.map((patient) => (
              <button key={patient.id} onClick={() => navigate(`/patient/${patient.id}`)} className="w-full card-interactive p-4 text-left">
                <div className="flex items-center gap-4">
                  <div className={`status-dot ${patient.lastEventType ? EVENT_TYPE_COLORS[patient.lastEventType] : ''}`} />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.daysWithoutCrisis} dias sem crise</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalHome;
