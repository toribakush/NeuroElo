import { Pill, Clock, AlertCircle, Trash2, ChevronRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  next_dose: string;
  stock: number;
}

interface MedicationListProps {
  medications: Medication[];
  onDelete?: (id: string) => void;
}

export const MedicationList = ({ medications, onDelete }: MedicationListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Pill size={18} />
          </div>
          Medicamentos
        </h3>
        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
          {medications.length} Ativos
        </span>
      </div>

      <div className="grid gap-4">
        {medications.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Pill size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">Nenhum medicamento registrado</p>
              <p className="text-xs opacity-60">Adicione para acompanhar o tratamento</p>
            </CardContent>
          </Card>
        ) : (
          medications.map((med) => (
            <div
              key={med.id}
              className="group relative bg-white rounded-[24px] p-5 shadow-sm border border-white hover:shadow-md hover:border-indigo-100 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Pill size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {med.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                        {med.dosage}
                      </span>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        {med.frequency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
                    <Clock size={14} />
                    {med.next_dose}
                  </div>
                  {med.stock <= 5 && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg animate-pulse">
                      <AlertCircle size={12} />
                      ESTOQUE BAIXO: {med.stock}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Calendar size={12} />
                    Próxima Dose
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onDelete && (
                    <button
                      onClick={() => onDelete(med.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:gap-2 transition-all">
                    Detalhes <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
