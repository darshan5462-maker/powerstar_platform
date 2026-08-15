import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export type Role='customer'|'provider'|'admin'
export interface Profile{id:string;role:Role;full_name:string;phone?:string;avatar_url?:string;district?:string;city?:string;is_active:boolean}
interface S{profile:Profile|null;isLoading:boolean;setProfile:(p:Profile|null)=>void;setLoading:(v:boolean)=>void;reset:()=>void}
export const useAuthStore=create<S>()(persist(
  (set)=>({profile:null,isLoading:true,setProfile:p=>set({profile:p}),setLoading:v=>set({isLoading:v}),reset:()=>set({profile:null})}),
  {name:'ps-auth',partialize:s=>({profile:s.profile})}
))
