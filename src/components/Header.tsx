import React, { useState, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  onShowAlgorithmIdea: () => void;
}

const GITHUB_REPO = 'fuck-algorithm/leetcode-3-longest-substring-without-repeating-characters';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
const LEEtCODE_URL = 'https://leetcode.cn/problems/longest-substring-without-repeating-characters/';
const CACHE_KEY = 'github_stars_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

interface StarCache {
  stars: number;
  timestamp: number;
}

const Header: React.FC<HeaderProps> = ({ onShowAlgorithmIdea }) => {
  const [starCount, setStarCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        // 尝试从IndexedDB读取缓存
        const cached = await getCachedStars();
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setStarCount(cached.stars);
          setLoading(false);
          return;
        }

        // 从API获取
        const response = await fetch(GITHUB_API_URL);
        if (response.ok) {
          const data = await response.json();
          const stars = data.stargazers_count || 0;
          setStarCount(stars);
          // 缓存到IndexedDB
          await cacheStars(stars);
        } else {
          // API失败，使用缓存（即使过期）
          if (cached) {
            setStarCount(cached.stars);
          }
        }
      } catch (error) {
        console.error('获取Star数失败:', error);
        // 出错时使用缓存
        const cached = await getCachedStars();
        if (cached) {
          setStarCount(cached.stars);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, []);

  // 从IndexedDB获取缓存
  const getCachedStars = async (): Promise<StarCache | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('algorithm_demo_db', 1);
      
      request.onerror = () => resolve(null);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['stars'], 'readonly');
        const store = transaction.objectStore('stars');
        const getRequest = store.get(CACHE_KEY);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        
        getRequest.onerror = () => resolve(null);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('stars')) {
          db.createObjectStore('stars', { keyPath: 'key' });
        }
      };
    });
  };

  // 缓存Star数到IndexedDB
  const cacheStars = async (stars: number): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('algorithm_demo_db', 1);
      
      request.onerror = () => resolve();
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['stars'], 'readwrite');
        const store = transaction.objectStore('stars');
        store.put({ key: CACHE_KEY, stars, timestamp: Date.now() });
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('stars')) {
          db.createObjectStore('stars', { keyPath: 'key' });
        }
      };
    });
  };

  return (
    <header className="app-header">
      {/* 左上角返回链接 */}
      <div className="header-left">
        <a 
          href="https://fuck-algorithm.github.io/leetcode-hot-100/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="back-link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回Leetcode Hot 100
        </a>
      </div>

      {/* 中间标题 */}
      <div className="header-center">
        <h1 className="main-title">
          <a 
            href={LEEtCODE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="title-link"
            title="点击跳转到LeetCode题目页面"
          >
            LeetCode #3. 无重复字符的最长子串
          </a>
        </h1>
        <p className="subtitle">给定一个字符串，请你找出其中不含有重复字符的最长子串的长度</p>
      </div>

      {/* 右上角功能区 */}
      <div className="header-right">
        {/* 算法思路按钮 */}
        <button 
          className="idea-button"
          onClick={onShowAlgorithmIdea}
          title="查看算法思路"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          算法思路
        </button>

        {/* GitHub徽标 */}
        <a 
          href={`https://github.com/${GITHUB_REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          title="点击去GitHub仓库Star支持一下"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="star-count">
            {loading ? '...' : starCount}
          </span>
        </a>
      </div>
    </header>
  );
};

export default Header;
