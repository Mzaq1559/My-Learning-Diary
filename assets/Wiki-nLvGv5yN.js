import{r as o,j as t,H as te}from"./index-BIaTRHAV.js";import{S as ae}from"./SEO-y-59tlAh.js";import"./githubApi-CkwGFiK4.js";const A={completed:"#1d9e75","in-progress":"#f59e0b",planned:"#94a3b8",locked:"#475569"},W={completed:"Completed","in-progress":"In Progress",planned:"Planned",locked:"Locked"},S={dsa:"#6366f1",systems:"#f97316",web:"#3b82f6","ai-ml":"#22c55e"},I={dsa:"DSA",systems:"Systems",web:"Web","ai-ml":"AI / ML"},re=["All","dsa","systems","web","ai-ml"],u=160,f=52,B=.9,U={x:40,y:40},O=.4,_=2.2;function oe(a){const s=[],i={};return a.forEach(l=>{i[l.id]=l}),a.forEach(l=>{(l.children||[]).forEach(c=>{const g=i[c];g&&s.push({from:l,to:g,category:l.category})})}),s}function se(a,s,i,l){const c=(s+l)/2;return`M ${a+u/2} ${s+f} C ${a+u/2} ${c}, ${i+u/2} ${c}, ${i+u/2} ${l}`}function ne({cx:a,cy:s}){return t.jsxs("g",{transform:`translate(${a-7}, ${s-8})`,children:[t.jsx("rect",{x:"2",y:"6",width:"10",height:"8",rx:"2",fill:"currentColor",opacity:"0.7"}),t.jsx("path",{d:"M4 6V4.5a3 3 0 0 1 6 0V6",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",opacity:"0.7"})]})}function ie({node:a,dimmed:s,selected:i,onSelect:l}){const c=A[a.status]??"#94a3b8",g=S[a.category]??"#94a3b8",d=a.status==="locked",k=s?"#e2e8f0":"#fdfcf5",v=s?"#aab":"#1e293b";return t.jsxs("g",{transform:`translate(${a.x}, ${a.y})`,style:{cursor:"pointer",opacity:s?.3:1,transition:"opacity 0.25s"},onClick:w=>{w.stopPropagation(),l(i?null:a)},role:"button","aria-label":a.label,children:[t.jsx("rect",{width:u,height:f,rx:"14",fill:"rgba(0,0,0,0.06)",transform:"translate(2,4)"}),t.jsx("rect",{width:u,height:f,rx:"14",fill:k,stroke:i?c:"rgba(0,0,0,0.08)",strokeWidth:i?2.5:1,style:{filter:i?`drop-shadow(0 0 8px ${c}88)`:"none"}}),t.jsx("rect",{x:0,y:f-5,width:u,height:5,rx:"0",fill:c,clipPath:"inset(0 0 0 0 round 0 0 14px 14px)"}),t.jsx("rect",{x:0,y:f-5,width:u,height:5,rx:"5",fill:c}),t.jsx("circle",{cx:14,cy:16,r:5,fill:g,opacity:s?.4:1}),t.jsx("text",{x:u/2,y:f/2-1,textAnchor:"middle",dominantBaseline:"middle",fontFamily:"'Syne', 'Inter', system-ui, sans-serif",fontWeight:"600",fontSize:"11.5",fill:v,style:{userSelect:"none",pointerEvents:"none"},children:a.label}),d&&t.jsx("g",{style:{color:"#64748b"},children:t.jsx(ne,{cx:u-16,cy:f/2-4})})]})}function le({node:a,pan:s,scale:i,onClose:l}){if(!a)return null;const c=a.x*i+s.x+u*i/2,g=a.y*i+s.y+f*i+12,d=A[a.status]??"#94a3b8",k=S[a.category]??"#94a3b8";return t.jsxs("div",{className:"roadmap-popover",style:{position:"absolute",left:c,top:g,transform:"translateX(-50%)",zIndex:200,pointerEvents:"auto"},children:[t.jsx("div",{className:"roadmap-popover-arrow"}),t.jsxs("div",{className:"roadmap-popover-inner",children:[t.jsxs("div",{className:"roadmap-popover-header",children:[t.jsx("span",{className:"roadmap-popover-dot",style:{background:k}}),t.jsx("span",{className:"roadmap-popover-category",children:I[a.category]}),t.jsx("button",{className:"roadmap-popover-close",onClick:l,"aria-label":"Close",children:"×"})]}),t.jsx("h3",{className:"roadmap-popover-title",children:a.label}),t.jsx("p",{className:"roadmap-popover-desc",children:a.description}),t.jsxs("span",{className:"roadmap-status-badge",style:{background:`${d}22`,color:d,borderColor:`${d}44`},children:[t.jsx("span",{className:"roadmap-status-dot",style:{background:d}}),W[a.status]]})]})]})}function ce(){return t.jsxs("div",{className:"roadmap-legend",children:[t.jsx("p",{className:"roadmap-legend-title",children:"Status"}),Object.entries(A).map(([a,s])=>t.jsxs("div",{className:"roadmap-legend-item",children:[t.jsx("span",{className:"roadmap-legend-dot",style:{background:s}}),t.jsx("span",{className:"roadmap-legend-label",children:W[a]})]},a)),t.jsx("p",{className:"roadmap-legend-title",style:{marginTop:"10px"},children:"Category"}),Object.entries(S).map(([a,s])=>t.jsxs("div",{className:"roadmap-legend-item",children:[t.jsx("span",{className:"roadmap-legend-dot",style:{background:s,borderRadius:"3px"}}),t.jsx("span",{className:"roadmap-legend-label",children:I[a]})]},a))]})}function xe(){const[a,s]=o.useState([]),[i,l]=o.useState(!0),[c,g]=o.useState(!1),[d,k]=o.useState("All"),[v,w]=o.useState(null),[L,M]=o.useState(U),[F,N]=o.useState(B),z=o.useRef(!1),b=o.useRef({x:0,y:0}),j=o.useRef(null),$=o.useRef(null),T=o.useCallback(async()=>{l(!0),g(!1);try{const e=await fetch("https://api.github.com/repos/Mzaq1559/blog-posts/git/trees/main?recursive=1");if(!e.ok)throw new Error(`HTTP ${e.status}`);const n=(await e.json()).tree.filter(p=>p.type==="blob"&&p.path.startsWith("roadmap_nodes/")&&p.path.endsWith(".json")).map(p=>p.path),m=async(p,E=1)=>{const X=`https://raw.githubusercontent.com/Mzaq1559/blog-posts/main/${p}`;for(let h=0;h<=E;h++){const x=await fetch(X);if(x.ok)return await x.json();if(x.status===503&&h<E){await new Promise(ee=>setTimeout(ee,500));continue}else throw new Error(`HTTP ${x.status} for ${p}`)}},y=[],C=5;for(let p=0;p<n.length;p+=C){const E=n.slice(p,p+C),X=await Promise.allSettled(E.map(h=>m(h)));try{for(const h of X)if(h.status==="fulfilled"){const x=h.value;x&&(Array.isArray(x.nodes)?y.push(...x.nodes):Array.isArray(x)?y.push(...x):x.id&&y.push(x))}else console.warn("[Roadmap] Failed to fetch a node file:",h.reason)}catch(h){console.error("[Roadmap] Error during result aggregation:",h)}}console.log("assembled nodes:",y.length,y),s(y)}catch(e){console.error("[Roadmap] fetch error",e),g(!0)}finally{l(!1)}},[]);o.useEffect(()=>{T()},[T]);const G=o.useCallback(e=>{e.button===0&&(z.current=!0,b.current={x:e.clientX,y:e.clientY},e.currentTarget.style.cursor="grabbing")},[]),V=o.useCallback(e=>{if(!z.current)return;const r=e.clientX-b.current.x,n=e.clientY-b.current.y;b.current={x:e.clientX,y:e.clientY},M(m=>({x:m.x+r,y:m.y+n}))},[]),H=o.useCallback(e=>{z.current=!1,e.currentTarget&&(e.currentTarget.style.cursor="grab")},[]),R=o.useCallback(e=>{e.preventDefault();const r=e.deltaY>0?-.08:.08;N(n=>Math.max(O,Math.min(_,n+r)))},[]);o.useEffect(()=>{const e=$.current;if(e)return e.addEventListener("wheel",R,{passive:!1}),()=>e.removeEventListener("wheel",R)},[R]);const P=o.useCallback(e=>{if(e.touches.length===1)b.current={x:e.touches[0].clientX,y:e.touches[0].clientY},j.current=null;else if(e.touches.length===2){const r=e.touches[0].clientX-e.touches[1].clientX,n=e.touches[0].clientY-e.touches[1].clientY;j.current=Math.hypot(r,n)}},[]),Y=o.useCallback(e=>{if(e.preventDefault(),e.touches.length===1&&j.current===null){const r=e.touches[0].clientX-b.current.x,n=e.touches[0].clientY-b.current.y;b.current={x:e.touches[0].clientX,y:e.touches[0].clientY},M(m=>({x:m.x+r,y:m.y+n}))}else if(e.touches.length===2){const r=e.touches[0].clientX-e.touches[1].clientX,n=e.touches[0].clientY-e.touches[1].clientY,m=Math.hypot(r,n);if(j.current!==null){const y=m/j.current;N(C=>Math.max(O,Math.min(_,C*y)))}j.current=m}},[]),D=o.useCallback(e=>{e.touches.length<2&&(j.current=null)},[]);o.useEffect(()=>{const e=$.current;if(e)return e.addEventListener("touchmove",Y,{passive:!1}),e.addEventListener("touchstart",P,{passive:!0}),e.addEventListener("touchend",D,{passive:!0}),()=>{e.removeEventListener("touchmove",Y),e.removeEventListener("touchstart",P),e.removeEventListener("touchend",D)}},[Y,P,D]);const q=()=>{M(U),N(B)},Z=oe(a),J=e=>d!=="All"&&e.category!==d,K=a.reduce((e,r)=>Math.max(e,r.x+u+80),800),Q=a.reduce((e,r)=>Math.max(e,r.y+f+80),600);return t.jsxs("div",{className:"roadmap-page",children:[t.jsx(te,{children:t.jsx("link",{rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Syne:wght@400;800&display=swap"})}),t.jsx("style",{children:`
        .roadmap-page {
          min-height: 100vh;
          padding-top: 80px;
          padding-bottom: 32px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .roadmap-header {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px 24px;
          text-align: center;
        }

        .roadmap-header h1 {
          font-family: 'Syne', system-ui, sans-serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: #1a1a2e;
          margin: 0 0 8px;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #1a1a2e 0%, #1d9e75 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .roadmap-header p {
          color: #64748b;
          font-size: 1rem;
          margin: 0;
        }

        /* Category filter bar */
        .roadmap-filters {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 0 20px 20px;
          max-width: 900px;
          margin: 0 auto;
        }

        .roadmap-filter-btn {
          padding: 7px 18px;
          border-radius: 50px;
          border: 1.5px solid rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(8px);
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Syne', system-ui, sans-serif;
        }

        .roadmap-filter-btn:hover {
          background: rgba(255,255,255,0.8);
          transform: translateY(-1px);
        }

        .roadmap-filter-btn.active {
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }

        /* Canvas container */
        .roadmap-canvas-wrap {
          max-width: calc(100vw - 32px);
          margin: 0 auto;
          padding: 0 16px;
          position: relative;
        }

        .roadmap-canvas-card {
          background: rgba(253, 252, 245, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 28px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.8) inset;
          overflow: hidden;
          position: relative;
          height: clamp(480px, 70vh, 720px);
          cursor: grab;
          user-select: none;
        }

        .roadmap-canvas-card:active {
          cursor: grabbing;
        }

        .roadmap-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Controls overlay */
        .roadmap-controls {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 10;
          pointer-events: auto;
        }

        .roadmap-ctrl-btn {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .roadmap-ctrl-btn:hover {
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        /* Legend */
        .roadmap-legend {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 14px;
          padding: 12px 14px;
          z-index: 10;
          min-width: 120px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .roadmap-legend-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin: 0 0 8px;
          font-family: 'Syne', system-ui, sans-serif;
        }

        .roadmap-legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 5px;
        }

        .roadmap-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .roadmap-legend-label {
          font-size: 11px;
          color: #475569;
          font-weight: 500;
        }

        /* Popover */
        .roadmap-popover {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 18px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.9) inset;
          width: 240px;
        }

        .roadmap-popover-arrow {
          position: absolute;
          top: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 7px;
          background: rgba(255,255,255,0.95);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          border-left: 1px solid rgba(0,0,0,0.08);
          border-right: 1px solid rgba(0,0,0,0.08);
        }

        .roadmap-popover-inner {
          padding: 16px;
        }

        .roadmap-popover-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }

        .roadmap-popover-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .roadmap-popover-category {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          flex: 1;
          font-family: 'Syne', system-ui, sans-serif;
        }

        .roadmap-popover-close {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.06);
          color: #64748b;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .roadmap-popover-close:hover {
          background: rgba(0,0,0,0.1);
        }

        .roadmap-popover-title {
          font-family: 'Syne', system-ui, sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px;
          line-height: 1.3;
        }

        .roadmap-popover-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 12px;
        }

        .roadmap-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 50px;
          border: 1px solid;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Syne', system-ui, sans-serif;
        }

        .roadmap-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Loading / error states */
        .roadmap-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 14px;
        }

        .roadmap-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid rgba(29,158,117,0.15);
          border-top-color: #1d9e75;
          animation: roadmap-spin 0.8s linear infinite;
        }

        @keyframes roadmap-spin {
          to { transform: rotate(360deg); }
        }

        .roadmap-state-text {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        .roadmap-retry-btn {
          padding: 9px 22px;
          border-radius: 50px;
          border: 1.5px solid #1d9e75;
          background: transparent;
          color: #1d9e75;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .roadmap-retry-btn:hover {
          background: #1d9e75;
          color: white;
        }

        /* Zoom hint */
        .roadmap-hint {
          text-align: center;
          font-size: 11.5px;
          color: #94a3b8;
          padding-top: 10px;
          font-weight: 500;
        }

        /* Stats bar */
        .roadmap-stats {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 18px 20px 0;
          max-width: 700px;
          margin: 0 auto;
        }

        .roadmap-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .roadmap-stat-value {
          font-family: 'Syne', system-ui, sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #1e293b;
        }

        .roadmap-stat-label {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #94a3b8;
        }

        .roadmap-stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-bottom: 2px;
        }
      `}),t.jsx(ae,{title:"Learning Roadmap",description:"An interactive skill tree of my learning journey — covering DSA, Systems, Web, and AI/ML."}),t.jsxs("div",{className:"roadmap-header",children:[t.jsx("h1",{children:"Learning Roadmap"}),t.jsx("p",{children:"My skill tree — click any node to explore, drag to pan, scroll to zoom."})]}),!i&&!c&&a.length>0&&t.jsx("div",{className:"roadmap-stats",children:Object.entries(A).map(([e,r])=>{const n=a.filter(m=>m.status===e).length;return n===0?null:t.jsxs("div",{className:"roadmap-stat",children:[t.jsx("span",{className:"roadmap-stat-dot",style:{background:r}}),t.jsx("span",{className:"roadmap-stat-value",style:{color:r},children:n}),t.jsx("span",{className:"roadmap-stat-label",children:W[e]})]},e)})}),!i&&!c&&t.jsx("div",{className:"roadmap-filters",style:{paddingTop:"16px"},children:re.map(e=>{const r=e==="All"?"#1d9e75":S[e],n=d===e;return t.jsx("button",{className:`roadmap-filter-btn ${n?"active":""}`,style:n?{background:r}:{},onClick:()=>{k(e),w(null)},type:"button",children:e==="All"?"All":I[e]},e)})}),t.jsxs("div",{className:"roadmap-canvas-wrap",children:[t.jsx("div",{className:"roadmap-canvas-card",ref:$,onMouseDown:G,onMouseMove:V,onMouseUp:H,onMouseLeave:H,onClick:()=>w(null),children:i?t.jsxs("div",{className:"roadmap-state",children:[t.jsx("div",{className:"roadmap-spinner"}),t.jsx("span",{className:"roadmap-state-text",children:"Loading roadmap..."})]}):c?t.jsxs("div",{className:"roadmap-state",children:[t.jsx("span",{style:{fontSize:"32px"},children:"🗺️"}),t.jsx("span",{className:"roadmap-state-text",children:"Could not load roadmap — check back soon."}),t.jsx("button",{className:"roadmap-retry-btn",onClick:e=>{e.stopPropagation(),T()},children:"Retry"})]}):t.jsxs(t.Fragment,{children:[t.jsxs("svg",{className:"roadmap-svg",viewBox:`0 0 ${K} ${Q}`,preserveAspectRatio:"xMidYMid meet",children:[t.jsx("defs",{children:t.jsx("filter",{id:"node-shadow",children:t.jsx("feDropShadow",{dx:"0",dy:"3",stdDeviation:"6",floodOpacity:"0.08"})})}),t.jsxs("g",{transform:`translate(${L.x}, ${L.y}) scale(${F})`,children:[Z.map((e,r)=>{const n=d!=="All"&&e.category!==d;return t.jsx("path",{d:se(e.from.x,e.from.y,e.to.x,e.to.y),fill:"none",stroke:S[e.category]??"#94a3b8",strokeWidth:"2",strokeDasharray:"6 4",opacity:n?.1:.35,style:{transition:"opacity 0.25s"}},r)}),a.map(e=>t.jsx(ie,{node:e,dimmed:J(e),selected:(v==null?void 0:v.id)===e.id,onSelect:w},e.id))]})]}),t.jsx(ce,{}),t.jsxs("div",{className:"roadmap-controls",children:[t.jsx("button",{className:"roadmap-ctrl-btn",onClick:e=>{e.stopPropagation(),N(r=>Math.min(_,r+.1))},children:"＋"}),t.jsx("button",{className:"roadmap-ctrl-btn",onClick:e=>{e.stopPropagation(),q()},children:"⌖ Reset"}),t.jsx("button",{className:"roadmap-ctrl-btn",onClick:e=>{e.stopPropagation(),N(r=>Math.max(O,r-.1))},children:"－"})]}),v&&t.jsx(le,{node:v,pan:L,scale:F,onClose:()=>w(null)})]})}),t.jsx("p",{className:"roadmap-hint",children:"Drag to pan · Scroll to zoom · Tap a node for details"})]})]})}export{xe as default};
