export interface PricingInput {
    partCost: number;
    isApple: boolean;
    difficulty: 'low' | 'medium' | 'high' | 'expert';
    modelYear: number;
  }
  
  export const calculateServicePrice = (input: PricingInput) => {
    const currentYear = new Date().getFullYear();
    
    // 1. Custo Operacional Fixo (Aluguel, Luz, Software)
    const overhead = 50.00; 
  
    // 2. Multiplicador de Risco (Complexidade)
    const diffMap = { low: 1.2, medium: 1.5, high: 2.2, expert: 3.5 };
    
    // 3. Fator de Depreciação Apple (Modelos mais novos exigem mais margem)
    const ageFactor = input.isApple ? Math.max(1, (currentYear - input.modelYear) * 0.1) : 1;
  
    // 4. Cálculo do Preço Sugerido
    const labor = (input.partCost * diffMap[input.difficulty]) + overhead;
    const finalPrice = (input.partCost + labor) * ageFactor;
  
    // 5. Piso de Proteção (NUNCA ter prejuízo)
    return Math.max(finalPrice, input.partCost * 1.4);
  };
  