"use client";
import { useState,useTransition, type ReactNode } from "react";
import Link from "next/link";
import { askInsura,type InsuraAnswer } from "./actions";
const suggestions=["Se faccio un incidente in Italia, cosa copre la mia auto?","Se mi rubano il telefono, sono assicurato?","Quali franchigie risultano dalle mie polizze?","Cosa succede se ho bisogno di cure all'estero?"];

function formatInline(text:string):ReactNode[]{
  return text.split(/(\\*\\*[^*]+\\*\\*|\\[F\\d+\\])/g).filter(Boolean).map((part,i)=>{
    if(part.startsWith("**")&&part.endsWith("**"))return <strong key={i} className="font-semibold text-[#142449]">{part.slice(2,-2)}</strong>;
    if(/^\\[F\\d+\\]$/.test(part))return <span key={i} className="whitespace-nowrap text-[12px] font-semibold text-[#3157eb]">{part}</span>;
    return part;
  });
}
function ReadableAnswer({answer}:{answer:string}){
  const lines=answer.replace(/\\r/g,"").split("\\n");
  const blocks:{kind:"heading"|"text"|"list";value:string}[]=[];
  for(const line of lines){
    const value=line.trim();
    if(!value)continue;
    if(/^#{1,4}\\s+/.test(value))blocks.push({kind:"heading",value:value.replace(/^#{1,4}\\s+/,"")});
    else if(/^(?:[-*]\\s+|\\d+[.)]\\s+)/.test(value))blocks.push({kind:"list",value:value.replace(/^(?:[-*]\\s+|\\d+[.)]\\s+)/,"")});
    else blocks.push({kind:"text",value});
  }
  return <div className="mt-4 space-y-3 text-[14px] leading-[1.75] text-[#34435f]">{blocks.map((block,i)=>
    block.kind==="heading"?<h3 key={i} className="pt-2 text-[15px] font-bold leading-6 text-[#101e3c]">{formatInline(block.value)}</h3>:
    block.kind==="list"?<div key={i} className="flex items-start gap-2.5 pl-1"><span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#3157eb]"/><p className="min-w-0">{formatInline(block.value)}</p></div>:
    <p key={i}>{formatInline(block.value)}</p>
  )}</div>;
}

export function InsuraChat(){
 const [question,setQuestion]=useState("");const [history,setHistory]=useState<Array<{role:"user"|"assistant";content:string}>>([]);const [result,setResult]=useState<InsuraAnswer|null>(null);const [error,setError]=useState("");const [pending,start]=useTransition();
 function submit(q:string){if(!q.trim()||pending)return;setQuestion(q);setError("");start(async()=>{const r=await askInsura(q,history);if(r.ok&&r.data){setResult(r.data);setHistory(prev=>[...prev,{role:"user",content:q},{role:"assistant",content:r.data!.answer}].slice(-12));}else setError(r.error||"Risposta non disponibile.");});}
 return <div className="space-y-5"><form onSubmit={e=>{e.preventDefault();submit(question);}} className="rounded-[24px] border border-[#e5eaf3] bg-white p-5 shadow-sm"><label htmlFor="insura-question" className="text-[13px] font-bold text-[#101e3c]">La tua domanda</label><textarea id="insura-question" rows={4} maxLength={1200} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Es. Se mi rubano la bicicletta fuori casa, sono coperto?" className="mt-3 w-full resize-y rounded-[16px] border border-[#dce4f1] bg-[#f5f7fc] p-4 text-[14px] text-[#101e3c] outline-none focus:border-[#3157eb]"/><button disabled={pending||question.trim().length<8} className="mt-3 w-full rounded-[16px] bg-[#3157eb] px-5 py-3.5 text-[14px] font-bold text-white disabled:opacity-50">{pending?"Sto cercando nelle polizze e nelle CGA…":"Chiedi a INSURA"}</button><p className="mt-3 text-[11px] text-[#71809a]">Puoi fare domande successive: INSURA tiene conto della conversazione. Verifica sempre le condizioni della tua polizza.</p></form><section><h2 className="mb-3 text-[14px] font-bold text-[#101e3c]">Domande frequenti</h2><div className="grid gap-2">{suggestions.map(s=><button key={s} disabled={pending} onClick={()=>submit(s)} className="rounded-[15px] border border-[#e5eaf3] bg-white px-4 py-3 text-left text-[13px] text-[#29446d] disabled:opacity-50">{s} →</button>)}</div></section>{error?<p role="alert" className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700">{error}</p>:null}{history.length>0?<div className="rounded-2xl border border-[#e5eaf3] bg-white px-4 py-3"><p className="text-xs font-semibold text-[#62718c]">Conversazione attiva · {Math.ceil(history.length/2)} domande</p><button type="button" onClick={()=>{setHistory([]);setResult(null);setQuestion("");}} className="mt-2 text-xs font-semibold text-[#3157eb]">Nuova conversazione</button></div>:null}{result?<article className="rounded-[22px] border border-[#dce6ff] bg-white p-5"><h2 className="text-[18px] font-extrabold text-[#101e3c]">Risposta INSURA</h2><ReadableAnswer answer={result.answer}/><p className="mt-4 text-[12px] text-[#687a99]">{result.notice}</p><details className="mt-4 border-t border-[#e5eaf3] pt-4"><summary className="cursor-pointer text-[13px] font-bold">Fonti consultate ({result.sources.length})</summary><div className="mt-3 space-y-3">{result.sources.map((s,i)=><div key={i} className="rounded-xl bg-[#f5f7fc] p-3"><Link href={s.href} className="text-[12px] font-bold text-[#3157eb]">[F{i+1}] {s.name} →</Link><p className="mt-1 line-clamp-3 text-[11px] text-[#71809a]">{s.excerpt}</p></div>)}</div></details></article>:null}</div>;
}
