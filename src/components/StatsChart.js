import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function StatsChart({ data }) {
  return (
    <div className="bg-gray-800 p-4 rounded shadow-md mt-6">
      <h2 className="text-xl font-bold mb-2">Gráfico de Estatísticas</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid stroke="#555" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="alerts" stroke="#ff4d4f" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StatsChart;

