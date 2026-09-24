import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Props={driverId?:string;tripId?:string};

export default function LiveLocation({driverId,tripId}:Props){
  const [location,setLocation]=useState<{lat:number;lng:number}|null>(null);
  const [message,setMessage]=useState("Localização desativada.");

  useEffect(()=>{
    if(!navigator.geolocation){setMessage("Este dispositivo não suporta localização.");return;}
    const watch=navigator.geolocation.watchPosition(async p=>{
      const lat=p.coords.latitude,lng=p.coords.longitude;
      setLocation({lat,lng});setMessage("Localização atualizada.");
      if(driverId) await supabase.from("drivers").update({current_lat:lat,current_lng:lng}).eq("id",driverId);
      if(tripId) await supabase.from("trip_events").insert({trip_id:tripId,status:"location_update",lat,lng,note:"GPS"});
    },()=>setMessage("Permita o acesso à localização para acompanhar a viagem."),{enableHighAccuracy:true,maximumAge:5000,timeout:10000});
    return()=>navigator.geolocation.clearWatch(watch);
  },[driverId,tripId]);

  return <div className="location-card"><strong>📍 GPS</strong><span>{message}</span>{location&&<small>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</small>}</div>;
}
