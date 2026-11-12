import React from "react";

const MembershipSection = () => {
  const plans = [
    {
      label: "STARTER",
      name: "Starter",
      description: "A simple way to build a consistent training habit.",
      price: "₱500",
      duration: "/ month",
      equipmentTitle: "Basic Equipment",
      equipment: [
        "Dumbbells",
        "Barbells",
        "Flat Bench",
        "Exercise Mats",
        "Resistance Bands",
        "Jump Ropes",
      ],
      access: "AREA 1 ONLY",
      popular: false,
    },
    {
      label: "PERFORMANCE",
      name: "Performance",
      description:
        "For members ready to commit to a longer training cycle.",
      price: "₱1,200",
      duration: "/ 3 months",
      equipmentTitle: "Standard Equipment",
      equipment: [
        "Everything in Starter",
        "Adjustable Benches",
        "Squat Rack",
        "Cable Machines",
        "Kettlebells",
        "Leg Machines",
      ],
      access: "AREA 1 + AREA 2",
      popular: true,
    },
    {
      label: "ELITE",
      name: "Elite",
      description:
        "A longer commitment for members chasing bigger goals.",
      price: "₱2,000",
      duration: "/ 6 months",
      equipmentTitle: "Full Gym Equipment",
      equipment: [
        "Everything in Performance",
        "Smith Machine",
        "Advanced Weight Machines",
        "Cardio Equipment",
        "Specialized Strength Equipment",
        "Premium Training Area",
      ],
      access: "AREA 1 + AREA 2 + AREA 3",
      popular: false,
    },
  ];

  const handleGetStarted = (plan) => {
    console.log("Selected membership:", plan.name);

    // Change this to your actual registration route if needed.
    window.location.href = "/register";
  };

  return (
    <section
      id="membership"
      className="relative overflow-hidden bg-[#0d110f] px-6 py-20 sm:px-8 lg:px-12"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-15%] h-[420px] w-[420px] rounded-full bg-[#c7f36b]/[0.035] blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-15%] h-[420px] w-[420px] rounded-full bg-[#c7f36b]/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1400px]">
        {/* Heading */}
        <div className="mb-12">
          <h2 className="text-[42px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#f4f5f2] sm:text-[52px] lg:text-[60px]">
            Choose your{" "}
            <span className="text-[#c7f36b]">training cycle.</span>
          </h2>

          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#a7b0aa] sm:text-[16px]">
            Start simple, stay consistent, and choose the commitment that
            fits your goals.
          </p>
        </div>

        {/* Membership Cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex h-full min-h-[590px] flex-col rounded-[24px] border p-8 transition-all duration-300 ${
                plan.popular
                  ? "border-[#c7f36b]/80 bg-[#141915] shadow-[0_0_0_1px_rgba(199,243,107,0.08)]"
                  : "border-white/[0.11] bg-[#141815]"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute right-6 top-6 rounded-full bg-[#c7f36b] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#10140f]">
                  Most Popular
                </div>
              )}

              {/* Plan Label */}
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#c7f36b]">
                  {plan.label}
                </p>

                <h3 className="mt-5 text-[29px] font-medium tracking-[-0.02em] text-[#f4f5f2]">
                  {plan.name}
                </h3>

                <p className="mt-4 max-w-[390px] text-[14px] leading-6 text-[#a7b0aa]">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mt-9 flex items-end gap-2">
                <span className="text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#f4f5f2] sm:text-[48px]">
                  {plan.price}
                </span>

                <span className="mb-1 text-[14px] text-[#a7b0aa]">
                  {plan.duration}
                </span>
              </div>

              {/* Equipment */}
              <div className="mt-9">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.17em] text-[#c7f36b]">
                  {plan.equipmentTitle}
                </p>

                <div className="space-y-3">
                  {plan.equipment.map((item, index) => (
                    <div
                      key={`${plan.name}-${index}`}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-[1px] text-[17px] leading-none text-[#c7f36b]">
                        ✓
                      </span>

                      <span className="text-[14px] leading-5 text-[#d8ddd8]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Area Access */}
              <div className="mt-8 rounded-[14px] border border-white/[0.09] bg-white/[0.025] px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#747e77]">
                  Area Access
                </p>

                <p className="mt-2 text-[14px] font-semibold tracking-[0.01em] text-[#f1f4ef]">
                  {plan.access}
                </p>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Button */}
              <button
                type="button"
                onClick={() => handleGetStarted(plan)}
                className="mt-8 w-full rounded-[13px] bg-[#c7f36b] px-5 py-4 text-[16px] font-semibold text-[#0e120e] transition-all duration-200 hover:brightness-95 active:scale-[0.99]"
              >
                Get started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MembershipSection;