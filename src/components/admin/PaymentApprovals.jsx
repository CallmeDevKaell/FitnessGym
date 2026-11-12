import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

const PaymentApprovals = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        member:member_id(
          user:user_id(full_name, email, contact_number)
        ),
        receipts(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (!error) setPendingPayments(data || []);
    setLoading(false);
  };

  const handleApprove = async (paymentId, receiptId) => {
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update receipt
      const { error: receiptError } = await supabase
        .from('receipts')
        .update({ 
          is_approved: true,
          approved_at: new Date().toISOString(),
          sent_to_member: true
        })
        .eq('id', receiptId);

      if (receiptError) throw receiptError;

      alert('Payment approved and receipt sent to member!');
      fetchPendingPayments();
    } catch (error) {
      alert('Error approving payment: ' + error.message);
    }
  };

  const handleReject = async (paymentId) => {
    if (window.confirm('Reject this payment?')) {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);
      
      if (!error) {
        alert('Payment rejected.');
        fetchPendingPayments();
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🧾 Payment Approvals</h2>
      <p className="text-gray-600 mb-4">Review and approve payments processed by employees.</p>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : pendingPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          ✅ No pending payment approvals.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <p className="font-semibold">Receipt #{payment.receipt_number}</p>
                  <p className="text-sm text-gray-600">
                    Member: {payment.member?.user?.full_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {payment.member?.user?.email || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact: {payment.member?.user?.contact_number || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: <span className="font-bold text-green-600">₱{payment.amount.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Method: <span className="capitalize">{payment.payment_method}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Date: {new Date(payment.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col space-y-2 mt-4 md:mt-0">
                  <button
                    onClick={() => handleApprove(payment.id, payment.receipts?.[0]?.id)}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleReject(payment.id)}
                    className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentApprovals;