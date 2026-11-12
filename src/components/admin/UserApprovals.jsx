import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';

import { supabase } from '../../services/supabase';
import '../../styles/UserApprovals.css';
const UserApprovals = () => {
  const [pendingUsers, setPendingUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [actionUserId, setActionUserId] =
    useState(null);

  const [
    showRejectModal,
    setShowRejectModal,
  ] = useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    rejectReason,
    setRejectReason,
  ] = useState('');

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  /* =====================================================
     FETCH PENDING CLIENT REGISTRATIONS
  ====================================================== */

  const fetchPendingUsers =
    useCallback(async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        /*
          IMPORTANT:
          This uses the Admin-only RPC we created
          specifically for pending client registrations.
        */

        const {
          data,
          error,
        } = await supabase.rpc(
          'get_pending_client_registrations'
        );

        if (error) {
          console.error(
            'Pending client registrations error:',
            error
          );

          throw error;
        }

        setPendingUsers(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {
        console.error(
          'Fetch approvals error:',
          error
        );

        setPendingUsers([]);

      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  /* =====================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    fetchPendingUsers(false);
  }, [fetchPendingUsers]);

  /* =====================================================
     FILTER
  ====================================================== */

  const filteredUsers =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase();

      if (!keyword) {
        return pendingUsers;
      }

      return pendingUsers.filter(
        (user) => {
          return (
            String(
              user.full_name ||
                ''
            )
              .toLowerCase()
              .includes(keyword) ||

            String(
              user.email ||
                ''
            )
              .toLowerCase()
              .includes(keyword) ||

            String(
              user.id_number ||
                ''
            )
              .toLowerCase()
              .includes(keyword) ||

            String(
              user.username ||
                ''
            )
              .toLowerCase()
              .includes(keyword)
          );
        }
      );
    }, [
      pendingUsers,
      searchTerm,
    ]);

  /* =====================================================
     APPROVE CLIENT
     
     Server-side:
       - verifies Admin
       - approves client
       - approves request
       - sends password setup email
  ====================================================== */

  const handleApprove = async (
    user
  ) => {
    const confirmed =
      window.confirm(
        `Approve this client registration?\n\n` +
        `Name: ${
          user.full_name ||
          'Unknown'
        }\n` +
        `Email: ${
          user.email ||
          'No email'
        }\n` +
        `ID Number: ${
          user.id_number ||
          'N/A'
        }`
      );

    if (!confirmed) {
      return;
    }

    setActionUserId(
      user.id
    );

    try {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          'send-password-setup-email',
          {
            body: {
              userId:
                user.id,
              approve:
                true,
            },
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.approved) {
        throw new Error(
          data?.error ||
          'The account could not be approved.'
        );
      }

      if (data.emailSent) {
        alert(
          'Client approved successfully!\n\n' +
          'The password setup email has been sent to:\n' +
          user.email
        );
      } else {
        alert(
          'Client approved successfully.\n\n' +
          'However, the password setup email could not be sent.\n\n' +
          (
            data.emailError ||
            'Please check your Supabase email configuration.'
          )
        );
      }

      await fetchPendingUsers(
        true
      );

    } catch (error) {
      console.error(
        'Approval error:',
        error
      );

      alert(
        'Unable to approve client:\n\n' +
        (
          error.message ||
          'Unknown error'
        )
      );

    } finally {
      setActionUserId(
        null
      );
    }
  };

  /* =====================================================
     OPEN REJECT MODAL
  ====================================================== */

  const openRejectModal = (
    user
  ) => {
    setSelectedUser(
      user
    );

    setRejectReason('');

    setShowRejectModal(
      true
    );
  };

  /* =====================================================
     CLOSE REJECT MODAL
  ====================================================== */

  const closeRejectModal = () => {
    if (actionUserId) {
      return;
    }

    setShowRejectModal(
      false
    );

    setSelectedUser(
      null
    );

    setRejectReason('');
  };

  /* =====================================================
     REJECT CLIENT
     
     Server-side:
       - verifies Admin
       - changes approval request to rejected
       - preserves records for traceability
  ====================================================== */

  const handleReject = async () => {
    if (!selectedUser) {
      return;
    }

    if (!rejectReason.trim()) {
      alert(
        'Please provide a rejection reason.'
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Reject the registration of ${
          selectedUser.full_name ||
          'this client'
        }?`
      );

    if (!confirmed) {
      return;
    }

    setActionUserId(
      selectedUser.id
    );

    try {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          'reject-client-registration',
          {
            body: {
              userId:
                selectedUser.id,

              reason:
                rejectReason.trim(),
            },
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.rejected) {
        throw new Error(
          data?.error ||
          'The registration could not be rejected.'
        );
      }

      alert(
        'Client registration rejected successfully.'
      );

      closeRejectModal();

      await fetchPendingUsers(
        true
      );

    } catch (error) {
      console.error(
        'Reject error:',
        error
      );

      alert(
        'Unable to reject client:\n\n' +
        (
          error.message ||
          'Unknown error'
        )
      );

    } finally {
      setActionUserId(
        null
      );
    }
  };

  /* =====================================================
     DATE FORMAT
  ====================================================== */

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

  /* =====================================================
     LOADING UI
  ====================================================== */

  if (loading) {
    return (
      <div className="approval-workspace">

        <div className="approval-loading">

          <div className="approval-spinner" />

          <h3>
            Loading pending registrations...
          </h3>

          <p>
            Checking the latest client
            registration requests.
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     MAIN UI
  ====================================================== */

  return (
    <div className="approval-workspace">

      {/* ================================================
          HEADER
      ================================================= */}

      <div className="approval-header">

        <div className="approval-header-copy">

          <div className="approval-icon">
            <ShieldCheck
              size={20}
            />
          </div>

          <div>

            <p className="approval-eyebrow">
              MEMBER REQUESTS
            </p>

            <h2>
              User approvals
            </h2>

            <p>
              Review client registrations and
              send approved members their
              password setup email.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="approval-refresh-btn"
          onClick={() =>
            fetchPendingUsers(true)
          }
          disabled={refreshing}
        >

          <RefreshCw
            size={15}
            className={
              refreshing
                ? 'approval-spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}

        </button>

      </div>

      {/* ================================================
          SUMMARY
      ================================================= */}

      <div className="approval-summary">

        <div className="approval-summary-card">

          <div className="approval-summary-icon">
            <Clock3
              size={18}
            />
          </div>

          <div>

            <span>
              Pending registrations
            </span>

            <strong>
              {pendingUsers.length}
            </strong>

          </div>

        </div>

        <div className="approval-summary-text">

          <UserCheck
            size={16}
          />

          <span>
            Approve
            {' → '}
            password setup email
            {' → '}
            client creates password
          </span>

        </div>

      </div>

      {/* ================================================
          SEARCH
      ================================================= */}

      <div className="approval-toolbar">

        <div className="approval-search">

          <UserRound
            size={15}
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search name, email, username, or ID number..."
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm('')
              }
              className="approval-search-clear"
            >
              <X size={13} />
            </button>
          )}

        </div>

        <span className="approval-result-count">
          {filteredUsers.length}
          {' '}
          result
          {filteredUsers.length === 1
            ? ''
            : 's'}
        </span>

      </div>

      {/* ================================================
          EMPTY
      ================================================= */}

      {filteredUsers.length === 0 ? (

        <div className="approval-empty">

          <div className="approval-empty-icon">
            <CheckCircle2
              size={24}
            />
          </div>

          <p className="approval-eyebrow">
            {searchTerm
              ? 'SEARCH RESULT'
              : 'APPROVAL QUEUE'}
          </p>

          <h3>
            {searchTerm
              ? 'No matching registrations'
              : 'No pending registrations'}
          </h3>

          <p>
            {searchTerm
              ? 'Try another name, email, username, or ID number.'
              : 'A newly submitted client registration will appear here automatically.'}
          </p>

        </div>

      ) : (

        /* ==============================================
           REGISTRATION LIST
        =============================================== */

        <div className="approval-list">

          {filteredUsers.map(
            (user) => {

              const isWorking =
                actionUserId ===
                user.id;

              return (
                <article
                  key={
                    user.id
                  }
                  className="approval-card"
                >

                  {/* ======================================
                      TOP
                  ======================================= */}

                  <div className="approval-card-top">

                    <div className="approval-person">

                      <div className="approval-avatar">

                        {(
                          user.first_name ||
                          user.full_name ||
                          'C'
                        )
                          .charAt(0)
                          .toUpperCase()}

                      </div>

                      <div className="approval-person-copy">

                        <div className="approval-person-title">

                          <h3>
                            {
                              user.full_name ||
                              `${user.last_name || ''}, ${user.first_name || ''}`
                            }
                          </h3>

                          <span className="approval-client-badge">
                            CLIENT
                          </span>

                        </div>

                        <div className="approval-meta">

                          <span>
                            ID:
                            {' '}
                            {
                              user.id_number ||
                              'N/A'
                            }
                          </span>

                          <span>
                            Username:
                            {' '}
                            {
                              user.username ||
                              'N/A'
                            }
                          </span>

                        </div>

                      </div>

                    </div>

                    <span className="approval-pending-badge">

                      <Clock3
                        size={12}
                      />

                      Pending

                    </span>

                  </div>

                  {/* ======================================
                      DETAILS
                  ======================================= */}

                  <div className="approval-details">

                    <div className="approval-detail">

                      <Mail
                        size={14}
                      />

                      <div>

                        <span>
                          EMAIL
                        </span>

                        <strong>
                          {
                            user.email ||
                            'N/A'
                          }
                        </strong>

                      </div>

                    </div>

                    <div className="approval-detail">

                      <Phone
                        size={14}
                      />

                      <div>

                        <span>
                          CONTACT
                        </span>

                        <strong>
                          {
                            user.contact_number ||
                            'N/A'
                          }
                        </strong>

                      </div>

                    </div>

                    <div className="approval-detail">

                      <MapPin
                        size={14}
                      />

                      <div>

                        <span>
                          ADDRESS
                        </span>

                        <strong>
                          {
                            user.address ||
                            'N/A'
                          }
                        </strong>

                      </div>

                    </div>

                    <div className="approval-detail">

                      <CalendarIcon />

                      <div>

                        <span>
                          REGISTERED
                        </span>

                        <strong>
                          {formatDate(
                            user.created_at
                          )}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* ======================================
                      PERSONAL INFO
                  ======================================= */}

                  <div className="approval-personal-grid">

                    <div>

                      <span>
                        FIRST NAME
                      </span>

                      <strong>
                        {
                          user.first_name ||
                          '—'
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        LAST NAME
                      </span>

                      <strong>
                        {
                          user.last_name ||
                          '—'
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        MIDDLE NAME
                      </span>

                      <strong>
                        {
                          user.middle_name ||
                          '—'
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        SUFFIX
                      </span>

                      <strong>
                        {
                          user.suffix ||
                          '—'
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        BIRTHDATE
                      </span>

                      <strong>
                        {
                          user.birthdate ||
                          '—'
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        GENDER
                      </span>

                      <strong>
                        {
                          user.gender ||
                          '—'
                        }
                      </strong>

                    </div>

                  </div>

                  {/* ======================================
                      ACTIONS
                  ======================================= */}

                  <div className="approval-card-actions">

                    <div className="approval-password-note">

                      <Mail
                        size={14}
                      />

                      <span>
                        Approval will send
                        the password setup
                        email automatically.
                      </span>

                    </div>

                    <div className="approval-actions">

                      <button
                        type="button"
                        className="approval-reject-btn"
                        onClick={() =>
                          openRejectModal(
                            user
                          )
                        }
                        disabled={
                          isWorking
                        }
                      >

                        <X
                          size={14}
                        />

                        Reject

                      </button>

                      <button
                        type="button"
                        className="approval-approve-btn"
                        onClick={() =>
                          handleApprove(
                            user
                          )
                        }
                        disabled={
                          isWorking
                        }
                      >

                        <CheckCircle2
                          size={14}
                        />

                        {isWorking
                          ? 'Processing...'
                          : 'Approve & Email'}

                      </button>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}

      {/* ================================================
          REJECT MODAL
      ================================================= */}

      {showRejectModal &&
        selectedUser && (

        <div
          className="approval-modal-overlay"
          onClick={closeRejectModal}
        >

          <div
            className="approval-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="approval-modal-header">

              <div>

                <p className="approval-eyebrow">
                  REJECT REGISTRATION
                </p>

                <h3>
                  Reject client account
                </h3>

                <p>
                  Provide a reason for
                  rejecting this registration.
                </p>

              </div>

              <button
                type="button"
                className="approval-modal-close"
                onClick={
                  closeRejectModal
                }
                disabled={
                  Boolean(
                    actionUserId
                  )
                }
              >
                <X size={17} />
              </button>

            </div>

            <div className="approval-modal-user">

              <div className="approval-avatar">

                {(
                  selectedUser.first_name ||
                  selectedUser.full_name ||
                  'C'
                )
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <strong>
                  {
                    selectedUser.full_name ||
                    'Pending Client'
                  }
                </strong>

                <span>
                  {
                    selectedUser.email
                  }
                </span>

              </div>

            </div>

            <div className="approval-modal-field">

              <label>
                Rejection reason
              </label>

              <textarea
                value={
                  rejectReason
                }
                onChange={(event) =>
                  setRejectReason(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Explain why this registration is being rejected..."
                disabled={
                  Boolean(
                    actionUserId
                  )
                }
              />

            </div>

            <div className="approval-modal-actions">

              <button
                type="button"
                className="approval-cancel-btn"
                onClick={
                  closeRejectModal
                }
                disabled={
                  Boolean(
                    actionUserId
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="approval-confirm-reject-btn"
                onClick={
                  handleReject
                }
                disabled={
                  Boolean(
                    actionUserId
                  ) ||
                  !rejectReason.trim()
                }
              >

                <X
                  size={14}
                />

                {actionUserId
                  ? 'Rejecting...'
                  : 'Confirm Rejection'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

/* =========================================================
   SMALL ICON HELPER
========================================================= */

const CalendarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect
      width="18"
      height="18"
      x="3"
      y="4"
      rx="2"
    />
    <path d="M3 10h18" />
  </svg>
);

export default UserApprovals;