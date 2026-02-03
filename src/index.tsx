import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  FileText, CheckCircle2, Pizza, PartyPopper, Church, 
  ChevronDown, Wallet, Calendar 
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURAÇÃO DA IA ---
// Certifique-se de que a chave REACT_APP_GEMINI_API_KEY esteja cadastrada na Vercel
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const PROMPT_SISTEMA = `
Você é um assistente contábil especializado na Tesouraria do ECC (Encontro de Casais com Cristo) da Paróquia Nossa Senhora das Dores de Guaxupé/MG.
Analise o extrato bancário fornecido e extraia os dados rigorosamente no formato JSON.

REGRAS DE CATEGORIZAÇÃO:
1. "Pizza": Entradas de vendas de pizzas ou saídas de custos com ingredientes.
2. "Baile": Entradas de convites ou saídas com buffet/decoração.
3. "Taxa Mitra": Saídas identificadas como repasse ou taxa para a Mitra/Diocese.
4. "Dízimo/Oferta": Entradas de doações gerais.
5. "Manutenção": Despesas fixas como luz, água ou limpeza.

Retorne APENAS um objeto JSON válido (sem textos antes ou depois) com esta estrutura:
{
  "periodo": "Mês/Ano",
  "transacoes": [{ "data": "DD/MM", "desc": "descrição curta", "valor": 0.00, "tipo": "E"|"S", "cat": "categoria" }],
  "resumo": { "totalEntradas": 0.00, "totalSaidas": 0.00, "saldo": 0.00 },
  "eventos": { "lucroPizzas": 0.00, "lucroBaile": 0.00 },
  "mitraStatus": "PAGO" | "PENDENTE"
}
`;

// --- COMPONENTES AUXILIARES ---

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

const EventBadge = ({ title, value, icon, colorClass }: any) => (
  <div className={`bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm`}>
    <div className={`p-2 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '100')} ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{title}</p>
      <p className="text-sm font-mono font-bold text-slate-700">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
  </div>
);

// --- APLICAÇÃO PRINCIPAL ---

const App = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleProcess = async () => {
    if (!inputText.trim()) return alert("Por favor, cole os dados do extrato.");
    if (!API_KEY) return alert("Erro: Chave da API Gemini não encontrada nas configurações.");

    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([PROMPT_SISTEMA, inputText]);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, "").trim();
      const data = JSON.parse(text);
      setReport(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao processar o extrato. Tente copiar e colar novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20 font-sans text-slate-900">
      {/* Cabeçalho Profissional */}
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
          <div className="hidden md:block text-right">
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> IA Operacional
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-10 space-y-8">
        {/* Área de Entrada */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 transition-all hover:shadow-2xl">
          <div className="flex items-center gap-2 mb-4 ml-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inserir Extrato Mensal</span>
          </div>
          <textarea 
            className="w-full h-44 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 mb-6 font-mono text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
            placeholder="Cole aqui o texto copiado do Internet Banking..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isProcessing ? <Activity className="animate-spin" /> : "GERAR RELATÓRIO DE CONTAS"}
          </button>
        </section>

        {report && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cards de Resumo Líquido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard title="Entradas Mensais" value={report.resumo.totalEntradas} type="positive" icon={<TrendingUp size={16}/>} />
              <FinancialCard title="Saídas Mensais" value={report.resumo.totalSaidas} type="negative" icon={<TrendingDown size={16}/>} />
              <FinancialCard title="Saldo em Caixa" value={report.resumo.saldo} type="positive" icon={<Wallet size={16}/>} />
            </div>

            {/* Projetos e Taxas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <EventBadge title="Resultado Pizzas" value={report.eventos.lucroPizzas} icon={<Pizza size={18}/>} colorClass="text-orange-600" />
               <EventBadge title="Resultado Baile" value={report.eventos.lucroBaile} icon={<PartyPopper size={18}/>} colorClass="text-purple-600" />
               <div className={`bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-sm ${report.mitraStatus === 'PAGO' ? 'border-emerald-100' : 'border-rose-100'}`}>
                  <div className={`p-2 rounded-xl ${report.mitraStatus === 'PAGO' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Church size={18}/>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Repasse Mitra</p>
                    <p className="text-sm font-black uppercase tracking-tighter">{report.mitraStatus}</p>
                  </div>
               </div>
            </div>

            {/* Tabela Detalhada */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Detalhamento de Lançamentos</h3>
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500">{report.periodo}</span>
               </div>
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-400 uppercase text-[9px]">
                    <tr>
                      <th className="px-8 py-4">Data</th>
                      <th className="px-8 py-4">Descrição</th>
                      <th className="px-8 py-4">Categoria</th>
                      <th className="px-8 py-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.transacoes.map((t: any, i: number) => (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 font-mono text-slate-400">{t.data}</td>
                        <td className="px-8 py-4 font-bold text-slate-700">{t.desc}</td>
                        <td className="px-8 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-tighter transition-all group-hover:bg-blue-100 group-hover:text-blue-600">
                            {t.cat}
                          </span>
                        </td>
                        <td className={`px-8 py-4 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.tipo === 'S' ? '-' : ''}R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>

            <div className="flex items-center gap-3 justify-center text-slate-300 py-10">
               <div className="h-[1px] w-12 bg-slate-200" />
               <CheckCircle2 size={16} />
               <div className="h-[1px] w-12 bg-slate-200" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- RENDERIZAÇÃO FINAL ---
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
