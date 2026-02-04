import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, Church, Wallet, Calendar, 
  FileSearch, Paperclip, Plus, Pizza, PartyPopper, Utensils, 
  Users, Info, X, FileText, Download, FileSpreadsheet 
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

  // --- FUNÇÕES DE EXPORTAÇÃO ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Tesouraria ECC - Paroquia N. Sra. das Dores", 14, 20);
    doc.setFontSize(10);
    doc.text(`Periodo: ${startDate} a ${endDate}`, 14, 28);
    const tableData = transactions.map(t => [t.data, t.proj, t.item, t.cat, t.tipo === 'E' ? t.valor.toFixed(2) : `-${t.valor.toFixed(2)}`]);
    doc.autoTable({ startY: 40, head: [['Data', 'Projeto', 'Item', 'Categoria', 'Valor (R$)']], body: tableData, theme: 'grid' });
    doc.save(`Relatorio_ECC_${startDate}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
    XLSX.writeFile(wb, `Tesouraria_ECC_${startDate}.xlsx`);
  };

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
    if (!API_KEY) return alert("Chave API não configurada.");
    
    setIsProcessing(true);
    const prompt = `Analise os extratos de ${startDate} a ${endDate}. Extraia Saldo Inicial, Saldo Final e Transacoes. Categorias: ${categories.join(',')}. Projetos: Pizza, Pastel, Baile, Encontro, Outros. Retorne APENAS o JSON puro: { "saldoInicial": 0.0, "saldoFinal": 0.0, "lista": [{ "data": "DD/MM", "item": "string", "valor": 0.0, "tipo": "E/S", "cat": "string", "proj": "string" }] }`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([prompt, inputText]);
      const responseText = await result.response.text();
      
      // Limpeza de Markdown
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      setTransactions(data.lista);
      setAccountBalances({ inicial: data.saldoInicial, final: data.saldoFinal });
    } catch (e) {
      alert("❌ ERRO NA ANÁLISE:\n" + e.message);
    } finally { setIsProcessing(false); }
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 -mt-12 space-y-8">
        {/* Filtros */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Calendar size={14} className="inline mr-2"/> Período</p>
            <div className="flex gap-2"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" /><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" /></div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Plus size={14} className="inline mr-2"/> Categoria</p>
            <div className="flex gap-2"><input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nova..." className="w-full p-3 bg-slate-50 border rounded-xl text-xs" /><button onClick={() => { if(newCategoryName) setCategories([...categories, newCategoryName]); setNewCategoryName(''); }} className="bg-slate-900 text-white px-4 rounded-xl"><Plus size={18}/></button></div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Paperclip size={14} className="inline mr-2"/> Extratos ({attachedFiles.length}/15)</p>
            <button onClick={() => fileInputRef.current.click()} className="w-full p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-blue-100 transition-all">
              {attachedFiles.length > 0 ? "Arquivos Prontos" : "Anexar Arquivos"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" multiple />
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
          <textarea className="w-full h-32 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-6 font-mono text-xs focus:outline-none resize-none" placeholder="O conteúdo dos arquivos aparecerá aqui..." value={inputText} readOnly />
          <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50">
            {isProcessing ? <Activity className="animate-spin" /> : "GERAR RELATÓRIO COMPLETO"}
          </button>
        </section>

        {transactions.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Cards de Saldo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-100 p-6 rounded-3xl border"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Inicial</p><p className="text-lg font-mono font-bold">R$ {accountBalances.inicial.toLocaleString('pt-BR')}</p></div>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100"><p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Entradas (+)</p><p className="text-lg font-mono font-bold text-emerald-700">R$ {totals.entradas.toLocaleString('pt-BR')}</p></div>
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100"><p className="text-[9px] font-black text-rose-600 uppercase mb-1">Saídas (-)</p><p className="text-lg font-mono font-bold text-rose-700">R$ {totals.saidas.toLocaleString('pt-BR')}</p></div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-lg"><p className="text-[9px] font-black text-blue-100 uppercase mb-1">Final</p><p className="text-xl font-mono font-bold text-white">R$ {accountBalances.final.toLocaleString('pt-BR')}</p></div>
            </div>

            {/* Projetos */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {PROJETOS_PADRAO.map(proj => {
                const pData = totals.porProjeto[proj] || { e: 0, s: 0, r: 0 };
                return (
                  <div key={proj} className="bg-white p-5 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3">{proj}</p>
                    <div className="space-y-1 text-[10px] font-bold">
                      <div className="flex justify-between tracking-tighter"><span>ENT:</span><span className="text-emerald-600">+{pData.e.toFixed(2)}</span></div>
                      <div className="flex justify-between tracking-tighter"><span>SAÍ:</span><span className="text-rose-600">-{pData.s.toFixed(2)}</span></div>
                      <div className={`pt-2 border-t mt-1 flex justify-between font-black ${pData.r >= 0 ? 'text-blue-600' : 'text-rose-600'}`}><span>RES:</span><span>R$ {pData.r.toFixed(2)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabela com Exportação */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <div className="px-8 py-5 border-b flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamentos Detalhados</span>
                  <div className="flex gap-3">
                    <button onClick={exportPDF} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all"><Download size={14}/> PDF</button>
                    <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all"><FileSpreadsheet size={14}/> Excel</button>
                  </div>
               </div>
               <table className="w-full text-left text-[11px]"><thead className="bg-slate-50 text-slate-400 uppercase font-black border-b"><tr><th className="px-6 py-5">Data</th><th className="px-6 py-5">Projeto</th><th className="px-6 py-5">Item</th><th className="px-6 py-5">Categoria</th><th className="px-6 py-5 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-50">{transactions.map((t, i) => (<tr key={i} className="hover:bg-slate-50/50"><td className="px-6 py-5 font-mono text-slate-400">{t.data}</td><td className="px-6 py-5"><select value={t.proj} onChange={e => { const nl = [...transactions]; nl[i].proj = e.target.value; setTransactions(nl); }} className="w-full bg-slate-100 px-3 py-1 rounded-full font-black text-[9px] uppercase outline-none">{PROJETOS_PADRAO.map(p => <option key={p} value={p}>{p}</option>)}</select></td><td className="px-6 py-5 font-bold text-slate-700">{t.item}</td><td className="px-6 py-5"><select value={t.cat} onChange={e => { const nl = [...transactions]; nl[i].cat = e.target.value; setTransactions(nl); }} className="w-full bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black text-[9px] uppercase outline-none">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></td><td className={`px-6 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {t.valor.toLocaleString('pt-BR')}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
