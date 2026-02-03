import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Activity, TrendingUp, TrendingDown, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';

// --- 1. LÓGICA DE INTELIGÊNCIA (Simulação) ---
const analyzeTransactions = async (text: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    period: "Janeiro 2026",
    summary: { totalEntries: 4250.00, totalExits: 1120.00, netBalance: 3130.00 },
    transactions: [
      { id: '1', date: '2026-01-10', description: 'Venda Pizza - Lote 1', amount: 1200.00, type: 'E', category: 'Pizza' },
      { id: '2', date: '2026-01-15', description: 'Repasse Mitra', amount: 120.00, type: 'S', category: 'Taxas' },
      { id: '3', date: '2026-01-20', description: 'Ofertas Missa', amount: 450.00, type: 'E', category: 'Oferta' }
    ]
  };
};

// --- 2. COMPONENTE DE TABELA ---
const TransactionTable = ({ transactions }: { transactions: any[] }) => (
  <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-6 py-4 font-bold text-slate-600">Data</th>
          <th className="px-6 py-4 font-bold text-slate-600">Descrição</th>
          <th className="px-6 py-4 font-bold text-slate-600 text-right">Valor</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {transactions.map((t) => (
          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4 text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
            <td className="px-6 py-4 font-medium text-slate-800">{t.description}</td>
            <td className={`px-6 py-4 text-right font-mono font-bold ${t.type === 'E' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.type === 'S' ? '-' : ''}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- 3. COMPONENTE PRINCIPAL (APP) ---
const App = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleProcess = async () => {
    if (!inputText.trim()) return alert("Por favor, cole os dados do extrato.");
    setIsProcessing(true);
    try {
      const result = await analyzeTransactions(inputText);
      setReport(result);
    } catch {
      alert("Erro ao processar.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <header className="bg-slate-900 text-white py-10 px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <Activity className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic">Tesouraria ECC</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest opacity-80">N. Sra. das Dores - Guaxupé</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <span className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Status do Sistema</span>
            <span className="flex items-center gap-2 text-emerald-400 text-sm font-bold">● Operacional</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-8 space-y-10">
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Dados do Extrato Bancário</label>
          <textarea 
            className="w-full h-40 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 mb-6 font-mono text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
            placeholder="Cole o extrato aqui para análise inteligente..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isProcessing ? <Activity className="animate-spin" /> : <><FileText size={20}/> ANALISAR MOVIMENTAÇÕES</>}
          </button>
        </section>

        {report && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Entradas', val: report.summary.totalEntries, icon: <TrendingUp className="text-emerald-500" />, color: 'text-emerald-600' },
                { label: 'Saídas', val: report.summary.totalExits, icon: <TrendingDown className="text-rose-500" />, color: 'text-rose-600' },
                { label: 'Saldo Líquido', val: report.summary.netBalance, icon: <ArrowRightLeft className="text-blue-500" />, color: 'text-slate-900' }
              ].map((card, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3 uppercase font-black text-[10px] text-slate-400 tracking-widest">
                    {card.icon} {card.label}
                  </div>
                  <div className={`text-3xl font-mono font-black ${card.color}`}>
                    R$ {card.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
            <TransactionTable transactions={report.transactions} />
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
              <CheckCircle2 className="text-blue-600 mt-1 shrink-0" />
              <p className="text-blue-800 text-sm font-medium leading-relaxed italic">
                "Análise pronta para a prestação de contas da Paróquia. Verifique se os repasses da Mitra estão em dia."
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
