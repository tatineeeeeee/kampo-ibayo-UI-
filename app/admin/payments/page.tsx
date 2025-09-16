export default function PaymentsPage() {
  const payments = [
    { id: 1, user: "Juan Dela Cruz", amount: 2000, date: "Sept 16, 2025", status: "Paid" },
    { id: 2, user: "Maria Santos", amount: 1500, date: "Sept 20, 2025", status: "Pending" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Payments</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-600 text-sm">
            <th className="p-3">User</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Date</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.user}</td>
              <td className="p-3">₱{p.amount}</td>
              <td className="p-3">{p.date}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-md text-xs ${
                    p.status === "Paid"
                      ? "bg-green-100 text-green-600"
                      : p.status === "Pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
