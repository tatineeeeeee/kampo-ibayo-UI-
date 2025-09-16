export default function BookingsPage() {
  return (
    <div>


      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">All Bookings</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-sm">
              <th className="p-3">Guest</th>
              <th className="p-3">Date</th>
              <th className="p-3">Guests</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3 text-black">Juan Dela Cruz</td>
              <td className="p-3 text-black">Sept 20, 2025</td>
              <td className="p-3 text-black">4</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-md text-xs">
                  Confirmed
                </span>
              </td>
              <td className="p-3">
                <button className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">
                  View
                </button>
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3 text-black">Maria Santos</td>
              <td className="p-3 text-black">Sept 22, 2025</td>
              <td className="p-3 text-black">2</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-md text-xs">
                  Pending
                </span>
              </td>
              <td className="p-3">
                <button className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
