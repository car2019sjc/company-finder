import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    // Você pode logar o erro em um serviço externo aqui
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 text-red-800 p-6 rounded shadow-lg mt-8">
          <h2 className="text-xl font-bold mb-2">Ocorreu um erro inesperado na aplicação.</h2>
          <p className="mb-2">{this.state.error?.toString()}</p>
          <details className="whitespace-pre-wrap text-xs">
            {this.state.errorInfo?.componentStack}
          </details>
          <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded" onClick={() => window.location.reload()}>
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
} 