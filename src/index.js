import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  CheckCircle2, Pizza, PartyPopper, Church, 
  Wallet, Calendar, FileSearch, Paperclip, FileText, X
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const App = () => {
  const [inputText, setInputText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    if (!inputText.trim()) return alert("Cole o extrato ou anexe um arquivo.");
    if (!startDate || !endDate) return alert("Por favor, selecione as datas de início e fim do período.");
    
    setIsProcessing(true);
    
    // Prompt atualizado para incluir o filtro de datas
    const promptDinamico = `
      Você é o Tesoureiro Digital do ECC Paróquia Nossa Senhora das Dores.
      Analise o extrato e extraia apenas as movimentações entre ${startDate} e ${endDate}.
      
      REGRAS:
      1. Calcule lucro de "PIZZA" (Entradas - Saídas de ingredientes).
      2. Calcule lucro de "BAILE" (Convites/Mesas - Despesas baile).
      3. Identifique se houve saída para "MITRA" (Status PAGO ou PENDENTE).
      
      RETORNE APENAS JSON:
      {
        "periodo": "De ${startDate} a ${endDate}",
        "resumo": { "entradas": 0.0, "saidas": 0.0, "saldo": 0.0 },
        "detalhes": { "lucroPizzas": 0.0, "lucroBaile": 0.0, "taxaMitra": "PAGO/PENDENTE" },
        "lista": [{ "data": "DD/MM", "item": "string", "valor": 0.0, "tipo": "E/S", "categoria": "string" }]
      }
    `;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([promptDinamico, inputText]);
      const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      setReport(data);
    } catch (e) {
      alert("Erro na análise. Verifique se o texto do extrato é válido.");
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20 text-slate-900">
      <header className="bg-slate-900 text-white pt-12 pb-24 px-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg"><Church size={32} /></div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">N. Sra. das Dores • Guaxupé/MG</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-12 space-y-8">
        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
          
          {/* SEÇÃO DE FILTROS DE DATA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Data Inicial</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Data Final</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2 text-slate-400">
              <FileSearch size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Conteúdo do Extrato</span>
            </div>
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-[10px] font-black bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200 transition-all">
              <Paperclip size={14} /> {attachedFile ? "Trocar" : "Anexar"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" />
          </div>

          <textarea 
            className="w-full h-40 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-6 font-mono text-xs focus:outline-none focus:bg-white transition-all resize-none shadow-inner"
            placeholder="Cole o texto aqui..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />

          <button 
            onClick={handleAnalyze} 
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {isProcessing ? <Activity className="animate-spin" /> : "GERAR RELATÓRIO DO PERÍODO"}
          </button>
        </section>

        {report && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">{report.periodo}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-50 shadow-sm text-center">
                <TrendingUp className="mx-auto mb-2 text-emerald-500" size={20} />
                <p className="text-[10px] font-black text-slate-400 uppercase">Entradas</p>
                <p className="text-xl font-mono font-black text-emerald-600">R$ {report.resumo.entradas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border-2 border-rose-50 shadow-sm text-center">
                <TrendingDown className="mx-auto mb-2 text-rose-500" size={20} />
                <p className="text-[10px] font-black text-slate-400 uppercase">Saídas</p>
                <p className="text-xl font-mono font-black text-rose-600">R$ {report.resumo.saidas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-50 shadow-sm text-center">
                <Wallet className="mx-auto mb-2 text-blue-500" size={20} />
                <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Final</p>
                <p className="text-xl font-mono font-black text-slate-900">R$ {report.resumo.saldo.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4">Descrição</th><th className="px-8 py-4 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.lista.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-8 py-4 font-mono text-slate-400">{t.data}</td>
                        <td className="px-8 py-4 font-bold text-slate-700">{t.item}</td>
                        <td className={`px-8 py-4 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {t.valor.toLocaleString('pt-BR')}</td>
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
