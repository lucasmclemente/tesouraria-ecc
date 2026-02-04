import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, Church, Wallet, Calendar, 
  FileSearch, Paperclip, Plus, Pizza, PartyPopper, Utensils, 
  Users, Info, X, FileText, Download, FileSpreadsheet, FilePieChart 
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
    const titulo = `Relatorio_ECC_${startDate}_a_${endDate}`;
    
    doc.setFontSize(18);
    doc.text("Tesouraria ECC - Paroquia N. Sra. das Dores", 14, 20);
    doc.setFontSize(10);
    doc.text(`Periodo: ${startDate} a ${endDate}`, 14, 28);

    doc.text(`Saldo Inicial: R$ ${accountBalances.inicial.toFixed(2)}`, 14, 40);
    doc.text(`Total Entradas: R$ ${totals.entradas.toFixed(2)}`, 14, 45);
    doc.text(`Total Saidas: R$ ${totals.saidas.toFixed(2)}`, 14, 50);
    doc.text(`Saldo Final: R$ ${accountBalances.final.toFixed(2)}`, 14, 55);

    const tableData = transactions.map(t => [t.data, t.proj, t.item, t.cat, t.tipo === 'E' ? t.valor.toFixed(2) : `-${t.valor.toFixed(2)}`]);
    
    doc.autoTable({
      startY: 65,
      head: [['Data', 'Projeto', 'Descricao', 'Categoria', 'Valor (R$)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`${titulo}.pdf`);
  };

  const exportExcel = () => {
    const wsData = transactions.map(t => ({
      Data: t.data,
      Projeto: t.proj,
      Descricao: t.item,
      Categoria: t.cat,
      Tipo: t.tipo === 'E' ? 'Entrada' : 'Saida',
      Valor: t.valor
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
    XLSX.writeFile(wb, `Tesouraria_ECC_${startDate}.xlsx`);
  };

  // --- LÓGICA DE ANÁLISE ---

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
    setIsProcessing(true);
    const prompt = `Analise extratos ECC (${startDate} a ${endDate}). Identifique Saldo Inicial, Saldo Final e Transacoes. Projetos: Pizza, Pastel, Baile, Encontro, Outros. Categorias: ${categories.join(',')}. JSON: { "saldoInicial": 0.0, "saldoFinal": 0.0, "lista": [{ "data": "DD/MM", "item": "string", "valor": 0.0, "tipo": "E/S", "cat": "string", "proj": "string" }] }`;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([prompt, inputText]);
      const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      setTransactions(data.lista);
      setAccountBalances({ inicial: data.saldoInicial, final: data.saldoFinal });
    } catch (e) { alert("Erro na analise."); }
    finally { setIsProcessing(false); }
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
        {/* Painel de Filtros */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Calendar size={14} className="inline mr-2"/> Período</p>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Plus size={14} className="inline mr-2"/> Categoria</p>
            <div className="flex gap-2">
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nova..." className="w-full p-3 bg-slate-50 border rounded-xl text-xs" />
              <button onClick={() => { if(newCategoryName) setCategories([...categories, newCategoryName]); setNewCategoryName(''); }} className="bg-slate-900 text-white px-4 rounded-xl hover:bg-slate-800"><Plus size={18}/></button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Paperclip size={14} className="inline mr-2"/> Extratos ({attachedFiles.length})</p>
            <button onClick={() => fileInputRef.current.click()} className="w-full p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-blue-100">
               {attachedFiles.length > 0 ? "Arquivos Carregados" : "Anexar Arquivos"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" multiple />
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
          <textarea className="w-full h-32 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-6 font-mono text-xs focus:outline-none focus:bg-white resize-none" placeholder="Conteúdo do extrato aqui..." value={inputText} readOnly />
          <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50">
            {isProcessing ? <Activity className="animate-spin" /> : "GERAR RELATÓRIO COMPLETO"}
          </button>
        </section>

        {transactions.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Resumo da Conta */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Inicial</p>
                <p className="text-lg font-mono font-bold text-slate-600">R$ {accountBalances.inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Entradas</p>
                <p className="text-lg font-mono font-bold text-emerald-700">R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-center">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Saídas</p>
                <p className="text-lg font-mono font-bold text-rose-700">R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-lg text-center">
                <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest mb-1">Saldo Final</p>
                <p className="text-xl font-mono font-bold text-white">R$ {accountBalances.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Projetos Detalhados */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { name: "Pizza", icon: Pizza, color: "text-orange-500" },
                { name: "Pastel", icon: Utensils, color: "text-yellow-600" },
                { name: "Baile", icon: PartyPopper, color: "text-purple-500" },
                { name: "Encontro", icon: Users, color: "text-blue-500" },
                { name: "Outros", icon: Info, color: "text-slate-500" }
              ].map(proj => {
                const pData = totals.porProjeto[proj.name] || { e: 0, s: 0, r: 0 };
                return (
                  <div key={proj.name} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <proj.icon className={proj.color} size={18} />
                      <p className="text-[10px] font-black uppercase text-slate-400">{proj.name}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">ENT:</span><span className="text-emerald-600">+{pData.e.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">SAI:</span><span className="text-rose-600">-{pData.s.toFixed(2)}</span></div>
                      <div className={`mt-2 pt-1 border-t flex justify-between text-[11px] font-black ${pData.r >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        <span>RES:</span><span>R$ {pData.r.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabela de Lançamentos com Exportação */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <div className="px-8 py-5 border-b flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhamento Financeiro</span>
                  <div className="flex gap-3">
                    <button onClick={exportPDF} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all"><Download size={14}/> PDF</button>
                    <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all"><FileSpreadsheet size={14}/> Excel</button>
                  </div>
               </div>
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest border-b">
                    <tr><th className="px-6 py-5">Data</th><th className="px-6 py-5">Projeto</th><th className="px-6 py-5">Item</th><th className="px-6 py-5">Categoria</th><th className="px-6 py-5 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-mono text-slate-400">{t.data}</td>
                        <td className="px-6 py-5">
                          <select value={t.proj} onChange={e => { const nl = [...transactions]; nl[i].proj = e.target.value; setTransactions(nl); }} className="w-full bg-slate-100 px-3 py-1.5 rounded-full font-black text-[9px] uppercase outline-none">
                            {PROJETOS_PADRAO.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-700">{t.item}</td>
                        <td className="px-6 py-5">
                          <select value={t.cat} onChange={e => { const nl = [...transactions]; nl[i].cat = e.target.value; setTransactions(nl); }} className="w-full bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-black text-[9px] uppercase outline-none">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className={`px-6 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
