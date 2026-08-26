export const DEMO_COMMAND_DATA = {
  has_data: true,
  is_demo: true,
  briefing: "Sua empresa está saudável hoje, mas encontrei 4 pontos que merecem sua atenção.",
  health: {
    score: 82,
    status: "Saudável",
    components: [
      { key: "financeiro", label: "Financeiro", score: 88, reason: "Caixa cobre os compromissos dos próximos 30 dias" },
      { key: "vendas", label: "Vendas", score: 86, reason: "Receita 8,7% acima do período anterior" },
      { key: "clientes", label: "Clientes", score: 74, reason: "Cinco clientes relevantes estão sem comprar" },
      { key: "estoque", label: "Estoque", score: 79, reason: "Dois produtos podem romper em 7 dias" },
      { key: "eficiencia", label: "Eficiência", score: 83, reason: "Margem caiu 3,1 pontos nesta semana" },
    ],
  },
  insights: [
    { id: "demo-margin", severity: "critical", title: "A margem caiu 3,1 pontos", summary: "O custo médio do Café Especial subiu e reduziu o lucro mesmo com vendas maiores.", evidence: ["Margem atual: 24,8%", "Período: últimos 7 dias", "Fonte: transações e catálogo demo"], action: "Investigar comigo", prompt: "Por que minha margem caiu 3,1 pontos?", confidence: "Alta" },
    { id: "demo-sales", severity: "positive", title: "Vendas 8,7% acima do período anterior", summary: "O crescimento veio principalmente de Café Especial e Kits Presente.", evidence: ["Receita: R$ 48.260", "Comparação: últimos 7 dias", "Fonte: vendas demo"], action: "Entender crescimento", prompt: "O que explica o crescimento das minhas vendas?", confidence: "Alta" },
    { id: "demo-stock", severity: "critical", title: "Dois produtos podem entrar em ruptura", summary: "Mantido o ritmo atual, Café Especial e Granola Artesanal acabam em aproximadamente 7 dias.", evidence: ["Estoque mínimo configurado", "Projeção: 7 dias", "Fonte: estoque demo"], action: "Preparar reposição", prompt: "Quais produtos podem faltar nos próximos dias?", confidence: "Média" },
    { id: "demo-customers", severity: "important", title: "Cinco clientes importantes estão inativos", summary: "Eles representam R$ 18.400 em compras nos últimos seis meses.", evidence: ["Critério: mais de 45 dias sem compra", "Valor histórico: R$ 18.400", "Fonte: clientes demo"], action: "Preparar reativação", prompt: "Quais clientes importantes estão deixando de comprar?", confidence: "Média" },
  ],
  data_scope: { transactions: 248, products: 32, customers: 86 },
};