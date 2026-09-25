import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { MapPin, Navigation, CalendarDays, CreditCard, Clock3, Car, ChevronRight, Home, History, UserRound, Bell, Package, Route as RouteIcon, LocateFixed, X, CheckCircle2 } from "lucide-react";

type Route={id:string;origin:string;destination:string;base_fare:number;estimated_minutes:number};
type Trip={id:string;origin:string;destination:string;status:string;fare:number|null;payment_method:string;scheduled_at:string|null};

const statusLabel:Record<string,string>={
  requested:"A procurar motorista",
  searching:"A procurar motorista",
  accepted:"Motorista encontrado",
  driver_assigned:"Motorista encontrado",
  driver_arriving:"Motorista a caminho",
  arrived:"Motorista chegou",
  started:"Viagem em andamento",
  in_progress:"Viagem em andamento",
  completed:"Concluída",
  cancelled:"Cancelada"
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

  async function load(){
    const {data:session}=await supabase.auth.getSession();
    const uid=session.session?.user.id;
    if(!uid)return;
    const[r,t]=await Promise.all([
      supabase.from("routes").select("id,origin,destination,base_fare,estimated_minutes").eq("active",true).order("origin"),
      supabase.from("trips").select("id,origin,destination,status,fare,payment_method,scheduled_at").eq("passenger_id",uid).order("created_at",{ascending:false}).limit(20)
    ]);
    if(r.data)setRoutes(r.data);
    if(t.data)setTrips(t.data);
  }

  useEffect(()=>{load()},[]);
  useEffect(()=>{
    const channel=supabase.channel("passenger-trip-updates")
      .on("postgres_changes",{event:"*",schema:"public",table:"trips"},()=>load())
      .subscribe();
    return()=>{supabase.removeChannel(channel)};
  },[]);

  async function requestTrip(e:React.FormEvent){
    e.preventDefault();setMessage("");
    const{data:session}=await supabase.auth.getSession();
    const uid=session.session?.user.id;
    if(!uid||!origin||!destination){setMessage("Selecione a origem e o destino.");return}
    setLoading(true);
    const route=routes.find(x=>x.origin===origin&&x.destination===destination);
    const result=await supabase.from("trips").insert({
      passenger_id:uid,route_id:route?.id??null,origin,destination,
      fare:route?.base_fare??null,payment_method:payment,
      scheduled_at:scheduled?new Date(scheduled).toISOString():null,
      status:"requested"
    }).select("id").single();
    setLoading(false);
    if(result.error)setMessage(result.error.message);
    else{setMessage("Pedido enviado. Estamos a procurar um motorista.");setOrigin("");setDestination("");setScheduled("");await load()}
  }

  const selectedRoute=useMemo(()=>routes.find(r=>r.origin===origin&&r.destination===destination),[routes,origin,destination]);
  const activeTrip=trips.find(t=>!["completed","cancelled"].includes(t.status));
  const history=trips.filter(t=>["completed","cancelled"].includes(t.status));
  const origins=[...new Set(routes.map(r=>r.origin))];
  const destinations=[...new Set(routes.map(r=>r.destination))];

  return <div className="passenger-app">
    <div className="passenger-topbar">
      <div className="passenger-brand">
        <img src="/horizonte-boninas-logo.svg" alt="Horizonte Boninas"/>
      </div>
      <div className="passenger-actions">
        <button className="icon-button" aria-label="Notificações"><Bell size={20}/>{activeTrip&&<i/>}</button>
        <div className="passenger-avatar"><UserRound size={18}/></div>
      </div>
    </div>

    {tab==="home"&&<main className="passenger-main">
      <section className="passenger-map-card">
        <div className="map-surface">
          <div className="map-pattern"/>
          <div className="map-road road-one"/><div className="map-road road-two"/><div className="map-road road-three"/>
          <div className="map-route-line"/>
          <div className="map-marker map-start"><MapPin size={18}/></div>
          <div className="map-marker map-end"><Navigation size={17}/></div>
          <div className="map-location-note"><LocateFixed size={15}/><span>Mapa pronto para localização</span></div>
          <div className="map-disclaimer">A localização GPS será activada quando o serviço de mapas estiver configurado.</div>
        </div>
        <div className="passenger-booking">
          <div className="booking-handle"/>
          <div className="passenger-greeting"><div><span>Olá, passageiro</span><h1>Para onde vamos?</h1></div><div className="mini-badge"><Car size={16}/></div></div>
          <form onSubmit={requestTrip}>
            <div className="location-stack">
              <div className="location-row"><span className="dot blue"/><div><small>De</small><select value={origin} onChange={e=>setOrigin(e.target.value)} required><option value="">Escolher origem</option>{origins.map(x=><option key={x}>{x}</option>)}</select></div></div>
              <div className="location-connector"/>
              <div className="location-row"><span className="dot pink"/><div><small>Para</small><select value={destination} onChange={e=>setDestination(e.target.value)} required><option value="">Escolher destino</option>{destinations.map(x=><option key={x}>{x}</option>)}</select></div></div>
            </div>
            <div className="booking-options">
              <label><CalendarDays size={16}/><input type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)}/></label>
              <label><CreditCard size={16}/><select value={payment} onChange={e=>setPayment(e.target.value)}><option value="cash">Numerário</option><option value="multicaixa">Multicaixa</option><option value="bank_transfer">Transferência</option><option value="wallet">Carteira digital</option></select></label>
            </div>
            <div className="service-selector">
              <button type="button" className={service==="Horizonte Boninas"?"selected":""} onClick={()=>setService("Horizonte Boninas")}><RouteIcon size={18}/><span><b>Horizonte Boninas</b><small>Viagem programada</small></span></button>
              <button type="button" className={service==="Boninas Táxi"?"selected":""} onClick={()=>setService("Boninas Táxi")}><Car size={18}/><span><b>Boninas Táxi</b><small>Transporte personalizado</small></span></button>
            </div>
            {selectedRoute&&<div className="fare-card"><div><small>Estimativa da rota</small><strong>{Number(selectedRoute.base_fare).toLocaleString("pt-AO")} Kz</strong></div><span>~{selectedRoute.estimated_minutes} min</span></div>}
            {message&&<div className="passenger-message">{message}</div>}
            <button className="passenger-primary" disabled={loading}>{loading?"A solicitar...":"Confirmar viagem"}<ChevronRight size={19}/></button>
          </form>
        </div>
      </section>

      {activeTrip&&<section className="active-trip-card">
        <div className="active-trip-head"><div><span>VIAGEM ACTUAL</span><h2>{statusLabel[activeTrip.status]||activeTrip.status}</h2></div><div className="live-dot"><i/> ACTIVA</div></div>
        <div className="trip-route"><div><b>{activeTrip.origin}</b><span>Origem</span></div><div className="route-arrow"><ChevronRight/></div><div><b>{activeTrip.destination}</b><span>Destino</span></div></div>
        <div className="trip-progress"><span className="done"/><span className={activeTrip.status!=="requested"?"done":""}/><span className={["started","in_progress","completed"].includes(activeTrip.status)?"done":""}/></div>
      </section>}

      <section className="quick-services"><div className="dashboard-title"><div><span>SERVIÇOS</span><h2>Precisa de algo mais?</h2></div></div><div className="quick-grid"><button><Package/><span><b>Encomendas</b><small>Seguras e rápidas</small></span><ChevronRight/></button><button onClick={()=>setTab("trips")}><History/><span><b>Histórico</b><small>As suas viagens</small></span><ChevronRight/></button></div></section>
    </main>}

    {tab==="trips"&&<main className="passenger-page"><div className="page-title"><span>ACTIVIDADE</span><h1>As minhas viagens</h1><p>Consulte pedidos activos e viagens anteriores.</p></div>{trips.length===0?<div className="empty-state"><History size={30}/><h3>Ainda não existem viagens</h3><p>As suas viagens aparecerão aqui depois de um pedido.</p></div>:<div className="history-list">{trips.map(t=><article key={t.id} className="history-card"><div className="history-icon"><Car size={19}/></div><div className="history-main"><strong>{t.origin} → {t.destination}</strong><span>{statusLabel[t.status]||t.status}</span><small>{t.scheduled_at?new Date(t.scheduled_at).toLocaleString("pt-AO"):"Imediata"}</small></div><div className="history-fare">{t.fare?Number(t.fare).toLocaleString("pt-AO")+" Kz":"—"}</div></article>)}</div>}</main>}

    {tab==="profile"&&<main className="passenger-page"><div className="page-title"><span>CONTA</span><h1>O meu perfil</h1><p>As informações da sua conta são geridas com segurança.</p></div><div className="profile-card"><div className="profile-avatar"><UserRound size={32}/></div><h2>Passageiro</h2><p>A sua sessão está activa.</p><div className="profile-note"><CheckCircle2 size={18}/> Conta autenticada</div></div></main>}

    <nav className="passenger-bottom-nav"><button className={tab==="home"?"active":""} onClick={()=>setTab("home")}><Home/><span>Início</span></button><button className={tab==="trips"?"active":""} onClick={()=>setTab("trips")}><History/><span>Viagens</span></button><button className={tab==="profile"?"active":""} onClick={()=>setTab("profile")}><UserRound/><span>Perfil</span></button></nav>
  </div>;
}
