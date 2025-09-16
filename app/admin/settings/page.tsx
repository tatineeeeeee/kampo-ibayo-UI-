export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Profile Settings</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-700"
              placeholder="Admin Name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-700"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-700"
              placeholder="••••••••"
            />
          </div>
        </form>
      </div>

      {/* Booking Rules */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Booking Rules</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Maximum Guests Per Booking
            </label>
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-700"
              defaultValue={10}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Cancellation Policy
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-700"
              rows={3}
              defaultValue="Cancellations must be made at least 24 hours before the booking date."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Booking Cutoff Time (hours before)
            </label>
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-700"
              defaultValue={2}
            />
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">System Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-gray-700 text-sm">
            <input type="checkbox" className="rounded" defaultChecked />
            Enable Notifications
          </label>
          <label className="flex items-center gap-2 text-gray-700 text-sm">
            <input type="checkbox" className="rounded" />
            Allow Online Payments
          </label>
          <label className="flex items-center gap-2 text-gray-700 text-sm">
            <input type="checkbox" className="rounded" />
            Enable Dark Mode
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm">
          Save Changes
        </button>
      </div>
    </div>
  );
}
