export default function UsersPage() {
  return (
    <div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">User Management</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-sm">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3 text-black">Admin User</td>
              <td className="p-3 text-black">admin@kampo.com</td>
              <td className="p-3 text-black">Administrator</td>
              <td className="p-3">
                <button className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">
                  Edit
                </button>
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3 text-black">Juan Dela Cruz</td>
              <td className="p-3 text-black">juan@email.com</td>
              <td className="p-3 text-black">Customer</td>
              <td className="p-3">
                <button className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
