import { supabase } from "../lib/supabase";

export type AvailableDriver={id:string;current_lat:number;current_lng:number;rating:number;distance_km:number};

function distanceKm(aLat:number,aLng:number,bLat:number,bLng:number){
  const rad=Math.PI/180;
  const dLat=(bLat-aLat)*rad,dLng=(bLng-aLng)*rad;
  const x=Math.sin(dLat/2)**2+Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

export async function findNearbyDrivers(lat:number,lng:number,limit=10){
  const {data,error}=await supabase.from("drivers")
    .select("id,current_lat,current_lng,rating")
    .eq("status","available").eq("verified",true)
    .not("current_lat","is",null).not("current_lng","is",null);
  if(error)throw error;
  return (data||[]).map(d=>({...d,distance_km:distanceKm(lat,lng,d.current_lat!,d.current_lng!)}))
    .sort((a,b)=>a.distance_km-b.distance_km).slice(0,limit) as AvailableDriver[];
}

export async function assignDriver(tripId:string,driverId:string){
  const {data,error}=await supabase.from("trips").update({driver_id:driverId,status:"accepted"})
    .eq("id",tripId).eq("status","requested").select("id,driver_id,status").maybeSingle();
  if(error)throw error;
  if(!data)throw new Error("A viagem já foi aceite por outro motorista ou não está disponível.");
  await supabase.from("drivers").update({status:"busy"}).eq("id",driverId).eq("status","available");
  return data;
}
