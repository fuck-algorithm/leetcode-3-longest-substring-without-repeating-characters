import React, { useState, useEffect } from 'react';
import './CodeDisplay.css';
import { 
  Language, 
  allSolutions, 
  stepToLinesMap,
  getSolution,
  CodeSolution,
  CodeLine
} from './codeSolutions';

interface CodeDisplayProps {
  // 当前算法步骤索引
  currentStep: number;
  // 变量值映射（用于显示在代码行后面）
  variableValues?: { [key: string]: string };
}

// IndexedDB 键名
const LANGUAGE_CACHE_KEY = 'preferred_language';

const CodeDisplay: React.FC<CodeDisplayProps> = ({ 
  currentStep,
  variableValues = {}
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('java');
  const [loading, setLoading] = useState(true);

  // 从 IndexedDB 加载语言偏好
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const cached = await getLanguageFromCache();
        if (cached && allSolutions.some(s => s.language === cached)) {
          setCurrentLanguage(cached as Language);
        }
      } catch (error) {
        console.error('加载语言偏好失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  // 切换语言并缓存
  const handleLanguageChange = async (lang: Language) => {
    setCurrentLanguage(lang);
    try {
      await cacheLanguage(lang);
    } catch (error) {
      console.error('缓存语言偏好失败:', error);
    }
  };

  // 获取当前解决方案
  const currentSolution = getSolution(currentLanguage);

  // 获取当前步骤需要高亮的行号
  const highlightedLines = stepToLinesMap[currentStep]?.[currentLanguage] || [];

  // 从 IndexedDB 读取语言偏好
  const getLanguageFromCache = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('algorithm_demo_db', 1);
      
      request.onerror = () => resolve(null);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('preferences')) {
          resolve(null);
          return;
        }
        const transaction = db.transaction(['preferences'], 'readonly');
        const store = transaction.objectStore('preferences');
        const getRequest = store.get(LANGUAGE_CACHE_KEY);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.value || null);
        };
        
        getRequest.onerror = () => resolve(null);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
  };

  // 缓存语言偏好到 IndexedDB
  const cacheLanguage = async (lang: Language): Promise<void> => {
    return new Promise((resolve) => {
      // 使用版本2确保onupgradeneeded被触发（如果之前是版本1）
      const request = indexedDB.open('algorithm_demo_db', 2);
      
      request.onerror = () => resolve();
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        try {
          if (!db.objectStoreNames.contains('preferences')) {
            // 如果对象存储不存在，关闭数据库并升级版本
            db.close();
            const upgradeRequest = indexedDB.open('algorithm_demo_db', 3);
            upgradeRequest.onupgradeneeded = (e) => {
              const upgradedDb = (e.target as IDBOpenDBRequest).result;
              if (!upgradedDb.objectStoreNames.contains('preferences')) {
                upgradedDb.createObjectStore('preferences', { keyPath: 'key' });
              }
            };
            upgradeRequest.onsuccess = (e) => {
              const finalDb = (e.target as IDBOpenDBRequest).result;
              const transaction = finalDb.transaction(['preferences'], 'readwrite');
              const store = transaction.objectStore('preferences');
              store.put({ key: LANGUAGE_CACHE_KEY, value: lang });
              resolve();
            };
            upgradeRequest.onerror = () => resolve();
          } else {
            const transaction = db.transaction(['preferences'], 'readwrite');
            const store = transaction.objectStore('preferences');
            store.put({ key: LANGUAGE_CACHE_KEY, value: lang });
            resolve();
          }
        } catch (error) {
          console.error('缓存语言偏好失败:', error);
          resolve();
        }
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
  };

  // 语法高亮函数
  const highlightCode = (code: string, language: Language): React.ReactNode => {
    // 移除行首的空格用于显示，但保留相对缩进
    const trimmedCode = code.trimStart();
    const leadingSpaces = code.length - trimmedCode.length;
    
    // 根据语言应用简单的语法高亮
    const highlighted = trimmedCode;
    
    // 关键字高亮
    const keywords: { [key: string]: string[] } = {
      java: ['class', 'public', 'private', 'int', 'char', 'void', 'return', 'if', 'else', 'while', 'for', 'new', 'this', 'null', 'true', 'false', 'boolean', 'String', 'Set', 'HashSet', 'import', 'package'],
      python: ['def', 'class', 'return', 'if', 'else', 'elif', 'while', 'for', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'import', 'from', 'as', 'self', 'pass'],
      golang: ['func', 'var', 'const', 'return', 'if', 'else', 'for', 'range', 'make', 'delete', 'len', 'package', 'import', 'struct', 'interface', 'map', 'bool', 'int', 'string', 'byte'],
      javascript: ['var', 'let', 'const', 'function', 'return', 'if', 'else', 'while', 'for', 'new', 'this', 'null', 'undefined', 'true', 'false', 'class', 'extends', 'constructor', 'super', 'import', 'export', 'from', 'default']
    };
    
    const langKeywords = keywords[language] || [];
    
    // 暂时简化处理，直接返回带缩进的文本
    if (leadingSpaces > 0) {
      return (
        <>
          <span className="indent">{' '.repeat(leadingSpaces)}</span>
          {applySyntaxHighlighting(trimmedCode, langKeywords)}
        </>
      );
    }
    
    return applySyntaxHighlighting(trimmedCode, langKeywords);
  };

  // 应用语法高亮
  const applySyntaxHighlighting = (code: string, keywords: string[]): React.ReactNode => {
    // 匹配注释
    const commentMatch = code.match(/(\/\/|#).*/);
    if (commentMatch) {
      const commentIndex = commentMatch.index || 0;
      const beforeComment = code.slice(0, commentIndex);
      const comment = code.slice(commentIndex);
      return (
        <>
          {highlightKeywordsAndStrings(beforeComment, keywords)}
          <span className="token comment">{comment}</span>
        </>
      );
    }
    
    return highlightKeywordsAndStrings(code, keywords);
  };

  // 高亮关键字和字符串
  const highlightKeywordsAndStrings = (code: string, keywords: string[]): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    
    // 正则表达式匹配：字符串、关键字、数字
    const tokenRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+|[a-zA-Z_][a-zA-Z0-9_]*|[{}()\[\];,.=<>!&|+\-*/%])/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = tokenRegex.exec(code)) !== null) {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{code.slice(lastIndex, match.index)}</span>);
      }
      
      const token = match[0];
      
      // 判断token类型并应用样式
      if (token.startsWith('"') || token.startsWith("'")) {
        // 字符串
        parts.push(<span key={key++} className="token string">{token}</span>);
      } else if (keywords.includes(token)) {
        // 关键字
        parts.push(<span key={key++} className="token keyword">{token}</span>);
      } else if (/^\d+$/.test(token)) {
        // 数字
        parts.push(<span key={key++} className="token number">{token}</span>);
      } else if (/^[{}()\[\];,.=<>!&|+\-*/%]$/.test(token)) {
        // 运算符/符号
        parts.push(<span key={key++} className="token operator">{token}</span>);
      } else {
        // 普通标识符
        parts.push(<span key={key++} className="token identifier">{token}</span>);
      }
      
      lastIndex = tokenRegex.lastIndex;
    }
    
    // 添加剩余的文本
    if (lastIndex < code.length) {
      parts.push(<span key={key++}>{code.slice(lastIndex)}</span>);
    }
    
    return parts.length > 0 ? parts : code;
  };

  // 获取变量值的显示
  const getVariableDisplay = (line: CodeLine): React.ReactNode | null => {
    if (!line.variables || line.variables.length === 0) return null;
    
    return (
      <span className="variable-values">
        {line.variables.map((v, idx) => (
          <span key={idx} className="var-display">
            <span className="var-name">{v.name}</span>
            <span className="var-separator">=</span>
            <span className="var-value">{variableValues[v.name] || v.value}</span>
          </span>
        ))}
      </span>
    );
  };

  if (loading) {
    return <div className="code-display loading">加载中...</div>;
  }

  return (
    <div className="code-display">
      {/* 语言切换标签 */}
      <div className="language-tabs">
        {allSolutions.map((solution) => (
          <button
            key={solution.language}
            className={`language-tab ${currentLanguage === solution.language ? 'active' : ''}`}
            onClick={() => handleLanguageChange(solution.language)}
          >
            {solution.displayName}
          </button>
        ))}
      </div>

      {/* 代码显示区域 */}
      <div className="code-container">
        <div className="code-scroll">
          {currentSolution.lines.map((line) => {
            const isHighlighted = highlightedLines.includes(line.lineNumber);
            
            return (
              <div 
                key={line.lineNumber} 
                className={`code-line ${isHighlighted ? 'highlighted' : ''}`}
              >
                <span className="line-number">{line.lineNumber}</span>
                <span className="line-content">
                  {highlightCode(line.code, currentLanguage)}
                </span>
                {getVariableDisplay(line)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CodeDisplay;
