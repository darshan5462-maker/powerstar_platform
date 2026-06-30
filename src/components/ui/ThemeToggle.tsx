import { useThemeStore } from '@/store/themeStore'
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { dark, toggle } = useThemeStore()
  return (
    <button onClick={toggle} className={`btn btn-ghost btn-icon tooltip-wrapper ${className}`} title={dark ? 'Switch to Light' : 'Switch to Dark'} aria-label="Toggle theme">
      <span style={{fontSize:17}}>{dark ? '☀️' : '🌙'}</span>
      <span className="tooltip-text">{dark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
