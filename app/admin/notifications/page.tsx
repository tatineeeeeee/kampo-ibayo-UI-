export default function NotificationsPage() {
  const notifications = [
    { id: 1, message: "Juan Dela Cruz booked for Sept 16, 2025", status: "Confirmed" },
    { id: 2, message: "Maria Santos booking pending approval", status: "Pending" },
    { id: 3, message: "Booking #45 was cancelled", status: "Cancelled" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Notifications</h3>
      <ul className="space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className="p-3 border rounded-md flex justify-between items-center">
            <span className="text-gray-700">{n.message}</span>
            <span
              className={`px-2 py-1 rounded-md text-xs ${
                n.status === "Confirmed"
                  ? "bg-green-100 text-green-600"
                  : n.status === "Pending"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {n.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
