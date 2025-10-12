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

      {/* Policy Details - Enhanced Professional UI */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => setShowPolicy(!showPolicy)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          type="button"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Cancellation Policy Details</span>
          </div>
          <div className={`transform transition-transform duration-200 ${showPolicy ? 'rotate-180' : 'rotate-0'}`}>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        <div className={`transition-all duration-300 ease-in-out ${showPolicy ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="px-4 pb-4">
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Refund Policy Structure</h4>
              
              {/* Policy Table */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">48+ hours before check-in</span>
                    </div>
                    <span className="text-sm font-semibold text-green-700">100% refund</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">24-48 hours before</span>
                    </div>
                    <span className="text-sm font-semibold text-yellow-700">50% refund</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-white rounded-md border border-red-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Less than 24 hours</span>
                    </div>
                    <span className="text-sm font-semibold text-red-700">No refund</span>
                  </div>
                </div>
              </div>
              
              {/* Important Notes */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-blue-900">Important Information:</p>
                    <p className="text-xs text-blue-800">
                      • Only the down payment (50% of total booking) is refundable<br/>
                      • Remaining 50% is paid upon arrival at the resort<br/>
                      • Refunds processed within 5-10 business days to original payment method
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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