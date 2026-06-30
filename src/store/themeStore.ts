import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface S { dark:boolean; toggle:()=>void }
export const useThemeStore = create<S>()(persist(
  (set)=>({ dark:false, toggle:()=>set(s=>{const n=!s.dark;document.documentElement.classList.toggle('dark',n);return{dark:n}}) }),
  {name:'ps-theme'}
))
