// src/components/CameraCard.jsx
export default function CameraCard({ camera, distance, description, time, highlight, zoom }) {
  return (
    <div
      className={`
        rounded-lg shadow-lg p-6 transition-all duration-700 ease-in-out
        ${zoom
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          : "w-80 border border-gray-200 bg-white"
        }
        ${highlight ? "border-4 border-red-600" : ""}
      `}
    >
      <div
        className={`
          p-6 rounded-xl shadow-md transition-all duration-500
          ${highlight ? "bg-red-100" : "bg-gray-50"}
          ${zoom ? "text-3xl w-[70%] h-[70%] flex flex-col justify-center items-center" : ""}
        `}
      >
        <h3 className="font-bold mb-4">{camera}</h3>
        <p className="mb-2">{description || "Sem descrição"}</p>
        <p className="mb-2">Distância: {distance ? `${distance} cm` : "N/A"}</p>
        <p className="text-sm text-gray-600">Hora: {time || "--:--"}</p>
      </div>
    </div>
  );
}


