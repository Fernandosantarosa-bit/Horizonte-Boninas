import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Mail, LockKeyhole, UserRound, ArrowRight, ShieldCheck } from "lucide-react";
type Props={onSuccess:()=>void};
export default function PassengerAccess({onSuccess}:Props){
 const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[name,setName]=useState("");const[mode,setMode]=useState<"login"|"signup">("login");const[loading,setLoading]=useState(false);const[error,setError]=useState("");const[notice,setNotice]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");setNotice("");
  if(mode==="signup"){const r=await supabase.auth.signUp({email,password,options:{data:{full_name:name,role:"passenger"}}});if(r.error)setError(r.error.message);else{setNotice("Conta criada. Verifique o seu e-mail para confirmar o acesso.");setMode("login")}}
  else{const r=await supabase.auth.signInWithPassword({email,password});if(r.error)setError(r.error.message);else onSuccess()}
  setLoading(false);
 }
 return <div className="hb-access"><div className="hb-access-brand"><div className="hb-access-logo"><img src="/horizonte-boninas-logo.svg" alt="Horizonte Boninas"/></div><span>TRANSPORTE PERSONALIZADO</span><h2>{mode==="login"?"Bem-vindo de volta":"Crie a sua conta"}</h2><p>{mode==="login"?"Entre para pedir e acompanhar a sua viagem.":"Crie a sua conta para começar a viajar."}</p></div>
 <form onSubmit={submit}><div className="hb-access-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Entrar</button><button type="button" className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>Criar conta</button></div>
 {mode==="signup"&&<label><UserRound size={16}/><input placeholder="Nome completo" value={name} onChange={e=>setName(e.target.value)} required/></label>}
 <label><Mail size={16}/><input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
 <label><LockKeyhole size={16}/><input type="password" placeholder="Palavra-passe" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/></label>
 {error&&<div className="hb-access-error">{error}</div>}{notice&&<div className="hb-access-notice">{notice}</div>}
 <button className="hb-access-submit" disabled={loading}>{loading?"A processar...":mode==="login"?"Entrar":"Criar conta"}<ArrowRight size={17}/></button>
 <small><ShieldCheck size={13}/> A sua sessão é protegida por autenticação segura.</small></form></div>
}