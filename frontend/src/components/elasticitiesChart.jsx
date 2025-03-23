import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ElasticityChart({ elasticitySummary }) {
  let minElasticity = -30;
  let maxElasticity = 30;
  let maxFrequency = 20000;

  if (Array.isArray(elasticitySummary) && elasticitySummary.length > 0) {
    minElasticity = Math.min(...elasticitySummary.map((d) => d.elasticity));
    maxElasticity = Math.max(...elasticitySummary.map((d) => d.elasticity));
    maxFrequency = Math.max(...elasticitySummary.map((d) => d.count));
  }

  return (
    <div style={{ width: "70%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={elasticitySummary || []}
          margin={{ top: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="elasticity"
            type="number"
            domain={[minElasticity - 5, maxElasticity + 5]}
            label={{
              value: "Elasticidad (%)",
              position: "insideBottom",
              dy: 10,
            }}
          />
          <YAxis
            domain={[0, maxFrequency]}
            label={{
              value: "Frecuencia",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip formatter={(value, name) => [`${value}`, "Frecuencia"]} />
          <Bar dataKey="count" fill="#f09223" name="Frecuencia" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
