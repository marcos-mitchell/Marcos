export default function LoadingSpinner({ size = "medium", text = "Carregando..." }) {
  const sizes = {
    small: "w-6 h-6",
    medium: "w-12 h-12",
    large: "w-16 h-16"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 ${sizes[size]}`}></div>
      {text && <p className="mt-4 text-gray-400">{text}</p>}
    </div>
  );
}

// Componente de loading para cards
export function LoadingCard() {
  return (
    <div className="bg-gray-800 p-4 rounded-2xl shadow-lg animate-pulse">
      <div className="h-8 w-8 bg-gray-700 rounded-full mx-auto mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto"></div>
    </div>
  );
}

// Componente de loading para câmeras
export function LoadingCamera() {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-800 animate-pulse">
      <div className="w-full h-64 bg-gray-700"></div>
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-2">
        <div className="h-4 bg-gray-600 rounded w-1/2 mb-1"></div>
        <div className="h-6 bg-gray-600 rounded w-3/4"></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
        <div className="h-4 bg-gray-600 rounded w-1/2"></div>
      </div>
    </div>
  );
}