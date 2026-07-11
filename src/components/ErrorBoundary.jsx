import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * Catches unhandled rendering errors anywhere in the app tree.
 * Shows a user-friendly retry screen instead of a permanent blank/error screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-stone-50 p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-amber-100 p-4 rounded-full">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                Something went wrong
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                We encountered an error while loading the app. Please try reloading.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2 tracking-widest"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}