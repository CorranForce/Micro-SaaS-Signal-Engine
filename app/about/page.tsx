import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ms-bg text-ms-text font-ms p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="font-ms text-[12px] text-ms-green hover:underline">
            ← Back to Finder
          </Link>
          <div className="font-ms text-[10px] text-ms-green tracking-[2px] font-bold">ABOUT</div>
        </div>

        <div className="bg-ms-panel border border-ms-border p-8 mb-8">
          <h1 className="text-2xl md:text-3xl text-white font-bold mb-4 tracking-tight">Micro-SaaS Signal Engine</h1>
          <div className="h-[1px] w-full bg-ms-border mb-6"></div>
          
          <div className="space-y-6 text-[13px] leading-relaxed text-ms-text-light">
            <p>
              The <strong>Micro-SaaS Signal Engine</strong> is an AI-powered research tool designed to help founders discover highly profitable, "boring" B2B micro-SaaS opportunities in legacy industries.
            </p>
            <p>
              Instead of building another generic AI wrapper or consumer app, this tool focuses on finding unsexy, high-retention problems in industries like property management, dental offices, logistics, and manufacturing. These are the spaces where a simple, well-executed software solution can generate significant recurring revenue with low churn.
            </p>
            
            <h2 className="text-lg text-white font-bold mt-8 mb-3">Core Features</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Niche Discovery:</strong> Generate highly specific, underserved B2B micro-SaaS ideas based on your interests or a specific problem.</li>
              <li><strong>Market Validation:</strong> AI-driven analysis of forum discussions, social media sentiment, and competitor landscapes to validate demand.</li>
              <li><strong>Launch Kits:</strong> Generate comprehensive launch kits including Lovable.dev prompts, no-code tech stacks, build roadmaps, marketing assets, and sales scripts.</li>
              <li><strong>Local Lead Finder:</strong> Discover potential early adopters and beta testers in your local area for direct outreach.</li>
              <li><strong>ROI Estimation:</strong> Calculate potential Return on Investment based on estimated build costs and subscription pricing.</li>
            </ul>

            <h2 className="text-lg text-white font-bold mt-8 mb-3">The Team</h2>
            <p>
              Built by a team of indie hackers and AI enthusiasts who believe the best software businesses solve real, painful problems for specific groups of professionals.
            </p>
            <p>
              We leverage the power of Google's Gemini models to process vast amounts of market data and distill it into actionable business intelligence for solo founders and small teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
