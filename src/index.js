import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, Church, Wallet, Calendar, 
  FileSearch, Paperclip, Plus, Pizza, PartyPopper, Utensils, 
  Users, Info, X, FileText, Download, FileSpreadsheet, Save
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const PROJETOS_PADRAO = ["Pizza", "Pastel", "Baile", "Encontro", "Outros"];

const App = () => {
  const [inputText, setInputText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // --- PERSISTÊNCIA DE DADOS (MEMÓRIA) ---
  
  // 1. Saldo Inicial
  const [manualInitialBalance, setManualInitialBalance] = useState(() => {
    return localStorage.getItem('ecc_saldo_inicial') || 0;
  });

  // 2. Categorias
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('ecc_categorias');
    return saved ? JSON.parse(saved) : ["Dízimo/Oferta", "Repasse Mitra", "Cozinha", "Manutenção", "Outros"];
  });

  // 3. Transações Históricas (A "Memória" das suas classificações)
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('ecc_transacoes_memoria');
    return saved ? JSON.parse(saved) : [];
  });

  // Efeito para salvar tudo automaticamente sempre que mudar
  useEffect(() => {
    localStorage.setItem('ecc_saldo_inicial', manualInitialBalance);
    localStorage.setItem('ecc_categorias', JSON.stringify(categories));
    localStorage.setItem('ecc_transacoes_memoria', JSON.stringify(transactions));
  }, [manualInitialBalance, categories, transactions]);

  // --- CÁLCULOS ---
  const totals = transactions.reduce((acc, t) => {
    const val = parseFloat(t.valor) || 0;
    if (t.tipo === 'E') acc.entradas += val; else acc.saidas += val;
    if (!acc.porProjeto[t.proj]) acc.porProjeto[t.proj] = { e: 0, s: 0, r: 0 };
    if (t.tipo === 'E') acc.porProjeto[t.proj].e += val; else acc.porProjeto[t.proj].s += val;
    acc.porProjeto[t.proj].r = acc.porProjeto[t.proj].e - acc.porProjeto[t.proj].s;
    return acc;
  }, { entradas: 0, saidas: 0, porProjeto: {} });

  const calculatedFinalBalance = parseFloat(manualInitialBalance) + totals.entradas - totals.saidas;

  // --- LÓGICA DE MERGE (MEMÓRIA) ---
  const mergeTransactions = (newList) => {
    const savedList = [...transactions];
    
    const merged = newList.map(newT => {
      // Cria uma chave única para identificar se já conhecemos esse lançamento
      // Baseado em Data + Descrição + Valor
      const match = savedList.find(savedT => 
        savedT.data === newT.data && 
        savedT.item === newT.item && 
        savedT.valor === newT.valor
      );

      if (match) {
        // Se já existe, mantemos a classificação que você fez manualmente antes
        return { ...newT, cat: match.cat, proj: match.proj };
      }
      // Se for novo, usa a sugestão da IA
      return newT;
    });

    // Remove duplicatas reais (mesmos dados) para não somar duas vezes o mesmo dia
    const uniqueList = [...merged];
    savedList.forEach(saved => {
        const exists = uniqueList.find(u => u.data === saved.data && u.item === saved.item && u.valor === saved.valor);
        if (!exists) uniqueList.push(saved);
    });

    setTransactions(uniqueList.sort((a, b) => a.data.localeCompare(b.data)));
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 15);
    setAttachedFiles(selectedFiles);
    let combinedText = "";
    for (const file of selectedFiles) {
      const text = await file.text();
      combinedText += `\n${text}\n`;
    }
    setInputText(combinedText);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || !startDate || !endDate) return alert("Preencha datas e extratos.");
    setIsProcessing(true);
    
    const prompt = `Analise extratos de ${startDate} a ${endDate}. Extraia todas as transações. JSON: { "lista": [{ "data": "DD/MM", "item": "string", "valor": 0.0, "tipo": "E/S", "cat": "sugestão", "proj": "Outros" }] }`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([prompt, inputText]);
      const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      
      mergeTransactions(data.lista);
    } catch (e) { alert("Erro na análise inteligente."); }
    finally { setIsProcessing(false); }
  };

  const updateField = (index, field, value) => {
    const newList = [...transactions];
    newList[index][field] = value;
    setTransactions(newList);
  };

  // --- EXPORTAÇÃO ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Tesouraria ECC - Paroquia N. Sra. das Dores", 14, 20);
    const tableData = transactions.map(t => [t.data, t.proj, t.item, t.cat, t.tipo === 'E' ? t.valor.toFixed(2) : `-${t.valor.toFixed(2)}`]);
    doc.autoTable({ startY: 40, head: [['Data', 'Projeto', 'Item', 'Categoria', 'Valor']], body: tableData });
    doc.save("Relatorio_ECC.pdf");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20 text-slate-900">
      <header className="bg-slate-900 text-white pt-12 pb-24 px-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg"><Church size={32} /></div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">N. Sra. das Dores • Guaxupé</p>
            </div>
          </div>
          {transactions.length > 0 && (
            <button onClick={() => {if(window.confirm("Limpar toda a memória e começar do zero?")) setTransactions([]);}} className="text-[9px] bg-rose-500/20 text-rose-300 px-4 py-2 rounded-full font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Limpar Memória</button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 -mt-12 space-y-8">
        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Período</p>
            <div className="flex gap-1"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl text-[10px] font-bold" /><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl text-[10px] font-bold" /></div>
          </div>
          
          <div className="space-y-3">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Wallet size={14}/> Saldo em {startDate || '...'}</p>
            <input type="number" value={manualInitialBalance} onChange={e => setManualInitialBalance(e.target.value)} className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black" />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Nova Categoria</p>
            <div className="flex gap-2"><input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs" /><button onClick={() => { if(newCategoryName) setCategories([...categories, newCategoryName]); setNewCategoryName(''); }} className="bg-slate-900 text-white px-3 rounded-xl"><Plus size={16}/></button></div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14}/> Extratos ({attachedFiles.length})</p>
            <button onClick={() => fileInputRef.current.click()} className="w-full p-3 bg-slate-100 text-slate-600 border rounded-xl text-[10px] font-black uppercase">Anexar Arquivos</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" multiple />
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
          <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50">
            {isProcessing ? <Activity className="animate-spin" /> : "SINCRONIZAR E ATUALIZAR MEMÓRIA"}
          </button>
        </section>

        {transactions.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-black">
              <div className="bg-slate-100 p-6 rounded-3xl border"><p className="text-[9px] text-slate-500 uppercase mb-1">Saldo Inicial</p><p className="text-lg font-mono">R$ {parseFloat(manualInitialBalance).toLocaleString('pt-BR')}</p></div>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100"><p className="text-[9px] text-emerald-600 uppercase mb-1">Entradas</p><p className="text-lg font-mono text-emerald-700">R$ {totals.entradas.toLocaleString('pt-BR')}</p></div>
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100"><p className="text-[9px] text-rose-600 uppercase mb-1">Saídas</p><p className="text-lg font-mono text-rose-700">R$ {totals.saidas.toLocaleString('pt-BR')}</p></div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-lg text-white"><p className="text-[9px] uppercase mb-1 opacity-80">Saldo Final Atual</p><p className="text-xl font-mono">R$ {calculatedFinalBalance.toLocaleString('pt-BR')}</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {PROJETOS_PADRAO.map(proj => {
                const pData = totals.porProjeto[proj] || { e: 0, s: 0, r: 0 };
                return (
                  <div key={proj} className="bg-white p-5 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3">{proj}</p>
                    <div className="space-y-1 text-[10px] font-bold font-mono">
                      <div className="flex justify-between tracking-tighter"><span>ENT:</span><span className="text-emerald-600">+{pData.e.toFixed(2)}</span></div>
                      <div className="flex justify-between tracking-tighter"><span>SAÍ:</span><span className="text-rose-600">-{pData.s.toFixed(2)}</span></div>
                      <div className={`pt-2 border-t mt-1 flex justify-between font-black ${pData.r >= 0 ? 'text-blue-600' : 'text-rose-600'}`}><span>RES:</span><span>{pData.r.toFixed(2)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <div className="px-8 py-5 border-b flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Save size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados Persistente ({transactions.length} itens)</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={exportPDF} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all flex items-center gap-2"><Download size={14}/> PDF</button>
                    <button onClick={exportExcel} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all flex items-center gap-2"><FileSpreadsheet size={14}/> Excel</button>
                  </div>
               </div>
               <table className="w-full text-left text-[11px]"><thead className="bg-slate-50 text-slate-400 uppercase font-black border-b"><tr><th className="px-6 py-5">Data</th><th className="px-6 py-5">Projeto</th><th className="px-6 py-5">Item</th><th className="px-6 py-5">Categoria</th><th className="px-6 py-5 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-50">{transactions.map((t, i) => (<tr key={i} className="hover:bg-slate-50/50"><td className="px-6 py-5 font-mono text-slate-400">{t.data}</td><td className="px-6 py-5"><select value={t.proj} onChange={e => updateField(i, 'proj', e.target.value)} className="w-full bg-slate-100 px-2 py-1 rounded-full font-black text-[9px] uppercase outline-none cursor-pointer">{PROJETOS_PADRAO.map(p => <option key={p} value={p}>{p}</option>)}</select></td><td className="px-6 py-5 font-bold text-slate-700">{t.item}</td><td className="px-6 py-5"><select value={t.cat} onChange={e => updateField(i, 'cat', e.target.value)} className="w-full bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-black text-[9px] uppercase outline-none cursor-pointer">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></td><td className={`px-6 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {t.valor.toLocaleString('pt-BR')}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
