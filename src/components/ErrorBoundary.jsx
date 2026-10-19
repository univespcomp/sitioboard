import { Component } from "react";

/**
 * Barreira de erros de renderização.
 *
 * Sem ela, qualquer exceção durante o render faz o React desmontar a árvore
 * inteira e a tela fica em branco. Com ela, o erro fica contido e visível.
 * (Precisa ser classe: hooks ainda não oferecem componentDidCatch.)
 *
 * @param {Object}  props
 * @param {boolean} [props.fullPage] Usa o layout de página inteira (barreira raiz)
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Detalhes técnicos só no console; a tela mostra uma mensagem genérica.
    console.error("Erro de renderização:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = (
      <div className="alert alert-error" role="alert">
        Não foi possível exibir este conteúdo. Recarregue a página; se o
        problema continuar, abra o console do navegador (F12) para ver o detalhe
        do erro.
      </div>
    );
    return this.props.fullPage ? (
      <div className="container">{message}</div>
    ) : (
      message
    );
  }
}
