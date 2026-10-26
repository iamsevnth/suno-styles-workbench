import { useMemo } from "react";
import { familyKeys, LIBRARY_STATS } from "../../lib/suno/families.ts";
import { allStyles } from "../../lib/suno/ontology.ts";

const LABELS: Record<string,string> = {
  afro:"Afro", ambient:"Ambient", baile:"Brazilian Funk", bass:"Bass Music",
  breaks:"Breaks / DnB", cinematic:"Cinematic", dancehall:"Dancehall", drill:"Drill",
  future:"Future Bass", garage:"UK Garage", gospel:"Gospel", house:"House / Techno",
  latin:"Latin", phonk:"Phonk", pop:"Pop", rap:"Hip-Hop / Rap", riddim:"Riddim",
  ritual:"Ritual Bass", soul:"R&B / Soul", trap:"Trap", ukg:"UKG Dubstep",
};
const COLORS = ["blue","violet","magenta","cyan","orange","coral","green","amber"] as const;

/** The current ontology drives this figure; historical appendix tables cannot make it stale. */
export default function LiveGenreCoverage() {
  const rows = useMemo(() => {
    const counted = new Map<string,Set<string>>();
    for (const genre of allStyles()) for (const family of familyKeys([genre.name])) {
      if (!counted.has(family)) counted.set(family,new Set());
      counted.get(family)?.add(genre.name);
    }
    return [...counted.entries()].map(([family,names]) => ({
      family,label:LABELS[family]??family,count:names.size,
    })).sort((a,b)=>b.count-a.count);
  }, []);
  const max = Math.max(...rows.map(x=>x.count),1);

  return (
    <figure className="guide-live-chart" aria-label="Current genre family coverage">
      <figcaption>
        <strong>Live v4 Genre Coverage</strong>
        <span>{LIBRARY_STATS.genres} recognized genres across {LIBRARY_STATS.families} families</span>
      </figcaption>
      <div className="guide-live-chart-bars">
        {rows.map((row,i)=>{
          const color=COLORS[i%COLORS.length];
          return (
            <div className="guide-live-chart-row" key={row.family}>
              <span>{row.label}</span>
              <div className="guide-live-chart-track" aria-hidden="true">
                <div className={`guide-live-chart-fill tint tile-${color}`} style={{width:`${(row.count/max)*100}%`}} />
              </div>
              <strong>{row.count}</strong>
            </div>
          );
        })}
      </div>
      <p className="guide-live-chart-explanation">Legend: bar length and the number at right represent genre memberships per family; colors distinguish families only. A hybrid may belong to more than one family, so totals can exceed the number of unique genres.</p>
    </figure>
  );
}
