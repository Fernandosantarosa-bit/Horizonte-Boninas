import { useState } from "react";
import { supabase } from "../lib/supabase";

type Props = { onSuccess: () => void };

export default function PassengerAccess({ onSuccess }: Props) {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setError("");
    const result = await supabase.auth.signInWithPassword({ email, password });
    if(result.error) setError(result.error.message);
    else onSuccess();
    setLoading(false);
  }

  return <form onSubmit={handleSubmit} className="access-card">
    <h2>Entrar no Horizonte Boninas</h2>
    <p>Aceda à sua área de passageiro.</p>
    <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required />
    <input type="password" placeholder="Palavra-passe" value={password} onChange={e=>setPassword(e.target.value)} required />
    {error && <div className="error-message">{error}</div>}
    <button type="submit" disabled={loading}>{loading ? "A entrar..." : "Entrar"}</button>
  </form>;
}
