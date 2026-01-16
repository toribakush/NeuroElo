import { Pill, Clock, AlertCircle } from "lucide-react";
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
}

export const MedicationList = ({ medications }: MedicationListProps) => {
    return (
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-indigo-900">
                                  <Pill className="w-5 h-5 text-indigo-600" />
                                  Medicamentos Ativos
                        </CardTitle>CardTitle>
                </CardHeader>CardHeader>
                <CardContent>
                        <div className="space-y-3">
                          {medications.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 italic">
                                      Nenhum medicamento registrado.
                        </div>div>
                      ) : (
                        medications.map((med) => (
                                        <div
                                                          key={med.id}
                                                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 transition-colors group"
                                                        >
                                                        <div className="flex items-center gap-3">
                                                                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                                              <Pill className="w-4 h-4" />
                                                                          </div>div>
                                                                          <div>
                                                                                              <h4 className="font-medium text-slate-900">{med.name}</h4>h4>
                                                                                              <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>p>
                                                                          </div>div>
                                                        </div>div>
                                                        <div className="text-right">
                                                                          <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 mb-1">
                                                                                              <Clock className="w-3 h-3" />
                                                                            {med.next_dose}
                                                                          </div>div>
                                                          {med.stock <= 5 && (
                                                                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                                                                    <AlertCircle className="w-2 h-2" />
                                                                                                    Estoque Baixo: {med.stock}
                                                                              </div>div>
                                                                          )}
                                                        </div>div>
                                        </div>div>
                                      ))
                      )}
                        </div>div>
                </CardContent>CardContent>
          </Card>Card>
        );
};</Card>
