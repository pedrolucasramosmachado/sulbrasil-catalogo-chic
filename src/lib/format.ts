/**
 * Formata um número para o padrão de moeda Brasileira (R$).
 */
export const formatCurrency = (value: number | string): string => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

/**
 * Calcula o acréscimo de preço baseado no tamanho e categoria.
 */
export const getPriceAdjustment = (category: string | null, size?: string): number => {
  if (size === 'G1' && category?.toLowerCase() === 'conjuntos') {
    return 10;
  }
  return 0;
};
