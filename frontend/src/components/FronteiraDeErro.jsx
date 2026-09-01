import { Component } from "react";

/**
 * Fronteira de erro no topo da aplicação.
 *
 * Sem ela, qualquer exceção durante o render desmonta a árvore inteira do
 * React e o visitante recebe uma página em branco — sem mensagem, sem forma de
 * voltar, e sem pista do que aconteceu a não ser abrindo o console.
 *
 * Foi exatamente isso que transformou um erro pontual de dados
 * ("t.filter is not a function", numa tela do sistema) em "o site inteiro
 * sumiu". A causa daquele erro foi corrigida, mas o modo de falha continuaria
 * valendo para o próximo. Agora o erro fica contido: aparece uma tela legível
 * com a mensagem real e um caminho de volta.
 */
export default class FronteiraDeErro extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    // Mantém o rastro no console para diagnóstico, com o componente de origem.
    console.error("Erro não tratado na interface:", erro, info?.componentStack);
  }

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    return (
      <div className="fronteira-erro">
        <div className="fronteira-erro-caixa">
          <span className="fronteira-erro-selo">SD</span>
          <h1>Algo quebrou nesta tela</h1>
          <p>
            O restante do sistema continua funcionando. Recarregue a página ou
            volte para o início; se o problema repetir, a mensagem abaixo ajuda
            a identificar a causa.
          </p>
          <code>{String(erro?.message || erro)}</code>
          <div className="fronteira-erro-acoes">
            <button type="button" onClick={() => window.location.reload()}>
              Recarregar
            </button>
            <a href="/">Ir para o início</a>
          </div>
        </div>
      </div>
    );
  }
}
