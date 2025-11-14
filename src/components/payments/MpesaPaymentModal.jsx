import React, { useState, useEffect } from 'react';
import { X, Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { mpesaApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MpesaPaymentModal = ({ isOpen, onClose, invoice, amount, businessId, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const queryClient = useQueryClient();

  // Initiate payment mutation
  const initiatePaymentMutation = useMutation({
    mutationFn: (data) => mpesaApi.initiatePayment(data),
    onSuccess: (data) => {
      if (data.success) {
        setPaymentId(data.payment_id);
        setIsPolling(true);
        toast.success('Payment request sent! Please check your phone and enter your M-Pesa PIN.');
      } else {
        toast.error(data.error || 'Failed to initiate payment');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
    },
  });

  // Poll payment status
  const { data: paymentStatus } = useQuery({
    queryKey: ['mpesa-payment-status', paymentId],
    queryFn: () => mpesaApi.getPaymentStatus(paymentId),
    enabled: isPolling && !!paymentId,
    refetchInterval: (data) => {
      // Stop polling if payment is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        setIsPolling(false);
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
  });

  // Handle payment status updates
  useEffect(() => {
    if (paymentStatus) {
      if (paymentStatus.status === 'completed') {
        toast.success('Payment completed successfully!');
        queryClient.invalidateQueries(['invoices']);
        queryClient.invalidateQueries(['transactions']);
        queryClient.invalidateQueries(['notifications']);
        if (onSuccess) onSuccess(paymentStatus);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else if (paymentStatus.status === 'failed') {
        toast.error(paymentStatus.error_message || 'Payment failed');
        setIsPolling(false);
      }
    }
  }, [paymentStatus, onSuccess, onClose, queryClient]);

  const resetForm = () => {
    setPhoneNumber('');
    setPaymentId(null);
    setIsPolling(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate phone number (Kenyan format)
    const cleanedPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+/, '');
    if (!cleanedPhone.match(/^(254|0)[0-9]{9}$/)) {
      toast.error('Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)');
      return;
    }

    initiatePaymentMutation.mutate({
      phone_number: cleanedPhone.startsWith('0') ? '254' + cleanedPhone.substring(1) : cleanedPhone,
      amount: amount || invoice?.total_amount || 0,
      business: businessId,
      invoice: invoice?.id,
      account_reference: invoice ? `INV-${invoice.invoice_number}` : 'PAYMENT',
      transaction_desc: invoice ? `Payment for invoice ${invoice.invoice_number}` : 'Payment',
    });
  };

  const handleClose = () => {
    if (!isPolling) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const displayAmount = amount || invoice?.total_amount || 0;
  const paymentStatusDisplay = paymentStatus?.status;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pay with M-Pesa</h2>
              <p className="text-sm text-gray-500">Enter your phone number to receive payment request</p>
            </div>
          </div>
          {!isPolling && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount to Pay</span>
              <span className="text-2xl font-bold text-blue-600">
                KES {parseFloat(displayAmount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {invoice && (
              <div className="mt-2 text-sm text-gray-600">
                Invoice: <span className="font-semibold">{invoice.invoice_number}</span>
              </div>
            )}
          </div>

          {/* Payment Status */}
          {paymentStatusDisplay && (
            <div className="mb-6">
              {paymentStatusDisplay === 'initiated' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-yellow-900">Waiting for payment...</p>
                    <p className="text-sm text-yellow-700">Please check your phone and enter your M-Pesa PIN</p>
                  </div>
                </div>
              )}
              {paymentStatusDisplay === 'processing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-blue-900">Processing payment...</p>
                    <p className="text-sm text-blue-700">Please wait while we confirm your payment</p>
                  </div>
                </div>
              )}
              {paymentStatusDisplay === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Payment Successful!</p>
                    {paymentStatus.mpesa_receipt_number && (
                      <p className="text-sm text-green-700">
                        Receipt: {paymentStatus.mpesa_receipt_number}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {paymentStatusDisplay === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900">Payment Failed</p>
                    <p className="text-sm text-red-700">
                      {paymentStatus.error_message || 'Payment could not be processed'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setPaymentId(null);
                        setIsPolling(false);
                        resetForm();
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Form */}
          {!paymentStatusDisplay || paymentStatusDisplay === 'failed' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone_number">M-Pesa Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={initiatePaymentMutation.isPending}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your M-Pesa registered phone number
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">What happens next?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>You'll receive an M-Pesa prompt on your phone</li>
                  <li>Enter your M-Pesa PIN to authorize the payment</li>
                  <li>Payment will be processed automatically</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={initiatePaymentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={initiatePaymentMutation.isPending}
                >
                  {initiatePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">
                {paymentStatusDisplay === 'initiated' || paymentStatusDisplay === 'processing'
                  ? 'Please complete the payment on your phone'
                  : 'Payment completed successfully'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MpesaPaymentModal;


