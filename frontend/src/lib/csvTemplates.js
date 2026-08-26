const transactionsCsv = `data,descricao,valor,tipo,categoria,cliente,status,vencimento
15/01/2026,Venda de produto A,1500.00,receita,Vendas,Cliente A,pago,
18/01/2026,Venda de servico,800.00,receita,Servicos,Cliente B,pago,
20/01/2026,Aluguel do escritorio,3200.00,despesa,Aluguel,,pendente,05/02/2026
22/01/2026,Fornecedor XYZ,950.00,despesa,Fornecedores,,pago,
`;

const inventoryCsv = `produto,estoque_atual,estoque_minimo,vendas_mes
Produto A,120,20,40
Produto B,8,15,25
Produto C,300,10,15
`;

function toDataUri(csv) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

export const TRANSACTIONS_TEMPLATE_URI = toDataUri(transactionsCsv);
export const INVENTORY_TEMPLATE_URI = toDataUri(inventoryCsv);
