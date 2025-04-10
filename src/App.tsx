import React, { useState, useEffect } from 'react';
import AlgorithmRunner from './components/AlgorithmRunner';
import './App.css';

function App() {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟异步加载
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    // 全局错误处理
    const handleError = (event: ErrorEvent) => {
      console.error('捕获到全局错误:', event.error);
      setError(event.error);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>发生错误</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>重新加载</button>
      </div>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary>
        <AlgorithmRunner />
      </ErrorBoundary>
    </div>
  );
}

// 错误边界组件
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>组件渲染错误</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
