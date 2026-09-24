import { useState } from "react";
import { findNearbyDrivers,assignDriver,AvailableDriver } from "../services/dispatch";

export default function DispatchPanel({tripId,lat,lng}:{tripId:string;lat:number;lng:number}){
  const [drivers,setDrivers]=useState<AvailableDriver[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");

  async function search(){
    setLoading(true);setMessage("");
    try{setDrivers(await findNearbyDrivers(lat,lng));if(!drivers.length)setMessage("Nenhum motorista disponível encontrado.");}
    catch(e){setMessage(e instanceof Error?e.message:"Não foi possível procurar motoristas.");}
    finally{setLoading(false);}
  }

  async function assign(id:string){
    setLoading(true);setMessage("");
    try{await assignDriver(tripId,id);setMessage("Motorista atribuído à viagem.");setDrivers(x=>x.filter(d=>d.id!==id));}
    catch(e){setMessage(e instanceof Error?e.message:"Não foi possível atribuir o motorista.");}
    finally{setLoading(false);}
  }

  return <div className="dispatch-panel"><div className="section-heading"><span>DESPACHO</span><h3>Motoristas próximos</h3><p>Procure motoristas verificados que estejam disponíveis.</p></div><button onClick={search} disabled={loading}>{loading?"A procurar...":"Procurar motoristas"}</button>{message&&<div className="status-message">{message}</div>}<div className="driver-results">{drivers.map(d=><article className="driver-result" key={d.id}><div><strong>Motorista</strong><span>{d.distance_km.toFixed(1)} km · ★ {Number(d.rating||0).toFixed(1)}</span></div><button onClick={()=>assign(d.id)} disabled={loading}>Atribuir</button></article>)}</div></div>;
}
