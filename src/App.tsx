import{useEffect,useState}from"react";
import{MapPin,Car,ShieldCheck,Clock3,ArrowRight,LogIn,Menu,Navigation,Package,CalendarDays,ChevronRight,LocateFixed}from"lucide-react";
import{supabase}from"./lib/supabase";
import PassengerAccess from"./components/PassengerAccess";
import PassengerDashboard from"./components/PassengerDashboard";
import DriverDashboard from"./components/DriverDashboard";
import AdminDashboard from"./components/AdminDashboard";
type Route={id:string;origin:string;destination:string;base_fare:number;estimated_minutes:number};
export default function App(){
 const[routes,setRoutes]=useState<Route[]>([]);const[session,setSession]=useState<any>(null);const[role,setRole]=useState<string|null>(null);const[showLogin,setShowLogin]=useState(false);
 async function loadSession(s:any){setSession(s);if(s?.user?.id){const{data}=await supabase.from("profiles").select("role").eq("id",s.user.id).maybeSingle();setRole(data?.role||"passenger")}else setRole(null)}
 useEffect(()=>{supabase.auth.getSession().then(({data})=>loadSession(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>loadSession(s));supabase.from("routes").select("*").eq("active",true).order("origin").then(({data})=>setRoutes((data||[])as Route[]));return()=>subscription.unsubscribe()},[]);
 if(session&&role==="admin")return <><RoleHeader label="Administração" signOut={()=>supabase.auth.signOut()}/><AdminDashboard/></>;
 if(session&&role==="driver")return <><RoleHeader label="Motorista" signOut={()=>supabase.auth.signOut()}/><DriverDashboard/></>;
 if(session)return <><RoleHeader label="Passageiro" signOut={()=>supabase.auth.signOut()}/><PassengerDashboard/></>;
 return <div className="hb-public">
  <header className="hb-public-nav"><a className="hb-public-logo" href="#"><img src="/horizonte-boninas-logo.svg" alt="Horizonte Boninas"/></a><nav><a href="#servicos">Serviços</a><a href="#seguranca">Segurança</a><button onClick={()=>setShowLogin(true)}><LogIn size={16}/> Entrar</button></nav><button className="hb-menu"><Menu/></button></header>
  <main>
   <section className="hb-public-map"><div className="hb-public-map-bg"/><div className="hb-public-road a"/><div className="hb-public-road b"/><div className="hb-public-route"/><div className="hb-public-pin one"><MapPin/></div><div className="hb-public-pin two"><Navigation/></div><div className="hb-public-map-label"><span>HORIZONTE BONINAS</span><b>SUMBE ⇄ LUANDA</b><small>Todos os dias · 06H e 14H</small></div>
    <div className="hb-public-book"><span>TRANSPORTE PERSONALIZADO</span><h1>Para onde vamos?</h1><p>Peça uma viagem, acompanhe o motorista e viaje com segurança.</p><button className="hb-public-input" onClick={()=>setShowLogin(true)}><MapPin size={18}/><div><small>Local de recolha</small><b>Escolha o seu ponto de partida</b></div><ChevronRight/></button><button className="hb-public-input" onClick={()=>setShowLogin(true)}><Navigation size={18}/><div><small>Destino</small><b>Para onde quer ir?</b></div><ChevronRight/></button><button className="hb-public-order" onClick={()=>setShowLogin(true)}>Pedir viagem <ArrowRight size={18}/></button><div className="hb-public-trust"><span><ShieldCheck size={14}/> Seguro</span><span><Clock3 size={14}/> Pontual</span><span><Car size={14}/> Confortável</span></div></div>
   </section>
   <section className="hb-public-services" id="servicos"><div className="hb-public-heading"><span>OS NOSSOS SERVIÇOS</span><h2>Mobilidade simples, como deve ser.</h2></div><div className="hb-public-cards"><article><div><Car/></div><h3>Boninas Táxi</h3><p>Transporte personalizado com acompanhamento da viagem.</p><button onClick={()=>setShowLogin(true)}>Pedir viagem <ArrowRight size={15}/></button></article><article><div><Navigation/></div><h3>Horizonte Boninas</h3><p>Sumbe ⇄ Luanda, todos os dias, com horários definidos.</p><button onClick={()=>setShowLogin(true)}>Ver rota <ArrowRight size={15}/></button></article><article><div><Package/></div><h3>Encomendas</h3><p>Envios seguros, rápidos e com responsabilidade.</p><button onClick={()=>setShowLogin(true)}>Solicitar <ArrowRight size={15}/></button></article></div></section>
   <section className="hb-public-route"><div><span>ROTA PRINCIPAL</span><h2>SUMBE ⇄ LUANDA</h2><p>Buscamos no Sumbe em sua casa. Em Luanda: Pumangol do Benfica / junto ao KFC.</p></div><div className="hb-public-times"><b>06H</b><b>14H</b><small>TODOS OS DIAS</small></div></section>
   <section className="hb-public-security" id="seguranca"><ShieldCheck/><div><span>SEGURANÇA</span><h2>Mais que uma viagem, é o seu destino em boas mãos.</h2><p>Pedidos, localização, motorista, estado da viagem e histórico organizados numa única experiência.</p></div></section>
   {routes.length>0&&<section className="hb-public-route-list">{routes.map(r=><div key={r.id}><MapPin size={16}/><b>{r.origin} → {r.destination}</b><span>{r.base_fare?Number(r.base_fare).toLocaleString("pt-AO")+" Kz":"Sob consulta"}</span></div>)}</section>}
  </main>
  <footer className="hb-public-footer"><img src="/horizonte-boninas-logo.svg" alt="Horizonte Boninas"/><span>© Horizonte Boninas · Transporte Personalizado</span></footer>
  {showLogin&&<div className="modal-backdrop" onClick={()=>setShowLogin(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowLogin(false)}>×</button><PassengerAccess onSuccess={()=>setShowLogin(false)}/></div></div>}
 </div>
}
function RoleHeader({label,signOut}:{label:string;signOut:()=>void}){return <header className="app-header"><div className="brand"><div className="logo-image"><img src="/horizonte-boninas-logo.svg" alt="Horizonte Boninas"/></div><div><strong>HORIZONTE BONINAS</strong><span>{label}</span></div></div><button className="outline" onClick={signOut}>Sair</button></header>}
