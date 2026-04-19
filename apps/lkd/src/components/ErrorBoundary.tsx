import React, { Component } from 'react';
import type { ErrorInfo } from 'react';

export default class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] p-8 text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Terjadi Kesalahan (Crash)</h1>
          <p className="text-slate-500 mb-6">Maaf, aplikasi mengalami masalah saat merender tampilan.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700"
          >
            Muat Ulang Aplikasi
          </button>
          <div className="mt-8 text-left max-w-2xl w-full">
             <details className="text-xs">
               <summary className="text-red-400 cursor-pointer font-semibold hover:underline">Detail teknis (untuk developer)</summary>
               <pre className="text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-xl overflow-auto border border-red-100 dark:border-red-900/50 mt-2">
                {this.state.error?.toString()}
                {'\n'}
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
