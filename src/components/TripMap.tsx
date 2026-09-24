import { useEffect, useRef } from "react";

type Point={lat:number;lng:number};
type Props={driver?:Point|null;passenger?:Point|null};

export default function TripMap({driver,passenger}:Props){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!ref.current)return;
    const points=[driver,passenger].filter(Boolean) as Point[];
    const center=points[0]||{lat:-8.8383,lng:13.2344};
    const markers=points.map(p=>"<div class='hb-marker' style='left:"+(50+(p.lng-center.lng)*30)+"%;top:"+(50-(p.lat-center.lat)*30)+"%'>●</div>").join("");
    ref.current.innerHTML="<div class='map-grid'><div class='map-center'><span>Horizonte Boninas</span>"+markers+"</div></div>";
    return()=>{if(ref.current)ref.current.innerHTML=""};
  },[driver,passenger]);
  return <div className="trip-map" ref={ref}><div className="map-grid"><div className="map-center"><span>Mapa de viagem</span></div></div></div>;
}
