import { useState } from 'react';
import { Clock, DollarSign, Info } from 'lucide-react';

interface CancellationPolicyProps {
  checkInDate: string;
  totalAmount: number;
  onConfirm?: (refundAmount: number) => void;
}

export function CancellationPolicy({ checkInDate, totalAmount, onConfirm }: CancellationPolicyProps) {
  const [showPolicy, setShowPolicy] = useState(false);

  const calculateRefundAmount = (): { amount: number; percentage: number; timeRemaining: string; canCancel: boolean } => {
    const checkIn = new Date(checkInDate);
    const now = new Date();
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let percentage: number;
    let timeRemaining: string;
    let canCancel: boolean = true;
    
    if (hoursUntilCheckIn >= 48) {
      percentage = 100;
      timeRemaining = `${Math.floor(hoursUntilCheckIn / 24)} days`;
    } else if (hoursUntilCheckIn >= 24) {
      percentage = 50;
      timeRemaining = `${Math.floor(hoursUntilCheckIn)} hours`;
    } else {
      percentage = 0;
      timeRemaining = `${Math.floor(hoursUntilCheckIn)} hours`;
      canCancel = false; // No cancellation within 24 hours
    }
    
    // Calculate refund based on down payment (50% of total)
    const downPayment = totalAmount * 0.5;
    const refundAmount = Math.round(downPayment * (percentage / 100));
    
    return { amount: refundAmount, percentage, timeRemaining, canCancel };
  };

  const { amount, percentage, timeRemaining, canCancel } = calculateRefundAmount();
  const downPayment = totalAmount * 0.5;
  const remainingBalance = totalAmount - downPayment;

  return (
    <div className="space-y-4">
      {!canCancel && (
        <div className="p-4 rounded-lg border bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <Info className="w-5 h-5" />
            <span className="font-semibold">Cancellation Not Allowed</span>
          </div>
          <p className="text-red-800 text-sm mt-1">
            Cancellation is not allowed within 24 hours of check-in. Please contact the resort directly for assistance.
          </p>
        </div>
      )}

      {/* Down Payment Info */}
      <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Payment Structure</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-blue-100">
            <p className="font-medium text-blue-900">Down Payment (Paid)</p>
            <p className="text-lg font-bold text-blue-900">₱{downPayment.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded bg-gray-100">
            <p className="font-medium text-gray-900">Pay on Arrival</p>
            <p className="text-lg font-bold text-gray-900">₱{remainingBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Refund Policy Summary */}
      {canCancel && (
        <div className={`p-4 rounded-lg border ${
          percentage >= 75 ? 'bg-green-50 border-green-200' :
          percentage >= 50 ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              percentage >= 75 ? 'bg-green-500' :
              percentage >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`font-semibold ${
                percentage >= 75 ? 'text-green-900' :
                percentage >= 50 ? 'text-yellow-900' :
                'text-red-900'
              }`}>
                Refund Amount: ₱{amount.toLocaleString()} ({percentage}% of down payment)
              </h3>
              <p className={`text-sm ${
                percentage >= 75 ? 'text-green-800' :
                percentage >= 50 ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                <Clock className="w-4 h-4 inline mr-1" />
                Time until check-in: {timeRemaining}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`p-2 rounded ${
              percentage >= 75 ? 'bg-green-100' :
              percentage >= 50 ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <p className={`font-medium ${
                percentage >= 75 ? 'text-green-900' :
                percentage >= 50 ? 'text-yellow-900' :
                'text-red-900'
              }`}>Down Payment</p>
              <p className={`text-lg ${
                percentage >= 75 ? 'text-green-900' :
                percentage >= 50 ? 'text-yellow-900' :
                'text-red-900'
              }`}>₱{downPayment.toLocaleString()}</p>
            </div>
            <div className={`p-2 rounded ${
              percentage >= 75 ? 'bg-green-100' :
              percentage >= 50 ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <p className={`font-medium ${
                percentage >= 75 ? 'text-green-900' :
                percentage >= 50 ? 'text-yellow-900' :
                'text-red-900'
              }`}>Refund Amount</p>
              <p className={`text-lg font-bold ${
                percentage >= 75 ? 'text-green-900' :
                percentage >= 50 ? 'text-yellow-900' :
                'text-red-900'
              }`}>₱{amount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Policy Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <button
          onClick={() => setShowPolicy(!showPolicy)}
          className="flex items-center gap-2 text-gray-900 hover:text-black transition-colors"
        >
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">View Cancellation Policy</span>
        </button>
        
        {showPolicy && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Refund Policy (Down Payment Only):</h4>
            <div className="space-y-2 text-sm text-gray-900">
              <div className="flex justify-between">
                <span>48+ hours before check-in:</span>
                <span className="font-medium text-green-800">100% down payment refund</span>
              </div>
              <div className="flex justify-between">
                <span>24-48 hours before:</span>
                <span className="font-medium text-yellow-800">50% down payment refund</span>
              </div>
              <div className="flex justify-between">
                <span>Less than 24 hours:</span>
                <span className="font-medium text-red-800">No refund - Contact resort</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
              <strong>Note:</strong> Only the down payment (50% of total) is refundable. The remaining 50% is paid on arrival at the resort.
            </div>
            <p className="text-xs text-gray-800 mt-2">
              Refunds will be processed within 5-10 business days to your original payment method.
            </p>
          </div>
        )}
      </div>

      {/* Confirm Button */}
      {onConfirm && canCancel && (
        <button
          onClick={() => onConfirm(amount)}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            percentage >= 75 ? 'bg-green-600 hover:bg-green-700' :
            percentage >= 50 ? 'bg-yellow-600 hover:bg-yellow-700' :
            'bg-red-600 hover:bg-red-700'
          }`}
        >
          Cancel Booking & Request ₱{amount.toLocaleString()} Refund
        </button>
      )}

      {!canCancel && (
        <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-900">
          <p className="text-sm">For assistance with your booking, please call the resort directly.</p>
        </div>
      )}
    </div>
  );
}