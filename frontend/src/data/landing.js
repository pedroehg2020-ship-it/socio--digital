/**
 * Conteúdo da página pública.
 *
 * Regra que guiou cada texto daqui: só entra o que a API realmente entrega
 * hoje (`backend/app.py` + `backend/erp.py`). Nada de recurso "previsto",
 * certificação inventada ou número de clientes que não existe.
 *
 * Onde o sistema faz menos do que o nome sugere, o texto diz isso — é o caso
 * do registro de notas (controle interno, sem transmissão à SEFAZ) e dos
 * avisos por WhatsApp (dependem de um provedor configurado pelo administrador).
 */

/* -------------------------------------------------- indicadores do hero */

export const INDICADORES = [
  { valor: 8, sufixo: "", rotulo: "módulos integrados" },
  { valor: 90, sufixo: " dias", rotulo: "de caixa projetado" },
  { valor: 6, sufixo: " meses", rotulo: "de DRE mês a mês" },
  { valor: 0, sufixo: "", rotulo: "planilha necessária" },
];

/* ------------------------------------------------------ visão geral */

export const PILARES = [
  {
    icone: "cart",
    titulo: "A operação",
    texto:
      "Venda, estoque, clientes e notas conversando entre si — um registro alimenta o outro.",
  },
  {
    icone: "wallet",
    titulo: "O dinheiro",
    texto:
      "Contas a receber, contas a pagar, fluxo de caixa projetado e DRE calculados a partir do que já foi lançado.",
  },
  {
    icone: "robot",
    titulo: "A leitura",
    texto:
      "Um assistente que responde em português sobre os seus próprios números e um radar que procura o problema antes de você.",
  },
];

/* ------------------------------------------- seções de funcionalidade */

export const FUNCIONALIDADES = [
  {
    id: "financeiro",
    chave3d: "financeiro",
    icone: "wallet",
    sobretitulo: "Controle financeiro",
    titulo: "Saiba exatamente para onde o dinheiro da empresa está indo.",
    frase: "Contas a receber, contas a pagar e o saldo dos próximos meses na mesma tela.",
    texto:
      "Cada venda a prazo vira parcela com vencimento; cada despesa entra classificada como fixa ou variável. A partir daí o sistema calcula sozinho o que entra, o que sai e o que sobra — sem você refazer conta em planilha.",
    beneficios: [
      "Contas a receber e a pagar com baixa por lançamento",
      "Marcação automática do que já venceu",
      "Fluxo de caixa projetado para até 365 dias",
      "DRE mês a mês com receita, custo, despesas e lucro líquido",
    ],
    cta: { texto: "Ver o financeiro por dentro", para: "/cadastro" },
  },
  {
    id: "vendas",
    chave3d: "vendas",
    icone: "cart",
    sobretitulo: "Vendas e PDV",
    titulo: "Registre a venda em segundos e deixe o resto acontecer sozinho.",
    frase: "Uma tela de venda que já resolve estoque, cliente e recebimento.",
    texto:
      "Você escolhe os produtos, a forma de pagamento e o desconto. O sistema dá baixa no estoque, atualiza a ficha do cliente, gera a parcela em contas a receber e calcula a margem daquela venda no mesmo instante.",
    beneficios: [
      "Venda com vários itens, desconto e observação",
      "Formas de pagamento à vista e a prazo",
      "Lucro por venda calculado com o custo do produto",
      "Cancelamento que estorna estoque e recebimento",
    ],
    inverter: true,
  },
  {
    id: "clientes",
    chave3d: "clientes",
    icone: "users",
    sobretitulo: "Clientes",
    titulo: "A carteira inteira, com quem está comprando e quem sumiu.",
    frase: "Relacionamento medido por dado, não por memória.",
    texto:
      "Cada cliente carrega o histórico de compras, o valor acumulado e há quantos dias não volta. O sistema classifica quem está ativo e sinaliza quem passou do prazo típico de recompra, para você agir antes de perder a conta.",
    beneficios: [
      "Valor acumulado por cliente, atualizado a cada venda",
      "Dias desde a última compra e status de atividade",
      "Lista de clientes inativos pronta para reativação",
      "Histórico ligado às vendas e às notas emitidas",
    ],
  },
  {
    id: "estoque",
    chave3d: "estoque",
    icone: "box",
    sobretitulo: "Estoque e produtos",
    titulo: "Saber o que tem, o que falta e o que está preso em prateleira.",
    frase: "O saldo se move junto com a venda, não no fim do mês.",
    texto:
      "Produto tem preço, custo, saldo e ponto mínimo. A venda desconta o saldo na hora e a tentativa de vender além do disponível é bloqueada. Quando um item cruza o mínimo, ele entra na lista de reposição do painel.",
    beneficios: [
      "Baixa automática de estoque a cada venda",
      "Bloqueio de venda acima do saldo disponível",
      "Ponto mínimo por produto com alerta de reposição",
      "Preço e custo por item para calcular margem real",
    ],
    inverter: true,
  },
  {
    id: "relatorios",
    chave3d: "relatorios",
    icone: "gauge",
    sobretitulo: "Relatórios e indicadores",
    titulo: "Os números do mês prontos, sem montar relatório.",
    frase: "Receita, lucro, despesa e tendência calculados sobre o que você já lançou.",
    texto:
      "O painel consolida receita, lucro bruto, despesas e lucro líquido dos últimos 30 dias, compara as duas últimas semanas para mostrar a tendência e acompanha o progresso em relação à meta do mês.",
    beneficios: [
      "Receita, lucro e despesas dos últimos 30 dias",
      "Tendência de vendas comparando semanas",
      "DRE com margem calculada por mês",
      "Curva diária de receita e de pedidos",
    ],
  },
  {
    id: "agenda",
    chave3d: "agenda",
    icone: "calendar",
    sobretitulo: "Agenda de vencimentos",
    titulo: "O que vence esta semana aparece antes de virar problema.",
    frase: "Uma agenda financeira que se monta sozinha a partir dos lançamentos.",
    texto:
      "Todo título a receber ou a pagar tem data de vencimento. O sistema separa o que cai nos próximos sete dias, marca o que já passou do prazo e projeta a curva de saldo à frente, para você enxergar o aperto com antecedência.",
    beneficios: [
      "Totais a receber e a pagar da semana",
      "Identificação automática de títulos vencidos",
      "Projeção de saldo dia a dia",
      "Despesas fixas separadas das variáveis",
    ],
    inverter: true,
  },
  {
    id: "automacao",
    chave3d: "automacao",
    icone: "refresh",
    sobretitulo: "Rotinas automáticas",
    titulo: "Um lançamento, várias consequências — sem retrabalho.",
    frase: "O sistema encadeia o que hoje você faz em três lugares diferentes.",
    texto:
      "Fechar uma venda move estoque, cliente, contas a receber e indicadores de uma vez só. Em paralelo, o radar varre os dados procurando queda de vendas, estoque no limite, cliente parado e título vencido, e transforma isso em alerta.",
    beneficios: [
      "Venda que alimenta estoque, cliente e financeiro",
      "Radar de alertas por severidade e categoria",
      "Assistente de IA que responde sobre os seus dados reais",
      "Avisos por WhatsApp quando um provedor está configurado",
    ],
  },
  {
    id: "documentos",
    chave3d: "documentos",
    icone: "invoice",
    sobretitulo: "Documentos e notas",
    titulo: "O registro das notas ligado à venda que deu origem a ela.",
    frase: "Numeração sequencial, valor, cliente e situação em um histórico só.",
    texto:
      "A nota é gerada a partir da venda, recebe número sequencial por empresa e fica com status de emitida ou cancelada. É o controle interno das notas da operação — a transmissão ao SEFAZ continua sendo feita no emissor que você já usa.",
    beneficios: [
      "Nota vinculada à venda, ao cliente e ao valor",
      "Numeração sequencial por empresa",
      "Cancelamento com registro da situação",
      "Total emitido no mês somado no painel",
    ],
    inverter: true,
  },
];

/* ------------------------------------------------------ como funciona */

export const PASSOS = [
  {
    numero: "1",
    titulo: "Crie sua conta",
    texto:
      "Nome, e-mail, senha e os dados básicos da empresa. Leva menos de um minuto e não pede cartão.",
  },
  {
    numero: "2",
    titulo: "Configure a empresa",
    texto:
      "Cadastre produtos e clientes, ou entre na conta de demonstração, que já vem com dados para você navegar por tudo.",
  },
  {
    numero: "3",
    titulo: "Comece pela tela de vendas",
    texto:
      "É onde o dia começa. A partir do primeiro registro, estoque, financeiro e painel passam a se alimentar sozinhos.",
  },
];

/* ---------------------------------------------------------- benefícios */

export const BENEFICIOS = [
  {
    icone: "clock",
    titulo: "Economia de tempo",
    texto:
      "Um lançamento resolve estoque, cliente e financeiro. Some o retrabalho de digitar a mesma venda três vezes.",
  },
  {
    icone: "gauge",
    titulo: "Visão centralizada",
    texto:
      "Receita, lucro, vencimentos e reposição na mesma tela, calculados sobre a mesma base de dados.",
  },
  {
    icone: "radar",
    titulo: "Decisões melhores",
    texto:
      "Fluxo de caixa projetado e DRE com margem mostram o efeito de uma decisão antes de ela virar prejuízo.",
  },
  {
    icone: "check",
    titulo: "Organização",
    texto:
      "Título com vencimento, produto com custo, cliente com histórico. Nada depende de lembrar onde ficou o papel.",
  },
  {
    icone: "bolt",
    titulo: "Facilidade de uso",
    texto:
      "Telas curtas, linguagem de negócio e um assistente que aceita pergunta em português comum.",
  },
  {
    icone: "link",
    titulo: "Acesso de qualquer lugar",
    texto:
      "Roda no navegador do computador e do celular, com a mesma conta e os mesmos dados.",
  },
];

/* ------------------------------------------------------------ para quem */

export const PUBLICO = [
  {
    icone: "cart",
    titulo: "Comércio e varejo",
    texto: "Quem vende produto, controla saldo e precisa saber a margem de cada item.",
  },
  {
    icone: "users",
    titulo: "Prestadores de serviço",
    texto: "Quem fatura por contrato ou por hora e acompanha recebimento a prazo.",
  },
  {
    icone: "bolt",
    titulo: "Profissionais autônomos",
    texto: "Quem faz tudo sozinho e não tem tempo de manter três planilhas em dia.",
  },
  {
    icone: "target",
    titulo: "Empreendedores",
    texto: "Quem está começando e quer nascer com o financeiro organizado.",
  },
  {
    icone: "doc",
    titulo: "Escritórios e consultorias",
    texto: "Quem precisa de DRE e histórico limpo para conversar com o contador.",
  },
  {
    icone: "trendUp",
    titulo: "Negócios em crescimento",
    texto: "Quem passou do ponto em que dá para tocar a empresa de cabeça.",
  },
];

/* ------------------------------------------------------------ segurança */

export const SEGURANCA = [
  {
    icone: "shield",
    titulo: "Senha nunca guardada em texto",
    texto:
      "A senha é transformada por PBKDF2-SHA256 com 200.000 iterações e sal próprio por usuário. O sistema não tem como ler a sua senha.",
  },
  {
    icone: "users",
    titulo: "Dados isolados por conta",
    texto:
      "Produto, venda, cliente, título e nota carregam o identificador do dono. Toda consulta filtra por usuário autenticado.",
  },
  {
    icone: "link",
    titulo: "Integração com token criptografado",
    texto:
      "Ao conectar a Conta Azul, os tokens de acesso e de renovação são gravados criptografados, e o parâmetro de estado do OAuth é assinado e de uso único.",
  },
];

/* ------------------------------------------------------------------ FAQ */

export const PERGUNTAS = [
  {
    pergunta: "Preciso instalar alguma coisa?",
    resposta:
      "Não. O Sócio Digital roda no navegador, no computador ou no celular. Você entra com e-mail e senha e os dados ficam disponíveis nos dois.",
  },
  {
    pergunta: "Dá para testar antes de cadastrar minha empresa?",
    resposta:
      "Sim. Existe uma conta de demonstração já preenchida com produtos, clientes, vendas, títulos e notas, para você navegar por todas as telas antes de lançar qualquer dado real.",
  },
  {
    pergunta: "O sistema emite nota fiscal para a SEFAZ?",
    resposta:
      "Não. O que existe é o registro interno das notas: número sequencial, cliente, valor, vínculo com a venda e situação (emitida ou cancelada). A transmissão continua sendo feita pelo emissor que você já usa.",
  },
  {
    pergunta: "Como o assistente de IA responde sobre a minha empresa?",
    resposta:
      "Ele monta a resposta a partir do seu próprio painel: receita, lucro, despesas, estoque abaixo do mínimo e clientes inativos. Quando não há chave de IA configurada, o sistema responde com um resumo local calculado sobre os mesmos números.",
  },
  {
    pergunta: "Os avisos por WhatsApp funcionam desde o primeiro dia?",
    resposta:
      "O envio real depende de um provedor de WhatsApp configurado pelo administrador da instalação. Sem essa configuração, as mensagens ficam registradas no histórico dentro do sistema, mas não saem para o celular.",
  },
  {
    pergunta: "Consigo trazer o financeiro da Conta Azul?",
    resposta:
      "Sim, por OAuth. Depois de conectar, o sistema importa contas a pagar e a receber por faixa de vencimento e guarda a data da última sincronização.",
  },
  {
    pergunta: "O que acontece se eu cancelar uma venda?",
    resposta:
      "O cancelamento devolve a quantidade ao estoque e desfaz o recebimento gerado por ela, mantendo a venda no histórico com a situação de cancelada.",
  },
  {
    pergunta: "Quanto custa?",
    resposta:
      "A criação de conta é gratuita e não pede cartão. Os planos comerciais ainda estão sendo definidos e serão comunicados aqui antes de qualquer cobrança.",
  },
];
