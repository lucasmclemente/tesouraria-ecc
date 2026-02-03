import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  CheckCircle2, Pizza, PartyPopper, Church, 
  Wallet, Calendar 
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuração segura da API
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const PROMPT_SISTEMA = `
Você é o assistente contábil da Tesouraria do ECC - Paróquia N. Sra. das Dores (Guaxupé).
Analise o extrato e retorne APENAS um JSON:
{
  "periodo": "Mês/Ano",
  "transacoes": [{ "data": "DD/MM", "desc": "string", "valor": 0.00, "tipo": "E"|"S", "cat": "string" }],
  "resumo": { "totalEntradas": 0.00, "totalSaidas": 0.00, "saldo": 0.00 },
  "eventos": { "lucroPizzas": 0.00, "lucroBaile": 0.00 },
  "mitraStatus": "PAGO" | "PENDENTE"
}`;

const FinancialCard = ({ title, value, type, icon }: any) => (
  <div className={`bg-white p-6 rounded-[2rem] border-2 ${type === 'positive' ? 'border-emerald-50' : 'border-rose-50'} shadow-sm`}>
    <div className="flex items-center gap-3 mb-3 text-slate-400 uppercase font-black text-[10px] tracking-widest">
      {icon} {title}
    </div>
    <div className={`text-2xl font-mono font-black ${type === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>
      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </div>
  </div>
);

const App = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleProcess = async () => {
    if (!inputText.trim()) return alert("Cole o extrato.");
    if (!API_KEY) return alert("Configure a API Key na Vercel.");

    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([PROMPT_SISTEMA, inputText]);
      const response = await result.response;
      const data = JSON.parse(response.text().replace(/```json|```/g, "").trim());
      setReport(data);
    } catch (error) {
      alert("Erro na análise. Verifique os dados.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20 font-sans text-slate-900">
      <header className="bg-slate-900 text-white pt-12 pb-20 px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
              <Church className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-2">Paróquia Nossa Senhora das Dores • Guaxupé</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-10 space-y-8">
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <textarea 
            className="w-full h-44 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 mb-6 font-mono text-xs focus:border-blue-500 focus:outline-none transition-all resize-none"
            placeholder="Cole o extrato aqui..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Activity className="animate-spin" /> : "GERAR RELATÓRIO"}
          </button>
        </section>

        {report && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard title="Entradas" value={report.resumo.totalEntradas} type="positive" icon={<TrendingUp size={16}/>} />
              <FinancialCard title="Saídas" value={report.resumo.totalSaidas} type="negative" icon={<TrendingDown size={16}/>} />
              <FinancialCard title="Saldo" value={report.resumo.saldo} type="positive" icon={<Wallet size={16}/>} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white p-4 rounded-2xl border flex items-center gap-3">
                  <Pizza className="text-orange-500" />
                  <span className="text-xs font-bold">Pizza: R$ {report.eventos.lucroPizzas.toLocaleString('pt-BR')}</span>
               </div>
               <div className="bg-white p-4 rounded-2xl border flex items-center gap-3">
                  <PartyPopper className="text-purple-500" />
                  <span className="text-xs font-bold">Baile: R$ {report.eventos.lucroBaile.toLocaleString('pt-BR')}</span>
               </div>
               <div className="bg-white p-4 rounded-2xl border flex items-center gap-3 text-slate-500">
                  <Church size={18}/>
                  <span className="text-xs font-bold uppercase">Mitra: {report.mitraStatus}</span>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Data</th>
                      <th className="px-8 py-4">Descrição</th>
                      <th className="px-8 py-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.transacoes.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-8 py-4 font-mono text-slate-400">{t.data}</td>
                        <td className="px-8 py-4 font-bold text-slate-700">{t.desc}</td>
                        <td className={`px-8 py-4 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          R$ {t.valor.toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
