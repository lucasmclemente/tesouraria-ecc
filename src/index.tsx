import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Activity, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

// Importando dos arquivos locais (mesma pasta)
import { analyzeTransactions } from './gemini';
import TransactionTable from './tabela';

const FinancialCard = ({ title, value, type, icon }: any) => (
  <div className={`bg-white p-6 rounded-3xl border-2 ${type === 'positive' ? 'border-emerald-100' : 'border-rose-100'} shadow-sm`}>
    <div className="flex items-center gap-3 mb-2 text-slate-500">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
    </div>
    <div className={`text-2xl font-mono font-bold ${type === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>
      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </div>
  </div>
);

const App = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const categories = ['Dízimo', 'Oferta', 'Pizza', 'Baile', 'Despesa Fixa'];

  const handleAnalyze = async () => {
    if (!inputText.trim()) return alert("Cole o extrato.");
    setIsProcessing(true);
    try {
      const result = await analyzeTransactions([], '01/01/2026', '31/01/2026', categories);
      setReport(result);
    } catch {
      alert("Erro na análise.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-slate-900 text-white py-6 px-8 mb-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Activity className="text-blue-500 w-8 h-8" />
          <div>
            <h1 className="font-black uppercase tracking-tighter text-lg leading-none">Tesouraria ECC</h1>
            <p className="text-[10px] text-slate-400 mt-1">Paróquia N. Sra. das Dores - Guaxupé/MG</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 space-y-8">
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <textarea 
            className="w-full h-32 p-4 bg-slate-50 rounded-xl border-2 border-slate-100 mb-4 font-mono text-sm focus:border-blue-500 focus:outline-none transition-all"
            placeholder="Cole seu extrato aqui..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleAnalyze} 
            disabled={isProcessing} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Activity className="animate-spin" /> : "ANALISAR EXTRATO"}
          </button>
        </section>

        {report && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard title="Entradas" value={report.summary.totalEntries} type="positive" icon={<TrendingUp size={16}/>} />
              <FinancialCard title="Saídas" value={report.summary.totalExits} type="negative" icon={<TrendingDown size={16}/>} />
              <FinancialCard title="Saldo" value={report.summary.netBalance} type="positive" icon={<ArrowRightLeft size={16}/>} />
            </div>
            <TransactionTable transactions={report.transactions} categories={categories} />
          </div>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
