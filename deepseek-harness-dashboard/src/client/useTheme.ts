/** useTheme —— localStorage 持久化 + 跨标签页同步 + MutationObserver 监听 DOM 变化。 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { DEFAULT_THEME, STORAGE_KEY, type ThemeId } from './themes.js'

function readFromStorage(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'cyber-blue' || raw === 'midnight-gold' || raw === 'aurora-green') return raw
  } catch { /* private mode */ }
  return DEFAULT_THEME
}

function applyThemeClass(root: HTMLElement | null, id: ThemeId) {
  if (!root) return
  // 清除所有 dwd-theme-* class
  root.classList.remove('dwd-theme-cyber-blue', 'dwd-theme-midnight-gold', 'dwd-theme-aurora-green')
  root.classList.add(`dwd-theme-${id}`)
}

export function useTheme(): [ThemeId, (next: ThemeId) => void] {
  const [theme, setThemeState] = useState<ThemeId>(() => readFromStorage())
  const rootRef = useRef<HTMLElement | null>(null)

  // 切换主题
  const setTheme = useCallback((next: ThemeId) => {
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
    setThemeState(next)
    applyThemeClass(rootRef.current ?? document.querySelector('.dwd-root'), next)
  }, [])

  // 初始化：查找 .dwd-root 元素并应用 class
  useEffect(() => {
    const tryFind = () => {
      const el = document.querySelector<HTMLElement>('.dwd-root')
      if (el) {
        rootRef.current = el
        applyThemeClass(el, readFromStorage())
        return true
      }
      return false
    }
    // 立即找 + 轮询等面板挂载
    if (!tryFind()) {
      const id = setInterval(() => {
        if (tryFind()) clearInterval(id)
      }, 200)
      return () => clearInterval(id)
    }
  }, [])

  // 跨标签页同步
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const v = e.newValue as ThemeId
        setThemeState(v)
        applyThemeClass(rootRef.current, v)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return [theme, setTheme]
}
