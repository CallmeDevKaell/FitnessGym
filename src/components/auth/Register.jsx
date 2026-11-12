import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Dumbbell,
  ShieldCheck,
} from 'lucide-react';

import { supabase } from '../../services/supabase';
import '../../styles/Register.css';

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  email: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  suffix: '',
  contact_number: '',
  address: '',
  birthdate: '',
  gender: 'Male',
  emergency_contact: '',
};

/* =========================================================
   REUSABLE FIELD
   Keep this OUTSIDE Register so inputs do not lose focus
   every time form state changes.
========================================================= */

const Field = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  required = false,
  children,
  className = '',
  value = '',
  onChange,
  disabled = false,
}) => (
  <div className={`register-field ${className}`}>
    <label htmlFor={name}>
      {label}

      {required && (
        <span className="required-mark">
          *
        </span>
      )}
    </label>

    {children || (
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="register-input"
      />
    )}
  </div>
);

/* =========================================================
   BIRTHDATE VALIDATION
========================================================= */

const birthdateIsValid = (value) => {
  if (!value) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date <= new Date()
  );
};

/* =========================================================
   REGISTER
========================================================= */

const Register = () => {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [isRegistered, setIsRegistered] =
    useState(false);

  const [formData, setFormData] =
    useState(INITIAL_FORM);

  /* =======================================================
     HANDLE INPUT
  ======================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =======================================================
     SUBMIT REGISTRATION
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      loading ||
      isRegistered
    ) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      /* ===================================================
         CLEAN DATA
      =================================================== */

      const email =
        formData.email
          .trim()
          .toLowerCase();

      const lastName =
        formData.last_name.trim();

      const firstName =
        formData.first_name.trim();

      const middleName =
        formData.middle_name.trim();

      const suffix =
        formData.suffix.trim();

      const contactNumber =
        formData.contact_number.trim();

      const address =
        formData.address.trim();

      const emergencyContact =
        formData.emergency_contact.trim();

      /* ===================================================
         VALIDATION
      =================================================== */

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        throw new Error(
          'Please enter a valid email address.'
        );
      }

      if (!lastName) {
        throw new Error(
          'Last Name is required.'
        );
      }

      if (!firstName) {
        throw new Error(
          'First Name is required.'
        );
      }

      if (
        !contactNumber
      ) {
        throw new Error(
          'Contact Number is required.'
        );
      }

      if (!address) {
        throw new Error(
          'Address is required.'
        );
      }

      if (
        !formData.birthdate ||
        !birthdateIsValid(
          formData.birthdate
        )
      ) {
        throw new Error(
          'Please provide a valid birthdate.'
        );
      }

      if (!emergencyContact) {
        throw new Error(
          'Emergency Contact is required.'
        );
      }

      /* ===================================================
         FULL NAME
      =================================================== */

      let fullName =
        `${lastName}, ${firstName}`;

      if (middleName) {
        fullName +=
          ` ${middleName}`;
      }

      if (suffix) {
        fullName +=
          ` ${suffix}`;
      }

      /* ===================================================
         CALL SECURE SERVER REGISTRATION
         
         IMPORTANT:
         The browser does NOT create auth/users/
         approval_requests separately anymore.
         
         The Edge Function handles the complete
         registration transaction.
      =================================================== */

      const {
        data,
        error: functionError,
      } =
        await supabase.functions.invoke(
          'public-register',
          {
            body: {
              email,

              last_name:
                lastName,

              first_name:
                firstName,

              middle_name:
                middleName,

              suffix,

              contact_number:
                contactNumber,

              address,

              birthdate:
                formData.birthdate,

              gender:
                formData.gender,

              emergency_contact:
                emergencyContact,

              website: '',
            },
          }
        );

      /* ===================================================
         FUNCTION ERROR
      =================================================== */

      if (functionError) {
        console.error(
          'public-register function error:',
          functionError
        );

        throw new Error(
          functionError.message ||
          'Unable to submit registration.'
        );
      }

      /* ===================================================
         BACKEND ERROR
      =================================================== */

      if (!data?.success) {
        throw new Error(
          data?.error ||
          'Registration failed.'
        );
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      setIsRegistered(true);

      setSuccess(
        `Registration submitted successfully!

Name: ${fullName}
Email: ${email}
Username: ${data.username}
ID Number: ${data.idNumber}

Status: Waiting for Admin approval.

After approval, a password setup email will be sent to your registered email address.

Redirecting to Login...`
      );

      setFormData(
        INITIAL_FORM
      );

      /* ===================================================
         REDIRECT
      =================================================== */

      setTimeout(() => {
        navigate('/login');
      }, 8000);

    } catch (err) {
      console.error(
        'Registration error:',
        err
      );

      setError(
        err?.message ||
        'Registration failed. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="auth-page register-page">

      {/* ================================================
          LEFT VISUAL
      ================================================= */}

      <section className="auth-visual register-visual">

        <Link
          to="/"
          className="brand"
        >
          <span className="brand-mark">
            ✦
          </span>

          FORGE FITNESS
        </Link>

        <div className="register-visual-copy">

          <p className="eyebrow">
            Start your membership
          </p>

          <h1>
            Make your
            <br />
            <span>
              move today.
            </span>
          </h1>

          <p>
            Join a training community
            built to help you feel
            stronger, more consistent,
            and more confident every day.
          </p>

          <div className="register-trust">

            <div className="register-trust-item">

              <ShieldCheck
                size={18}
              />

              <span>
                Secure member registration
              </span>

            </div>

            <div className="register-trust-item">

              <ShieldCheck
                size={18}
              />

              <span>
                Admin approval before login
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================
          RIGHT FORM
      ================================================= */}

      <section className="auth-form-wrap register-form-wrap">

        <div className="auth-form register-form">

          {/* ============================================
              HEADER
          ============================================= */}

          <div className="register-header">

            <div className="register-icon">

              <Dumbbell
                size={25}
              />

            </div>

            <div>

              <p className="register-kicker">
                MEMBER REGISTRATION
              </p>

              <h2>
                Create Member Account
              </h2>

              <p className="register-subtitle">
                Complete your details
                below to request a
                Forge Fitness membership.
              </p>

            </div>

          </div>

          {/* ============================================
              APPROVAL NOTICE
          ============================================= */}

          <div className="register-approval-note">

            <span>
              ⚠️
            </span>

            <div>

              <strong>
                Admin approval required
              </strong>

              <p>
                Your account stays pending
                until an administrator
                approves your registration.
              </p>

            </div>

          </div>

          {/* ============================================
              SUCCESS
          ============================================= */}

          {success && (
            <div className="register-alert register-alert-success">
              {success}
            </div>
          )}

          {/* ============================================
              ERROR
          ============================================= */}

          {error && (
            <div className="register-alert register-alert-error">
              {error}
            </div>
          )}

          {/* ============================================
              FORM
          ============================================= */}

          {!isRegistered ? (

            <form
              onSubmit={handleSubmit}
              className="register-form-body"
            >

              {/* ========================================
                  ACCOUNT INFORMATION
              ========================================= */}

              <div className="register-section-label">
                Account Information
              </div>

              <div className="register-grid two-col">

                <Field
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="juan.delacruz@gmail.com"
                  required
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                  className="span-2"
                />

                <div className="register-auto-info span-2">

                  <div>

                    <strong>
                      Automatic ID Number
                    </strong>

                    <span>
                      An 8-digit member ID
                      will be generated
                      automatically.
                    </span>

                  </div>

                </div>

                <div className="register-auto-info span-2">

                  <div>

                    <strong>
                      Automatic Username
                    </strong>

                    <span>
                      Your username will be
                      based on your first name.
                    </span>

                  </div>

                </div>

              </div>

              {/* ========================================
                  PERSONAL INFORMATION
              ========================================= */}

              <div className="register-section-label">
                Personal Information
              </div>

              <div className="register-grid two-col">

                <Field
                  label="Last Name"
                  name="last_name"
                  placeholder="Dela Cruz"
                  required
                  value={
                    formData.last_name
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

                <Field
                  label="First Name"
                  name="first_name"
                  placeholder="Juan"
                  required
                  value={
                    formData.first_name
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

                <Field
                  label="Middle Name"
                  name="middle_name"
                  placeholder="Santos"
                  value={
                    formData.middle_name
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

                <Field
                  label="Suffix"
                  name="suffix"
                  placeholder="Jr., Sr., III"
                  value={
                    formData.suffix
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

                <Field
                  label="Birthdate"
                  name="birthdate"
                  type="date"
                  required
                  value={
                    formData.birthdate
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

                <Field
                  label="Gender"
                  name="gender"
                  required
                  value={
                    formData.gender
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                >

                  <select
                    id="gender"
                    name="gender"
                    value={
                      formData.gender
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      loading
                    }
                    className="register-input register-select"
                    required
                  >

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </Field>

              </div>

              {/* ========================================
                  CONTACT INFORMATION
              ========================================= */}

              <div className="register-section-label">
                Contact Information
              </div>

              <div className="register-grid two-col">

                <Field
                  label="Contact Number"
                  name="contact_number"
                  type="tel"
                  placeholder="09123456789"
                  required
                  value={
                    formData.contact_number
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

                <Field
                  label="Emergency Contact"
                  name="emergency_contact"
                  placeholder="Juan Dela Cruz – 09123456789"
                  required
                  value={
                    formData.emergency_contact
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

                <Field
                  label="Address"
                  name="address"
                  placeholder="Street, Barangay, City / Municipality"
                  required
                  value={
                    formData.address
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                  className="span-2"
                />

              </div>

              {/* ========================================
                  PASSWORD NOTICE
              ========================================= */}

              <div className="register-password-note">

                <ShieldCheck
                  size={17}
                />

                <div>

                  <strong>
                    No password required now
                  </strong>

                  <p>
                    You will create your own
                    password only after your
                    registration is approved
                    by the administrator.
                  </p>

                </div>

              </div>

              {/* ========================================
                  SUBMIT
              ========================================= */}

              <button
                type="submit"
                disabled={
                  loading
                }
                className="register-submit"
              >

                <span>
                  {loading
                    ? 'Submitting Registration...'
                    : 'Create Member Account'}
                </span>

                {!loading && (
                  <ArrowLeft
                    size={17}
                    className="register-submit-arrow"
                  />
                )}

              </button>

            </form>

          ) : (

            /* ==========================================
               COMPLETE STATE
            =========================================== */

            <div className="register-complete">

              <div className="register-complete-icon">
                ✓
              </div>

              <h3>
                Registration Submitted
              </h3>

              <p>
                Your member account is now
                waiting for Admin approval.
              </p>

              <p className="register-complete-muted">
                A password setup email will
                be sent after approval.
              </p>

            </div>

          )}

          {/* ============================================
              FOOTER
          ============================================= */}

          <div className="auth-footer register-footer">

            <Link
              to="/login"
              className="register-back-link"
            >

              <ArrowLeft
                size={16}
              />

              Back to Login

            </Link>

          </div>

        </div>

      </section>

    </div>
  );
};

export default Register;