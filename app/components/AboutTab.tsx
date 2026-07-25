// Static "Methodology" tab content — no props, no state.
export function AboutTab() {
  return (
    <div className="bg-ms-card border border-ms-border p-8 rounded-lg max-w-3xl mx-auto space-y-6">
      <div className="border-b border-ms-border pb-4">
        <h2 className="text-xl font-bold text-white">
          The Boring B2B SaaS Philosophy
        </h2>
        <p className="text-sm text-ms-text-muted mt-1">
          Why legacy, offline sectors produce the highest retention, easiest
          sales, and lowest churn startups.
        </p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-ms-text-muted">
        <p>
          In the modern SaaS landscape, 95% of builders compete for consumer
          tools, productivity widgets, or generic AI playgrounds. This leads to
          heavy competition, high customer acquisition costs (CAC), and extreme
          customer churn.
        </p>

        <div className="bg-ms-bg p-4 rounded-lg border border-ms-border space-y-3">
          <h4 className="text-xs font-bold text-ms-yellow font-ms uppercase">
            Legacy Industries Are Different:
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-ms-green font-bold">✔</span>
              <span>
                <strong>High Retention:</strong> B2B companies in roofing, dry
                cleaning, or pest control do not switch platforms often once
                integrated.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ms-green font-bold">✔</span>
              <span>
                <strong>Willingness to Pay:</strong> A dry cleaner losing
                $1,000/mo in lost inventory easily pays $100-$300/mo to solve it.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ms-green font-bold">✔</span>
              <span>
                <strong>Direct Outreach is Free:</strong> Finding roofing
                contractors takes minutes on Google Maps, and you can contact
                them directly. No expensive ad spend.
              </span>
            </li>
          </ul>
        </div>

        <h4 className="text-base font-bold text-white mt-6">
          How Signal Engine Operates:
        </h4>
        <p>
          Signal Engine is powered by advanced Gemini 3.5 reasoning. It scans and
          calculates:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs">
          <li>
            <strong>GTM Channel Validation:</strong> Where and how to reach these
            offline business owners directly (phone, direct mail, or local
            associations).
          </li>
          <li>
            <strong>ROI Matrices:</strong> Estimating development costs using AI
            tools and showing clear financial break-even projections.
          </li>
          <li>
            <strong>Vibe-Coding Prompts:</strong> Custom, detailed prompts to
            build high-fidelity applications with dynamic state, local mock
            persistence, database designs, Stripe billing integrations, and
            automated emails.
          </li>
        </ul>
      </div>
    </div>
  );
}
