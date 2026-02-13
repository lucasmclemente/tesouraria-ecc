import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, Church, Wallet, Calendar, 
  FileSearch, Paperclip, Plus, Pizza, PartyPopper, Utensils, 
  Users, Info, X, FileText, Download, FileSpreadsheet, Save, Trash2
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

  // --- PERSISTÊNCIA SEGURA ---
  const [manualInitialBalance, setManualInitialBalance] = useState(() => localStorage.getItem('ecc_saldo_inicial') || 0);
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('ecc_categorias');
      return saved ? JSON.parse(saved) : ["Dízimo/Oferta", "Repasse Mitra", "Cozinha", "Manutenção", "Outros"];
    } catch(e) { return ["Dízimo/Oferta", "Repasse Mitra", "Cozinha", "Manutenção", "Outros"]; }
  });
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('ecc_transacoes_memoria');
      return (saved && saved !== "undefined") ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    localStorage.setItem('ecc_saldo_inicial', manualInitialBalance);
    localStorage.setItem('ecc_categorias', JSON.stringify(categories));
    localStorage.setItem('ecc_transacoes_memoria', JSON.stringify(transactions));
  }, [manualInitialBalance, categories, transactions]);

  // --- CÁLCULOS MATEMÁTICOS ---
  const totals = (transactions || []).reduce((acc, t) => {
    const val = Math.abs(parseFloat(t.valor)) || 0;
    const pName = t.proj || "Outros";
    if (t.tipo === 'E') acc.entradas += val; else acc.saidas += val;
    if (!acc.porProjeto[pName]) acc.porProjeto[pName] = { e: 0, s: 0, r: 0 };
    if (t.tipo === 'E') acc.porProjeto[pName].e += val; else acc.porProjeto[pName].s += val;
    acc.porProjeto[pName].r = acc.porProjeto[pName].e - acc.porProjeto[pName].s;
    return acc;
  }, { entradas: 0, saidas: 0, porProjeto: {} });

  const finalBalance = parseFloat(manualInitialBalance) + totals.entradas - totals.saidas;

  // --- LÓGICA DE SINCRONIZAÇÃO (ANTI-DUPLICIDADE) ---
  const mergeNewData = (newList) => {
    const oldList = [...transactions];
    const newlyAdded = [];
    newList.forEach(newItem => {
      const createSig = (t) => `${t.data}|${t.item.toLowerCase().trim()}|${Math.abs(parseFloat(t.valor)).toFixed(2)}`;
      const newSig = createSig(newItem);
      if (!oldList.some(oldT => createSig(oldT) === newSig)) newlyAdded.push(newItem);
    });
    if (newlyAdded.length === 0) return alert("Nenhum lançamento novo identificado.");
    const merged = [...oldList, ...newlyAdded].sort((a,b) => a.data.split('/').reverse().join('').localeCompare(b.data.split('/').reverse().join('')));
    setTransactions(merged);
    alert(`${newlyAdded.length} itens novos sincronizados!`);
  };

  // --- AÇÕES ---
  const handleAnalyze = async () => {
    if (!inputText.trim() || !startDate || !endDate) return alert("Preencha datas e anexe arquivos.");
    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Analise transações entre ${startDate} e ${endDate}. Retorne APENAS o JSON: { "lista": [{ "data": "DD/MM/YYYY", "item": "string", "valor": 0.0, "tipo": "E/S", "cat": "Outros", "proj": "Outros" }] }`;
      const result = await model.generateContent([prompt, inputText]);
      const resText = result.response.text();
      const jsonStart = resText.indexOf('{');
      const jsonEnd = resText.lastIndexOf('}') + 1;
      const cleanJson = resText.substring(jsonStart, jsonEnd);
      mergeNewData(JSON.parse(cleanJson).lista);
    } catch (e) { alert("Erro de formato. Tente novamente."); }
    finally { setIsProcessing(false); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text("TESOURARIA ECC - GUAXUPÉ", 14, 20);
    doc.setFontSize(9); doc.text(`Relatório Gerado em ${new Date().toLocaleDateString()} | Período: ${startDate} a ${endDate}`, 14, 28);
    
    doc.setTextColor(0,0,0); doc.setFontSize(10);
    doc.text(`SALDO INICIAL: R$ ${parseFloat(manualInitialBalance).toLocaleString('pt-BR')}`, 14, 50);
    doc.text(`ENTRADAS (+): R$ ${totals.entradas.toLocaleString('pt-BR')}`, 70, 50);
    doc.text(`SAÍDAS (-): R$ ${totals.saidas.toLocaleString('pt-BR')}`, 120, 50);
    doc.text(`SALDO FINAL: R$ ${finalBalance.toLocaleString('pt-BR')}`, 165, 50);

    let yProj = 65;
    doc.text("RESUMO POR PROJETOS", 14, yProj);
    PROJETOS_PADRAO.forEach(p => {
      const d = totals.porProjeto[p] || { e: 0, s: 0, r: 0 };
      yProj += 6; doc.setFontSize(8);
      doc.text(`${p}: Ent: R$ ${d.e.toFixed(2)} | Saí: R$ ${d.s.toFixed(2)} | Result: R$ ${d.r.toFixed(2)}`, 14, yProj);
    });

    const body = transactions.map(t => [t.data, t.proj, t.item, t.cat, t.obs || '-', t.tipo === 'E' ? t.valor.toFixed(2) : `-${Math.abs(t.valor).toFixed(2)}`]);
    doc.autoTable({ startY: yProj + 10, head: [['Data', 'Projeto', 'Descrição', 'Categoria', 'Obs', 'Valor']], body, theme: 'grid', styles: {fontSize: 7}});
    doc.save("Prestacao_Contas_ECC.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({ ...t, valor: t.tipo === 'E' ? t.valor : -Math.abs(t.valor) })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, "ECC_Financeiro.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      <header className="bg-slate-900 text-white pt-12 pb-24 px-8 rounded-b-[3rem] shadow-2xl flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl"><Church size={32} /></div>
          <div><h1 className="text-3xl font-black uppercase italic leading-none">Tesouraria ECC</h1><p className="text-blue-400 text-[10px] font-black uppercase mt-2">Paróquia Nossa Senhora das Dores</p></div>
        </div>
        <button onClick={() => {if(window.confirm("Zerar base de dados?")) {localStorage.clear(); window.location.reload();}}} className="bg-rose-600/20 text-rose-400 p-3 rounded-2xl transition-colors hover:bg-rose-600 hover:text-white"><Trash2 size={20}/></button>
      </header>

      <main className="max-w-7xl mx-auto px-8 -mt-12 space-y-8">
        <section className="bg-white p-8 rounded-[3rem] shadow-xl border grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Período</p><div className="flex gap-1"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none" /><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none" /></div></div>
          <div className="space-y-2"><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">Saldo Inicial (Manual)</p><input type="number" value={manualInitialBalance} onChange={e => setManualInitialBalance(e.target.value)} className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black outline-none" /></div>
          <div className="space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nova Categoria</p><div className="flex gap-2"><input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs outline-none" /><button onClick={() => {if(newCategoryName){setCategories([...categories, newCategoryName]); setNewCategoryName('');}}} className="bg-slate-900 text-white px-4 rounded-xl transition-all hover:bg-slate-800"><Plus size={18}/></button></div></div>
          <div className="space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Anexar Extratos</p><button onClick={() => fileInputRef.current.click()} className="w-full p-3 bg-slate-100 border rounded-xl text-[10px] font-black uppercase tracking-tighter">Selecionar ({attachedFiles.length})</button><input type="file" ref={fileInputRef} onChange={async (e) => { const files = Array.from(e.target.files); setAttachedFiles(files); let text = ""; for (const f of files) { text += await f.text(); } setInputText(text); }} className="hidden" multiple accept=".txt,.csv" /></div>
        </section>

        <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50">{isProcessing ? <Activity className="animate-spin inline mr-2" /> : "SINCRONIZAR EXTRATOS (SEM DUPLICIDADE)"}</button>

        {transactions.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-black">
              <div className="bg-white p-6 rounded-3xl border shadow-sm"><p className="text-[9px] text-slate-400 uppercase mb-1">Saldo Inicial</p><p className="text-lg">R$ {parseFloat(manualInitialBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              <div className="bg-emerald-50 p-6 rounded-3xl border text-emerald-700 shadow-sm"><p className="text-[9px] uppercase mb-1">Entradas</p><p className="text-lg">R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              <div className="bg-rose-50 p-6 rounded-3xl border text-rose-700 shadow-sm"><p className="text-[9px] uppercase mb-1">Saídas</p><p className="text-lg">R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg"><p className="text-[9px] uppercase mb-1 opacity-70">Saldo Final</p><p className="text-xl font-mono">R$ {finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
            </div>

            {/* CARDS DE PROJETO RESTAURADOS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {PROJETOS_PADRAO.map(proj => {
                const pData = totals.porProjeto[proj] || { e: 0, s: 0, r: 0 };
                return (
                  <div key={proj} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{proj}</p>
                    <div className="space-y-1 text-[10px] font-bold font-mono">
                      <div className="flex justify-between tracking-tighter"><span>ENT:</span><span className="text-emerald-600">+{pData.e.toFixed(2)}</span></div>
                      <div className="flex justify-between tracking-tighter"><span>SAÍ:</span><span className="text-rose-600">-{pData.s.toFixed(2)}</span></div>
                      <div className={`pt-2 border-t mt-1 flex justify-between font-black ${pData.r >= 0 ? 'text-blue-600' : 'text-rose-600'}`}><span>RES:</span><span>{pData.r.toFixed(2)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
               <div className="px-8 py-5 border-b flex justify-between items-center bg-slate-50/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Save size={14} className="text-blue-600"/> Lançamentos Consolidados ({transactions.length})</span>
                  <div className="flex gap-2">
                    <button onClick={exportPDF} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-rose-100 transition-all shadow-sm"><Download size={14}/> PDF</button>
                    <button onClick={exportExcel} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"><FileSpreadsheet size={14}/> Excel</button>
                  </div>
               </div>
               <table className="w-full text-left text-[11px]"><thead className="bg-slate-50 text-slate-400 uppercase font-black border-b"><tr><th className="px-6 py-5">Data</th><th className="px-6 py-5">Projeto</th><th className="px-6 py-5">Descrição</th><th className="px-6 py-5">Categoria</th><th className="px-6 py-5">Obs</th><th className="px-6 py-5 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-50">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-mono text-slate-400">{t.data}</td>
                    <td className="px-6 py-5"><select value={t.proj} onChange={e => {const nl=[...transactions]; nl[i].proj=e.target.value; setTransactions(nl);}} className="bg-slate-100 px-3 py-1 rounded-full font-black text-[9px] uppercase border-none outline-none">{PROJETOS_PADRAO.map(p=><option key={p} value={p}>{p}</option>)}</select></td>
                    <td className="px-6 py-5 font-bold text-slate-700 leading-tight">{t.item}</td>
                    <td className="px-6 py-5"><select value={t.cat} onChange={e => {const nl=[...transactions]; nl[i].cat=e.target.value; setTransactions(nl);}} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black text-[9px] uppercase border-none outline-none">{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                    <td className="px-6 py-5"><input type="text" value={t.obs || ''} onChange={e => {const nl=[...transactions]; nl[i].obs=e.target.value; setTransactions(nl);}} placeholder="..." className="bg-transparent border-b text-[10px] outline-none w-full" /></td>
                    <td className={`px-6 py-5 text-right font-mono font-black ${t.tipo==='E'?'text-emerald-500':'text-rose-500'}`}>R$ {Math.abs(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
               </tbody></table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
