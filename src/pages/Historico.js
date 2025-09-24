import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const data = [
  { hora: "00h", eventos: 2 },
  { hora: "03h", eventos: 5 },
  { hora: "06h", eventos: 1 },
  { hora: "09h", eventos: 7 },
  { hora: "12h", eventos: 4 },
  { hora: "15h", eventos: 8 },
  { hora: "18h", eventos: 6 },
  { hora: "21h", eventos: 3 },
];

export default function Historico() {
  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Histórico de Eventos (Últimas 24h)</h1>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis dataKey="hora" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }}
              labelStyle={{ color: '#f3f4f6' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Line
              type="monotone"
              dataKey="eventos"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, stroke: "#2563eb", strokeWidth: 2 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
