import React, {
  useEffect,
  useState,
} from 'react';

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ReceiptText,
  WalletCards,
} from 'lucide-react';

import { supabase } from '../../services/supabase';

import '../../styles/MyReceipts.css';

const MyReceipts = ({ userId }) => {
  const [receipts, setReceipts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedReceipt, setSelectedReceipt] =
    useState(null);

  useEffect(() => {
    if (userId) {
      fetchReceipts();
    }
  }, [userId]);

  const fetchReceipts = async () => {
    setLoading(true);

    try {
      /* =====================================
         FIND ALL CLIENT MEMBERSHIPS

         A member can have more than one
         historical membership after a plan
         upgrade/switch. Keep all membership
         IDs so old receipts remain visible.
      ====================================== */

      const {
        data: members,
        error: memberError,
      } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', userId);

      if (memberError) {
        throw memberError;
      }

      const memberIds =
        (members || []).map(
          (item) => item.id
        );

      if (memberIds.length === 0) {
        setReceipts([]);
        return;
      }

      /* =====================================
         GET APPROVED PAYMENTS
      ====================================== */

      const {
        data: payments,
        error: paymentsError,
      } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_method,
          payment_date,
          status,
          receipt_number,
          created_at,
          transaction_type,
          previous_plan_id,
          new_plan_id
        `)
        .in(
          'member_id',
          memberIds
        )
        .eq(
          'status',
          'approved'
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

      if (paymentsError) {
        throw paymentsError;
      }

      if (
        !payments ||
        payments.length === 0
      ) {
        setReceipts([]);
        return;
      }

      /* =====================================
         PAYMENT IDS
      ====================================== */

      const paymentIds =
        payments.map(
          (payment) =>
            payment.id
        );

      /* =====================================
         GET APPROVED RECEIPTS
      ====================================== */

      const {
        data: receiptData,
        error: receiptError,
      } = await supabase
        .from('receipts')
        .select(`
          id,
          payment_id,
          receipt_number,
          member_name,
          plan_name,
          amount,
          cash_received,
          change_amount,
          receipt_type,
          previous_plan_name,
          new_plan_name,
          additional_amount,
          is_approved,
          sent_to_member,
          generated_at,
          approved_at
        `)
        .in(
          'payment_id',
          paymentIds
        )
        .eq(
          'is_approved',
          true
        )
        .eq(
          'sent_to_member',
          true
        )
        .order(
          'generated_at',
          {
            ascending: false,
          }
        );

      if (receiptError) {
        throw receiptError;
      }

      /* =====================================
         MERGE PAYMENT DATA
      ====================================== */

      const paymentMap =
        new Map(
          payments.map(
            (payment) => [
              payment.id,
              payment,
            ]
          )
        );

      const finalReceipts =
        (receiptData || []).map(
          (receipt) => ({
            ...receipt,

            payment:
              paymentMap.get(
                receipt.payment_id
              ) || null,
          })
        );

      setReceipts(
        finalReceipts
      );
    } catch (error) {
      console.error(
        'Error fetching receipts:',
        error
      );

      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleReceipt = (
    receiptId
  ) => {
    setSelectedReceipt(
      (current) =>
        current === receiptId
          ? null
          : receiptId
    );
  };

  const formatAmount = (
    value
  ) => {
    return Number(
      value || 0
    ).toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const formatDate = (
    value
  ) => {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    ).format(
      new Date(value)
    );
  };

  const getCashReceived = (
    receipt
  ) => {
    /*
      Older receipts may have the
      default value of 0. In that case
      the receipt was most likely created
      before cash tracking was added.
    */

    if (
      receipt.cash_received !==
        null &&
      receipt.cash_received !==
        undefined &&
      Number(receipt.cash_received) >
        0
    ) {
      return Number(
        receipt.cash_received
      );
    }

    return Number(
      receipt.amount || 0
    );
  };

  const getChange = (
    receipt
  ) => {
    if (
      receipt.change_amount !==
        null &&
      receipt.change_amount !==
        undefined
    ) {
      return Number(
        receipt.change_amount
      );
    }

    return 0;
  };

  if (loading) {
    return (
      <section className="client-receipts">
        <div className="client-receipts-loading">

          <div className="client-receipts-spinner" />

          <h3>
            Loading your receipts...
          </h3>

          <p>
            Please wait while we load
            your approved payment history.
          </p>

        </div>
      </section>
    );
  }

  return (
    <section className="client-receipts">

      {/* =================================
          HEADER
      ================================== */}

      <div className="client-receipts-header">

        <div className="client-receipts-heading">

          <div className="client-receipts-heading-icon">
            <ReceiptText size={19} />
          </div>

          <div>

            <p className="client-receipts-kicker">
              PAYMENT HISTORY
            </p>

            <h2>
              My Receipts
            </h2>

            <p>
              View your approved membership
              payment receipts and cash details.
            </p>

          </div>

        </div>

        <div className="client-receipts-count">

          <ReceiptText size={14} />

          <span>
            {receipts.length}{' '}
            {receipts.length === 1
              ? 'receipt'
              : 'receipts'}
          </span>

        </div>

      </div>

      {/* =================================
          EMPTY
      ================================== */}

      {receipts.length === 0 ? (

        <div className="client-receipts-empty">

          <div className="client-receipts-empty-icon">
            <ReceiptText size={24} />
          </div>

          <p className="client-receipts-kicker">
            PAYMENT HISTORY
          </p>

          <h3>
            No approved receipts yet
          </h3>

          <p>
            Your receipt will appear here
            once your payment has been
            approved and sent to your
            member account.
          </p>

        </div>

      ) : (

        <div className="client-receipts-list">

          {receipts.map(
            (receipt) => {

              const expanded =
                selectedReceipt ===
                receipt.id;

              const amount =
                Number(
                  receipt.amount || 0
                );

              const cashReceived =
                getCashReceived(
                  receipt
                );

              const change =
                getChange(
                  receipt
                );

              return (
                <article
                  key={
                    receipt.id
                  }
                  className={`client-receipt-card ${
                    expanded
                      ? 'is-expanded'
                      : ''
                  }`}
                >

                  {/* =========================
                      RECEIPT HEADER
                  ========================== */}

                  <button
                    type="button"
                    className="client-receipt-summary"
                    onClick={() =>
                      toggleReceipt(
                        receipt.id
                      )
                    }
                  >

                    <div className="client-receipt-summary-left">

                      <div className="client-receipt-icon">
                        <ReceiptText
                          size={17}
                        />
                      </div>

                      <div>

                        <span className="client-receipt-label">
                          RECEIPT NUMBER
                        </span>

                        <strong>
                          #
                          {
                            receipt.receipt_number
                          }
                        </strong>

                        <small>
                          <CalendarDays
                            size={11}
                          />

                          {formatDate(
                            receipt.generated_at
                          )}
                        </small>

                      </div>

                    </div>

                    <div className="client-receipt-summary-right">

                      <strong className="client-receipt-total">
                        ₱
                        {formatAmount(
                          amount
                        )}
                      </strong>

                      <span className="client-receipt-approved">
                        <CheckCircle2
                          size={12}
                        />
                        Approved
                      </span>

                      <span className="client-receipt-chevron">

                        {expanded ? (
                          <ChevronUp
                            size={17}
                          />
                        ) : (
                          <ChevronDown
                            size={17}
                          />
                        )}

                      </span>

                    </div>

                  </button>

                  {/* =========================
                      DETAILS
                  ========================== */}

                  {expanded && (

                    <div className="client-receipt-details">

                      {/* BASIC */}

                      <div className="client-receipt-grid">

                        <div className="client-receipt-detail">

                          <span>
                            MEMBER
                          </span>

                          <strong>
                            {
                              receipt.member_name ||
                              'N/A'
                            }
                          </strong>

                        </div>

                        <div className="client-receipt-detail">

                          <span>
                            MEMBERSHIP PLAN
                          </span>

                          <strong>
                            {
                              receipt.plan_name ||
                              'N/A'
                            }
                          </strong>

                        </div>

                        <div className="client-receipt-detail">

                          <span>
                            PAYMENT METHOD
                          </span>

                          <strong className="capitalize">
                            {receipt.payment
                              ?.payment_method ||
                              'cash'}
                          </strong>

                        </div>

                        <div className="client-receipt-detail">

                          <span>
                            PAYMENT STATUS
                          </span>

                          <strong className="client-receipt-paid">
                            <CheckCircle2
                              size={13}
                            />

                            Paid
                          </strong>

                        </div>

                      </div>

                      {/* =======================
                          MEMBERSHIP UPGRADE
                      ======================== */}

                      {(receipt.receipt_type ===
                        'membership_switch' ||
                        receipt.payment?.transaction_type ===
                          'membership_switch') && (

                        <div className="client-receipt-cash-section">

                          <div className="client-receipt-cash-heading">

                            <div className="client-receipt-cash-icon">
                              <CreditCard
                                size={17}
                              />
                            </div>

                            <div>

                              <p>
                                MEMBERSHIP UPGRADE
                              </p>

                              <span>
                                Plan switch details
                              </span>

                            </div>

                          </div>

                          <div className="client-receipt-grid">

                            <div className="client-receipt-detail">

                              <span>
                                PREVIOUS PLAN
                              </span>

                              <strong>
                                {receipt.previous_plan_name ||
                                  'N/A'}
                              </strong>

                            </div>

                            <div className="client-receipt-detail">

                              <span>
                                NEW PLAN
                              </span>

                              <strong>
                                {receipt.new_plan_name ||
                                  receipt.plan_name ||
                                  'N/A'}
                              </strong>

                            </div>

                            <div className="client-receipt-detail">

                              <span>
                                ADDITIONAL AMOUNT
                              </span>

                              <strong>
                                ₱
                                {formatAmount(
                                  receipt.additional_amount ??
                                    receipt.amount
                                )}
                              </strong>

                            </div>

                            <div className="client-receipt-detail">

                              <span>
                                TRANSACTION
                              </span>

                              <strong>
                                Membership Upgrade
                              </strong>

                            </div>

                          </div>

                        </div>

                      )}

                      {/* =======================
                          CASH BREAKDOWN
                      ======================== */}

                      <div className="client-receipt-cash-section">

                        <div className="client-receipt-cash-heading">

                          <div className="client-receipt-cash-icon">
                            <WalletCards
                              size={17}
                            />
                          </div>

                          <div>

                            <p>
                              CASH PAYMENT
                            </p>

                            <span>
                              Payment breakdown
                            </span>

                          </div>

                        </div>

                        <div className="client-receipt-cash-grid">

                          {/* AMOUNT DUE */}

                          <div className="client-receipt-cash-card">

                            <span>
                              AMOUNT TO PAY
                            </span>

                            <strong>
                              ₱
                              {formatAmount(
                                amount
                              )}
                            </strong>

                          </div>

                          {/* CASH RECEIVED */}

                          <div className="client-receipt-cash-card">

                            <span>
                              CASH RECEIVED
                            </span>

                            <strong>
                              ₱
                              {formatAmount(
                                cashReceived
                              )}
                            </strong>

                          </div>

                          {/* CHANGE */}

                          <div className="client-receipt-cash-card change">

                            <span>
                              CHANGE
                            </span>

                            <strong>
                              ₱
                              {formatAmount(
                                change
                              )}
                            </strong>

                          </div>

                        </div>

                      </div>

                      {/* =======================
                          PAYMENT CHECK
                      ======================== */}

                      <div className="client-receipt-payment-check">

                        <span className="client-receipt-check-icon">
                          <CheckCircle2
                            size={16}
                          />
                        </span>

                        <div>

                          <strong>
                            Payment confirmed
                          </strong>

                          <span>
                            {receipt.receipt_type ===
                              'membership_switch'
                              ? 'Your membership upgrade payment was approved and this receipt was sent to your member account.'
                              : 'Your payment was approved and this receipt was sent to your member account.'}
                          </span>

                        </div>

                      </div>

                      {/* =======================
                          DATE DETAILS
                      ======================== */}

                      <div className="client-receipt-date-row">

                        <div>

                          <span>
                            RECEIPT GENERATED
                          </span>

                          <strong>
                            {formatDate(
                              receipt.generated_at
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            APPROVED
                          </span>

                          <strong>
                            {formatDate(
                              receipt.approved_at
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>

                  )}

                </article>
              );
            }
          )}

        </div>
      )}

    </section>
  );
};

export default MyReceipts;