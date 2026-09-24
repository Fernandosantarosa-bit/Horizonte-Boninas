import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Trip={id:string;origin:string;destination:string;status:string;fare:number|null;payment_method:string;created_at:string};

export default function DriverDashboard(){
  const [driverId,setDriverId]=useState("");
  const [status,setStatus]=useState("offline");
  const [trips,setTrips]=useState<Trip[]>([]);
  const [message,setMessage]=useState("");

  async function load(){
    const {data:s}=await supabase.auth.getSession();
    const uid=s.session?.user.id;
    if(!uid)return;
    const {data:d}=await supabase.from("drivers").select("id,status").eq("id",uid).maybeSingle();
    if(d){setDriverId(d.id);setStatus(d.status);}
    const {data:t}=await supabase.from("trips").select("id,origin,destination,status,fare,payment_method,created_at").in("status",["requested","accepted","driver_arriving","in_progress"]).order("created_at",{ascending:false}).limit(20);
    if(t)setTrips(t);
  }

  useEffect(()=>{load();const c=supabase.channel("driver-trip-feed").on("postgres_changes",{event:"*",schema:"public",table:"trips"},()=>load()).subscribe();return()=>{supabase.removeChannel(c)}},[]);

  async function setDriverStatus(value:string){
    if(!driverId){setMessage("Este utilizador ainda não está registado como motorista.");return;}
    const {error}=await supabase.from("drivers").update({status:value}).eq("id",driverId);
    if(error)setMessage(error.message);else{setStatus(value);setMessage(value==="available"?"Motorista disponível para novas viagens.":"Estado atualizado.");}
  }

  async function updateTrip(id:string,next:string){
    const {error}=await supabase.from("trips").update({driver_id:driverId,status:next}).eq("id",id);
    if(error)setMessage(error.message);else{setMessage("Viagem atualizada.");await load();}
  }

  return <section className="dashboard-section">
    <div className="section-heading"><span>Área do motorista</span><h2>Central de viagens</h2><p>Fique disponível e acompanhe os pedidos de transporte.</p></div>
    <div className="driver-status">
      <strong>Estado: {status}</strong>
      <div><button onClick={()=>setDriverStatus("available")}>Ficar disponível</button><button onClick={()=>setDriverStatus("offline")}>Ficar offline</button></div>
    </div>
    {message&&<div className="status-message">{message}</div>}
    <div className="trip-list"><h3>Pedidos e viagens ativas</h3>{trips.length===0?<p>Nenhum pedido disponível neste momento.</p>:trips.map(t=><article className="trip-item" key={t.id}><div><strong>{t.origin} → {t.destination}</strong><span>{t.status}</span></div><small>{t.fare?Number(t.fare).toLocaleString("pt-AO")+" Kz":"Tarifa pendente"} · {t.payment_method}</small><div className="trip-actions">{t.status==="requested"&&<button onClick={()=>updateTrip(t.id,"accepted")}>Aceitar</button>}{t.status==="accepted"&&<button onClick={()=>updateTrip(t.id,"driver_arriving")}>A caminho</button>}{t.status==="driver_arriving"&&<button onClick={()=>updateTrip(t.id,"in_progress")}>Iniciar viagem</button>}{t.status==="in_progress"&&<button onClick={()=>updateTrip(t.id,"completed")}>Concluir</button>}</div></article>)}</div>
  </section>;
}
