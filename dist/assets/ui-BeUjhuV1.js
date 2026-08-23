import{r as d}from"./react-C9lcm3zZ.js";var F={exports:{}},j={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var J=d,K=Symbol.for("react.element"),Q=Symbol.for("react.fragment"),V=Object.prototype.hasOwnProperty,G=J.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,X={key:!0,ref:!0,__self:!0,__source:!0};function L(e,t,r){var o,i={},s=null,a=null;r!==void 0&&(s=""+r),t.key!==void 0&&(s=""+t.key),t.ref!==void 0&&(a=t.ref);for(o in t)V.call(t,o)&&!X.hasOwnProperty(o)&&(i[o]=t[o]);if(e&&e.defaultProps)for(o in t=e.defaultProps,t)i[o]===void 0&&(i[o]=t[o]);return{$$typeof:K,type:e,key:s,ref:a,props:i,_owner:G.current}}j.Fragment=Q;j.jsx=L;j.jsxs=L;F.exports=j;var Ue=F.exports;let ee={data:""},te=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||ee},re=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,ae=/\/\*[^]*?\*\/|  +/g,S=/\n+/g,x=(e,t)=>{let r="",o="",i="";for(let s in e){let a=e[s];s[0]=="@"?s[1]=="i"?r=s+" "+a+";":o+=s[1]=="f"?x(a,s):s+"{"+x(a,s[1]=="k"?"":t)+"}":typeof a=="object"?o+=x(a,t?t.replace(/([^,])+/g,n=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):s):a!=null&&(s=s[1]=="-"?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=x.p?x.p(s,a):s+":"+a+";")}return r+(t&&i?t+"{"+i+"}":i)+o},v={},M=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+M(e[r]);return t}return e},oe=(e,t,r,o,i)=>{let s=M(e),a=v[s]||(v[s]=(l=>{let u=0,p=11;for(;u<l.length;)p=101*p+l.charCodeAt(u++)>>>0;return"go"+p})(s));if(!v[a]){let l=s!==e?e:(u=>{let p,c,m=[{}];for(;p=re.exec(u.replace(ae,""));)p[4]?m.shift():p[3]?(c=p[3].replace(S," ").trim(),m.unshift(m[0][c]=m[0][c]||{})):m[0][p[1]]=p[2].replace(S," ").trim();return m[0]})(e);v[a]=x(i?{["@keyframes "+a]:l}:l,r?"":"."+a)}let n=r&&v.g;return r&&(v.g=v[a]),((l,u,p,c)=>{c?u.data=u.data.replace(c,l):u.data.indexOf(l)===-1&&(u.data=p?l+u.data:u.data+l)})(v[a],t,o,n),a},se=(e,t,r)=>e.reduce((o,i,s)=>{let a=t[s];if(a&&a.call){let n=a(r),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;a=l?"."+l:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return o+i+(a??"")},"");function C(e){let t=this||{},r=e.call?e(t.p):e;return oe(r.unshift?r.raw?se(r,[].slice.call(arguments,1),t.p):r.reduce((o,i)=>Object.assign(o,i&&i.call?i(t.p):i),{}):r,te(t.target),t.g,t.o,t.k)}let H,P,R;C.bind({g:1});let b=C.bind({k:1});function ie(e,t,r,o){x.p=t,H=e,P=r,R=o}function w(e,t){let r=this||{};return function(){let o=arguments;function i(s,a){let n=Object.assign({},s),l=n.className||i.className;r.p=Object.assign({theme:P&&P()},n),r.o=/go\d/.test(l),n.className=C.apply(r,o)+(l?" "+l:"");let u=e;return e[0]&&(u=n.as||e,delete n.as),R&&u[0]&&R(n),H(u,n)}return i}}var ne=e=>typeof e=="function",O=(e,t)=>ne(e)?e(t):e,le=(()=>{let e=0;return()=>(++e).toString()})(),U=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),de=20,z="default",B=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(a=>a.id===t.toast.id?{...a,...t.toast}:a)};case 2:let{toast:o}=t;return B(e,{type:e.toasts.find(a=>a.id===o.id)?1:0,toast:o});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(a=>a.id===i||i===void 0?{...a,dismissed:!0,visible:!1}:a)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(a=>a.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+s}))}}},_=[],Y={toasts:[],pausedAt:void 0,settings:{toastLimit:de}},h={},q=(e,t=z)=>{h[t]=B(h[t]||Y,e),_.forEach(([r,o])=>{r===t&&o(h[t])})},W=e=>Object.keys(h).forEach(t=>q(e,t)),ce=e=>Object.keys(h).find(t=>h[t].toasts.some(r=>r.id===e)),D=(e=z)=>t=>{q(t,e)},ue={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},pe=(e={},t=z)=>{let[r,o]=d.useState(h[t]||Y),i=d.useRef(h[t]);d.useEffect(()=>(i.current!==h[t]&&o(h[t]),_.push([t,o]),()=>{let a=_.findIndex(([n])=>n===t);a>-1&&_.splice(a,1)}),[t]);let s=r.toasts.map(a=>{var n,l,u;return{...e,...e[a.type],...a,removeDelay:a.removeDelay||((n=e[a.type])==null?void 0:n.removeDelay)||(e==null?void 0:e.removeDelay),duration:a.duration||((l=e[a.type])==null?void 0:l.duration)||(e==null?void 0:e.duration)||ue[a.type],style:{...e.style,...(u=e[a.type])==null?void 0:u.style,...a.style}}});return{...r,toasts:s}},me=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||le()}),E=e=>(t,r)=>{let o=me(t,e,r);return D(o.toasterId||ce(o.id))({type:2,toast:o}),o.id},f=(e,t)=>E("blank")(e,t);f.error=E("error");f.success=E("success");f.loading=E("loading");f.custom=E("custom");f.dismiss=(e,t)=>{let r={type:3,toastId:e};t?D(t)(r):W(r)};f.dismissAll=e=>f.dismiss(void 0,e);f.remove=(e,t)=>{let r={type:4,toastId:e};t?D(t)(r):W(r)};f.removeAll=e=>f.remove(void 0,e);f.promise=(e,t,r)=>{let o=f.loading(t.loading,{...r,...r==null?void 0:r.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let s=t.success?O(t.success,i):void 0;return s?f.success(s,{id:o,...r,...r==null?void 0:r.success}):f.dismiss(o),i}).catch(i=>{let s=t.error?O(t.error,i):void 0;s?f.error(s,{id:o,...r,...r==null?void 0:r.error}):f.dismiss(o)}),e};var fe=1e3,ye=(e,t="default")=>{let{toasts:r,pausedAt:o}=pe(e,t),i=d.useRef(new Map).current,s=d.useCallback((c,m=fe)=>{if(i.has(c))return;let y=setTimeout(()=>{i.delete(c),a({type:4,toastId:c})},m);i.set(c,y)},[]);d.useEffect(()=>{if(o)return;let c=Date.now(),m=r.map(y=>{if(y.duration===1/0)return;let $=(y.duration||0)+y.pauseDuration-(c-y.createdAt);if($<0){y.visible&&f.dismiss(y.id);return}return setTimeout(()=>f.dismiss(y.id,t),$)});return()=>{m.forEach(y=>y&&clearTimeout(y))}},[r,o,t]);let a=d.useCallback(D(t),[t]),n=d.useCallback(()=>{a({type:5,time:Date.now()})},[a]),l=d.useCallback((c,m)=>{a({type:1,toast:{id:c,height:m}})},[a]),u=d.useCallback(()=>{o&&a({type:6,time:Date.now()})},[o,a]),p=d.useCallback((c,m)=>{let{reverseOrder:y=!1,gutter:$=8,defaultPosition:A}=m||{},N=r.filter(g=>(g.position||A)===(c.position||A)&&g.height),Z=N.findIndex(g=>g.id===c.id),T=N.filter((g,I)=>I<Z&&g.visible).length;return N.filter(g=>g.visible).slice(...y?[T+1]:[0,T]).reduce((g,I)=>g+(I.height||0)+$,0)},[r]);return d.useEffect(()=>{r.forEach(c=>{if(c.dismissed)s(c.id,c.removeDelay);else{let m=i.get(c.id);m&&(clearTimeout(m),i.delete(c.id))}})},[r,s]),{toasts:r,handlers:{updateHeight:l,startPause:n,endPause:u,calculateOffset:p}}},ge=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,he=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,be=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ve=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ge} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${he} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${be} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,xe=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,we=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${xe} 1s linear infinite;
`,Ee=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,$e=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ke=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ee} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${$e} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,_e=w("div")`
  position: absolute;
`,Oe=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,je=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Ce=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${je} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,De=({toast:e})=>{let{icon:t,type:r,iconTheme:o}=e;return t!==void 0?typeof t=="string"?d.createElement(Ce,null,t):t:r==="blank"?null:d.createElement(Oe,null,d.createElement(we,{...o}),r!=="loading"&&d.createElement(_e,null,r==="error"?d.createElement(ve,{...o}):d.createElement(ke,{...o})))},Ne=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ie=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Pe="0%{opacity:0;} 100%{opacity:1;}",Re="0%{opacity:1;} 100%{opacity:0;}",ze=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Ae=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Te=(e,t)=>{let r=e.includes("top")?1:-1,[o,i]=U()?[Pe,Re]:[Ne(r),Ie(r)];return{animation:t?`${b(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Se=d.memo(({toast:e,position:t,style:r,children:o})=>{let i=e.height?Te(e.position||t||"top-center",e.visible):{opacity:0},s=d.createElement(De,{toast:e}),a=d.createElement(Ae,{...e.ariaProps},O(e.message,e));return d.createElement(ze,{className:e.className,style:{...i,...r,...e.style}},typeof o=="function"?o({icon:s,message:a}):d.createElement(d.Fragment,null,s,a))});ie(d.createElement);var Fe=({id:e,className:t,style:r,onHeightUpdate:o,children:i})=>{let s=d.useCallback(a=>{if(a){let n=()=>{let l=a.getBoundingClientRect().height;o(e,l)};n(),new MutationObserver(n).observe(a,{subtree:!0,childList:!0,characterData:!0})}},[e,o]);return d.createElement("div",{ref:s,className:t,style:r},i)},Le=(e,t)=>{let r=e.includes("top"),o=r?{top:0}:{bottom:0},i=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:U()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...o,...i}},Me=C`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,k=16,Be=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:o,children:i,toasterId:s,containerStyle:a,containerClassName:n})=>{let{toasts:l,handlers:u}=ye(r,s);return d.createElement("div",{"data-rht-toaster":s||"",style:{position:"fixed",zIndex:9999,top:k,left:k,right:k,bottom:k,pointerEvents:"none",...a},className:n,onMouseEnter:u.startPause,onMouseLeave:u.endPause},l.map(p=>{let c=p.position||t,m=u.calculateOffset(p,{reverseOrder:e,gutter:o,defaultPosition:t}),y=Le(c,m);return d.createElement(Fe,{id:p.id,key:p.id,onHeightUpdate:u.updateHeight,className:p.visible?Me:"",style:y},p.type==="custom"?O(p.message,p):i?i(p):d.createElement(Se,{toast:p,position:c}))}))},Ye=f;export{Be as F,Ue as j,Ye as z};
