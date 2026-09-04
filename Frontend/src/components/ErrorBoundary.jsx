import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { erro: null };

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error(erro, info);
  }

  render() {
    if (this.state.erro) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 12 }}>Algo deu errado</h2>
            <p style={{ color: 'var(--texto-suave)', marginBottom: 16 }}>
              {this.state.erro.message || 'Ocorreu um erro inesperado.'}
            </p>
            <button className="btn btn-dourado" onClick={() => this.setState({ erro: null })}>
              Tentar de novo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
