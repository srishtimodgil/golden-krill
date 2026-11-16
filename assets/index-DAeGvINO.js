(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const l of o.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function t(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(a){if(a.ep)return;a.ep=!0;const o=t(a);fetch(a.href,o)}})();const x=3,z=.75,Ht=[{depth:10,text:"pressure doubles · 2 atmospheres",side:"R"},{depth:20,text:"reds have faded to brown",side:"L"},{depth:40,text:"recreational scuba limit · 40m",side:"R"},{depth:100,text:"light begins to fade fast",side:"L"},{depth:200,text:"THE TWILIGHT ZONE",side:"R",zone:!0},{depth:214,text:"deepest no-limits freedive · 214m",side:"L"},{depth:332,text:"deepest scuba dive on record · 332m",side:"R"},{depth:500,text:"emperor penguins dive past here",side:"L"},{depth:700,text:"vampire squid drift 600–900m",side:"R"},{depth:1e3,text:"THE MIDNIGHT ZONE",side:"L",zone:!0},{depth:1050,text:"no sunlight at all · ~100 atmospheres",side:"R"},{depth:1300,text:"anglerfish territory",side:"L"},{depth:2e3,text:"sperm whales hunt squid down here",side:"R"},{depth:2500,text:"hydrothermal vents & tube worms",side:"L"},{depth:2992,text:"Cuvier's beaked whale record · 2,992m",side:"R"},{depth:3700,text:"average depth of the ocean · ~3,700m",side:"L"},{depth:3800,text:"the Titanic rests here · 3,800m",side:"R"},{depth:4e3,text:"THE ABYSSAL ZONE",side:"L",zone:!0},{depth:4791,text:"wreck of the Bismarck · ~4,790m",side:"R"},{depth:6e3,text:"THE HADAL ZONE",side:"L",zone:!0},{depth:6900,text:"trench floor? still ~4km further down",side:"R"}],D=(s,e,t)=>s+(e-s)*t,F=(s,e=0,t=1)=>Math.max(e,Math.min(t,s)),W=(s,e,t)=>[D(s[0],e[0],t),D(s[1],e[1],t),D(s[2],e[2],t)],q=(s,e=1)=>`rgba(${s[0]|0},${s[1]|0},${s[2]|0},${e})`;function b(s){const e=Math.sin(s*127.1+311.7)*43758.5453;return e-Math.floor(e)}function st(s){const e=Math.floor(s),t=s-e,n=t*t*(3-2*t);return D(b(e),b(e+1),n)}const N=[[0,[34,122,118]],[120,[14,72,74]],[450,[6,38,42]],[1200,[3,18,20]],[3e3,[1,7,8]],[7e3,[0,2,3]]];function pt(s){for(let e=1;e<N.length;e++)if(s<=N[e][0]){const[t,n]=N[e-1],[a,o]=N[e];return W(n,o,(s-t)/(a-t))}return N[N.length-1][1]}const at=s=>[Math.round(s[0]/3)*3,Math.round(s[1]/3)*3,Math.round(s[2]/3)*3];class Gt{constructor(e,t){this.canvas=e,this.overlay=t,this.cam=0,this.camV=0,this.you=0,this.follow=null,this.lines=[],this.reduced=matchMedia("(prefers-reduced-motion: reduce)").matches,this.W=0,this.H=0,this.w=0,this.h=0,this.dpr=1,this.t=0,this.last=0,this.bubbles=[],this.bubbleTimer=0,this.schools=Array.from({length:9},(n,a)=>({depth:30+a*110+b(a)*60,x:b(a+9)*400,vx:(b(a+3)>.5?1:-1)*(6+b(a+5)*8),n:5+Math.floor(b(a+7)*8),seed:a})),this.specks=Array.from({length:420},(n,a)=>({x:b(a*3.1),depth:250+b(a*7.7)*7600,ph:b(a)*6.28,hue:b(a*1.3)})),this.kelp=Array.from({length:22},(n,a)=>({depth:55+a*13+b(a)*8,side:a%2,len:14+b(a+2)*26,ph:b(a)*6})),this.ctx=e.getContext("2d"),this.octx=t.getContext("2d"),addEventListener("resize",()=>this.resize()),this.resize(),requestAnimationFrame(n=>this.frame(n))}get anchorY(){return Math.round(this.H*.4)}screenY(e){return this.anchorY+(e-this.cam)*z}depthAt(e){return this.cam+(e-this.anchorY)/z}resize(){this.W=innerWidth,this.H=innerHeight,this.dpr=Math.min(devicePixelRatio||1,2),this.w=Math.ceil(this.W/x),this.h=Math.ceil(this.H/x)+2,this.canvas.width=this.w,this.canvas.height=this.h,this.canvas.style.height=`${this.h*x}px`,this.canvas.style.width=`${this.w*x}px`,this.overlay.width=this.W*this.dpr,this.overlay.height=this.H*this.dpr,this.ctx.imageSmoothingEnabled=!1}frame(e){const t=Math.min(.05,(e-(this.last||e))/1e3);this.last=e,this.reduced||(this.t+=t),this.follow!==null&&(this.reduced?(this.cam=this.follow,this.camV=0):(this.camV+=(4.2*4.2*(this.follow-this.cam)-2*4.2*this.camV)*t,this.cam+=this.camV*t));const n=this.cam,a=x/z,o=Math.floor(n/a)*a;this.cam=o,this.drawWorld(t),this.cam=n,this.canvas.style.transform=`translate3d(0, ${(-(n-o)*z).toFixed(2)}px, 0)`,this.drawOverlay(e),requestAnimationFrame(l=>this.frame(l))}wallWidth(e,t){if(e<45)return 0;const n=t*97.3,a=3+st(e*.03+n)*6,o=(()=>{const r=e/140+n,c=Math.floor(r),i=r-c,d=1-Math.abs(2*i-1);return 6+st(e*.01+n)*10+Math.pow(d,2.4)*b(c+t)*34})(),l=26+st(e*.02+n)*10+F((e-2500)/4e3)*this.w*.12;return e<350?D(0,a,F((e-45)/40)):e<2500?D(a,o,F((e-350)/200)):D(o,l,F((e-2500)/500))}drawWorld(e){const{ctx:t,w:n,h:a}=this,o=this.screenY(0)/x;for(let l=0;l<a;l++){const r=this.depthAt(l*x+x/2);if(r<0){const p=F(l/Math.max(1,o));t.fillStyle=q(at(W([86,150,178],[196,224,214],p))),t.fillRect(0,l,n,1);continue}const c=at(pt(r));t.fillStyle=q(c),t.fillRect(0,l,n,1);const i=at(W(c,[0,0,0],.55)),d=Math.round(this.wallWidth(r,0)),u=Math.round(this.wallWidth(r,1));(d||u)&&(t.fillStyle=q(i),d&&t.fillRect(0,l,d,1),u&&t.fillRect(n-u,l,u,1),t.fillStyle=q(W(i,c,.5)),d&&t.fillRect(d,l,1,1),u&&t.fillRect(n-u-1,l,1,1))}o>-60&&this.drawSky(o),this.drawRays(o),this.drawKelp(),this.drawFish(e),this.drawSpecks(),this.drawSub(o),this.drawBubbles(e,o),o>-10&&o<a+5&&this.drawWaterline(o)}drawSky(e){const{ctx:t,w:n}=this,a=Math.round(n*.8),o=Math.round(e-Math.min(46,e*.6));for(let i=14;i>6;i-=3)t.fillStyle=`rgba(255,236,170,${.08+(14-i)*.02})`,this.disc(a,o,i);t.fillStyle="#FFF1B8",this.disc(a,o,6),t.fillStyle="#FFE58A",this.disc(a+1,o+1,4),t.fillStyle="rgba(240,250,246,.9)";for(let i=0;i<4;i++){const d=(b(i)*n+this.t*(1.5+i*.6))%(n+60)-30,u=Math.round(e*(.15+b(i+4)*.45)),p=12+Math.round(b(i+8)*14);t.fillRect(Math.round(d),u,p,3),t.fillRect(Math.round(d)+3,u-2,p-7,2),t.fillRect(Math.round(d)+6,u-4,Math.max(3,p-14),2)}const l=Math.round(n*.22)-16,r=Math.round(e),c=Math.round(Math.sin(this.t*1.6));t.fillStyle="#26363A",t.fillRect(l,r-4+c,34,4),t.fillStyle="#3B5257",t.fillRect(l+2,r-5+c,30,1),t.fillStyle="#D9E4DD",t.fillRect(l+4,r-10+c,9,5),t.fillStyle="#FFB347",t.fillRect(l+6,r-8+c,2,2),t.fillRect(l+9,r-8+c,2,2),t.fillStyle="#E0A93A",t.fillRect(l+22,r-16+c,2,11);for(let i=0;i<9;i++)t.fillRect(l+22-i,r-16+c-Math.floor(i/3),1,1)}disc(e,t,n){for(let a=-n;a<=n;a++){const o=Math.floor(Math.sqrt(n*n-a*a));this.ctx.fillRect(e-o,t+a,o*2+1,1)}}drawWaterline(e){const{ctx:t,w:n}=this;for(let a=0;a<n;a++){const o=Math.round(Math.sin(a*.18+this.t*2.2)*1.2+Math.sin(a*.07-this.t)*.8);t.fillStyle="rgba(210,245,235,.85)",t.fillRect(a,Math.round(e)+o,1,1),t.fillStyle="rgba(120,200,190,.5)",t.fillRect(a,Math.round(e)+o+1,1,1)}}drawRays(e){if(e<-80||e>this.h)return;const{ctx:t,w:n}=this;t.save();for(let a=0;a<5;a++){const o=n*(.1+a*.2)+Math.sin(this.t*.4+a)*6,l=t.createLinearGradient(0,e,0,e+90);l.addColorStop(0,"rgba(200,255,235,.13)"),l.addColorStop(1,"rgba(200,255,235,0)"),t.fillStyle=l,t.beginPath(),t.moveTo(o,e),t.lineTo(o+8,e),t.lineTo(o+30,e+90),t.lineTo(o+14,e+90),t.fill()}t.restore()}drawKelp(){const{ctx:e,w:t}=this;for(const n of this.kelp){const a=this.screenY(n.depth)/x;if(a<-60||a>this.h+10)continue;const o=this.wallWidth(n.depth,n.side),l=n.side===0?o+1:t-o-2;for(let r=0;r<n.len;r++){const c=Math.round(Math.sin(this.t*1.1+r*.25+n.ph)*r*.12),i=l+c,d=Math.round(a-r);e.fillStyle=r%5===0?"#4F9A4C":"#2E6B3A",e.fillRect(i,d,1,1),r%4===2&&(e.fillStyle="#3F8A45",e.fillRect(i+(r%8===2?1:-1),d,1,1))}}}drawFish(e){const{ctx:t,w:n}=this;for(const a of this.schools){a.x+=a.vx*e*(this.reduced?0:1);const o=this.screenY(a.depth)/x;if(o<-20||o>this.h+20)continue;const l=q(W(pt(a.depth),[0,0,0],.45),.9);t.fillStyle=l;for(let r=0;r<a.n;r++){const c=((a.x+b(a.seed*10+r)*40)%(n+60)+n+60)%(n+60)-30,i=Math.round(o+(b(a.seed*20+r)-.5)*18+Math.sin(this.t*2+r)*.8),d=a.vx>0?1:-1,u=Math.round(c);t.fillRect(u,i,3,2),t.fillRect(u-d*1+(d<0?3:0)-(d<0,0),i,1,1),t.fillRect(d>0?u-1:u+3,i+1,1,1)}}}drawSpecks(){const{ctx:e,w:t}=this;for(const n of this.specks){const a=this.screenY(n.depth)/x;if(a<0||a>this.h)continue;const l=F((n.depth-300)/1800)*(.45+.55*Math.sin(this.t*1.7+n.ph*3));if(l<=.03)continue;const r=n.hue<.6?"124,255,178":n.hue<.85?"120,230,255":"255,210,74",c=Math.round(n.x*t);e.fillStyle=`rgba(${r},${l*.25})`,e.fillRect(c-1,Math.round(a)-1,3,3),e.fillStyle=`rgba(${r},${l})`,e.fillRect(c,Math.round(a),1,1)}}drawSub(e){const{ctx:t}=this,n=Math.round(this.w*.22),a=Math.round(this.screenY(this.you)/x+10+Math.sin(this.t*1.4)*1.2);t.fillStyle="rgba(200,210,200,.55)";const o=Math.max(0,Math.round(e)-16);t.fillRect(n,o,1,Math.max(0,a-8-o));const l=F(this.you/900,.15,1),r=t.createLinearGradient(n+6,0,n+60,0);r.addColorStop(0,`rgba(255,220,140,${.28*l})`),r.addColorStop(1,"rgba(255,220,140,0)"),t.fillStyle=r,t.beginPath(),t.moveTo(n+6,a-1),t.lineTo(n+60,a-12),t.lineTo(n+60,a+12),t.lineTo(n+6,a+2),t.fill(),t.fillStyle="#5E4A2A",this.disc(n,a,8),t.fillStyle="#B08A4A",this.disc(n,a,7),t.fillStyle="#D4AE68",t.fillRect(n-5,a-5,3,2),t.fillRect(n-6,a-3,2,2),t.fillStyle="#5E4A2A",[[-6,0],[6,0],[0,-6],[0,6],[-4,-4],[4,4],[4,-4],[-4,4]].forEach(([c,i])=>t.fillRect(n+c,a+i,1,1)),t.fillStyle="#2B2216",this.disc(n+2,a,3),t.fillStyle="#FFD24A",this.disc(n+2,a,2),t.fillStyle="#FFF4C2",t.fillRect(n+1,a-1,1,1),t.fillStyle="#7A6034",t.fillRect(n-2,a-9,5,2),t.fillStyle="#FFB347",t.fillRect(n+7,a-1,2,2)}drawBubbles(e,t){const{ctx:n}=this;if(this.bubbleTimer-=e,this.bubbleTimer<=0&&!this.reduced){this.bubbleTimer=.25+Math.random()*.35;const a=Math.round(this.w*.22)+(Math.random()*6-3);this.bubbles.push({x:a,y:this.screenY(this.you)/x+2,vy:10+Math.random()*10,s:Math.random()<.3?2:1}),Math.random()<.6&&this.bubbles.push({x:Math.random()*this.w,y:this.h+2,vy:8+Math.random()*12,s:1})}n.fillStyle="rgba(200,255,240,.55)",this.bubbles=this.bubbles.filter(a=>(a.y-=a.vy*e,a.x+=Math.sin(a.y*.3)*.15,a.y<Math.max(0,t+1)?!1:(n.fillRect(Math.round(a.x),Math.round(a.y),a.s,a.s),!0)))}burst(e,t,n=3){if(!this.reduced)for(let a=0;a<n;a++)this.bubbles.push({x:e/x+(Math.random()*10-5),y:t/x+Math.random()*3,vy:14+Math.random()*16,s:Math.random()<.35?2:1})}drawOverlay(e){const t=this.octx,n=this.W,a=this.H;t.setTransform(this.dpr,0,0,this.dpr,0,0),t.clearRect(0,0,n,a);const o=n-46;for(const i of Ht){const d=this.screenY(i.depth);if(d<-20||d>a+20)continue;const u=F(1.25-Math.abs(d-this.anchorY)/(a*.42));if(u<=0)continue;t.save(),t.globalAlpha=u,t.textBaseline="middle",t.textAlign=i.side==="L"?"left":"right";const p=i.side==="L"?14:o-10;i.zone?(t.font="13px Silkscreen, monospace",t.letterSpacing="3px",t.fillStyle="#7CFFB2",t.shadowColor="rgba(124,255,178,.7)",t.shadowBlur=10):(t.font='11px "IBM Plex Mono", monospace',t.letterSpacing="1px",t.fillStyle="#B5D3C4"),t.fillText(i.zone?i.text:`— ${i.text}`,p,d),t.restore()}for(const i of this.lines){const d=Math.round(this.screenY(i.depth))+.5;if(d<-10||d>a+10)continue;t.save(),t.setLineDash(i.state==="lit"?[6,4]:[2,5]),t.lineWidth=i.state==="lit"?2:1,t.strokeStyle=i.state==="idle"?"rgba(127,165,149,.45)":i.state==="dim"?"rgba(127,165,149,.18)":i.color,t.globalAlpha=i.state==="passed"?.6:1;const u=i.pulseAt?Math.max(0,1-(e-i.pulseAt)/600):0;i.state==="lit"?(t.shadowColor=i.color,t.shadowBlur=12+6*Math.sin(e/260)):u>0&&(t.globalAlpha=.6+.4*u,t.lineWidth=1+u*1.5,t.shadowColor=i.color,t.shadowBlur=14*u),t.beginPath(),t.moveTo(12,d),t.lineTo(o-6,d),t.stroke(),t.setLineDash([]),t.font="10px Silkscreen, monospace",t.letterSpacing="2px",t.textAlign="right",t.textBaseline="bottom",t.fillStyle=i.state==="idle"||i.state==="dim"?"rgba(181,211,196,.6)":i.color,t.fillText(i.label,o-8,d-4),t.restore()}t.fillStyle="rgba(4,16,12,.55)",t.fillRect(o,0,46,a),t.fillStyle="rgba(124,255,178,.35)",t.fillRect(o,0,1,a);const l=this.depthAt(0),r=this.depthAt(a);t.font='9px "IBM Plex Mono", monospace',t.textAlign="right",t.textBaseline="middle";for(let i=Math.max(0,Math.floor(l/25)*25);i<=r;i+=25){const d=Math.round(this.screenY(i))+.5,u=i%100===0;t.fillStyle=u?"rgba(124,255,178,.8)":"rgba(124,255,178,.35)",t.fillRect(o+1,d,u?10:5,1),u&&(t.fillStyle="rgba(181,211,196,.75)",t.fillText(`${i}m`,n-4,d))}const c=Math.round(this.screenY(this.you)+10*x);t.fillStyle="#FF6B5A",t.shadowColor="rgba(255,107,90,.8)",t.shadowBlur=8,t.beginPath(),t.moveTo(o-1,c),t.lineTo(o+7,c-6),t.lineTo(o+7,c+6),t.fill(),t.fillRect(o+8,c-7,36,14),t.shadowBlur=0,t.fillStyle="#04100C",t.font="10px Silkscreen, monospace",t.textAlign="center",t.fillText("YOU",o+26,c+1)}}const Y=[{name:"Plankton",points:10,depth:100,color:"#A9C2CF",glow:"rgba(169,194,207,.55)",emoji:"🫧",flavor:"The first thing everyone thinks of. It still counts."},{name:"Too Clever",points:15,depth:150,color:"#FFB347",glow:"rgba(255,179,71,.55)",emoji:"🦀",flavor:"Technically correct. The judges are squinting."},{name:"Schooler",points:30,depth:300,color:"#7CFFB2",glow:"rgba(124,255,178,.55)",emoji:"🐟",flavor:"A sturdy pick. Plenty of company down here."},{name:"Rare",points:60,depth:600,color:"#FF6B5A",glow:"rgba(255,107,90,.6)",emoji:"🦑",flavor:"Off the main current. Nicely found."},{name:"Deep Cut",points:85,depth:850,color:"#B48CFF",glow:"rgba(180,140,255,.6)",emoji:"🐡",flavor:"Very few divers ever reach this answer."},{name:"Golden Krill",points:100,depth:1e3,color:"#FFD24A",glow:"rgba(255,210,74,.75)",emoji:"✨",flavor:"Shimmering, nearly mythical. A legendary find."}],$=Object.fromEntries(Y.map(s=>[s.name,s])),H=7,bt=25,M=700,jt=s=>s*10,qt={ø:"o",æ:"ae",œ:"oe",ß:"ss",ł:"l",đ:"d",ð:"d",þ:"th",ı:"i"};function G(s,e=[]){let t=s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");t=t.replace(/[øæœßłđðþı]/g,a=>qt[a]??a),t=t.replace(/&/g," and ").replace(/['’`]/g,"").replace(/[^a-z0-9]+/g," ").trim(),t=t.replace(/^the /,"");let n=t.split(" ").filter(Boolean).map(ft);if(e.length){const a=e.map(l=>ft(l.toLowerCase())),o=n.filter(l=>!a.includes(l));o.length&&(n=o)}return n.join(" ")}function ft(s){return s.length<=3||s.endsWith("ss")?s:s.endsWith("ies")&&s.length>4?s.slice(0,-3)+"y":/(ch|sh|x|z|o)es$/.test(s)?s.slice(0,-2):s.endsWith("s")?s.slice(0,-1):s}const Z=s=>s.replace(/ /g,"");function mt(s,e,t=1/0){if(s===e)return 0;if(Math.abs(s.length-e.length)>t)return t+1;let n=Array.from({length:e.length+1},(a,o)=>o);for(let a=1;a<=s.length;a++){const o=[a];let l=a;for(let r=1;r<=e.length;r++){const c=Math.min(n[r]+1,o[r-1]+1,n[r-1]+(s[a-1]===e[r-1]?0:1));o.push(c),c<l&&(l=c)}if(l>t)return t+1;n=o}return n[e.length]}function Vt(s){const e=[];for(const t of s.answers)for(const n of[t.text,...t.aliases??[]]){const a=G(n,s.ignoreWords);a&&e.push({answer:t,norm:a,tokens:a.split(" ")})}return e}function Wt(s,e){t:for(let t=0;t+e.length<=s.length;t++){for(let n=0;n<e.length;n++)if(s[t+n]!==e[n])continue t;return t}return-1}function yt(s,e){const t=G(s,e.ignoreWords);if(!t)return{kind:"none"};const n=Vt(e),a=n.find(c=>c.norm===t||Z(c.norm)===Z(t));if(a)return{kind:"exact",answer:a.answer};const o=t.split(" ");if(o.length>1){const c=n.map(i=>({f:i,at:Wt(o,i.tokens)})).filter(i=>i.at>=0&&i.f.norm.length>=3).sort((i,d)=>d.f.tokens.length-i.f.tokens.length||d.f.norm.length-i.f.norm.length);if(c.length){const i=c[0],d=i.at+i.f.tokens.length;return c.some(p=>p.f.answer!==i.f.answer&&(p.at<i.at||p.at+p.f.tokens.length>d))?{kind:"none"}:{kind:"near",answer:i.f.answer}}}if(t.length<3)return{kind:"none"};const l=new Map;for(const c of n){const i=c.norm.length<=5?1:2,d=Math.min(mt(t,c.norm,i),mt(Z(t),Z(c.norm),i));d<=i&&d<(l.get(c.answer)??1/0)&&l.set(c.answer,d)}if(l.size===0)return{kind:"none"};const r=[...l.entries()].sort((c,i)=>c[1]-i[1]);return r.length>1&&r[1][1]===r[0][1]?{kind:"none"}:{kind:"near",answer:r[0][0]}}const lt=s=>Object.keys(s.dives).length;function Yt(s,e){const t=s.dives[String(e)];if(!t)throw new Error(`Dive #${e} does not exist`);return t.map(n=>{const a=s.prompts[n];if(!a)throw new Error(`Dive #${e} references unknown prompt "${n}"`);return a})}class Ut{constructor(e,t,n=!1,a=[]){this.dive=e,this.replay=n,this.results=[],this.pending=null,this.prompts=Yt(t,e),this.results=a.slice(0,H)}get index(){return this.results.length}get current(){return this.prompts[this.index]??null}get done(){return this.results.length>=this.prompts.length}get score(){return this.results.reduce((e,t)=>e+t.points,0)}get depth(){return jt(this.score)}submit(e){const t=this.current;if(!t)return{kind:"rejected"};if(this.pending&&G(e,t.ignoreWords)===G(this.pending.text,t.ignoreWords)){const a=this.pending;return this.accept(a)}const n=yt(e,t);return n.kind==="exact"?this.accept(n.answer):n.kind==="near"?(this.pending=n.answer,{kind:"confirm",suggestion:n.answer}):(this.pending=null,{kind:"rejected"})}timeout(){const t={promptId:this.current.id,answer:null,tier:null,points:0};return this.results.push(t),this.pending=null,t}accept(e){const t=this.current,n=$[e.tier],a={promptId:t.id,answer:e.text,tier:e.tier,points:n.points};return this.results.push(a),this.pending=null,{kind:"accepted",answer:e,result:a}}}Object.fromEntries(Y.map((s,e)=>[s.name,e]));const T={history:"gk.history",next:"gk.nextDive",live:"gk.liveDive"};class Kt{constructor(e){this.kv=e}all(){try{return JSON.parse(this.kv.getItem(T.history)??"[]")}catch{return[]}}async save(e){if(e.replay)return;const t=this.all().filter(n=>n.dive!==e.dive);t.push(e),this.kv.setItem(T.history,JSON.stringify(t))}async personal(){return this.all()}async friendsOnDive(){return[]}}class _t{constructor(e){this.kv=e}get nextDive(){return Math.max(1,Number(this.kv.getItem(T.next)??1)||1)}set nextDive(e){this.kv.setItem(T.next,String(e))}saveLive(e){e?this.kv.setItem(T.live,JSON.stringify(e)):this.kv.removeItem(T.live)}loadLive(){try{return JSON.parse(this.kv.getItem(T.live)??"null")}catch{return null}}reset(){[T.history,T.next,T.live].forEach(e=>this.kv.removeItem(e))}}const nt=5;function zt(s,e){if(!e.length)return 0;const t=e.reduce((n,a)=>n+(a<s?1:a===s?.5:0),0);return Math.round(t/e.length*100)}function Zt(s,e=71){const t=s.length>=nt?s:null,n=270,a=105,o=t?Math.max(28,1.06*Jt(t)*Math.pow(t.length,-.2)):0,l=[];for(let c=0;c<e;c++){const i=c/(e-1)*M,d=t?t.reduce((u,p)=>u+Math.exp(-.5*((i-p)/o)**2),0):Math.exp(-.5*((i-n)/a)**2);l.push({x:i,y:d})}const r=Math.max(...l.map(c=>c.y))||1;return l.map(c=>({x:c.x,y:c.y/r}))}function Jt(s){const e=s.reduce((t,n)=>t+n,0)/s.length;return Math.sqrt(s.reduce((t,n)=>t+(n-e)**2,0)/s.length)||60}const ot=[{name:"Plankton",min:0,max:150,flavor:"Drifting near the surface. The deep is still waiting."},{name:"Schooler",min:151,max:250,flavor:"A steady dive. You held your own with the crowd."},{name:"Rare",min:251,max:350,flavor:"Well past the sunlight. Your instincts run deep."},{name:"Deep Cut",min:351,max:449,flavor:"Down where few divers go. Seriously good pulls."},{name:"Golden Krill",min:450,max:M,flavor:"Legendary. They will tell stories about this dive."}],xt=s=>ot.find(e=>s>=e.min&&s<=e.max)??ot[0];function Xt(s,e,t,n){const a=t.map(o=>o.tier?$[o.tier].emoji:"⬛").join("");return[`GOLDEN KRILL · DIVE #${s}`,`${e}/${M} · ⬇ ${(e*10).toLocaleString("en-US")}m · ${xt(e).name}`,a,n??""].filter(Boolean).join(`
`)}const Qt=(s,e)=>s.filter(t=>!t.replay&&t.dive!==e).map(t=>t.score);function B(s,e,t=4,n=""){const a=Math.max(...s.map(r=>r.length)),o=s.length;let l="";return s.forEach((r,c)=>{[...r].forEach((i,d)=>{const u=e[i];u&&(l+=`<rect x="${d}" y="${c}" width="1.02" height="1.02" fill="${u}"/>`)})}),`<svg class="px ${n}" viewBox="0 0 ${a} ${o}" width="${a*t}" height="${o*t}" shape-rendering="crispEdges" aria-hidden="true">${l}</svg>`}const wt={Plankton:["...aaa...","..a.b.a..",".a.bcb.a.","a.b...b.a","abc.c.cba","a.b...b.a",".a.bcb.a.","..a.b.a..","...aaa..."],"Too Clever":["a.........a","aa.......aa",".ab.d.d.ba.","..abbbbba..",".bbbbbbbbb.","bbabbbbbabb",".b.b...b.b.","b...b.b...b"],Schooler:[".....aaaa....","...aaaaaaa..a","..aadaaaaaaaa",".aaaaabababaa","..aaaaaaaaaaa","...aaaaaaa..a",".....aaaa...."],Rare:["....aa....","...aaaa...","..aaaaaa..","..abaaba..","..aaaaaa..","..adaada..","..aaaaaa..",".a.a..a.a.","a..a..a..a","a.a....a.a",".a......a."],"Deep Cut":["......cc......",".......a......","........a.....","...aaaaaaa....",".aaaaaaaaaa..a","aadaaaaaaaaaaa","aaaaaaaaaaa.ba","cacacaaaaa...a",".aaaaaaa......"],"Golden Krill":["c..............",".c....aaaa.....","..c.aaaaaaaa...","...adaaaaaaaaa.","...aaaaaaaaaaaa","....b.b.b.b.aba","...b.b.b.b...ab","..............a"],Timeout:["..aaaaa..",".a.....a.","a...b...a","a...b...a","a...bbb.a","a.......a",".a.....a.","..aaaaa.."]},$t={Plankton:{a:"#A9C2CF",b:"#6F8B99",c:"#E6FFF2"},"Too Clever":{a:"#FFB347",b:"#E2852A",d:"#04100C"},Schooler:{a:"#7CFFB2",b:"#3FBF7E",d:"#04100C"},Rare:{a:"#FF6B5A",b:"#FFB3A8",d:"#04100C"},"Deep Cut":{a:"#B48CFF",b:"#7A55C9",c:"#FFF3B0",d:"#FFF3B0"},"Golden Krill":{a:"#FFD24A",b:"#FFF0A8",c:"#FFE88A",d:"#04100C"},Timeout:{a:"#5F7A70",b:"#8FA89E"}},O=(s,e=5)=>B(wt[s],$t[s],e,"creature"),St=(s=5)=>B(wt["Golden Krill"],$t["Golden Krill"],s,"logo-krill"),X={menu:B(["aaaaaaa",".......","aaaaaaa",".......","aaaaaaa"],{a:"currentColor"},3),soundOn:B(["...a.....a","..aa..a..a","aaaa...a.a","aaaa...a.a","aaaa...a.a","..aa..a..a","...a.....a"],{a:"currentColor"},3),soundOff:B(["...a......","..aa.a...a","aaaa..a.a.","aaaa...a..","aaaa..a.a.","..aa.a...a","...a......"],{a:"currentColor"},3),gear:B(["..a.a.a..",".aaaaaaa.","aaa...aaa",".aa...aa.","aaa...aaa",".aaaaaaa.","..a.a.a.."],{a:"currentColor"},3)},E=s=>s.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);async function Mt(s){try{return await navigator.clipboard.writeText(s),!0}catch{const e=document.createElement("textarea");e.value=s,e.style.position="fixed",e.style.opacity="0",document.body.appendChild(e),e.select();const t=document.execCommand("copy");return e.remove(),t}}const it=["Golden Krill","Deep Cut","Rare","Schooler","Too Clever","Plankton"],vt=3,kt=(s,e)=>s.text.localeCompare(e.text,void 0,{sensitivity:"base"});function te(s){return it.flatMap(e=>s.answers.filter(t=>t.tier===e).sort(kt))}function Et(s,e){return`
  <div class="recap">
    ${s.map((t,n)=>ee(t,e[n],n)).join("")}
  </div>
  <button class="btn ghost reveal-all" data-reveal-all aria-pressed="false">REVEAL ALL ANSWERS ▼</button>`}function ee(s,e,t){const n=e!=null&&e.tier?$[e.tier]:null;return`
  <div class="recap-row" data-row="${t}" style="--tc:${n?n.color:"#5F7A70"}">
    <button class="recap-head" aria-expanded="false" aria-controls="reveal-${t}">
      <div class="r-top">
        <span class="r-prompt">${E(s.prompt.toUpperCase())}</span>
        <span class="r-pts">${n?`+${n.points}`:"—"}</span>
      </div>
      <div class="r-mid">
        <span class="r-icon">${O((e==null?void 0:e.tier)??"Timeout",2)}</span>
        <span class="r-answer">${e!=null&&e.answer?E(e.answer):"<i>no answer</i>"}</span>
        <span class="r-tier">${n?n.name:""}</span>
        <span class="r-caret" aria-hidden="true">▼</span>
      </div>
    </button>
    <div class="reveal-wrap" id="reveal-${t}" inert>
      <div class="reveal">${se(s,e,t)}</div>
    </div>
  </div>`}function se(s,e,t){const n=s.answers.length,a=(e==null?void 0:e.answer)??null,o=it.map((r,c)=>{const i=s.answers.filter(u=>u.tier===r).sort(kt);if(!i.length)return"";const d=$[r];return`
    <section class="rv-group ${c>=vt?"rv-low":""} ${r==="Golden Krill"?"rv-gk":""}" style="--tc:${d.color};--tg:${d.glow}">
      <header class="rv-head">
        <span class="rv-icon">${O(r,2)}</span>
        <b>${r.toUpperCase()} · ${d.points}</b>
        <span class="rv-count">${i.length} answer${i.length===1?"":"s"}</span>
      </header>
      <div class="chips">
        ${i.map(u=>{const p=u.text===a,g=[u.text,...u.aliases??[]].map(A=>G(A,s.ignoreWords)).join("|");return`<span class="chip${p?" you":""}" data-k="${E(g)}">${E(u.text)}${p?"<i>YOU</i>":""}</span>`}).join("")}
      </div>
    </section>`}).join(""),l=s.answers.filter(r=>it.indexOf(r.tier)>=vt).length;return`
    <div class="rv-top">
      <div class="rv-summary">
        ${a?"":'<div class="rv-you-none">you: —</div>'}
        You found <b>${a?1:0}</b> of <b>${n}</b> answers
      </div>
      <button class="rv-copy" data-copy="${t}" aria-label="Copy the prompt and its 5 rarest answers">⧉ COPY</button>
    </div>
    <label class="rv-search">
      <span class="sr-only">Check an answer</span>
      <input type="search" data-search="${t}" placeholder="would ___ have counted?" autocomplete="off" autocapitalize="off" spellcheck="false" />
    </label>
    <div class="rv-check" aria-live="polite"></div>
    <div class="rv-groups rv-collapsed">${o}</div>
    ${l?`<button class="rv-more" data-more aria-expanded="false">show more ▼ <span>Schooler · Too Clever · Plankton (${l})</span></button>`:""}`}function ae(s,e){const t=te(s).filter(n=>n.tier!=="Too Clever").slice(0,5);return[`GOLDEN KRILL · DIVE #${e}`,`"${s.prompt}": the 5 rarest answers`,...t.map(n=>`${$[n.tier].emoji} ${n.text} (${n.tier})`)].join(`
`)}function Lt(s,e,t){const n=[...s.querySelectorAll(".recap-row")],a=s.querySelector("[data-reveal-all]"),o=(r,c)=>{r.classList.toggle("open",c),r.querySelector(".recap-head").setAttribute("aria-expanded",String(c));const i=r.querySelector(".reveal-wrap");c?i.removeAttribute("inert"):i.setAttribute("inert","")},l=()=>{if(!a)return;const r=n.every(c=>c.classList.contains("open"));a.textContent=r?"HIDE ALL ANSWERS ▲":"REVEAL ALL ANSWERS ▼",a.setAttribute("aria-pressed",String(r))};s.addEventListener("click",async r=>{const c=r.target,i=c.closest(".recap-head");if(i){const p=i.closest(".recap-row");o(p,!p.classList.contains("open")),l();return}if(c.closest("[data-reveal-all]")){const p=!n.every(g=>g.classList.contains("open"));n.forEach(g=>o(g,p)),l();return}const d=c.closest("[data-more]");if(d){const g=d.parentElement.querySelector(".rv-groups").classList.toggle("rv-collapsed")===!1;d.setAttribute("aria-expanded",String(g)),d.firstChild.textContent=g?"show less ▲ ":"show more ▼ ";return}const u=c.closest("[data-copy]");if(u){const p=e[Number(u.dataset.copy)],g=await Mt(ae(p,t));u.textContent=g?"✓ COPIED":"COPY FAILED",setTimeout(()=>u.textContent="⧉ COPY",1600)}}),s.addEventListener("input",r=>{const c=r.target.closest("[data-search]");if(!c)return;const i=c.closest(".reveal"),d=e[Number(c.dataset.search)],u=c.value.trim(),p=G(u,d.ignoreWords),g=i.querySelector(".rv-groups"),A=i.querySelector("[data-more]");g.classList.toggle("rv-searching",!!p),A&&(A.hidden=!!p),i.querySelectorAll(".rv-group").forEach(w=>{let K=!1;w.querySelectorAll(".chip").forEach(P=>{const _=!p||P.dataset.k.split("|").some(et=>et.includes(p));P.hidden=!_,K||(K=_)}),w.hidden=!K});const y=i.querySelector(".rv-check");if(!u){y.innerHTML="",y.className="rv-check";return}const R=yt(u,d);if(R.kind==="exact"){const w=$[R.answer.tier];y.className="rv-check ok",y.innerHTML=`✓ counts as <b style="color:${w.color}">${E(R.answer.text)}</b> · ${w.name} · ${w.points} pts`}else if(R.kind==="near"){const w=$[R.answer.tier];y.className="rv-check near",y.innerHTML=`≈ close to <b style="color:${w.color}">${E(R.answer.text)}</b> (${w.name}). The game would ask you to confirm`}else y.className="rv-check no",y.innerHTML=`✖ "${E(u)}": no echo, wouldn't have counted`})}function ne({session:s,pastScores:e}){const t=s.score,n=xt(t),a=e.length>=nt,o=zt(t,e);return`
  <div class="end-inner">
    <div class="end-head">
      ${St(3)}
      <div class="end-logo">GOLDEN KRILL</div>
    </div>
    <div class="end-title">DIVE #${s.dive} COMPLETE${s.replay?' · <span class="replay-tag">REPLAY · NOT COUNTED</span>':""}</div>

    <div class="big-score"><span class="num" id="end-score">0</span><span class="of">/${M}</span></div>
    <div class="big-depth">-${s.depth.toLocaleString("en-US")}m</div>

    <section class="card">
      <div class="card-label">SCORE CURVE</div>
      ${oe(t,e)}
      <div class="compare">${a?`BETTER THAN <b>${o}%</b> OF YOUR PAST DIVES`:`keep diving to unlock your curve · ${e.length}/${nt} dives`}</div>
    </section>

    <section class="card">
      <div class="card-label">DIVE LOG</div>
      ${ie(s)}
    </section>

    <section class="card">
      <div class="card-label">THE BEARING</div>
      <div class="bearings">
        ${[...ot].reverse().map(l=>`
          <div class="bearing ${l===n?"me":""}" style="--tc:${$[l.name].color}">
            <div class="b-icon">${O(l.name,3)}</div>
            <div class="b-text">
              <div class="b-name">${l.name.toUpperCase()} <span>${l.min}${l.max>=M?"+":"–"+l.max}</span></div>
              <div class="b-flavor">${l.flavor}</div>
            </div>
          </div>`).join("")}
      </div>
    </section>

    <button class="btn primary big-ish" id="copy">COPY RESULT</button>

    <section class="card">
      <div class="card-label">RECAP · tap a prompt to reveal every answer</div>
      ${Et(s.prompts,s.results)}
    </section>

    <div class="end-actions">
      <button class="btn primary big" id="next-dive">NEXT DIVE ▼</button>
      <button class="btn ghost" id="end-log">DIVE LOG</button>
    </div>
  </div>`}function oe(s,e){const o=Zt(e).map(d=>[10+d.x/M*300,98-d.y*80]);let l=`M${o[0][0]},${o[0][1]}`;for(let d=0;d<o.length-1;d++){const u=o[d-1]??o[d],p=o[d],g=o[d+1],A=o[d+2]??g;l+=` C${p[0]+(g[0]-u[0])/6},${p[1]+(g[1]-u[1])/6} ${g[0]-(A[0]-p[0])/6},${g[1]-(A[1]-p[1])/6} ${g[0]},${g[1]}`}const r=98,c=`${l} L${o[o.length-1][0]},${r} L${o[0][0]},${r} Z`,i=10+Math.min(s,M)/M*(320-10*2);return`
  <svg class="curve" viewBox="0 0 320 120" role="img" aria-label="Score distribution with your score marked">
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CFFB2" stop-opacity=".35"/><stop offset="1" stop-color="#7CFFB2" stop-opacity="0"/></linearGradient></defs>
    <path d="${c}" fill="url(#cg)"/>
    <path d="${l}" fill="none" stroke="#7CFFB2" stroke-width="1.5"/>
    <line x1="10" x2="310" y1="${r}" y2="${r}" stroke="#24503f"/>
    ${[0,350,700].map(d=>`<text x="${10+d/M*(320-10*2)}" y="114" text-anchor="middle">${d}</text>`).join("")}
    <line class="you-line" x1="${i}" x2="${i}" y1="12" y2="${r}" stroke="#FF6B5A" stroke-width="2" stroke-dasharray="3 3"/>
    <rect x="${i-17}" y="0" width="34" height="13" rx="2" fill="#FF6B5A"/>
    <text x="${i}" y="10" text-anchor="middle" class="you-text">YOU</text>
  </svg>`}function ie(s){return`
  <div class="divelog">
    <div class="dl-scale"><span>0m</span><span>500m</span><span>1000m</span></div>
    <div class="dl-cols">
      ${s.prompts.map((e,t)=>{const n=s.results[t],a=n!=null&&n.tier?$[n.tier]:null,o=a?a.depth/1e3:0;return`<div class="dl-col" style="--tc:${a?a.color:"#5F7A70"};--f:${o}">
          ${a?`<div class="dl-line"></div><div class="dl-icon">${O(a.name,2)}</div>`:'<div class="dl-none">—</div>'}
          <div class="dl-n">${t+1}</div>
        </div>`}).join("")}
    </div>
  </div>`}const At=s=>new Date(s).toLocaleDateString(void 0,{month:"short",day:"numeric"});function re(s,e,t){const n=[...s].sort((r,c)=>c.dive-r.dive),a=s.map(r=>r.score),o=a.length?Math.round(a.reduce((r,c)=>r+c,0)/a.length):0,l=a.length?Math.max(...a):0;return`
  <div class="end-inner">
    <div class="log-head">
      <button class="btn ghost small" id="log-back">◀ BACK</button>
      <div class="end-title">DIVE LOG</div>
      <span></span>
    </div>
    <div class="log-stats">
      <div><b>${s.length}</b><span>DIVES</span></div>
      <div><b>${o}</b><span>AVERAGE</span></div>
      <div><b>${l}</b><span>BEST</span></div>
    </div>
    <div class="log-note">next dive: <b>#${e}</b> of ${t} · tap a dive to see every answer · replays never change your stats</div>
    ${n.length?"":'<div class="log-empty">No dives yet. Your first descent awaits.</div>'}
    <div class="log-list">
      ${n.map(r=>`
        <div class="log-row">
          <button class="log-open" data-open="${r.dive}" aria-label="Open dive ${r.dive} recap">
            <span class="l-num">#${r.dive}</span>
            <span class="l-mid">
              <span class="l-emoji">${r.results.map(c=>c.tier?$[c.tier].emoji:"⬛").join("")}</span>
              <span class="l-meta">${At(r.playedAt)} · -${r.depth.toLocaleString("en-US")}m</span>
            </span>
            <span class="l-score">${r.score}<span>/${M}</span></span>
          </button>
          <button class="btn ghost small" data-replay="${r.dive}" aria-label="Replay dive ${r.dive}">↻</button>
        </div>`).join("")}
    </div>
  </div>`}function le(s,e){return`
  <div class="end-inner">
    <div class="log-head">
      <button class="btn ghost small" id="detail-back">◀ LOG</button>
      <div class="end-title">DIVE #${s.dive}</div>
      <button class="btn ghost small" data-replay="${s.dive}">↻ REPLAY</button>
    </div>
    <div class="big-score compact"><span class="num">${s.score}</span><span class="of">/${M}</span></div>
    <div class="big-depth">-${s.depth.toLocaleString("en-US")}m · ${At(s.playedAt)}</div>
    <section class="card">
      <div class="card-label">RECAP · tap a prompt to reveal every answer</div>
      ${Et(e,s.results)}
    </section>
  </div>`}class ce{constructor(){this.ctx=null,this.enabled=localStorage.getItem("gk.sound")==="on"}toggle(){return this.enabled=!this.enabled,localStorage.setItem("gk.sound",this.enabled?"on":"off"),this.enabled&&this.ac(),this.enabled}ac(){return this.ctx||(this.ctx=new AudioContext),this.ctx.state==="suspended"&&this.ctx.resume(),this.ctx}tone(e,t,n,a,o,l="sine"){const r=this.ac(),c=r.currentTime+n,i=r.createOscillator(),d=r.createGain();i.type=l,i.frequency.setValueAtTime(e,c),i.frequency.exponentialRampToValueAtTime(t,c+a),d.gain.setValueAtTime(1e-4,c),d.gain.exponentialRampToValueAtTime(o,c+.012),d.gain.exponentialRampToValueAtTime(1e-4,c+a),i.connect(d).connect(r.destination),i.start(c),i.stop(c+a+.05)}ping(){this.enabled&&(this.tone(1320,1180,0,.9,.12),this.tone(1320,1180,.22,.7,.04))}bubble(){if(!this.enabled)return;const e=380+Math.random()*260;this.tone(e,e*2.2,0,.09,.07)}chime(e){if(!this.enabled)return;const t=523.25*Math.pow(2,e/12);[0,4,7,e>=4?12:7].forEach((n,a)=>this.tone(t*Math.pow(2,n/12),t*Math.pow(2,n/12),a*.09,.8,.07,"triangle"))}thud(){this.enabled&&this.tone(160,70,0,.5,.12,"sine")}}const L=new ce,h=s=>document.querySelector(s),de=matchMedia("(prefers-reduced-motion: reduce)"),j=()=>de.matches||localStorage.getItem("gk.reduceMotion")==="on",Tt=()=>document.documentElement.classList.toggle("reduce-motion",j());Tt();const J=s=>new Promise(e=>setTimeout(e,j()?Math.min(s,150):s)),k=new _t(localStorage),rt=new Kt(localStorage);h("#app").innerHTML=`
  <canvas id="scene"></canvas>
  <canvas id="overlay"></canvas>
  <div class="bezel" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="scan" aria-hidden="true"></div>

  <header class="topbar">
    <button class="icon-btn" id="menu" aria-label="Menu">${X.menu}</button>
    <div class="spacer"></div>
    <button class="icon-btn" id="sound" aria-label="Toggle sound"></button>
    <button class="icon-btn" id="settings" aria-label="Settings">${X.gear}</button>
  </header>

  <section id="start" class="screen">
    <div class="logo-wrap">
      ${St(6)}
      <h1 class="logo" data-text="GOLDEN KRILL">GOLDEN KRILL</h1>
      <div class="subtitle">A RARITY DIVE</div>
    </div>
    <p class="tagline">7 prompts · 25 seconds each · rarer answers sink deeper</p>
    <button id="begin" class="btn primary big" disabled>LOADING…</button>
    <div class="dive-no" id="dive-no"></div>
    <button class="link" id="open-log">open dive log →</button>
  </section>

  <div id="hud" class="hud hidden">
    <div class="hud-box"><span class="hud-label">DEPTH</span><span id="hud-depth" class="hud-depth">0m</span></div>
    <div class="hud-mid">
      <div class="squares">${Array.from({length:H},()=>"<i></i>").join("")}</div>
      <div id="hud-prompt" class="hud-label">PROMPT 1 OF 7</div>
    </div>
    <div class="hud-box right"><span class="hud-label">SCORE</span><span id="hud-score" class="hud-score">0</span></div>
  </div>

  <section id="prompt" class="panel prompt-panel hidden">
    <div class="eyebrow" id="prompt-eyebrow"></div>
    <h2 id="prompt-text"></h2>
    <div class="hint">▼ rarer answers sink deeper ▼</div>
  </section>

  <div id="pill" class="pill hidden">descending · the clock starts in <b id="pill-n">3</b></div>
  <div id="tag" class="tag hidden"><span id="tag-text"></span></div>
  <section id="result" class="panel result hidden" aria-live="polite"></section>

  <form id="bar" class="inputbar hidden" autocomplete="off">
    <div id="msg" class="msg" aria-live="polite"></div>
    <div class="bar-row">
      <div class="ring">
        <svg viewBox="0 0 48 48"><circle class="ring-bg" cx="24" cy="24" r="20"/><circle id="ring-fg" class="ring-fg" cx="24" cy="24" r="20"/></svg>
        <span id="ring-n">25</span>
      </div>
      <input id="answer" type="text" placeholder="type one answer…" enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="60" aria-label="Your answer" />
      <button class="btn primary" id="dive" type="submit">DIVE</button>
    </div>
    <div class="drain"><i id="drain"></i></div>
  </form>

  <section id="end" class="sheet hidden"></section>
  <section id="log" class="sheet hidden"></section>

  <div id="drawer" class="drawer hidden">
    <nav class="panel drawer-panel">
      <div class="card-label">GOLDEN KRILL</div>
      <button class="drawer-item" data-go="how">How to play</button>
      <button class="drawer-item" data-go="log">Dive log</button>
      <button class="drawer-item" data-go="settings">Settings</button>
      <button class="drawer-item" data-go="close">Close</button>
    </nav>
  </div>

  <div id="modal" class="modal hidden"><div class="panel modal-panel" id="modal-body"></div></div>
`;const v=new Gt(h("#scene"),h("#overlay"));v.reduced=j();let C;async function he(){const s="./",[e,t]=await Promise.all([fetch(`${s}data/questions.json`).then(n=>n.json()),fetch(`${s}data/dives.json`).then(n=>n.json())]);return{prompts:Object.fromEntries(e.map(n=>[n.id,n])),dives:t}}const Ct=h("#sound"),ct=()=>Ct.innerHTML=L.enabled?X.soundOn:X.soundOff;ct();Ct.onclick=()=>{L.toggle(),ct(),L.ping()};h("#menu").onclick=()=>m("#drawer");h("#settings").onclick=()=>Ft();h("#drawer").onclick=s=>{var t;const e=(t=s.target.closest("[data-go]"))==null?void 0:t.dataset.go;(s.target===h("#drawer")||e)&&m("#drawer",!1),e==="how"&&ue(),e==="log"&&ut(),e==="settings"&&Ft()};h("#modal").onclick=s=>{s.target===h("#modal")&&m("#modal",!1)};function Rt(s){h("#modal-body").innerHTML=s+'<div class="row"><button class="btn ghost" id="modal-close">CLOSE</button></div>',m("#modal"),h("#modal-close").onclick=()=>m("#modal",!1)}function ue(){Rt(`
    <div class="card-label">HOW TO PLAY</div>
    <p>Each dive has <b>7 prompts</b> like “Name a type of cheese”. You get <b>25 seconds</b> and <b>one answer</b> each.</p>
    <p>Common answers barely sink. Rare ones plunge. Your score × 10 is your depth in metres.</p>
    <div class="how-tiers">${Y.map(s=>`<div style="--tc:${s.color}">${O(s.name,2)}<b>${s.name}</b><span>${s.points} pts</span></div>`).join("")}</div>
    <p class="muted">Too Clever = technically right, but a loophole. Every prompt hides exactly one Golden Krill.</p>`)}function Ft(){Rt(`
    <div class="card-label">SETTINGS</div>
    <label class="toggle"><input type="checkbox" id="set-sound" ${L.enabled?"checked":""}/> Sound effects</label>
    <label class="toggle"><input type="checkbox" id="set-motion" ${localStorage.getItem("gk.reduceMotion")==="on"?"checked":""}/> Reduce motion</label>
    <button class="btn ghost small danger" id="set-reset">RESET ALL PROGRESS</button>`),h("#set-sound").onchange=()=>{L.toggle(),ct()},h("#set-motion").onchange=e=>{localStorage.setItem("gk.reduceMotion",e.target.checked?"on":"off"),v.reduced=j(),Tt()};let s=!1;h("#set-reset").onclick=()=>{if(!s){s=!0,h("#set-reset").textContent="TAP AGAIN TO ERASE EVERYTHING";return}k.reset(),m("#modal",!1),tt(),dt("Progress erased")}}function dt(s){const e=document.createElement("div");e.className="toast",e.textContent=s,document.body.appendChild(e),setTimeout(()=>e.remove(),2200)}const V=window.visualViewport;if(V){const s=()=>document.documentElement.style.setProperty("--kb",`${Math.max(0,innerHeight-V.height-V.offsetTop)}px`);V.addEventListener("resize",s),V.addEventListener("scroll",s)}const m=(s,e=!0)=>h(s).classList.toggle("hidden",!e);function tt(){I=!1,f=null,["#hud","#prompt","#bar","#result","#end","#log","#pill"].forEach(o=>m(o,!1)),h("#tag").className="tag hidden",v.lines=[],v.you=0,v.follow=0,m("#start");const s=k.nextDive,e=k.loadLive(),t=C?lt(C):0,n=h("#begin");if(C&&s>t){n.disabled=!0,n.textContent="ALL DIVES DONE",h("#dive-no").innerHTML=`you've finished all ${t} dives · new ones: <code>npm run generate</code>`;return}n.disabled=!C;const a=e&&e.dive===s&&e.results.length>0&&e.results.length<H;n.textContent=a?"▼ RESUME DESCENT ▼":"▼ BEGIN DESCENT ▼",h("#dive-no").textContent=a?`DIVE #${s} · PROMPT ${e.results.length+1} OF 7`:`DIVE #${s}`}h("#begin").onclick=()=>{L.ping();const s=k.nextDive,e=k.loadLive();ht(s,!1,e&&e.dive===s?e.results:[])};h("#open-log").onclick=()=>void ut();let f=null,Dt=0,I=!1;function ht(s,e,t=[]){try{f=new Ut(s,C,e,t)}catch(n){dt(String(n.message));return}["#start","#end","#log"].forEach(n=>m(n,!1)),m("#hud"),v.you=f.depth,v.follow=f.depth,U(f.depth),Ot()}function U(s){f&&(h("#hud-depth").textContent=`${Math.round(s).toLocaleString("en-US")}m`,h("#hud-score").textContent=String(f.score),document.querySelectorAll(".squares i").forEach((e,t)=>{const n=f.results[t];e.className=n?"done":t===f.index?"cur":"",e.style.setProperty("--tc",n!=null&&n.tier?$[n.tier].color:"#5F7A70")}),h("#hud-prompt").textContent=`PROMPT ${Math.min(f.index+1,H)} OF ${H}${f.replay?" · REPLAY":""}`)}async function Ot(){const s=f,e=s.current;v.lines=[],v.follow=s.depth,U(s.depth),h("#tag").className="tag hidden",m("#result",!1),h("#prompt-eyebrow").textContent=`PROMPT ${s.index+1} OF ${H}`,h("#prompt-text").textContent=e.prompt,h("#prompt").classList.remove("away"),m("#prompt"),m("#pill");for(const n of[3,2,1])if(h("#pill-n").textContent=`${n}…`,await J(650),f!==s)return;m("#pill",!1);const t=h("#answer");t.value="",Q(""),m("#bar"),h("#bar").classList.remove("down","urgent"),t.focus(),Dt=performance.now()+bt*1e3,I=!0,requestAnimationFrame(It)}function It(s){if(!I||!f)return;const e=Math.max(0,(Dt-s)/1e3),t=e/bt;h("#ring-n").textContent=String(Math.ceil(e));const n=2*Math.PI*20,a=h("#ring-fg");if(a.style.strokeDasharray=`${n}`,a.style.strokeDashoffset=`${n*(1-t)}`,h("#drain").style.transform=`scaleX(${t})`,h("#bar").classList.toggle("urgent",e<=5),e<=0){I=!1;const o=f.depth;f.timeout(),Pt(),Nt(null,o);return}requestAnimationFrame(It)}function Q(s,e=""){const t=h("#msg");t.className=`msg ${e}`,t.innerHTML=s}h("#bar").onsubmit=s=>{if(s.preventDefault(),!I||!f)return;const e=h("#answer"),t=e.value.trim();if(!t)return;const n=f.depth,a=f.submit(t);if(a.kind==="accepted")I=!1,L.ping(),Pt(),Nt(a.answer,n);else if(a.kind==="confirm")Q(`"${E(t)}" → "<b>${E(a.suggestion.text)}</b>" · submit again to confirm · or edit`,"near"),e.value=a.suggestion.text,e.select();else{Q(`"${E(t)}": no echo, try again`,"reject");const o=h("#bar");o.classList.remove("shake"),o.offsetWidth,o.classList.add("shake")}};function Pt(){!f||f.replay||k.saveLive(f.done?null:{dive:f.dive,results:f.results})}async function Nt(s,e){const t=f;if(h("#answer").blur(),h("#bar").classList.add("down"),h("#prompt").classList.add("away"),Q(""),!s){L.thud(),await J(380),m("#bar",!1),m("#prompt",!1),U(t.depth),gt(null,null);return}const n=$[s.tier],a=e+n.depth;v.lines=Y.map(l=>({depth:e+l.depth,label:`${l.name.toUpperCase()} · ${l.points}`,color:l.color,state:"idle"}));const o=h("#tag");h("#tag-text").textContent=s.text.toUpperCase(),o.style.setProperty("--tc","#FF6B5A"),o.style.transform="translate(-50%, 0)",o.className="tag drop",await J(460),m("#bar",!1),m("#prompt",!1),await pe(e,a,o),v.lines.forEach(l=>l.state=l.depth===a?"lit":"dim"),o.style.setProperty("--tc",n.color),o.classList.add("landed"),L.chime(Y.indexOf(n)),U(a),await J(700),gt(s,n)}function pe(s,e,t){if(j())return v.you=e,v.follow=e,v.cam=e,t.style.transform="translate(-50%, 0)",Promise.resolve();const n=e-s,a=900+Math.sqrt(n)*55,o=6.5,l=.62;let r=s,c=0,i=performance.now(),d=i,u=0;const p=new Set;return new Promise(g=>{const A=y=>{const R=Math.min(.034,(y-i)/1e3);i=y;const w=Math.min(1,(y-d)/a),K=s+n*(.5-.5*Math.cos(Math.PI*w));c+=(o*o*(K-r)-2*l*o*c)*R,r+=c*R,v.you=r,v.follow=r,U(Math.min(Math.max(r,s),e));const P=Math.min(1,Math.abs(c)/500),_=v.screenY(r)-v.anchorY,et=Math.sin((y-d)/260)*10*(.25+P),Bt=Math.sin((y-d)/340)*5*(.3+P);if(t.style.transform=`translate(calc(-50% + ${et.toFixed(1)}px), ${_.toFixed(1)}px) rotate(${Bt.toFixed(2)}deg)`,y-u>70){u=y;const S=t.getBoundingClientRect();v.burst(S.left+S.width/2+(Math.random()-.5)*S.width*.6,S.top,P>.2?2:1)}for(const S of v.lines)S.depth<e&&r>=S.depth&&!p.has(S.depth)&&(p.add(S.depth),S.state="passed",S.pulseAt=y,L.bubble());if(!(w>=1&&Math.abs(r-e)<.6&&Math.abs(c)<4)){requestAnimationFrame(A);return}v.you=e,v.follow=e,t.style.transition="transform .35s ease-out",t.style.transform="translate(-50%, 0) rotate(0deg)",setTimeout(()=>t.style.transition="",380),g()};requestAnimationFrame(A)})}function gt(s,e){const t=f,n=h("#result");n.style.setProperty("--tc",e?e.color:"#7FA595"),n.style.setProperty("--tg",e?e.glow:"rgba(127,165,149,.3)"),n.classList.toggle("timeout",!e),n.innerHTML=(e&&s?`<div class="creature-wrap">${O(e.name,6)}</div>
       <div class="tier-name">${e.name.toUpperCase()}</div>
       <div class="your">“${E(s.text)}”</div>
       <div class="pts">+${e.points} PTS · sink ${e.depth}m</div>
       <p class="flavor">${e.flavor}</p>`:`<div class="creature-wrap">${O("Timeout",6)}</div>
       <div class="tier-name">NO SIGNAL</div>
       <div class="pts">+0 PTS</div>
       <p class="flavor">the clock ran out before the ping.</p>`)+`<button class="btn primary" id="next">${t.done?"SURFACE ▲":"DESCEND ▼"}</button>`,m("#result"),n.classList.remove("pop"),n.offsetWidth,n.classList.add("pop");const a=h("#next");a.focus({preventScroll:!0}),a.onclick=()=>t.done?void fe():void Ot()}async function fe(){const s=f,e={dive:s.dive,score:s.score,depth:s.depth,results:s.results,playedAt:new Date().toISOString(),replay:s.replay};s.replay||(await rt.save(e),k.nextDive=Math.max(k.nextDive,s.dive+1),k.saveLive(null));const t=Qt(await rt.personal(),s.dive);["#hud","#result"].forEach(a=>m(a,!1)),h("#tag").className="tag hidden",v.lines=[];const n=h("#end");n.innerHTML=ne({session:s,pastScores:t}),n.scrollTop=0,m("#end"),me(h("#end-score"),s.score),Lt(n,s.prompts,s.dive),h("#copy").onclick=async()=>{const a=location.href.split("#")[0].split("?")[0],o=await Mt(Xt(s.dive,s.score,s.results,a));h("#copy").textContent=o?"COPIED ✓":"COPY FAILED",setTimeout(()=>h("#copy").textContent="COPY RESULT",1800)},h("#next-dive").onclick=()=>{const a=k.nextDive;if(a>lt(C)){tt();return}L.ping(),ht(a,!1)},h("#end-log").onclick=()=>void ut()}function me(s,e){if(j()){s.textContent=String(e);return}const t=performance.now(),n=900,a=o=>{const l=Math.min(1,(o-t)/n);s.textContent=String(Math.round(e*(1-Math.pow(1-l,3)))),l<1&&requestAnimationFrame(a)};requestAnimationFrame(a)}async function ut(){if(!C)return;if(f&&!f.done){dt("Finish your dive first. The log reveals answers.");return}const s=(await rt.personal()).filter(o=>!o.replay),e=h("#log"),t=o=>{I=!1,["#end","#result","#log"].forEach(l=>m(l,!1)),ht(o,!0)},n=()=>{e.innerHTML=re(s,k.nextDive,lt(C)),e.scrollTop=0,h("#log-back").onclick=()=>m("#log",!1),e.querySelectorAll("[data-replay]").forEach(o=>o.onclick=()=>t(Number(o.dataset.replay))),e.querySelectorAll("[data-open]").forEach(o=>o.onclick=()=>a(Number(o.dataset.open)))},a=o=>{const l=s.find(c=>c.dive===o);if(!l)return;const r=l.results.map(c=>C.prompts[c.promptId]).filter(Boolean);e.innerHTML=le(l,r),e.scrollTop=0,h("#detail-back").onclick=n,e.querySelector("[data-replay]").onclick=()=>t(o),Lt(e,r,o)};n(),m("#log")}tt();he().then(s=>{C=s,tt()}).catch(()=>{h("#begin").textContent="BANK MISSING",h("#dive-no").textContent="run: npm run build-dives"});
