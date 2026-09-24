import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Stats={passengers:number;drivers:number;trips:number;activeTrips:number};
type Trip={id:string;origin:string;destination:string;status:string;fare:number|null;payment_status:string;created_at:string};

export default function AdminDashboard(){
  const [stats,setStats]=useState<Stats>({passengers:0,drivers:0,trips:0,activeTrips:0});
  const [trips,setTrips]=useState<Trip[]>([]);
  const [message,setMessage]=useState("");

  async function load(){
    const [p,d,t,a]=await Promise.all([
      supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","passenger"),
      supabase.from("drivers").select("id",{count:"exact",head:true}),
      supabase.from("trips").select("id",{count:"exact",head:true}),
      supabase.from("trips").select("id",{count:"exact",head:true}).in("status",["requested","accepted","driver_arriving","in_progress"])
    ]);
    setStats({passengers:p.count||0,drivers:d.count||0,trips:t.count||0,activeTrips:a.count||0});
    const recent=await supabase.from("trips").select("id,origin,destination,status,fare,payment_status,created_at").order("created_at",{ascending:false}).limit(20);
    if(recent.error)setMessage(recent.error.message);else setTrips(recent.data||[]);
  }

  useEffect(()=>{load();const c=supabase.channel("admin-trip-feed").on("postgres_changes",{event:"*",schema:"public",table:"trips"},()=>load()).subscribe();return()=>{supabase.removeChannel(c)}},[]);

  async function cancelTrip(id:string){
    const {error}=await supabase.from("trips").update({status:"cancelled"}).eq("id",id);
    if(error)setMessage(error.message);else{setMessage("Viagem cancelada.");load();}
  }

  return <section className="dashboard-section">
    <div className="section-heading"><span>Gestão</span><h2>Painel Administrativo</h2><p>Visão operacional da Horizonte Boninas.</p></div>
    <div className="stats-grid">
      <div className="stat-card"><strong>{stats.passengers}</strong><span>Passageiros</span></div>
      <div className="stat-card"><strong>{stats.drivers}</strong><span>Motoristas</span></div>
      <div className="stat-card"><strong>{stats.trips}</strong><span>Viagens</span></div>
      <div className="stat-card"><strong>{stats.activeTrips}</strong><span>Viagens ativas</span></div>
    </div>
    {message&&<div className="status-message">{message}</div>}
    <div className="trip-list"><h3>Viagens recentes</h3>{trips.map(t=><article className="trip-item" key={t.id}><div><strong>{t.origin} → {t.destination}</strong><span>{t.status}</span></div><small>{t.fare?Number(t.fare).toLocaleString("pt-AO")+" Kz":"Tarifa pendente"} · pagamento: {t.payment_status}</small>{["requested","accepted","driver_arriving","in_progress"].includes(t.status)&&<div className="trip-actions"><button onClick={()=>cancelTrip(t.id)}>Cancelar</button></div>}</article>)}</div>
  </section>;
}
