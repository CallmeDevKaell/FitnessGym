import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    number: '01',
    title: 'Train with purpose',
    text: 'A focused fitness environment built around consistency, progress, and real results.',
  },
  {
    number: '02',
    title: 'Simple membership',
    text: 'Choose a plan that fits your schedule and budget without the usual gym hassle.',
  },
  {
    number: '03',
    title: 'Stay on track',
    text: 'Keep your membership details and payment records in one easy-to-use member portal.',
  },
  {
    number: '04',
    title: 'Built for everyone',
    text: 'Whether you are starting out or already training hard, there is room for your next level.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '₱500',
    period: '/ month',
    description: 'A simple way to build a consistent training habit.',

    equipmentTitle: 'Basic Equipment',
    equipment: [
      'Dumbbells',
      'Barbells',
      'Flat Bench',
      'Exercise Mats',
      'Resistance Bands',
      'Jump Ropes',
    ],

    accessTitle: 'Area Access',
    access: 'AREA 1 ONLY',
  },

  {
    name: 'Performance',
    price: '₱1,200',
    period: '/ 3 months',
    description: 'For members ready to commit to a longer training cycle.',

    equipmentTitle: 'Standard Equipment',
    equipment: [
      'Everything in Starter',
      'Adjustable Benches',
      'Squat Rack',
      'Cable Machines',
      'Kettlebells',
      'Leg Machines',
    ],

    accessTitle: 'Area Access',
    access: 'AREA 1 + AREA 2',

    featured: true,
  },

  {
    name: 'Elite',
    price: '₱2,000',
    period: '/ 6 months',
    description: 'A longer commitment for members chasing bigger goals.',

    equipmentTitle: 'Full Gym Equipment',
    equipment: [
      'Everything in Performance',
      'Smith Machine',
      'Advanced Weight Machines',
      'Cardio Equipment',
      'Specialized Strength Equipment',
      'Premium Training Area',
    ],

    accessTitle: 'Area Access',
    access: 'AREA 1 + AREA 2 + AREA 3',
  },
];

const Homepage = () => {
  return (
    <div className="app-page">

      {/* =========================
          NAVIGATION
      ========================== */}
      <header className="site-nav">
        <Link
          to="/"
          className="brand"
          aria-label="Forge Fitness home"
        >
          <span className="brand-mark">✦</span>
          <span>FORGE FITNESS</span>
        </Link>

        <nav
          className="nav-links"
          aria-label="Primary navigation"
        >
          <a href="#about">About</a>
          <a href="#plans">Membership</a>
          <a href="#why-us">Why Forge</a>
        </nav>

        <div className="nav-actions">
          <Link
            to="/login"
            className="btn btn-outline"
          >
            Sign in
          </Link>

          <Link
            to="/register"
            className="btn btn-primary"
          >
            Join now
          </Link>
        </div>
      </header>

      <main>

        {/* =========================
            HERO
        ========================== */}
        <section
          className="hero"
          aria-labelledby="hero-title"
        >
          <div className="hero-content">

            <p className="eyebrow">
              FORGE FITNESS • TRAIN HARD. LIVE STRONG.
            </p>

            <h1 id="hero-title">
              Build the body.
              <br />
              <span>Build the habit.</span>
            </h1>

            <p className="hero-copy">
              A modern gym membership experience designed to make showing up easier,
              tracking your membership simpler, and your progress more consistent.
            </p>

            <div className="hero-actions">
              <Link
                to="/register"
                className="btn btn-primary"
              >
                Create a member account
              </Link>

              <a
                href="#plans"
                className="btn btn-outline"
              >
                View membership plans
              </a>
            </div>

            <div
              className="hero-stats"
              aria-label="Gym highlights"
            >
              <div className="hero-stat">
                <strong>01</strong>
                <span>Focused environment</span>
              </div>

              <div className="hero-stat">
                <strong>24/7</strong>
                <span>Member portal access</span>
              </div>

              <div className="hero-stat">
                <strong>3</strong>
                <span>Member-facing roles</span>
              </div>
            </div>

          </div>
        </section>

        {/* =========================
            WHY FORGE
        ========================== */}
        <section
          id="why-us"
          className="feature-strip"
        >
          <div className="section-heading">

            <p className="eyebrow">
              WHY FORGE
            </p>

            <h2>
              Everything you need to <span>keep moving.</span>
            </h2>

            <p className="section-subtitle">
              Less friction around your membership. More focus on the work.
            </p>

          </div>

          <div className="feature-grid">

            {features.map((feature) => (
              <article
                className="feature-card"
                key={feature.number}
              >
                <div className="feature-number">
                  {feature.number}
                </div>

                <h3>
                  {feature.title}
                </h3>

                <p>
                  {feature.text}
                </p>
              </article>
            ))}

          </div>
        </section>

        {/* =========================
            ABOUT
        ========================== */}
        <section
          id="about"
          className="about-section"
        >
          <div
            className="about-media"
            role="img"
            aria-label="Athlete training in a gym"
          />

          <div className="about-copy-wrap">

            <p className="eyebrow">
              THE FORGE STANDARD
            </p>

            <h2>
              A gym should make consistency <span>feel natural.</span>
            </h2>

            <p>
              Forge Fitness is built around a straightforward idea: your gym should help you
              focus on training, not paperwork. From registration to membership tracking,
              everything is designed to stay clear and easy to use.
            </p>

            <div className="about-points">

              <div>
                <p>Clear membership information</p>
              </div>

              <div>
                <p>Simple account access</p>
              </div>

              <div>
                <p>Organized payment records</p>
              </div>

            </div>
          </div>
        </section>

        {/* =========================
            MEMBERSHIP PLANS
        ========================== */}
        <section
          id="plans"
          className="plans-section"
        >
          <div className="section-heading">

            <p className="eyebrow">
              MEMBERSHIP
            </p>

            <h2>
              Choose your <span>training cycle.</span>
            </h2>

            <p className="section-subtitle">
              Start simple, stay consistent, and choose the commitment that fits your goals.
            </p>

          </div>

          <div className="plan-grid">

            {plans.map((plan) => (

              <article
                className={`plan-card ${plan.featured ? 'featured' : ''}`}
                key={plan.name}
              >

                {/* Popular Badge */}
                {plan.featured && (
                  <span className="plan-badge">
                    Most popular
                  </span>
                )}

                {/* Plan Name */}
                <p className="plan-kicker">
                  {plan.name.toUpperCase()}
                </p>

                <h3>
                  {plan.name}
                </h3>

                <p className="plan-description">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="plan-price">
                  {plan.price}

                  <small>
                    {plan.period}
                  </small>
                </div>

                {/* Equipment Section */}
                <div className="plan-equipment">

                  <p className="plan-section-label">
                    {plan.equipmentTitle}
                  </p>

                  <ul className="plan-list">

                    {plan.equipment.map((equipment, index) => (

                      <li key={`${plan.name}-${index}`}>
                        <span className="plan-check">
                          
                        </span>

                        <span>
                          {equipment}
                        </span>
                      </li>

                    ))}

                  </ul>

                </div>

                {/* Area Access */}
                <div className="plan-access">

                  <span className="plan-access-label">
                    {plan.accessTitle}
                  </span>

                  <strong>
                    {plan.access}
                  </strong>

                </div>

                {/* Button */}
                <Link
                  to="/register"
                  className="btn btn-primary plan-button"
                >
                  Get started
                </Link>

              </article>

            ))}

          </div>
        </section>

        {/* =========================
            CTA
        ========================== */}
        <section className="cta-section">

          <div className="cta-inner">

            <p className="eyebrow">
              YOUR NEXT SESSION STARTS HERE
            </p>

            <h2>
              Show up for yourself.
            </h2>

            <p>
              Make the first move today. Your account is just a few steps away.
            </p>

            <Link
              to="/register"
              className="btn btn-primary"
            >
              Become a member
            </Link>

          </div>

        </section>

      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer
        className="site-footer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '24px',
        }}
      >

        <div
          className="site-footer-main"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            width: '100%',
          }}
        >
          <div>
            <div className="brand footer-brand">
              <span className="brand-mark">✦</span>
              <span>FORGE FITNESS</span>
            </div>

            <p>
              Train hard. Live strong.
            </p>
          </div>

          <div className="footer-actions">
            <Link to="/login">
              Sign in
            </Link>

            <Link to="/register">
              Register
            </Link>
          </div>
        </div>

        <div
          className="footer-copyright"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px 24px',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.10)',
            paddingTop: '20px',
            color: 'var(--muted, #9ca3af)',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} Forge Fitness. All rights reserved.
          </p>

          <p style={{ margin: 0 }}>
            Developer: <strong style={{ color: 'var(--text, #f5f5f5)' }}>Lady Marie Dorothy Cuadra</strong>
          </p>
        </div>

      </footer>

    </div>
  );
};

export default Homepage;