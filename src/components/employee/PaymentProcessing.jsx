import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  ReceiptText,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';

import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

import '../../styles/PaymentProcessing.css';

const PaymentProcessing = () => {
  const { user } = useAuth();

  // =========================================
  // STATE
  // =========================================

  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedClient, setSelectedClient] =
    useState(null);

  const [selectedPlan, setSelectedPlan] =
    useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Current active membership of the selected client.
  const [currentMembership, setCurrentMembership] =
    useState(null);

  const [membershipLoading, setMembershipLoading] =
    useState(false);

  // Employee receipt preview.
  const [selectedReceipt, setSelectedReceipt] =
    useState(null);

  const [receiptLoading, setReceiptLoading] =
    useState(false);

  // Cash received from client
  const [cashReceived, setCashReceived] = useState('');

  // Payment currently being approved/rejected
  const [reviewingPaymentId, setReviewingPaymentId] =
    useState(null);

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadPaymentWorkspace();
  }, []);

  const loadPaymentWorkspace = async () => {
    setPageLoading(true);

    try {
      await Promise.all([
        fetchClients(),
        fetchPlans(),
        fetchPayments(),
      ]);
    } finally {
      setPageLoading(false);
    }
  };

  // =========================================
  // FETCH APPROVED CLIENTS
  // =========================================

  const fetchClients = async () => {
    try {
      /*
        Uses the secure RPC because employees
        need to see approved clients even when
        users table RLS prevents a direct query.
      */

      const { data, error } = await supabase.rpc(
        'employee_get_approved_clients'
      );

      if (error) {
        console.error(
          'Error fetching approved clients:',
          error
        );

        setClients([]);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error(
        'Approved clients fetch error:',
        error
      );

      setClients([]);
    }
  };

  // =========================================
  // FETCH ACTIVE MEMBERSHIP PLANS
  // =========================================

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Error fetching membership plans:',
          error
        );

        setPlans([]);
        return;
      }

      setPlans(data || []);
    } catch (error) {
      console.error(
        'Membership plan fetch error:',
        error
      );

      setPlans([]);
    }
  };

  // =========================================
  // FETCH PAYMENTS
  // =========================================

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          member:member_id(
            user:user_id(
              full_name,
              email,
              id_number
            )
          )
        `)
        .order('created_at', {
          ascending: false,
        })
        .limit(50);

      if (error) {
        console.error(
          'Error fetching payments:',
          error
        );

        setPayments([]);
        return;
      }

      setPayments(data || []);
    } catch (error) {
      console.error(
        'Payment fetch error:',
        error
      );

      setPayments([]);
    }
  };

  // =========================================
  // FILTER CLIENTS
  // =========================================

  const filteredClients = useMemo(() => {
    const keyword = searchTerm
      .trim()
      .toLowerCase();

    if (!keyword) {
      return clients;
    }

    return clients.filter((client) => {
      const name = String(
        client.full_name || ''
      ).toLowerCase();

      const idNumber = String(
        client.id_number || ''
      ).toLowerCase();

      const email = String(
        client.email || ''
      ).toLowerCase();

      return (
        name.includes(keyword) ||
        idNumber.includes(keyword) ||
        email.includes(keyword)
      );
    });
  }, [clients, searchTerm]);

  // =========================================
  // FETCH CURRENT ACTIVE MEMBERSHIP
  // =========================================

  const fetchCurrentMembership = async (
    clientId
  ) => {
    if (!clientId) {
      setCurrentMembership(null);
      return;
    }

    setMembershipLoading(true);

    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          user_id,
          membership_plan_id,
          card_number,
          start_date,
          end_date,
          status,
          created_at,
          membership_plan:membership_plan_id(
            id,
            name,
            description,
            duration_months,
            price
          )
        `)
        .eq('user_id', clientId)
        .eq('status', 'active')
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setCurrentMembership(data || null);
    } catch (error) {
      console.error(
        'Current membership fetch error:',
        error
      );

      setCurrentMembership(null);
    } finally {
      setMembershipLoading(false);
    }
  };

  // =========================================
  // PAYMENT STATISTICS
  // =========================================

  const approvedPayments = payments.filter(
    (payment) =>
      payment.status === 'approved'
  ).length;

  const pendingPayments = payments.filter(
    (payment) =>
      payment.status === 'pending'
  ).length;

  const rejectedPayments = payments.filter(
    (payment) =>
      payment.status === 'rejected'
  ).length;

  const totalApprovedAmount = payments
    .filter(
      (payment) =>
        payment.status === 'approved'
    )
    .reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

  // =========================================
  // MEMBERSHIP SWITCH / CASH COMPUTATION
  // =========================================

  const currentPlan =
    currentMembership?.membership_plan || null;

  const currentPlanPrice =
    Number(currentPlan?.price || 0);

  const selectedPlanPrice =
    Number(selectedPlan?.price || 0);

  const isDifferentPlan =
    Boolean(
      currentMembership &&
      selectedPlan &&
      currentMembership.membership_plan_id !==
        selectedPlan.id
    );

  const upgradeDifference =
    selectedPlanPrice - currentPlanPrice;

  const isMembershipUpgrade =
    isDifferentPlan &&
    upgradeDifference > 0;

  const isMembershipDowngrade =
    isDifferentPlan &&
    upgradeDifference < 0;

  // Same plan = normal payment/renewal.
  // Higher plan = price difference only.
  // Lower plan = blocked by this workflow.
  const isMembershipSwitch =
    isMembershipUpgrade;

  const amountDue =
    isMembershipUpgrade
      ? upgradeDifference
      : selectedPlan
        ? selectedPlanPrice
        : 0;

  const receivedAmount = Number(
    cashReceived || 0
  );

  const changeAmount =
    receivedAmount >= amountDue
      ? receivedAmount - amountDue
      : 0;

  const insufficientAmount =
    receivedAmount < amountDue
      ? amountDue - receivedAmount
      : 0;

  const isPaymentSufficient =
    !isMembershipDowngrade &&
    amountDue > 0 &&
    receivedAmount >= amountDue;

  // =========================================
  // FORM HELPERS
  // =========================================

  const resetForm = () => {
    setSelectedClient(null);
    setSelectedPlan(null);
    setSearchTerm('');
    setCurrentMembership(null);
    setMembershipLoading(false);
    setCashReceived('');
    setSelectedReceipt(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (loading) {
      return;
    }

    setShowModal(false);
    resetForm();
  };

  const handleClientChange = (event) => {
    const clientId = event.target.value;

    const client = clients.find(
      (item) =>
        item.id === clientId
    );

    setSelectedClient(
      client || null
    );

    setSelectedPlan(null);
    setCashReceived('');

    fetchCurrentMembership(
      clientId
    );
  };

  const handlePlanChange = (event) => {
    const planId = event.target.value;

    const plan = plans.find(
      (item) =>
        item.id === planId
    );

    setSelectedPlan(
      plan || null
    );

    // Reset cash when changing the plan
    setCashReceived('');
  };

  const handleCashChange = (event) => {
    const value = event.target.value;

    if (value === '') {
      setCashReceived('');
      return;
    }

    const numericValue =
      Number(value);

    if (
      Number.isNaN(numericValue) ||
      numericValue < 0
    ) {
      return;
    }

    setCashReceived(value);
  };

  // =========================================
  // PROCESS PAYMENT
  // =========================================

  const handleProcessPayment = async (
    event
  ) => {
    event.preventDefault();

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!selectedClient) {
      alert(
        'Please select a member.'
      );
      return;
    }

    if (!selectedPlan) {
      alert(
        'Please select a membership plan.'
      );
      return;
    }

    if (membershipLoading) {
      alert(
        'Please wait while the current membership is loaded.'
      );
      return;
    }

    if (isMembershipDowngrade) {
      alert(
        `This member currently has ${currentPlan?.name || 'an active plan'} ` +
        `at ₱${formatAmount(currentPlanPrice)}.

` +
        `The selected ${selectedPlan.name} plan is lower at ` +
        `₱${formatAmount(selectedPlanPrice)}.

` +
        `This workflow currently supports upgrades only.`
      );
      return;
    }

    if (
      !amountDue ||
      amountDue <= 0
    ) {
      alert(
        'The selected membership plan has an invalid price.'
      );
      return;
    }

    if (
      !cashReceived ||
      receivedAmount <= 0
    ) {
      alert(
        'Please enter the cash received from the client.'
      );
      return;
    }

    if (!isPaymentSufficient) {
      alert(
        `Insufficient payment.

` +
        `Amount due: ₱${formatAmount(
          amountDue
        )}
` +
        `Cash received: ₱${formatAmount(
          receivedAmount
        )}
` +
        `Still needed: ₱${formatAmount(
          insufficientAmount
        )}`
      );

      return;
    }

    if (!user?.id) {
      alert(
        'Employee session not found.'
      );
      return;
    }

    setLoading(true);

    try {
      // -----------------------------
      // RECEIPT NUMBER
      // -----------------------------

      const receiptNumber =
        `RCP-${Date.now()}`;

      let memberId = null;

      // -----------------------------
      // CHECK EXISTING ACTIVE MEMBER
      // -----------------------------

      const {
        data: existingMember,
        error: existingMemberError,
      } = await supabase
        .from('members')
        .select(`
          id,
          user_id,
          membership_plan_id,
          card_number,
          status
        `)
        .eq(
          'user_id',
          selectedClient.id
        )
        .eq(
          'status',
          'active'
        )
        .order(
          'created_at',
          { ascending: false }
        )
        .limit(1)
        .maybeSingle();

      if (existingMemberError) {
        throw existingMemberError;
      }

      memberId =
        existingMember?.id || null;

      // -----------------------------
      // NORMAL MEMBERSHIP PAYMENT
      //
      // New membership can be created
      // or an existing membership renewed.
      // -----------------------------

      if (!isMembershipSwitch) {

        if (!memberId) {
          const startDate =
            new Date();

          const endDate =
            new Date();

          endDate.setMonth(
            endDate.getMonth() +
              Number(
                selectedPlan.duration_months ||
                  1
              )
          );

          const {
            data: newMember,
            error: memberError,
          } = await supabase
            .from('members')
            .insert([
              {
                user_id:
                  selectedClient.id,

                membership_plan_id:
                  selectedPlan.id,

                card_number:
                  `CARD-${selectedClient.id_number}`,

                start_date:
                  startDate
                    .toISOString()
                    .split('T')[0],

                end_date:
                  endDate
                    .toISOString()
                    .split('T')[0],

                status:
                  'active',

                created_by:
                  user.id,
              },
            ])
            .select()
            .single();

          if (memberError) {
            throw memberError;
          }

          memberId =
            newMember.id;
        } else {
          const startDate =
            new Date();

          const endDate =
            new Date();

          endDate.setMonth(
            endDate.getMonth() +
              Number(
                selectedPlan.duration_months ||
                  1
              )
          );

          const {
            error:
              updateMemberError,
          } = await supabase
            .from('members')
            .update({
              membership_plan_id:
                selectedPlan.id,

              start_date:
                startDate
                  .toISOString()
                  .split('T')[0],

              end_date:
                endDate
                  .toISOString()
                  .split('T')[0],

              status:
                'active',

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              memberId
            );

          if (updateMemberError) {
            throw updateMemberError;
          }
        }

      } else {

        // -----------------------------
        // MEMBERSHIP UPGRADE
        //
        // IMPORTANT:
        // Do NOT cancel/update the old
        // membership here.
        //
        // The employee approval RPC
        // does that after approval.
        // -----------------------------

        if (!memberId) {
          throw new Error(
            'The member does not have an active membership to upgrade.'
          );
        }

        if (
          !currentMembership ||
          currentMembership.id !== memberId
        ) {
          throw new Error(
            'The current membership could not be verified. Please reselect the member.'
          );
        }

      }

      // -----------------------------
      // CREATE PAYMENT
      //
      // Normal:
      // full selected plan price.
      //
      // Upgrade:
      // price difference only.
      // -----------------------------

      const {
        data: paymentData,
        error: paymentError,
      } = await supabase
        .from('payments')
        .insert([
          {
            member_id:
              memberId,

            amount:
              amountDue,

            payment_method:
              'cash',

            receipt_number:
              receiptNumber,

            generated_by:
              user.id,

            status:
              'pending',

            transaction_type:
              isMembershipSwitch
                ? 'membership_switch'
                : 'membership',

            previous_plan_id:
              isMembershipSwitch
                ? currentMembership.membership_plan_id
                : null,

            new_plan_id:
              isMembershipSwitch
                ? selectedPlan.id
                : null,
          },
        ])
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // -----------------------------
      // CREATE RECEIPT
      // -----------------------------

      const {
        error:
          receiptError,
      } = await supabase
        .from('receipts')
        .insert([
          {
            payment_id:
              paymentData.id,

            receipt_number:
              receiptNumber,

            member_name:
              selectedClient.full_name,

            plan_name:
              selectedPlan.name,

            amount:
              amountDue,

            cash_received:
              receivedAmount,

            change_amount:
              changeAmount,

            generated_by:
              user.id,

            is_approved:
              false,

            sent_to_member:
              false,

            receipt_type:
              isMembershipSwitch
                ? 'membership_switch'
                : 'membership',

            previous_plan_name:
              isMembershipSwitch
                ? currentMembership.membership_plan?.name
                : null,

            new_plan_name:
              isMembershipSwitch
                ? selectedPlan.name
                : null,

            additional_amount:
              isMembershipSwitch
                ? amountDue
                : null,
          },
        ]);

      if (receiptError) {
        throw receiptError;
      }

      // -----------------------------
      // CREATE PAYMENT APPROVAL REQUEST
      // -----------------------------

      const {
        error:
          approvalError,
      } = await supabase
        .from('approval_requests')
        .insert([
          {
            request_type:
              'payment',

            requested_by:
              user.id,

            target_id:
              paymentData.id,

            status:
              'pending',
          },
        ]);

      if (approvalError) {
        throw approvalError;
      }

      // -----------------------------
      // SUCCESS
      // -----------------------------

      if (isMembershipSwitch) {
        alert(
          `Membership upgrade request created successfully!\n\n` +
          `Current Plan: ${currentPlan?.name}\n` +
          `New Plan: ${selectedPlan.name}\n\n` +
          `Current Plan Price: ₱${formatAmount(
            currentPlanPrice
          )}\n` +
          `New Plan Price: ₱${formatAmount(
            selectedPlanPrice
          )}\n` +
          `Additional Amount Due: ₱${formatAmount(
            amountDue
          )}\n\n` +
          `Cash Received: ₱${formatAmount(
            receivedAmount
          )}\n` +
          `Change: ₱${formatAmount(
            changeAmount
          )}\n\n` +
          `Status: Waiting for employee approval.\n` +
          `The old membership will be cancelled only after approval.`
        );
      } else {
        alert(
          `Payment processed successfully!\n\n` +
          `Receipt: ${receiptNumber}\n\n` +
          `Amount Due: ₱${formatAmount(
            amountDue
          )}\n` +
          `Cash Received: ₱${formatAmount(
            receivedAmount
          )}\n` +
          `Change: ₱${formatAmount(
            changeAmount
          )}\n\n` +
          `Status: Waiting for employee approval.`
        );
      }

      setShowModal(false);
      resetForm();

      await Promise.all([
        fetchPayments(),
        fetchClients(),
      ]);
    } catch (error) {
      console.error(
        'Payment processing error:',
        error
      );

      alert(
        `Unable to process payment:\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // VIEW RECEIPT
  // =========================================

  const viewReceipt = async (
    payment
  ) => {
    setReceiptLoading(true);

    try {
      const {
        data,
        error,
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
        .eq(
          'payment_id',
          payment.id
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          'Receipt record was not found.'
        );
      }

      setSelectedReceipt(data);
    } catch (error) {
      console.error(
        'Receipt fetch error:',
        error
      );

      alert(
        `Unable to load receipt:\n${error.message}`
      );
    } finally {
      setReceiptLoading(false);
    }
  };

  // =========================================
  // APPROVE PAYMENT
  // =========================================

  const handleApprovePayment = async (
    payment
  ) => {
    const confirmed =
      window.confirm(
        `Approve payment #${payment.receipt_number}?\n\n` +
        `Member: ${
          payment.member?.user
            ?.full_name ||
          'Unknown'
        }\n` +
        `Amount: ₱${formatAmount(
          payment.amount
        )}`
      );

    if (!confirmed) {
      return;
    }

    setReviewingPaymentId(
      payment.id
    );

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        'employee_review_payment',
        {
          p_payment_id:
            payment.id,

          p_action:
            'approve',

          p_rejection_reason:
            null,
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          'Payment approval failed.'
        );
      }

      alert(
        `Payment #${payment.receipt_number} approved successfully.`
      );

      await fetchPayments();
    } catch (error) {
      console.error(
        'Approve payment error:',
        error
      );

      alert(
        `Unable to approve payment:\n${error.message}`
      );
    } finally {
      setReviewingPaymentId(
        null
      );
    }
  };

  // =========================================
  // REJECT PAYMENT
  // =========================================

  const handleRejectPayment = async (
    payment
  ) => {
    const reason =
      window.prompt(
        `Reason for rejecting payment #${payment.receipt_number}:`
      );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      alert(
        'Please provide a rejection reason.'
      );

      return;
    }

    setReviewingPaymentId(
      payment.id
    );

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        'employee_review_payment',
        {
          p_payment_id:
            payment.id,

          p_action:
            'reject',

          p_rejection_reason:
            reason.trim(),
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          'Payment rejection failed.'
        );
      }

      alert(
        `Payment #${payment.receipt_number} has been rejected.`
      );

      await fetchPayments();
    } catch (error) {
      console.error(
        'Reject payment error:',
        error
      );

      alert(
        `Unable to reject payment:\n${error.message}`
      );
    } finally {
      setReviewingPaymentId(
        null
      );
    }
  };

  // =========================================
  // HELPERS
  // =========================================

  const formatAmount = (value) => {
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

  const formatDate = (value) => {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    ).format(
      new Date(value)
    );
  };

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case 'approved':
        return 'is-approved';

      case 'rejected':
        return 'is-rejected';

      default:
        return 'is-pending';
    }
  };

  // =========================================
  // PAGE LOADING
  // =========================================

  if (pageLoading) {
    return (
      <div className="payment-page-loading">

        <div className="payment-loading-spinner" />

        <h3>
          Loading payment workspace...
        </h3>

        <p>
          Fetching members, plans, and
          payment records.
        </p>

      </div>
    );
  }

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <section className="payment-processing">

      {/* ==================================
          HEADER
      =================================== */}

      <div className="payment-header">

        <div>

          <div className="payment-title-row">

            <span className="payment-title-icon">
              <CreditCard size={19} />
            </span>

            <div>

              <p className="payment-kicker">
                PAYMENT PROCESSING
              </p>

              <h3>
                Payments
              </h3>

            </div>

          </div>

          <p className="payment-description">
            Process cash payments, calculate
            change, and manage employee approvals.
          </p>

        </div>

        <button
          type="button"
          className="payment-new-btn"
          onClick={openModal}
        >
          <CreditCard size={17} />
          New Payment
        </button>

      </div>

      {/* ==================================
          SUMMARY
      =================================== */}

      <div className="payment-summary-grid">

        <div className="payment-summary-card">

          <span className="payment-summary-icon">
            <ReceiptText size={17} />
          </span>

          <div>

            <span>
              Total payments
            </span>

            <strong>
              {payments.length}
            </strong>

          </div>

        </div>

        <div className="payment-summary-card payment-summary-pending">

          <span className="payment-summary-icon">
            <Clock3 size={17} />
          </span>

          <div>

            <span>
              Waiting for approval
            </span>

            <strong>
              {pendingPayments}
            </strong>

          </div>

        </div>

        <div className="payment-summary-card">

          <span className="payment-summary-icon">
            <CheckCircle2 size={17} />
          </span>

          <div>

            <span>
              Approved
            </span>

            <strong>
              {approvedPayments}
            </strong>

          </div>

        </div>

        <div className="payment-summary-card">

          <span className="payment-summary-icon">
            <DollarSign size={17} />
          </span>

          <div>

            <span>
              Approved amount
            </span>

            <strong>
              ₱
              {formatAmount(
                totalApprovedAmount
              )}
            </strong>

          </div>

        </div>

      </div>

      {/* ==================================
          APPROVAL BANNER
      =================================== */}

      <div className="payment-approval-banner">

        <span className="payment-approval-banner-icon">
          <ShieldAlert size={17} />
        </span>

        <div>

          <strong>
            Employee approval workflow
          </strong>

          <span>
            Pending payments are reviewed here by
            authorized employees. Admin does not
            approve payment transactions.
          </span>

        </div>

      </div>

      {/* ==================================
          CASH INFO
      =================================== */}

      <div className="payment-info-bar">

        <div>

          <span className="payment-info-dot" />

          <div>

            <strong>
              Cash payments
            </strong>

            <span>
              Enter the client's cash received
              to automatically calculate change.
            </span>

          </div>

        </div>

        <div className="payment-info-right">

          <span>
            {rejectedPayments} rejected
          </span>

          <span>
            {payments.length} recent records
          </span>

        </div>

      </div>

      {/* ==================================
          PAYMENT TABLE
      =================================== */}

      <div className="payment-table-card">

        {payments.length === 0 ? (

          <div className="payment-empty">

            <span className="payment-empty-icon">
              <ReceiptText size={25} />
            </span>

            <p className="payment-kicker">
              TRANSACTIONS
            </p>

            <h4>
              No payments yet
            </h4>

            <p>
              Start by clicking
              “New Payment” to process
              a member's payment.
            </p>

            <button
              type="button"
              className="payment-empty-btn"
              onClick={openModal}
            >
              <CreditCard size={15} />
              Process first payment
            </button>

          </div>

        ) : (

          <div className="payment-table-scroll">

            <table className="payment-table">

              <thead>

                <tr>

                  <th>
                    Receipt
                  </th>

                  <th>
                    Member
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Method
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Employee Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {payments.map(
                  (payment) => {

                    const isReviewing =
                      reviewingPaymentId ===
                      payment.id;

                    const isPending =
                      payment.status ===
                      'pending';

                    return (
                      <tr
                        key={
                          payment.id
                        }
                      >

                        {/* RECEIPT */}

                        <td>

                          <div className="payment-receipt-cell">

                            <span className="payment-receipt-icon">
                              <ReceiptText size={14} />
                            </span>

                            <div>

                              <strong>
                                #
                                {
                                  payment.receipt_number
                                }
                              </strong>

                              <span>
                                {payment.transaction_type ===
                                'membership_switch'
                                  ? 'Membership upgrade'
                                  : 'Payment receipt'}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* MEMBER */}

                        <td>

                          <div className="payment-member-cell">

                            <div className="payment-avatar">

                              {(
                                payment
                                  .member
                                  ?.user
                                  ?.full_name
                                  ?.charAt(
                                    0
                                  ) ||
                                'M'
                              ).toUpperCase()}

                            </div>

                            <div>

                              <strong>
                                {
                                  payment
                                    .member
                                    ?.user
                                    ?.full_name ||
                                  'Unknown member'
                                }
                              </strong>

                              <span>
                                ID{' '}
                                {
                                  payment
                                    .member
                                    ?.user
                                    ?.id_number ||
                                  '—'
                                }
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* AMOUNT */}

                        <td>

                          <strong className="payment-amount">
                            ₱
                            {formatAmount(
                              payment.amount
                            )}
                          </strong>

                        </td>

                        {/* METHOD */}

                        <td>

                          <span className="payment-method-badge">

                            <DollarSign size={12} />

                            Cash

                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`payment-status ${getStatusClass(
                              payment.status
                            )}`}
                          >

                            {payment.status ===
                            'approved' ? (

                              <CheckCircle2
                                size={12}
                              />

                            ) : payment.status ===
                              'rejected' ? (

                              <X
                                size={12}
                              />

                            ) : (

                              <Clock3
                                size={12}
                              />

                            )}

                            {payment.status ===
                            'approved'
                              ? 'Approved'
                              : payment.status ===
                                'rejected'
                              ? 'Rejected'
                              : 'Pending'}

                          </span>

                        </td>

                        {/* DATE */}

                        <td>

                          <span className="payment-date">

                            <CalendarDays
                              size={12}
                            />

                            {formatDate(
                              payment.payment_date ||
                                payment.created_at
                            )}

                          </span>

                        </td>

                        {/* EMPLOYEE ACTION */}

                        <td>

                          {isPending ? (

                            <div className="payment-action-group">

                              <button
                                type="button"
                                className="payment-approve-btn"
                                onClick={() =>
                                  handleApprovePayment(
                                    payment
                                  )
                                }
                                disabled={
                                  isReviewing
                                }
                              >

                                <CheckCircle2
                                  size={13}
                                />

                                {isReviewing
                                  ? 'Processing...'
                                  : 'Approve'}

                              </button>

                              <button
                                type="button"
                                className="payment-reject-btn"
                                onClick={() =>
                                  handleRejectPayment(
                                    payment
                                  )
                                }
                                disabled={
                                  isReviewing
                                }
                              >

                                <X
                                  size={13}
                                />

                                Reject

                              </button>

                            </div>

                          ) : (

                            <div className="payment-action-group">

                              {payment.status ===
                                'approved' && (
                                <button
                                  type="button"
                                  className="payment-approve-btn"
                                  onClick={() =>
                                    viewReceipt(
                                      payment
                                    )
                                  }
                                  disabled={
                                    receiptLoading
                                  }
                                >
                                  {receiptLoading
                                    ? 'Loading...'
                                    : 'View Receipt'}
                                </button>
                              )}

                              <span className="payment-action-complete">

                                {payment.status ===
                                'approved'
                                  ? 'Reviewed'
                                  : 'Rejected'}

                              </span>

                            </div>

                          )}

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ==================================
          NEW PAYMENT MODAL
      =================================== */}

      {showModal && (

        <div
          className="payment-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="payment-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================
                MODAL HEADER
            ================================== */}

            <div className="payment-modal-header">

              <div>

                <p className="payment-kicker">
                  NEW TRANSACTION
                </p>

                <h3>
                  Process Payment
                </h3>

                <p>
                  Enter the client's payment
                  and calculate the exact change.
                </p>

              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={closeModal}
                disabled={loading}
              >
                <X size={18} />
              </button>

            </div>

            <form
              className="payment-form"
              onSubmit={
                handleProcessPayment
              }
            >

              {/* =================================
                  01 MEMBER
              ================================== */}

              <section className="payment-form-section">

                <div className="payment-section-heading">

                  <span>
                    01
                  </span>

                  <div>

                    <h4>
                      Select Member
                    </h4>

                    <p>
                      Choose an approved
                      client account.
                    </p>

                  </div>

                </div>

                {/* SEARCH */}

                <div className="payment-field">

                  <label htmlFor="payment-search">
                    Search member
                  </label>

                  <div className="payment-search">

                    <Search size={15} />

                    <input
                      id="payment-search"
                      type="text"
                      value={
                        searchTerm
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Name, ID number, or email..."
                    />

                    {searchTerm && (

                      <button
                        type="button"
                        className="payment-search-clear"
                        onClick={() =>
                          setSearchTerm(
                            ''
                          )
                        }
                      >
                        <X size={13} />
                      </button>

                    )}

                  </div>

                </div>

                {/* CLIENT */}

                <div className="payment-field">

                  <label htmlFor="payment-member">
                    Member <b>*</b>
                  </label>

                  <select
                    id="payment-member"
                    value={
                      selectedClient?.id ||
                      ''
                    }
                    onChange={
                      handleClientChange
                    }
                    required
                  >

                    <option value="">
                      Select a member...
                    </option>

                    {filteredClients.map(
                      (client) => (

                        <option
                          key={
                            client.id
                          }
                          value={
                            client.id
                          }
                        >

                          {
                            client.id_number
                          }

                          {' — '}

                          {
                            client.full_name
                          }

                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* NO CLIENT */}

                {filteredClients.length ===
                  0 && (

                  <div className="payment-inline-warning">

                    <ShieldAlert
                      size={15}
                    />

                    <span>
                      No approved members
                      match your search.
                    </span>

                  </div>

                )}

                {/* SELECTED CLIENT */}

                {selectedClient && (

                  <>

                    <div className="selected-member-card">

                      <div className="selected-member-avatar">

                        {(
                          selectedClient
                            .full_name
                            ?.charAt(
                              0
                            ) ||
                          'M'
                        ).toUpperCase()}

                      </div>

                      <div>

                        <strong>
                          {
                            selectedClient.full_name
                          }
                        </strong>

                        <span>
                          ID{' '}
                          {
                            selectedClient.id_number
                          }

                          {' · '}

                          {
                            selectedClient.email
                          }
                        </span>

                      </div>

                    </div>

                    {membershipLoading ? (

                      <div className="payment-inline-warning">

                        <Clock3 size={15} />

                        <span>
                          Loading current membership...
                        </span>

                      </div>

                    ) : currentMembership ? (

                      <div className="selected-plan-card">

                        <div>

                          <p>
                            CURRENT ACTIVE PLAN
                          </p>

                          <h4>
                            {currentPlan?.name ||
                              'Current membership'}
                          </h4>

                          <span>
                            Current membership price
                          </span>

                        </div>

                        <strong>
                          ₱
                          {formatAmount(
                            currentPlanPrice
                          )}
                        </strong>

                      </div>

                    ) : (

                      <div className="payment-inline-warning">

                        <ShieldAlert size={15} />

                        <span>
                          This member has no active membership yet.
                          The selected plan will be treated as a new membership.
                        </span>

                      </div>

                    )}

                  </>

                )}

              </section>

              {/* =================================
                  02 PLAN
              ================================== */}

              <section className="payment-form-section">

                <div className="payment-section-heading">

                  <span>
                    02
                  </span>

                  <div>

                    <h4>
                      Membership Plan
                    </h4>

                    <p>
                      Select the plan being
                      purchased or used for an upgrade.
                    </p>

                  </div>

                </div>

                <div className="payment-field">

                  <label htmlFor="payment-plan">
                    Membership plan <b>*</b>
                  </label>

                  <select
                    id="payment-plan"
                    value={
                      selectedPlan?.id ||
                      ''
                    }
                    onChange={
                      handlePlanChange
                    }
                    required
                  >

                    <option value="">
                      Select a plan...
                    </option>

                    {plans.map(
                      (plan) => (

                        <option
                          key={
                            plan.id
                          }
                          value={
                            plan.id
                          }
                        >

                          {
                            plan.name
                          }

                          {' — '}

                          {
                            plan.duration_months
                          }

                          {' month'}

                          {Number(
                            plan.duration_months
                          ) > 1
                            ? 's'
                            : ''}

                          {' — ₱'}

                          {formatAmount(
                            plan.price
                          )}

                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* NO PLANS */}

                {plans.length ===
                  0 && (

                  <div className="payment-inline-warning">

                    <ShieldAlert size={15} />

                    <span>
                      No active membership
                      plans are available.
                    </span>

                  </div>

                )}

                {/* SELECTED PLAN */}

                {selectedPlan && (

                  <>

                    <div className="selected-plan-card">

                      <div>

                        <p>
                          {isMembershipUpgrade
                            ? 'NEW PLAN'
                            : 'SELECTED PLAN'}
                        </p>

                        <h4>
                          {
                            selectedPlan.name
                          }
                        </h4>

                        <span>
                          {
                            selectedPlan.duration_months
                          }{' '}
                          month
                          {Number(
                            selectedPlan.duration_months
                          ) > 1
                            ? 's'
                            : ''}{' '}
                          membership
                        </span>

                      </div>

                      <strong>
                        ₱
                        {formatAmount(
                          selectedPlan.price
                        )}
                      </strong>

                    </div>

                    {isMembershipUpgrade && (

                      <div className="payment-approval-banner">

                        <span className="payment-approval-banner-icon">
                          <CreditCard size={16} />
                        </span>

                        <div>

                          <strong>
                            Membership upgrade
                          </strong>

                          <span>
                            {currentPlan?.name} (₱
                            {formatAmount(
                              currentPlanPrice
                            )})
                            {' → '}
                            {selectedPlan.name} (₱
                            {formatAmount(
                              selectedPlanPrice
                            )})
                            .
                            {' '}
                            Additional amount due:
                            {' '}
                            ₱
                            {formatAmount(
                              upgradeDifference
                            )}
                            .
                          </span>

                        </div>

                      </div>

                    )}

                    {isMembershipDowngrade && (

                      <div className="payment-inline-warning">

                        <ShieldAlert size={15} />

                        <span>
                          The selected plan is lower than the
                          member's current plan. Downgrades are
                          not available through this workflow.
                        </span>

                      </div>

                    )}

                  </>

                )}

              </section>

              {/* =================================
                  03 CASH PAYMENT
              ================================== */}

              <section className="payment-form-section">

                <div className="payment-section-heading">

                  <span>
                    03
                  </span>

                  <div>

                    <h4>
                      Cash Payment
                    </h4>

                    <p>
                      Enter how much cash the
                      client handed to you.
                    </p>

                  </div>

                </div>

                {/* AMOUNT DUE */}

                <div className="payment-amount-due">

                  <div>

                    <span>
                      {isMembershipUpgrade
                        ? 'Additional amount to pay'
                        : 'Amount to pay'}
                    </span>

                    <strong>
                      ₱
                      {formatAmount(
                        amountDue
                      )}
                    </strong>

                  </div>

                  <CreditCard
                    size={18}
                  />

                </div>

                {/* CASH RECEIVED */}

                <div className="payment-field">

                  <label htmlFor="cash-received">
                    Cash received <b>*</b>
                  </label>

                  <div className="payment-cash-input">

                    <span>
                      ₱
                    </span>

                    <input
                      id="cash-received"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        cashReceived
                      }
                      onChange={
                        handleCashChange
                      }
                      placeholder="0.00"
                      required
                    />

                  </div>

                </div>

                {/* CHANGE */}

                {cashReceived &&
                  isPaymentSufficient && (

                  <div className="payment-change-card payment-change-success">

                    <div>

                      <span>
                        Change
                      </span>

                      <strong>
                        ₱
                        {formatAmount(
                          changeAmount
                        )}
                      </strong>

                    </div>

                    <CheckCircle2
                      size={22}
                    />

                  </div>

                )}

                {/* INSUFFICIENT */}

                {cashReceived &&
                  !isPaymentSufficient &&
                  amountDue > 0 && (

                  <div className="payment-change-card payment-change-insufficient">

                    <div>

                      <span>
                        Insufficient payment
                      </span>

                      <strong>
                        Still needed: ₱
                        {formatAmount(
                          insufficientAmount
                        )}
                      </strong>

                    </div>

                    <ShieldAlert
                      size={22}
                    />

                  </div>

                )}

                {/* EXACT PAYMENT */}

                {cashReceived &&
                  isPaymentSufficient &&
                  changeAmount === 0 && (

                  <div className="payment-exact-message">

                    <CheckCircle2
                      size={15}
                    />

                    <span>
                      Exact payment received.
                      No change required.
                    </span>

                  </div>

                )}

              </section>

              {/* =================================
                  NOTICE
              ================================== */}

              <div className="payment-notice">

                <ShieldAlert size={16} />

                <div>

                  <strong>
                    Employee approval required
                  </strong>

                  <span>
                    The payment will be recorded
                    using the membership amount.
                    Cash received and change are
                    also saved on the receipt.
                  </span>

                </div>

              </div>

              {/* =================================
                  ACTIONS
              ================================== */}

              <div className="payment-modal-actions">

                <button
                  type="button"
                  className="payment-cancel-btn"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="payment-process-btn"
                  disabled={
                    loading ||
                    !selectedClient ||
                    !selectedPlan ||
                    !isPaymentSufficient
                  }
                >

                  {loading ? (

                    <>
                      <span className="payment-button-spinner" />
                      Processing...
                    </>

                  ) : (

                    <>
                      <CreditCard size={15} />
                      Process Payment
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================
          EMPLOYEE RECEIPT PREVIEW
      =================================== */}

      {selectedReceipt && (

        <div
          className="payment-modal-overlay"
          onClick={() =>
            setSelectedReceipt(null)
          }
        >

          <div
            className="payment-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="payment-modal-header">

              <div>

                <p className="payment-kicker">
                  RECEIPT
                </p>

                <h3>
                  Payment Receipt
                </h3>

                <p>
                  {selectedReceipt.receipt_type ===
                  'membership_switch'
                    ? 'Membership upgrade receipt'
                    : 'Approved membership payment'}
                </p>

              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() =>
                  setSelectedReceipt(null)
                }
              >
                <X size={18} />
              </button>

            </div>

            <div className="payment-form">

              <div className="selected-member-card">

                <div className="selected-member-avatar">
                  {(
                    selectedReceipt
                      .member_name
                      ?.charAt(0) || 'M'
                  ).toUpperCase()}
                </div>

                <div>

                  <strong>
                    {selectedReceipt.member_name}
                  </strong>

                  <span>
                    Receipt #
                    {selectedReceipt.receipt_number}
                  </span>

                </div>

              </div>

              {selectedReceipt.receipt_type ===
                'membership_switch' && (

                <section className="payment-form-section">

                  <div className="payment-section-heading">

                    <span>
                      01
                    </span>

                    <div>

                      <h4>
                        Membership Upgrade
                      </h4>

                      <p>
                        Previous and new membership plan.
                      </p>

                    </div>

                  </div>

                  <div className="selected-plan-card">

                    <div>

                      <p>
                        PREVIOUS PLAN
                      </p>

                      <h4>
                        {selectedReceipt.previous_plan_name ||
                          'Previous plan'}
                      </h4>

                    </div>

                    <strong>
                      ↘
                    </strong>

                  </div>

                  <div className="selected-plan-card">

                    <div>

                      <p>
                        NEW PLAN
                      </p>

                      <h4>
                        {selectedReceipt.new_plan_name ||
                          selectedReceipt.plan_name}
                      </h4>

                    </div>

                    <strong>
                      ↗
                    </strong>

                  </div>

                  <div className="payment-amount-due">

                    <div>

                      <span>
                        Additional amount paid
                      </span>

                      <strong>
                        ₱
                        {formatAmount(
                          selectedReceipt.additional_amount ||
                          selectedReceipt.amount
                        )}
                      </strong>

                    </div>

                    <CreditCard size={18} />

                  </div>

                </section>

              )}

              <section className="payment-form-section">

                <div className="payment-section-heading">

                  <span>
                    {selectedReceipt.receipt_type ===
                    'membership_switch'
                      ? '02'
                      : '01'}
                  </span>

                  <div>

                    <h4>
                      Payment Details
                    </h4>

                    <p>
                      Approved transaction breakdown.
                    </p>

                  </div>

                </div>

                <div className="selected-plan-card">
                  <div>
                    <p>
                      AMOUNT TO PAY
                    </p>
                    <h4>
                      ₱
                      {formatAmount(
                        selectedReceipt.amount
                      )}
                    </h4>
                  </div>
                </div>

                <div className="selected-plan-card">
                  <div>
                    <p>
                      CASH RECEIVED
                    </p>
                    <h4>
                      ₱
                      {formatAmount(
                        selectedReceipt.cash_received
                      )}
                    </h4>
                  </div>
                </div>

                <div className="selected-plan-card">
                  <div>
                    <p>
                      CHANGE
                    </p>
                    <h4>
                      ₱
                      {formatAmount(
                        selectedReceipt.change_amount
                      )}
                    </h4>
                  </div>
                </div>

                <div className="selected-plan-card">
                  <div>
                    <p>
                      PAYMENT METHOD
                    </p>
                    <h4>
                      Cash
                    </h4>
                  </div>
                </div>

                <div className="payment-notice">

                  <CheckCircle2 size={16} />

                  <div>

                    <strong>
                      Receipt approved
                    </strong>

                    <span>
                      This receipt has been approved and
                      sent to the member account.
                    </span>

                  </div>

                </div>

              </section>

              <div className="payment-modal-actions">

                <button
                  type="button"
                  className="payment-cancel-btn"
                  onClick={() =>
                    setSelectedReceipt(null)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </section>
  );
};

export default PaymentProcessing;