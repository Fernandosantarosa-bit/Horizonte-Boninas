import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Route = { id:string; origin:string; destination:string; base_fare:number; estimated_minutes:number };
type Trip = { id:string; origin:string; destination:string; status:string; fare:number|null; payment_method:string; scheduled_at:string|null };

export default function PassengerDashboard(){
  const [routes,setRoutes]=useState<Route[]>([]);
  const [trips,setTrips]=useState<Trip[]>([]);
  const [origin,setOrigin]=useState("");
  const [destination,setDestination]=useState("");
  const [payment,setPayment]=useState("cash");
  const [scheduled,setScheduled]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function load(){
    const {data:session}=await supabase.auth.getSession();
    const uid=session.session?.user.id;
    if(!uid) return;
    const [r,t]=await Promise.all([
      supabase.from("routes").select("id,origin,destination,base_fare,estimated_minutes").eq("active",true).order("origin"),
      supabase.from("trips").select("id,origin,destination,status,fare,payment_method,scheduled_at").eq("passenger_id",uid).order("created_at",{ascending:false}).limit(10)
    ]);
    if(r.data) setRoutes(r.data);
    if(t.data) setTrips(t.data);
  }

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    const channel=supabase.channel("passenger-trip-updates")
      .on("postgres_changes",{event:"*",schema:"public",table:"trips"},()=>load())
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[]);

  async function requestTrip(e:React.FormEvent){
    e.preventDefault(); setMessage("");
    const {data:session}=await supabase.auth.getSession();
    const uid=session.session?.user.id;
    if(!uid || !origin || !destination){ setMessage("Selecione a origem e o destino."); return; }
    setLoading(true);
    const route=routes.find(x=>x.origin===origin && x.destination===destination);
    const result=await supabase.from("trips").insert({
      passenger_id:uid, route_id:route?.id ?? null, origin, destination,
      fare:route?.base_fare ?? null, payment_method:payment,
      scheduled_at:scheduled ? new Date(scheduled).toISOString() : null,
      status:"requested"
    }).select("id").single();
    setLoading(false);
    if(result.error) setMessage(result.error.message);
    else { setMessage("Pedido de viagem enviado. Estamos a procurar um motorista."); setOrigin(""); setDestination(""); setScheduled(""); await load(); }
  }

  const availableOrigins=[...new Set(routes.map(r=>r.origin))];
  const availableDestinations=[...new Set(routes.map(r=>r.destination))];
  const selectedRoute=routes.find(r=>r.origin===origin && r.destination===destination);

  return <section className="dashboard-section">
    <div className="section-heading"><span>Área do passageiro</span><h2>Solicite a sua viagem</h2><p>Escolha uma rota e acompanhe o pedido em tempo real.</p></div>
    <div className="dashboard-grid">
      <form className="booking-card" onSubmit={requestTrip}>
        <label>Origem<select value={origin} onChange={e=>setOrigin(e.target.value)} required><option value="">Selecionar</option>{availableOrigins.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Destino<select value={destination} onChange={e=>setDestination(e.target.value)} required><option value="">Selecionar</option>{availableDestinations.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Data e hora (opcional)<input type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)} /></label>
        <label>Pagamento<select value={payment} onChange={e=>setPayment(e.target.value)}><option value="cash">Numerário</option><option value="multicaixa">Multicaixa</option><option value="bank_transfer">Transferência bancária</option><option value="wallet">Carteira digital</option></select></label>
        {selectedRoute && <div className="fare-preview">Tarifa configurada: <strong>{Number(selectedRoute.base_fare).toLocaleString("pt-AO")} Kz</strong> · ~{selectedRoute.estimated_minutes} min</div>}
        {message && <div className="status-message">{message}</div>}
        <button type="submit" disabled={loading}>{loading ? "A solicitar..." : "Solicitar viagem"}</button>
      </form>
      <div className="trip-list"><h3>Minhas viagens</h3>{trips.length===0 ? <p>Ainda não existem viagens.</p> : trips.map(t=><article className="trip-item" key={t.id}><div><strong>{t.origin} → {t.destination}</strong><span>{t.status}</span></div><small>{t.fare ? Number(t.fare).toLocaleString("pt-AO")+" Kz" : "Tarifa pendente"} · {t.payment_method}</small></article>)}</div>
    </div>
  </section>;
}
