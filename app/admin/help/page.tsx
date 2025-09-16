export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* FAQ Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Frequently Asked Questions</h3>
        <ul className="space-y-3 text-gray-700 text-sm">
          <li>
            <strong>Q:</strong> How do I approve a booking?<br />
            <strong>A:</strong> Go to the Bookings page and change the status to Confirmed.
          </li>
          <li>
            <strong>Q:</strong> How can I generate a report?<br />
            <strong>A:</strong> Visit the Reports page, set a date range, and click Generate.
          </li>
          <li>
            <strong>Q:</strong> Can I reset my password?<br />
            <strong>A:</strong> Yes, go to Settings → Profile Settings and update your password.
          </li>
        </ul>
      </div>

      {/* Contact Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Need More Help?</h3>
        <p className="text-gray-600 mb-2">
          If you encounter any issues, please contact system support:
        </p>
        <p className="text-gray-700 font-medium">support@kampoibayo.com</p>
        <p className="text-gray-700">Phone: +63 912 345 6789</p>
      </div>
    </div>
  );
}
