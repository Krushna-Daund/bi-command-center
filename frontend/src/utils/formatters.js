export const formatCurrency = (value) => {
  if (value == null) return 'R$ 0.00';
  
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatNumber = (value) => {
  if (value == null) return '0';
  
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatPercent = (value) => {
  if (value == null) return '0.00%';
  return `${Number(value).toFixed(2)}%`;
};
