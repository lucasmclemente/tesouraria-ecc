export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'E' | 'S';
  category?: string;
}

export const analyzeTransactions = async (
  transactions: any[],
  startDate: string,
  endDate: string,
  categories: string[]
): Promise<any> => {
  // Simulação de processamento
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    period: `${startDate} até ${endDate}`,
    transactions: transactions,
    summary: {
      totalEntries: 1500.00,
      totalExits: 450.00,
      netBalance: 1050.00
    },
    aiInsights: "Análise concluída via estrutura plana e segura."
  };
};
