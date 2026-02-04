import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  CheckCircle2, Pizza, PartyPopper, Church, 
  Wallet, Calendar, FileSearch, Paperclip, FileText, X, AlertTriangle
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuração da API - O prefixo REACT_APP_ é essencial no React
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const PROMPT_SISTEMA = `Analise o extrato do ECC e retorne JSON: { "periodo": "string", "resumo": { "entradas": 0.0, "saidas": 0.0, "saldo": 0.0 }, "detalhes": { "lucroPizzas": 0.0, "lucroBaile": 0.0, "taxaMitra": "PAGO/PENDENTE" }, "lista": [{ "data": "string", "item": "string", "valor": 0.0, "tipo": "E/S", "categoria": "string" }] }`;

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
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setInputText(event.target.result);
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    // 1. Verificação de Input
    if (!inputText.trim()) return alert("Por favor, cole o extrato ou anexe um arquivo.");

    // 2. Modo Detetive: A chave chegou no site?
    if (!API_KEY || API_KEY.length < 10) {
        return alert("⚠️ ERRO DE CONFIGURAÇÃO:\n\nA chave da API não foi encontrada. \n\n1. Verifique se na Vercel o nome é REACT_APP_GEMINI_API_KEY\n2. Vá em 'Deployments' e clique em 'Redeploy' com a opção 'Clear Cache'.");
    }

    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([PROMPT_SISTEMA, inputText]);
      const text = result.response.text().replace(/```json|```/g, "").trim();
      setReport(JSON.parse(text));
    } catch (e) {
      console.error(e);
      // 3. O que o Google disse?
      alert("❌ ERRO DA IA:\n" + e.message);
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
      <header className="bg-slate-900 text-white pt-12 pb-24 px-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg"><Church size={32} /></div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">N. Sra. das Dores • Guaxupé/MG</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-12 space-y-10">
        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-slate-400">
              <FileSearch size={18} />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Processar Extrato</h2>
            </div>
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-[10px] font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-full transition-all">
              <Paperclip size={14} /> {attachedFile ? "Trocar Arquivo" : "Anexar TXT/CSV"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" />
          </div>

          {attachedFile && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100 animate-in fade-in">
              <FileText className="text-blue-600" size={20} />
              <span className="text-xs font-bold text-blue-800 flex-1">{attachedFile.name}</span>
              <button onClick={() => {setAttachedFile(null); setInputText('');}} className="text-blue-400 hover:text-blue-600"><X size={16}/></button>
            </div>
          )}

          <textarea 
            className="w-full h-48 p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-8 font-mono text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
            placeholder="Cole o texto do extrato aqui..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          
          <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50">
            {isProcessing ? <Activity className="animate-spin" /> : "ANALISAR MOVIMENTAÇÕES"}
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
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Pizza size={24}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Pizzas</p><p className="font-mono font-bold text-orange-700">R$ {report.detalhes.lucroPizzas.toLocaleString('pt-BR')}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><PartyPopper size={24}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Baile</p><p className="font-mono font-bold text-purple-700">R$ {report.detalhes.lucroBaile.toLocaleString('pt-BR')}</p></div>
              </div>
              <div className={`bg-white p-6 rounded-[2rem] border flex items-center gap-5 ${report.detalhes.taxaMitra === 'PAGO' ? 'border-emerald-200' : 'border-rose-200'}`}>
                <div className={`p-3 rounded-2xl ${report.detalhes.taxaMitra === 'PAGO' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><Church size={24}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Mitra</p><p className="font-black text-sm uppercase">{report.detalhes.taxaMitra}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm text-xs">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                    <tr><th className="px-10 py-5">Data</th><th className="px-10 py-5">Item</th><th className="px-10 py-5 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.lista.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-5 font-mono text-slate-400">{t.data}</td>
                        <td className="px-10 py-5 font-bold text-slate-700">{t.item} <br/><span className="text-[9px] font-black text-blue-400 uppercase">{t.categoria}</span></td>
                        <td className={`px-10 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
