export const NICHE_CATEGORIES = {
  "🏭 Legacy B2B Industries": [
    "Dental & Orthodontic Offices","Craft Breweries","Property Managers",
    "Auto Repair & Collision Shops","Commercial Landscapers","Cabinet & Millwork Shops",
    "Indie & Self-Published Authors","Local Law Firms","HVAC & Plumbing Companies","Veterinary Clinics",
    "Plumbing Services","Electricians","Roofing Contractors","HVAC Specialists",
  ],
  "💼 Business & Productivity": [
    "Freelancers & Solopreneurs","Remote Teams","Agency Owners",
    "E-commerce Sellers","Content Creators","Consultants & Coaches",
  ],
  "🛠️ Dev & Tech": [
    "Indie Hackers","No-Code Builders","DevOps & SRE",
    "Web3 & Crypto","AI/ML Practitioners","SaaS Founders",
  ],
  "📈 Finance & Investing": [
    "Personal Finance","Day Traders","Real Estate Investors",
    "Crypto Investors","Small Business Accounting","FIRE Community",
  ],
  "🏥 Health & Wellness": [
    "Fitness Coaches","Mental Health","Nutrition & Dietitians",
    "Sleep Optimization","Chronic Illness","Healthcare Providers",
  ],
  "🎓 Education & Learning": [
    "Online Course Creators","Tutors & Teachers","Students & Learners",
    "EdTech Builders","Language Learners","Career Switchers",
  ],
  "🏠 Lifestyle & Local": [
    "Property Managers","Event Planners","Pet Industry",
    "Home Improvement","Wedding Industry","Restaurant Owners",
  ],
};

export const DEMAND_CFG: Record<string, any> = {
  high:   { color:"#f87171", bg:"#450a0a", label:"HIGH DEMAND",
            tip:"High demand indicates strong search volume and active buyers looking for solutions. Lots of people need this RIGHT NOW and are already complaining about it online." },
  medium: { color:"#facc15", bg:"#422006", label:"MED DEMAND",
            tip:"Medium demand indicates a solid, steady market. Not viral but very reliable income once you land a few customers." },
  low:    { color:"#4ade80", bg:"#064e3b", label:"EMERGING",
            tip:"Low demand means you'll need to educate the market. Small market right now but growing fast. Being first means you could own the whole space!" },
};

export const COMP_CFG: Record<string, any> = {
  low:    { color:"#4ade80", label:"LOW COMP",
            tip:"Low competition means blue ocean (easier to rank, but might lack proven buyers). Hardly anyone is building this yet — you could own the whole market!" },
  medium: { color:"#facc15", label:"MED COMP",
            tip:"Medium competition means some competitors exist but there's plenty of room if you focus on a specific customer type or niche angle." },
  high:   { color:"#f87171", label:"HIGH COMP",
            tip:"High competition means established players exist (validation, but harder to stand out). You'd need a very specific niche angle to win." },
};

export const CHURN_CFG: Record<string, any> = {
  "very low": { color:"#4ade80", bg:"#064e3b", label:"🔒 VERY LOW CHURN",
                tip:"Churn Risk estimates cancellation likelihood. Low churn is critical for compounding MRR. Once customers use this daily it becomes part of their routine. They almost never cancel!" },
  low:        { color:"#86efac", bg:"#022c22", label:"🔒 LOW CHURN",
                tip:"Churn Risk estimates cancellation likelihood. Low churn is critical for compounding MRR. Customers stick around a long time. The product becomes a habit they rely on." },
  medium:     { color:"#facc15", bg:"#422006", label:"⚠ MED CHURN",
                tip:"Churn Risk estimates cancellation likelihood. Some customers may cancel after a few months. You'll need to keep improving the product to hold them." },
  high:       { color:"#f87171", bg:"#450a0a", label:"⚡ HIGH CHURN",
                tip:"Churn Risk estimates cancellation likelihood. High churn hurts growth. Customers might try it and leave quickly. This needs constant new features to keep people subscribed." },
};

export const COMPLEX_CFG: Record<string, any> = {
  simple:   { color:"#4ade80", label:"SIMPLE",
              buildTip:"Build Complexity estimates technical difficulty. Lower complexity means faster time-to-market. You could build a working version in about 1 week using Lovable.dev — just typing prompts, no coding needed!",
              integTip:"Integration Complexity estimates how hard it is to connect to existing tools. Their existing tools have modern APIs. Connecting everything should be easy and straightforward." },
  moderate: { color:"#facc15", label:"MODERATE",
              buildTip:"Build Complexity estimates technical difficulty. Expect about 2–3 weeks of Lovable.dev prompting. A few moving parts but very doable for a solo founder.",
              integTip:"Integration Complexity estimates how hard it is to connect to existing tools. Some of their software is older or a bit tricky. Expect a few workarounds — still manageable." },
  complex:  { color:"#f87171", label:"COMPLEX",
              buildTip:"Build Complexity estimates technical difficulty. This one needs 3–4 weeks to get right. More screens and integrations — still buildable solo, just more involved.",
              integTip:"Integration Complexity estimates how hard it is to connect to existing tools. Legacy system warning! They might use ancient software with no proper API. Budget extra time for workarounds." },
};

export const NICHE_TO_OSM: Record<string, any> = {
  "Dental & Orthodontic Offices":  { tags:[["amenity","dentist"]],                                       gmaps:"dental+orthodontic+offices" },
  "Craft Breweries":               { tags:[["craft","brewery"]],                                         gmaps:"craft+breweries" },
  "Property Managers":             { tags:[["office","estate_agent"],["office","property_management"]], gmaps:"property+management+companies" },
  "Auto Repair & Collision Shops": { tags:[["shop","car_repair"]],                                       gmaps:"auto+repair+collision+shops" },
  "Commercial Landscapers":        { tags:[["craft","gardener"],["craft","landscaper"]],                 gmaps:"commercial+landscaping+companies" },
  "Cabinet & Millwork Shops":      { tags:[["craft","cabinet_maker"],["craft","carpenter"]],             gmaps:"custom+cabinet+millwork+shops" },
  "Local Law Firms":               { tags:[["office","lawyer"],["office","law_firm"]],                   gmaps:"law+firms+attorneys" },
  "HVAC & Plumbing Companies":     { tags:[["craft","plumber"],["craft","hvac_technician"]],             gmaps:"HVAC+plumbing+companies" },
  "Veterinary Clinics":            { tags:[["amenity","veterinary"]],                                    gmaps:"veterinary+clinics" },
  "Agency Owners":                 { tags:[["office","advertising_agency"]],                             gmaps:"marketing+advertising+agencies" },
  "Fitness Coaches":               { tags:[["leisure","fitness_centre"]],                                gmaps:"gyms+fitness+studios" },
  "Mental Health":                 { tags:[["healthcare","psychologist"]],                               gmaps:"mental+health+clinics+therapists" },
  "Healthcare Providers":          { tags:[["amenity","clinic"],["amenity","doctors"]],                  gmaps:"medical+clinics+healthcare+providers" },
  "Tutors & Teachers":             { tags:[["amenity","school"]],                                        gmaps:"tutoring+centers+private+tutors" },
  "Language Learners":             { tags:[["amenity","language_school"]],                               gmaps:"language+schools" },
  "Event Planners":                { tags:[["office","event_management"]],                               gmaps:"event+planning+companies" },
  "Pet Industry":                  { tags:[["shop","pet"],["amenity","veterinary"]],                     gmaps:"pet+stores+grooming+vets" },
  "Home Improvement":              { tags:[["shop","hardware"]],                                         gmaps:"home+improvement+contractors" },
  "Wedding Industry":              { tags:[["shop","wedding"]],                                          gmaps:"wedding+venues+vendors" },
  "Restaurant Owners":             { tags:[["amenity","restaurant"],["amenity","cafe"]],                 gmaps:"restaurants+cafes" },
  "Small Business Accounting":     { tags:[["office","accountant"]],                                     gmaps:"accounting+bookkeeping+firms" },
  "Real Estate Investors":         { tags:[["office","estate_agent"]],                                   gmaps:"real+estate+investment+firms" },
  "Plumbing Services":             { tags:[["craft","plumber"]],                                         gmaps:"plumbing+services+plumbers" },
  "Electricians":                  { tags:[["craft","electrician"]],                                     gmaps:"electricians+electrical+contractors" },
  "Roofing Contractors":           { tags:[["craft","roofer"]],                                          gmaps:"roofing+contractors+roofers" },
  "HVAC Specialists":              { tags:[["craft","hvac"]],                                            gmaps:"hvac+specialists+contractors" },
};

export const toDomain       = (n: any) => {
  const str = typeof n === 'string' ? n : String(n || "");
  return str.toLowerCase().replace(/[^a-z0-9]+/g,"").replace(/^-|-$/g,"") + ".com";
};
export const toDomainHyphen = (n: any) => {
  const str = typeof n === 'string' ? n : String(n || "");
  return str.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") + ".com";
};
