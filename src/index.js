import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  CheckCircle2, Pizza, PartyPopper, Church, 
  Wallet, Calendar, FileSearch, Info
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// PROMPT IDÊNTICO AO DO GOOGLE AI STUDIO
const PROMPT_SISTEMA = `
Você é o Tesoureiro Digital do ECC Paróquia Nossa Senhora das Dores.
Sua tarefa é ler extratos bancários e organizar as finanças.
REGRAS DE OURO:
1. Identifique entradas de "PIZZA" e subtraia despesas de "PIZZA" para dar o lucro real.
2. Identifique entradas de "CONVITE BAILE" ou "MESA" e subtraia custos do baile.
3. Se houver o termo "MITRA" em uma saída, marque o status como PAGO. Caso contrário, PENDENTE.
4. Ignore transferências internas entre contas do mesmo titular.

RETORNE APENAS JSON:
{
  "periodo": "string",
  "resumo": { "entradas": 0.0, "saidas": 0.0, "saldo": 0.0 },
  "detalhes": { "lucroPizzas": 0.0, "lucroBaile": 0.0, "taxaMitra": "string" },
  "lista": [{ "data": "string", "item": "string", "valor": 0.0, "tipo": "E/S", "categoria": "string" }]
}
`;

const StatCard = ({ title, value, color, icon: Icon }) => (
  <div className={`bg-white p-6 rounded-[2.5rem] border-2 ${color} shadow-sm`}>
    <div className="flex items-center gap-3 mb-3 opacity-60">
      <Icon size={16} />
      <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
    </div>
    <div className="text-2xl font-mono font-black text-slate-800">
      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </div>
  </div>
);

const App = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return alert("Cole o extrato bancário.");
    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([PROMPT_SISTEMA, inputText]);
      const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      setReport(data);
    } catch (e) {
      alert("Erro na análise. Verifique se a chave da API está correta.");
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
      <header className="bg-slate-900 text-white pt-12 pb-24 px-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20"><Church size={32} /></div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">N. Sra. das Dores • Guaxupé/MG</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-12 space-y-10">
        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
          <div className="flex items-center gap-3 mb-6 text-slate-400">
            <FileSearch size={18} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Entrada de Dados</h2>
          </div>
          <textarea 
            className="w-full h-48 p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-8 font-mono text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
            placeholder="Cole aqui o texto do extrato..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <button 
            onClick={handleAnalyze} 
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <Activity className="animate-spin" /> : "PROCESSAR COM INTELIGÊNCIA ARTIFICIAL"}
          </button>
        </section>

        {report && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Entradas" value={report.resumo.entradas} color="border-emerald-100" icon={TrendingUp} />
              <StatCard title="Saídas" value={report.resumo.saidas} color="border-rose-100" icon={TrendingDown} />
              <StatCard title="Saldo" value={report.resumo.saldo} color="border-blue-100" icon={Wallet} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5 shadow-sm">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Pizza size={24}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Lucro Pizzas</p><p className="font-mono font-bold">R$ {report.detalhes.lucroPizzas.toLocaleString('pt-BR')}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5 shadow-sm">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><PartyPopper size={24}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Lucro Baile</p><p className="font-mono font-bold">R$ {report.detalhes.lucroBaile.toLocaleString('pt-BR')}</p></div>
              </div>
              <div className={`bg-white p-6 rounded-[2rem] border flex items-center gap-5 shadow-sm ${report.detalhes.taxaMitra === 'PAGO' ? 'border-emerald-200' : 'border-rose-200'}`}>
                <div className={`p-3 rounded-2xl ${report.detalhes.taxaMitra === 'PAGO' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><Church size={24}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Repasse Mitra</p><p className="font-black text-sm uppercase">{report.detalhes.taxaMitra}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
                    <tr><th className="px-10 py-5">Data</th><th className="px-10 py-5">Descrição Inteligente</th><th className="px-10 py-5 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.lista.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-5 font-mono text-slate-400">{t.data}</td>
                        <td className="px-10 py-5">
                          <p className="font-bold text-slate-700">{t.item}</p>
                          <span className="text-[9px] uppercase font-black text-blue-400 tracking-tighter">{t.categoria}</span>
                        </td>
                        <td className={`px-10 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.tipo === 'S' ? '-' : ''}R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
