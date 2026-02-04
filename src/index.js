import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  Church, Wallet, Calendar, FileSearch, Paperclip, 
  Plus, Pizza, PartyPopper, Utensils, Users, Info, X, FileText
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
  const [categories, setCategories] = useState(["Dízimo/Oferta", "Repasse Mitra", "Cozinha", "Manutenção", "Outros"]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]); // Agora é um array
  const fileInputRef = useRef(null);

  const totals = transactions.reduce((acc, t) => {
    const val = parseFloat(t.valor) || 0;
    if (t.tipo === 'E') acc.entradas += val; else acc.saidas += val;
    if (!acc.porProjeto[t.proj]) acc.porProjeto[t.proj] = 0;
    acc.porProjeto[t.proj] += (t.tipo === 'E' ? val : -val);
    return acc;
  }, { entradas: 0, saidas: 0, porProjeto: {} });

  // Função para ler múltiplos arquivos e combinar os textos
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

  const removeFile = (index) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(newFiles);
    if (newFiles.length === 0) setInputText('');
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || !startDate || !endDate) return alert("Preencha as datas e anexe os extratos.");
    setIsProcessing(true);
    
    const prompt = `Você recebeu múltiplos extratos bancários do ECC. 
    Analise o período de ${startDate} a ${endDate}.
    1. Identifique o SALDO INICIAL do primeiro extrato cronológico.
    2. Identifique o SALDO FINAL do último extrato cronológico.
    3. Extraia todas as transações, removendo duplicatas se houver sobreposição de dias.
    Retorne APENAS JSON: { 
      "saldoInicial": 0.0, 
      "saldoFinal": 0.0, 
      "lista": [{ "data": "DD/MM", "item": "string", "valor": 0.0, "tipo": "E/S", "cat": "sugestão", "proj": "Pizza|Pastel|Baile|Encontro|Outros" }] 
    }`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([prompt, inputText]);
      const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      
      setTransactions(data.lista);
      setAccountBalances({ inicial: data.saldoInicial, final: data.saldoFinal });
    } catch (e) { alert("Erro na análise dos extratos."); }
    finally { setIsProcessing(false); }
  };

  const updateField = (index, field, value) => {
    const newList = [...transactions];
    newList[index][field] = value;
    setTransactions(newList);
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Novas Categorias</p>
            <div className="flex gap-2">
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ex: Pastel" className="w-full p-3 bg-slate-50 border rounded-xl text-xs" />
              <button onClick={() => { if(newCategoryName) setCategories([...categories, newCategoryName]); setNewCategoryName(''); }} className="bg-slate-900 text-white px-4 rounded-xl hover:bg-slate-800 transition-colors"><Plus size={18}/></button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14}/> Extratos (até 15 arquivos)</p>
            <button onClick={() => fileInputRef.current.click()} className="w-full p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-blue-100 transition-colors">
              {attachedFiles.length > 0 ? `${attachedFiles.length} arquivos selecionados` : "Anexar Extratos Mensais"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" multiple />
          </div>
        </section>

        {/* Lista de Arquivos Anexados */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 animate-in fade-in">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="bg-white px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
                <FileText size={12} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
          <textarea className="w-full h-32 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-6 font-mono text-xs focus:outline-none focus:bg-white resize-none" placeholder="O conteúdo dos arquivos aparecerá aqui..." value={inputText} readOnly />
          <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50">
            {isProcessing ? <Activity className="animate-spin" /> : "ANALISAR TODOS OS MESES"}
          </button>
        </section>

        {transactions.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo em {startDate}</p>
                <p className="text-lg font-mono font-bold text-slate-600">R$ {accountBalances.inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Entradas (+)</p>
                <p className="text-lg font-mono font-bold text-emerald-700">R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Saídas (-)</p>
                <p className="text-lg font-mono font-bold text-rose-700">R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-lg">
                <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest mb-1">Saldo Final em {endDate}</p>
                <p className="text-xl font-mono font-bold text-white">R$ {accountBalances.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: "Pizza", icon: Pizza, color: "text-orange-500" },
                { name: "Pastel", icon: Utensils, color: "text-yellow-600" },
                { name: "Baile", icon: PartyPopper, color: "text-purple-500" },
                { name: "Encontro", icon: Users, color: "text-blue-500" },
                { name: "Outros", icon: Info, color: "text-slate-500" }
              ].map(proj => (
                <div key={proj.name} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <proj.icon className={`mx-auto mb-2 ${proj.color}`} size={18} />
                  <p className="text-[9px] font-black uppercase text-slate-400">{proj.name}</p>
                  <p className="text-xs font-black font-mono">R$ {(totals.porProjeto[proj.name] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-5">Data</th>
                      <th className="px-6 py-5 text-center">Projeto</th>
                      <th className="px-6 py-5">Descrição</th>
                      <th className="px-6 py-5">Categoria</th>
                      <th className="px-6 py-5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-mono text-slate-400">{t.data}</td>
                        <td className="px-6 py-5">
                          <select value={t.proj} onChange={e => updateField(i, 'proj', e.target.value)} className="w-full bg-slate-100 px-3 py-1.5 rounded-full font-black text-[9px] uppercase border-none outline-none">
                            {PROJETOS_PADRAO.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-700">{t.item}</td>
                        <td className="px-6 py-5">
                          <select value={t.cat} onChange={e => updateField(i, 'cat', e.target.value)} className="w-full bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-black text-[9px] uppercase border-none outline-none">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className={`px-6 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
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
