import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import TripMap from "./TripMap";

type Point={lat:number;lng:number};

export default function TripTracking({tripId,driverId}:{tripId:string;driverId?:string}){
  const [driver,setDriver]=useState<Point|null>(null);
  const [passenger,setPassenger]=useState<Point|null>(null);
  const [status,setStatus]=useState("requested");

  async function load(){
    const {data:t}=await supabase.from("trips").select("status,pickup_lat,pickup_lng").eq("id",tripId).maybeSingle();
    if(t){setStatus(t.status);if(t.pickup_lat&&t.pickup_lng)setPassenger({lat:t.pickup_lat,lng:t.pickup_lng});}
    if(driverId){const {data:d}=await supabase.from("drivers").select("current_lat,current_lng").eq("id",driverId).maybeSingle();if(d?.current_lat&&d?.current_lng)setDriver({lat:d.current_lat,lng:d.current_lng});}
  }

  useEffect(()=>{
    load();
    const channel=supabase.channel("trip-tracking-"+tripId)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"trips",filter:"id=eq."+tripId},payload=>{const t=payload.new as any;setStatus(t.status);if(t.pickup_lat&&t.pickup_lng)setPassenger({lat:t.pickup_lat,lng:t.pickup_lng});})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"drivers"},payload=>{const d=payload.new as any;if(driverId&&d.id===driverId&&d.current_lat&&d.current_lng)setDriver({lat:d.current_lat,lng:d.current_lng});})
      .subscribe();
    return()=>{supabase.removeChannel(channel)};
  },[tripId,driverId]);

  return <section className="tracking-panel"><div className="tracking-header"><div><span>VIAGEM EM TEMPO REAL</span><h2>{status==="completed"?"Viagem concluída":"Acompanhe a sua viagem"}</h2></div><strong>{status}</strong></div><TripMap driver={driver} passenger={passenger}/><div className="tracking-legend"><span>● Motorista</span><span>● Passageiro</span></div></section>;
}
