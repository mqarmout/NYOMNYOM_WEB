import { useEffect } from "react";
import { useHydro } from "../../context/HydroContext";
import { AreaChart } from "../../Charts";

function MetricChart({ title, data, unit }) {
  if (data.filter((d) => d.v !== null).length < 2) return null;
  return (
    <div className="graph-card" style={{ marginBottom: 20 }}>
      <div className="graph-card-title">{title}</div>
      <AreaChart data={data} />
      <div style={{ textAlign: "right", fontSize: 11, color: "var(--fg-dim)", marginTop: 4 }}>
        {unit}
      </div>
    </div>
  );
}

export default function History() {
  const { history, loadAll } = useHydro();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const sorted = [...history].reverse();
  const lbls = sorted.map((r, i) => {
    if (i === 0 || i === sorted.length - 1) return r.recorded_at?.slice(5, 10) || "";
    return "";
  });

  const make = (key) => sorted.map((r, i) => ({ v: r[key] ?? null, lbl: lbls[i] }));

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>History</h1>
          <p>{history.length} readings logged</p>
        </div>
      </div>

      {history.length < 2 ? (
        <div className="empty-state">Log at least 2 readings to see charts.</div>
      ) : (
        <>
          <MetricChart title="pH" data={make("ph")} unit="target range 5.5–6.5" />
          <MetricChart title="EC (ppm)" data={make("ec_ppm")} unit="nutrient concentration" />
          <MetricChart title="Water Temperature (°C)" data={make("water_temp")} unit="target range 18–24°C" />
          <MetricChart title="Water Level (%)" data={make("water_level")} unit="reservoir fill level" />
          <MetricChart title="Air Temperature (°C)" data={make("air_temp")} unit="ambient" />
          <MetricChart title="Humidity (%)" data={make("humidity")} unit="relative humidity" />

          <div style={{ marginTop: 16 }}>
            <div className="graph-card-title" style={{ marginBottom: 10 }}>
              ALL READINGS
            </div>
            <div className="tx-list">
              {history.map((r) => (
                <div className="tx-item" key={r.id}>
                  <div className="tx-info">
                    <div className="tx-name">{r.recorded_at?.slice(0, 16).replace("T", " ")}</div>
                    <div className="tx-cat">
                      {[
                        r.ph != null && `pH ${r.ph.toFixed(1)}`,
                        r.ec_ppm != null && `EC ${r.ec_ppm.toFixed(0)} ppm`,
                        r.water_temp != null && `${r.water_temp.toFixed(1)}°C water`,
                        r.water_level != null && `${r.water_level.toFixed(0)}% level`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-date">
                      {[
                        r.air_temp != null && `${r.air_temp.toFixed(1)}°C air`,
                        r.humidity != null && `${r.humidity.toFixed(0)}% RH`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
