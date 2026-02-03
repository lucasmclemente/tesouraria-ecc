import React from 'react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'E' | 'S';
  category?: string;
}

interface Props {
  transactions: Transaction[];
  categories: string[];
}

const TransactionTable: React.FC<Props> = ({ transactions, categories }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 font-sans">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold text-slate-600">Data</th>
            <th className="px-6 py-4 font-semibold text-slate-600">Descrição</th>
            <th className="px-6 py-4 font-semibold text-slate-600">Categoria</th>
            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Valor (R$)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50/50">
              <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                {new Date(t.date).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-6 py-4 text-slate-800 font-medium">{t.description}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  t.type === 'E' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {t.category || 'Revisão Manual'}
                </span>
              </td>
              <td className={`px-6 py-4 text-right font-mono font-semibold ${
                t.type === 'E' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {t.type === 'S' ? '-' : ''}{t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
