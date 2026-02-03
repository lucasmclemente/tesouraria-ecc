import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Activity, TrendingUp, TrendingDown, ArrowRightLeft, FileText, CheckCircle2, AlertCircle, Pizza, PartyPopper, Church } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURAÇÃO DA IA ---
// Você precisará adicionar a chave nas variáveis de ambiente da Vercel
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY || "");

const PROMPT_SISTEMA = `
Você é um especialista contábil para a Tesouraria do ECC (Encontro de Casais com Cristo).
Analise o texto do extrato bancário e extraia as transações em formato JSON.
Regras de Negócio:
1. Categorize como "Pizza" qualquer entrada/saída relacionada à venda de pizzas.
2. Categorize como "Baile" entradas de ingressos ou despesas com o baile.
3. Identifique o "Repasse Mitra" (saída).
4. Categorize dízimos e ofertas como "Entradas Gerais".
Retorne APENAS um objeto JSON com esta estrutura:
{
  "periodo": "string",
  "transacoes": [{ "data": "ISO", "desc": "string", "valor": number, "tipo": "E"|"S", "cat": "string" }],
  "resumo": { "totalEntradas": number, "totalSaidas": number, "saldo": number },
  "eventos": { "pizzas": number, "baile": number },
  "mitraStatus": "PAGO" | "PENDENTE"
}
`;

// --- COMPONENTE DE CARD DE EVENTO ---
const EventCard = ({ title, value, icon, color }: any) => (
  <div className={`bg-white p-5 rounded-3xl border-l-4 ${color} shadow-sm flex items-center gap-4`}>
    <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{title}</p>
      <p className="text-lg font-mono font-bold text-slate-800">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
  </div>
);

const App = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleProcess = async () => {
    if (!inputText.trim()) return alert("Cole os dados do extrato.");
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
        alert("API Key não configurada na Vercel!");
        return;
    }

    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent([PROMPT_SISTEMA, inputText]);
      const response = await result.response;
      const data = JSON.parse(response.text().replace(/```json|```/g, ""));
      setReport(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao processar com a IA. Verifique o formato do texto.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <header className="bg-slate-900 text-white py-10 px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <Church className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Guaxupé • N. Sra. das Dores</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-8 space-y-8">
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <textarea 
            className="w-full h-40 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 mb-6 font-mono text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none"
            placeholder="Cole aqui o texto copiado do seu Internet Banking..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Activity className="animate-spin text-white" /> : "GERAR RELATÓRIO INTELIGENTE"}
          </button>
        </section>

        {report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Cards de Resumo Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border-2 border-emerald-100 shadow-sm">
                <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Total Entradas</p>
                <p className="text-2xl font-mono font-black text-emerald-600">R$ {report.resumo.totalEntradas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border-2 border-rose-100 shadow-sm">
                <p className="text-[10px] font-black text-rose-500 uppercase mb-2">Total Saídas</p>
                <p className="text-2xl font-mono font-black text-rose-600">R$ {report.resumo.totalSaidas.toLocaleString('pt-BR')}</p>
              </div>
              <div className={`bg-white p-6 rounded-3xl border-2 shadow-sm ${report.resumo.saldo >= 0 ? 'border-blue-100' : 'border-orange-100'}`}>
                <p className="text-[10px] font-black text-blue-500 uppercase mb-2">Saldo Atual</p>
                <p className="text-2xl font-mono font-black text-slate-900">R$ {report.resumo.saldo.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            {/* Balanço de Projetos Específicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <EventCard title="Lucro Pizzas" value={report.eventos.pizzas} icon={<Pizza className="text-orange-500"/>} color="border-orange-500" />
               <EventCard title="Lucro Baile" value={report.eventos.baile} icon={<PartyPopper className="text-purple-500"/>} color="border-purple-500" />
               <div className={`p-5 rounded-3xl border-l-4 flex items-center gap-4 bg-white shadow-sm ${report.mitraStatus === 'PAGO' ? 'border-emerald-500' : 'border-rose-500'}`}>
                  <div className="p-3 bg-slate-50 rounded-2xl"><Church className={report.mitraStatus === 'PAGO' ? 'text-emerald-500' : 'text-rose-500'}/></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Repasse Mitra</p>
                    <p className="text-sm font-bold">{report.mitraStatus}</p>
                  </div>
               </div>
            </div>

            {/* Tabela de Transações */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Descrição IA</th>
                      <th className="px-6 py-4">Categoria</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.transacoes.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono text-slate-400">{t.data}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{t.desc}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">{t.cat}</span>
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.tipo === 'S' ? '-' : ''}R$ {t.valor.toLocaleString('pt-BR')}
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
