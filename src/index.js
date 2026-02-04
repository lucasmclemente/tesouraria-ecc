import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, TrendingUp, TrendingDown, ArrowRightLeft, 
  CheckCircle2, Pizza, PartyPopper, Church, 
  Wallet, Calendar, FileSearch, Paperclip, FileText, X, Edit3
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const CATEGORIAS_ECC = [
  "Pizza", "Baile", "Repasse Mitra", "Dízimo/Oferta", "Cozinha", "Limpeza/Manutencao", "Outros"
];

const App = () => {
  const [inputText, setInputText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [periodInfo, setPeriodInfo] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- CÁLCULOS EM TEMPO REAL ---
  // Recalcula tudo sempre que a lista de transações mudar (mesmo que mude manualmente)
  const totals = transactions.reduce((acc, t) => {
    const val = parseFloat(t.valor) || 0;
    if (t.tipo === 'E') acc.entradas += val;
    else acc.saidas += val;

    if (t.cat === 'Pizza') acc.pizzas += (t.tipo === 'E' ? val : -val);
    if (t.cat === 'Baile') acc.baile += (t.tipo === 'E' ? val : -val);
    if (t.cat === 'Repasse Mitra') acc.mitraPaga = true;

    return acc;
  }, { entradas: 0, saidas: 0, pizzas: 0, baile: 0, mitraPaga: false });

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
    if (!startDate || !endDate) return alert("Selecione o período.");
    
    setIsProcessing(true);
    const prompt = `Analise o extrato do ECC entre ${startDate} e ${endDate}. Identifique cada item e sugira a categoria (Pizza, Baile, Repasse Mitra, Dízimo/Oferta, Cozinha, Limpeza/Manutencao, Outros). Retorne APENAS um JSON: { "periodo": "string", "lista": [{ "data": "DD/MM", "item": "string", "valor": 0.0, "tipo": "E/S", "cat": "categoria sugerida" }] }`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([prompt, inputText]);
      const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      setTransactions(data.lista);
      setPeriodInfo(data.periodo);
    } catch (e) {
      alert("Erro na análise inteligente.");
    } finally { setIsProcessing(false); }
  };

  // Função para reclassificar manualmente
  const updateCategory = (index, newCat) => {
    const newList = [...transactions];
    newList[index].cat = newCat;
    setTransactions(newList);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20 text-slate-900">
      <header className="bg-slate-900 text-white pt-12 pb-24 px-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg"><Church size={32} /></div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Tesouraria ECC</h1>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">N. Sra. das Dores • Guaxupé/MG</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-12 space-y-8">
        <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><FileSearch size={14}/> Conteúdo do Extrato</span>
            <button onClick={() => fileInputRef.current.click()} className="text-[10px] font-black bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-200"><Paperclip size={14}/>{attachedFile ? "Alterar" : "Anexar"}</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" />
          </div>

          <textarea className="w-full h-40 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-6 font-mono text-xs focus:outline-none focus:bg-white resize-none shadow-inner" placeholder="Cole o extrato aqui..." value={inputText} onChange={e => setInputText(e.target.value)} />
          <button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50">
            {isProcessing ? <Activity className="animate-spin" /> : "GERAR RELATÓRIO DINÂMICO"}
          </button>
        </section>

        {transactions.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center"><span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{periodInfo}</span></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-emerald-50 text-center shadow-sm">
                <TrendingUp className="mx-auto mb-2 text-emerald-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase">Entradas</p>
                <p className="text-xl font-mono font-black text-emerald-600">R$ {totals.entradas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-rose-50 text-center shadow-sm">
                <TrendingDown className="mx-auto mb-2 text-rose-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase">Saídas</p>
                <p className="text-xl font-mono font-black text-rose-600">R$ {totals.saidas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-blue-50 text-center shadow-sm">
                <Wallet className="mx-auto mb-2 text-blue-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Final</p>
                <p className="text-xl font-mono font-black text-slate-900">R$ {(totals.entradas - totals.saidas).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white p-5 rounded-2xl border flex items-center gap-4">
                  <Pizza className="text-orange-500" />
                  <div><p className="text-[9px] font-black text-slate-400 uppercase">Lucro Pizzas</p><p className="font-bold text-orange-600">R$ {totals.pizzas.toLocaleString('pt-BR')}</p></div>
               </div>
               <div className="bg-white p-5 rounded-2xl border flex items-center gap-4">
                  <PartyPopper className="text-purple-500" />
                  <div><p className="text-[9px] font-black text-slate-400 uppercase">Lucro Baile</p><p className="font-bold text-purple-600">R$ {totals.baile.toLocaleString('pt-BR')}</p></div>
               </div>
               <div className={`bg-white p-5 rounded-2xl border flex items-center gap-4 ${totals.mitraPaga ? 'border-emerald-100' : 'border-rose-100'}`}>
                  <Church className={totals.mitraPaga ? 'text-emerald-500' : 'text-rose-500'} />
                  <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Taxa Mitra</p><p className="text-xs font-black uppercase">{totals.mitraPaga ? 'PAGO' : 'PENDENTE'}</p></div>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                    <tr><th className="px-8 py-5">Data</th><th className="px-8 py-5">Descrição</th><th className="px-8 py-5">Categoria (Clique p/ Mudar)</th><th className="px-8 py-5 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 font-mono text-slate-400">{t.data}</td>
                        <td className="px-8 py-5 font-bold text-slate-700">{t.item}</td>
                        <td className="px-8 py-5">
                          <select 
                            value={t.cat} 
                            onChange={(e) => updateCategory(i, e.target.value)}
                            className="bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-tighter outline-none cursor-pointer transition-all border-none"
                          >
                            {CATEGORIAS_ECC.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td className={`px-8 py-5 text-right font-mono font-black ${t.tipo === 'E' ? 'text-emerald-500' : 'text-rose-500'}`}>
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
