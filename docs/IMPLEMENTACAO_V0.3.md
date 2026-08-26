# Sócio Digital — Implementação v0.3

Esta versão continua a base da branch `conflict_250826_2256` e aplica a direção do Documento Mestre v0.2.

## Alterações desta versão

- Nova página pública de apresentação antes do login, com identidade visual mais escura, azul/ciano/violeta e menos áreas brancas.
- Seção ampliada de funcionalidades: vendas, financeiro, Radar Inteligente, estoque, clientes, chat em linguagem natural, metas/projeções e organização de dados.
- Vendas passou a ser a primeira área do produto após o login e a primeira opção do menu.
- Menu reorganizado para uma lógica mais próxima de ERP: Vendas, Visão geral, Clientes, Estoque, Financeiro e depois as funções de IA.
- Novo módulo funcional de Vendas com:
  - registro de venda;
  - cliente;
  - produto/serviço;
  - valor;
  - quantidade de itens;
  - forma de pagamento;
  - situação recebida/a receber;
  - busca e filtros;
  - alteração rápida do status;
  - faturamento do mês;
  - quantidade de vendas;
  - ticket médio;
  - contas a receber.
- As vendas registradas entram na mesma base de transações financeiras, mantendo integração com o dashboard e financeiro.
- Nova API `/api/sales` e resumo de vendas em `/api/sales/summary`.
- Visual interno atualizado com fundos mais suaves, cards com tonalidades por contexto e sidebar em degradê escuro.
- Cards financeiros do dashboard ganharam superfícies coloridas discretas para reduzir o excesso de branco.

## Direção do Documento Mestre preservada

O produto continua sendo tratado como um assistente executivo, e não apenas como mais um ERP. As telas de gestão dão a base operacional, enquanto Radar, chat, investigação, simulação e ações continuam formando a camada inteligente.

## Próximas evoluções recomendadas

1. Pedidos e orçamentos com conversão para venda.
2. Catálogo de produtos/serviços com preço e SKU.
3. Baixa automática de estoque a partir da venda.
4. Contas a receber parceladas e conciliação.
5. Metas comerciais e funil de vendas.
6. Emissão/integração de notas fiscais.
7. Integrações bancárias e meios de pagamento.
8. Eliminar dependências restantes da infraestrutura Emergent e parametrizar o provedor de IA.
