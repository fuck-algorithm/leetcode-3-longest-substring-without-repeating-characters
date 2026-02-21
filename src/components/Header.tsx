import React, { useState, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  onShowAlgorithmIdea: () => void;
}

const GITHUB_REPO = 'fuck-algorithm/leetcode-3-longest-substring-without-repeating-characters';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
const LEETCODE_URL = 'https://leetcode.cn/problems/longest-substring-without-repeating-characters/';
const CACHE_KEY = 'github_stars_cache';
const CACHE_DURATION = 60 * 60 * 1000;

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
        const cached = await getCachedStars();
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setStarCount(cached.stars);
          setLoading(false);
          return;
        }

        const response = await fetch(GITHUB_API_URL);
        if (response.ok) {
          const data = await response.json();
          const stars = data.stargazers_count || 0;
          setStarCount(stars);
          await cacheStars(stars);
        } else {
          if (cached) setStarCount(cached.stars);
        }
      } catch {
        const cached = await getCachedStars();
        if (cached) setStarCount(cached.stars);
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, []);

  const getCachedStars = async (): Promise<StarCache | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('algorithm_demo_db', 1);
      request.onerror = () => resolve(null);
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['stars'], 'readonly');
        const store = transaction.objectStore('stars');
        const getRequest = store.get(CACHE_KEY);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
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
      <a 
        href="https://fuck-algorithm.github.io/leetcode-hot-100/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="back-link"
      >
        ← 返回题库
      </a>

      <h1 className="main-title">
        <a href={LEETCODE_URL} target="_blank" rel="noopener noreferrer">
          #3. 无重复字符的最长子串
        </a>
      </h1>

      <div className="header-actions">
        <button className="action-btn idea-btn" onClick={onShowAlgorithmIdea}>
          💡 思路
        </button>
        <a 
          href={`https://github.com/${GITHUB_REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn github-btn"
        >
          ⭐ {loading ? '...' : starCount}
        </a>
      </div>
    </header>
  );
};

export default Header;
