import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { MapPin, Navigation, CalendarDays, CreditCard, Car, ChevronRight, Home, History, UserRound, Bell, Package, LocateFixed, ArrowUpDown, LoaderCircle, Plus, X, ShieldCheck, Clock3 } from "lucide-react";
import TripTracking from "./TripTracking";

type Route={id:string;origin:string;destination:string;base_fare:number;estimated_minutes:number};
type Trip={id:string;origin:string;destination:string;status:string;fare:number|null;payment_method:string;scheduled_at:string|null;driver_id?:string|null};

const statusLabel:Record<string,string>={
 requested:"A procurar motorista",searching:"A procurar motorista",accepted:"Motorista encontrado",
 driver_assigned:"Motorista encontrado",driver_arriving:"Motorista a caminho",arrived:"Motorista chegou",
 started:"Viagem em andamento",in_progress:"Viagem em andamento",completed:"Concluída",cancelled:"Cancelada"
};

export default function PassengerDashboard(){
 const[routes,setRoutes]=useState<Route[]>([]);
 const[trips,setTrips]=useState<Trip[]>([]);
 const[origin,setOrigin]=useState("");
 const[destination,setDestination]=useState("");
 const[payment,setPayment]=useState("cash");
 const[scheduled,setScheduled]=useState("");
 const[service,setService]=useState("Horizonte Boninas");
 const[message,setMessage]=useState("");
 const[loading,setLoading]=useState(false);
 const[tab,setTab]=useState<"home"|"trips"|"profile">("home");
 const[locating,setLocating]=useState(false);
 const[pickupCoords,setPickupCoords]=useState<{lat:number;lng:number}|null>(null);
 const[locationMessage,setLocationMessage]=useState("");
 const[showOptions,setShowOptions]=useState(false);

 async function load(){
  const {data:session}=await supabase.auth.getSession(); const uid=session.session?.user.id; if(!uid)return;
  const[r,t]=await Promise.all([
   supabase.from("routes").select("id,origin,destination,base_fare,estimated_minutes").eq("active",true).order("origin"),
   supabase.from("trips").select("id,origin,destination,status,fare,payment_method,scheduled_at,driver_id").eq("passenger_id",uid).order("created_at",{ascending:false}).limit(20)
  ]);
  if(r.data)setRoutes(r.data); if(t.data)setTrips(t.data);
 }
 useEffect(()=>{load();const c=supabase.channel("passenger-trip-updates").on("postgres_changes",{event:"*",schema:"public",table:"trips"},()=>load()).subscribe();return()=>{supabase.removeChannel(c)}},[]);
 async function requestTrip(e:React.FormEvent){
  e.preventDefault();setMessage("");
  const{data:session}=await supabase.auth.getSession(); const uid=session.session?.user.id;
  if(!uid||!origin||!destination){setMessage("Escolha o ponto de recolha e o destino.");return}
  setLoading(true); const route=routes.find(x=>x.origin===origin&&x.destination===destination);
  const result=await supabase.from("trips").insert({passenger_id:uid,route_id:route?.id??null,origin,destination,fare:route?.base_fare??null,payment_method:payment,scheduled_at:scheduled?new Date(scheduled).toISOString():null,status:"requested",pickup_lat:pickupCoords?.lat??null,pickup_lng:pickupCoords?.lng??null}).select("id").single();
  setLoading(false);
  if(result.error)setMessage(result.error.message); else {setMessage("Pedido enviado. A procurar motorista.");setScheduled("");setPickupCoords(null);await load()}
 }
 const selectedRoute=useMemo(()=>routes.find(r=>r.origin===origin&&r.destination===destination),[routes,origin,destination]);
 const activeTrip=trips.find(t=>!["completed","cancelled"].includes(t.status));
 const origins=[...new Set(routes.map(r=>r.origin))]; const destinations=[...new Set(routes.map(r=>r.destination))];
 function useCurrentLocation(){
  if(!navigator.geolocation){setLocationMessage("Localização indisponível neste dispositivo.");return}
  setLocating(true);navigator.geolocation.getCurrentPosition(p=>{setPickupCoords({lat:p.coords.latitude,lng:p.coords.longitude});setLocationMessage("Localização actualizada.");setLocating(false)},()=>{setLocationMessage("Permita a localização no navegador ou escolha o ponto manualmente.");setLocating(false)},{enableHighAccuracy:true,timeout:10000,maximumAge:30000});
 }
 return <div className="yb-rider-app">
  <header className="yb-appbar">
   <button className="yb-round-button" onClick={()=>setTab("profile")} aria-label="Perfil"><UserRound size={19}/></button>
   <div className="yb-wordmark"><img src="/horizonte-boninas-logo.svg" alt="Horizonte Boninas"/></div>
   <button className="yb-round-button" onClick={()=>setShowOptions(v=>!v)} aria-label="Notificações"><Bell size={19}/>{activeTrip&&<i/>}</button>
  </header>
  {showOptions&&<div className="yb-popover"><strong>Ajuda e segurança</strong><span>Suporte da viagem disponível</span><button onClick={()=>setShowOptions(false)}><X size={15}/> Fechar</button></div>}
  {tab==="home"&&<main className="yb-home">
   <section className="yb-map">
    <div className="yb-map-pattern"/><div className="yb-map-road r1"/><div className="yb-map-road r2"/><div className="yb-map-road r3"/>
    <div className="yb-map-route"/>
    <div className="yb-map-marker pickup"><MapPin size={18}/></div><div className="yb-map-marker destination"><Navigation size={17}/></div>
    <button className="yb-map-control locate" onClick={useCurrentLocation}>{locating?<LoaderCircle className="spin" size={18}/>:<LocateFixed size={18}/>}</button>
    <div className="yb-map-caption"><span>SUMBE ⇄ LUANDA</span><b>Mapa da viagem</b></div>
   </section>
   <section className="yb-sheet">
    <div className="yb-sheet-handle"/>
    <div className="yb-title-row"><div><span>HORIZONTE BONINAS</span><h1>Para onde vamos?</h1></div><div className="yb-secure"><ShieldCheck size={17}/></div></div>
    <form onSubmit={requestTrip}>
     <div className="yb-place-card">
      <div className="yb-place-line"><span className="yb-dot blue"/><div><small>Local de recolha</small><select value={origin} onChange={e=>setOrigin(e.target.value)} required><option value="">Escolher localização</option>{origins.map(x=><option key={x}>{x}</option>)}</select></div><button type="button" className="yb-mini" onClick={useCurrentLocation}><LocateFixed size={16}/></button></div>
      <div className="yb-connector"/>
      <div className="yb-place-line"><span className="yb-dot yellow"/><div><small>Destino</small><select value={destination} onChange={e=>setDestination(e.target.value)} required><option value="">Para onde?</option>{destinations.map(x=><option key={x}>{x}</option>)}</select></div><Navigation size={17} className="yb-dest-icon"/></div>
     </div>
     {locationMessage&&<div className="yb-note">{locationMessage}</div>}
     <div className="yb-service-title"><span>Escolha o serviço</span><button type="button" onClick={()=>setTab("trips")}>Histórico</button></div>
     <div className="yb-service-row">
      <button type="button" className={service==="Horizonte Boninas"?"chosen":""} onClick={()=>setService("Horizonte Boninas")}><Car size={22}/><div><b>Boninas</b><small>Viagem programada</small></div>{service==="Horizonte Boninas"&&<span className="yb-check">✓</span>}</button>
      <button type="button" className={service==="Boninas Táxi"?"chosen":""} onClick={()=>setService("Boninas Táxi")}><Navigation size={22}/><div><b>Táxi</b><small>Transporte personalizado</small></div>{service==="Boninas Táxi"&&<span className="yb-check">✓</span>}</button>
     </div>
     {selectedRoute&&<div className="yb-price"><div><small>Preço estimado</small><strong>{Number(selectedRoute.base_fare).toLocaleString("pt-AO")} Kz</strong></div><span>~{selectedRoute.estimated_minutes} min</span></div>}
     <div className="yb-options"><button type="button"><CalendarDays size={16}/><input aria-label="Data e hora" type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)}/></button><button type="button"><CreditCard size={16}/><select aria-label="Pagamento" value={payment} onChange={e=>setPayment(e.target.value)}><option value="cash">Numerário</option><option value="multicaixa">Multicaixa</option><option value="bank_transfer">Transferência</option><option value="wallet">Carteira digital</option></select></button></div>
     {message&&<div className="yb-note">{message}</div>}
     <button className="yb-order" disabled={loading}>{loading?"A procurar...":"Pedir viagem"}<ChevronRight size={20}/></button>
    </form>
    <div className="yb-benefits"><span><ShieldCheck size={14}/> Viagem segura</span><span><Clock3 size={14}/> Acompanhamento</span><span><Package size={14}/> Encomendas</span></div>
   </section>
   {activeTrip&&<section className="yb-active"><div className="yb-active-top"><div><span>VIAGEM ACTUAL</span><h2>{statusLabel[activeTrip.status]||activeTrip.status}</h2></div><b><i/> ACTIVA</b></div><div className="yb-active-route"><strong>{activeTrip.origin}</strong><ChevronRight size={17}/><strong>{activeTrip.destination}</strong></div><div className="yb-progress"><i/><i/><i/></div></section>}
   {activeTrip&&<TripTracking tripId={activeTrip.id} driverId={activeTrip.driver_id??undefined}/>}
   <section className="yb-quick"><button onClick={()=>setTab("trips")}><History/><div><b>As minhas viagens</b><small>Histórico e pedidos</small></div><ChevronRight/></button><button><Package/><div><b>Encomendas</b><small>Seguras e rápidas</small></div><ChevronRight/></button></section>
  </main>}
  {tab==="trips"&&<main className="yb-page"><button className="yb-back" onClick={()=>setTab("home")}>‹ Início</button><span>ACTIVIDADE</span><h1>As minhas viagens</h1><p>Pedidos actuais e viagens anteriores.</p>{trips.length===0?<div className="yb-empty"><History size={30}/><h3>Ainda sem viagens</h3><p>Quando pedir uma viagem, ela aparecerá aqui.</p></div>:<div className="yb-history">{trips.map(t=><article key={t.id}><div className="yb-history-icon"><Car size={18}/></div><div><b>{t.origin} → {t.destination}</b><span>{statusLabel[t.status]||t.status}</span><small>{t.scheduled_at?new Date(t.scheduled_at).toLocaleString("pt-AO"):"Imediata"}</small></div><strong>{t.fare?Number(t.fare).toLocaleString("pt-AO")+" Kz":"—"}</strong></article>)}</div>}</main>}
  {tab==="profile"&&<main className="yb-page"><button className="yb-back" onClick={()=>setTab("home")}>‹ Início</button><span>CONTA</span><h1>O meu perfil</h1><p>A sua conta Horizonte Boninas.</p><div className="yb-profile"><div><UserRound size={30}/></div><h2>Passageiro</h2><p>Sessão autenticada com segurança.</p><b><ShieldCheck size={15}/> Conta activa</b></div></main>}
  <nav className="yb-nav"><button className={tab==="home"?"active":""} onClick={()=>setTab("home")}><Home/><span>Início</span></button><button className={tab==="trips"?"active":""} onClick={()=>setTab("trips")}><History/><span>Viagens</span></button><button className="center" onClick={()=>setTab("home")}><Plus/></button><button className={tab==="profile"?"active":""} onClick={()=>setTab("profile")}><UserRound/><span>Perfil</span></button></nav>
 </div>;
}
