import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  Church, Wallet, Calendar, FileSearch, Paperclip, 
  Plus, Pizza, PartyPopper, Utensils, Users, Info, X, FileText, AlertCircle
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const PROJETOS_PADRAO = ["Pizza", "Pastel", "Baile", "Encontro", "Outros"];

const App = () => {
  const [inputText, setInputText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [accountBalances, setAccountBalances] = useState({ inicial: 0, final: 0 });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('ecc_categorias');
    return saved ? JSON.parse(saved) : ["Dízimo/Oferta", "Repasse Mitra", "Cozinha", "Manutenção", "Outros"];
  });

  useEffect(() => {
    localStorage.setItem('ecc_categorias', JSON.stringify(categories));
  }, [categories]);

  const totals = transactions.reduce((acc, t) => {
    const val = parseFloat(t.valor) || 0;
    if (t.tipo === 'E') acc.entradas += val; else acc.saidas += val;
    if (!acc.porProjeto[t.proj]) acc.porProjeto[t.proj] = { e: 0, s: 0, r: 0 };
    if (t.tipo === 'E') acc.porProjeto[t.proj].e += val; else acc.porProjeto[t.proj].s += val;
    acc.porProjeto[t.proj].r = acc.porProjeto[t.proj].e - acc.porProjeto[t.proj].s;
    return acc;
  }, { entradas: 0, saidas: 0, porProjeto: {} });

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 15);
    setAttachedFiles(selectedFiles);
    let combinedText = "";
    for (const file of selectedFiles) {
      const text = await file.text();
      combinedText += `\n--- ARQUIVO: ${file.name} ---\n${text}\n`;
    }
    setInputText(combinedText);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || !startDate || !endDate) return alert("Preencha as datas e anexe os extratos.");
    if (!API_KEY) return alert("Erro: Chave da API não configurada na Vercel.");

    setIsProcessing(true);
    
    // Prompt ultra-específico para evitar erros de JSON
    const prompt = `Analise os extratos do ECC de ${startDate} a ${endDate}.
    Extraia Saldo Inicial, Saldo Final e Transações (sem duplicatas).
    Categorias: ${categories.join(',')}.
    IMPORTANTE: Retorne APENAS o JSON, sem markdown ou explicações.
    ESTRUTURA: { "saldoInicial": 0.0, "saldoFinal": 0.0, "lista": [{ "data": "DD/MM", "item": "string", "valor": 0.0, "tipo": "E/S", "cat": "string", "proj": "Pizza|Pastel|Baile|Encontro|Outros" }] }`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([prompt, inputText]);
      const response = await result.response;
      
      // LIMPEZA DO JSON (Remove possíveis blocos ```json ... ```)
      let cleanJson = response.text().trim();
      if (cleanJson.includes('```')) {
        cleanJson = cleanJson.split('```')[1].replace('json', '').trim();
      }

      const data = JSON.parse(cleanJson);
      setTransactions(data.lista);
      setAccountBalances({ inicial: data.saldoInicial, final: data.saldoFinal });
    } catch (e) {
      console.error(e);
      alert("❌ ERRO NA ANÁLISE:\n" + e.message + "\n\nTente com menos arquivos ou verifique se o formato do extrato é legível.");
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20 text-slate-900">
      <header className="bg-slate-900 text-white pt-12 pb-24 px-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg"><Church size={32} /></div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">N. Sra. das Dores • Guaxupé</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 -mt-12 space-y-8">
        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Período</p>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Novas Categorias (Salvas)</p>
            <div className="flex gap-2">
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ex: Pastoral" className="w-full p-3 bg-slate-50 border rounded-xl text-xs" />
              <button onClick={() => { if(newCategoryName) setCategories([...categories, newCategoryName]); setNewCategoryName(''); }} className="bg-slate-900 text-white px-4 rounded-xl hover:bg-slate-800 transition-colors"><Plus size={18}/></button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14}/> Extratos ({attachedFiles.length}/15)</p>
            <button onClick={() => fileInputRef.current.click()} className="w-full p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black uppercase">
              Anexar Arquivos
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" multiple />
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
          <textarea className="w-full h-32 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-6 font-mono text-xs focus:outline-none resize-none" placeholder="O conteúdo dos arquivos aparecerá aqui..." value={inputText} readOnly />
          <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50">
            {isProcessing ? <Activity className="animate-spin" /> : "PROCESSAR TODOS OS EXTRATOS"}
          </button>
        </section>

        {transactions.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-100 p-6 rounded-3xl border">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Saldo Inicial</p>
                <p className="text-lg font-mono font-bold">R$ {accountBalances.inicial.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Total Entradas</p>
                <p className="text-lg font-mono font-bold text-emerald-700">R$ {totals.entradas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                <p className="text-[9px] font-black text-rose-600 uppercase mb-1">Total Saídas</p>
                <p className="text-lg font-mono font-bold text-rose-700">R$ {totals.saidas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-lg text-white">
                <p className="text-[9px] font-black uppercase mb-1 opacity-80">Saldo Final (Conferência)</p>
                <p className="text-xl font-mono font-bold text-white">R$ {accountBalances.final.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {PROJETOS_PADRAO.map(proj => {
                const pData = totals.porProjeto[proj] || { e: 0, s: 0, r: 0 };
                return (
                  <div key={proj} className="bg-white p-5 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3">{proj}</p>
                    <div className="space-y-1 text-[10px] font-bold">
                      <div className="flex justify-between tracking-tighter"><span>ENT:</span><span className="text-emerald-600">+{pData.e.toFixed(2)}</span></div>
                      <div className="flex justify-between tracking-tighter"><span>SAÍ:</span><span className="text-rose-600">-{pData.s.toFixed(2)}</span></div>
                      <div className="pt-2 border-t mt-1 flex justify-between font-black text-slate-800 tracking-tighter"><span>RES:</span><span>R$ {pData.r.toFixed(2)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black border-b">
                    <tr><th className="px-6 py-5">Data</th><th className="px-6 py-5">Projeto</th><th className="px-6 py-5">Item</th><th className="px-6 py-5">Categoria</th><th className="px-6 py-5 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-6 py-5 font-mono text-slate-400">{t.data}</td>
                        <td className="px-6 py-5">
                          <select value={t.proj} onChange={e => {
                            const newList = [...transactions];
                            newList[i].proj = e.target.value;
                            setTransactions(newList);
                          }} className="w-full bg-slate-100 px-3 py-1 rounded-full font-black text-[9px] uppercase border-none">
                            {PROJETOS_PADRAO.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-700">{t.item}</td>
                        <td className="px-6 py-5">
                          <select value={t.cat} onChange={e => {
                            const newList = [...transactions];
                            newList[i].cat = e.target.value;
                            setTransactions(newList);
                          }} className="w-full bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black text-[9px] uppercase border-none">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className={`px-6 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
