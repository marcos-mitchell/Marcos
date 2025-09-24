function EventHistory({ events }) {
  return (
    <div className="bg-gray-800 p-4 rounded shadow-md mt-6">
      <h2 className="text-xl font-bold mb-2">Histórico de Eventos</h2>
      <ul className="space-y-1 max-h-60 overflow-y-auto">
        {events.map((ev, i) => (
          <li key={i} className="border-b border-gray-700 py-1">
            {ev.time} - {ev.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventHistory;

