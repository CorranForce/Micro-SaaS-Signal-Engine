"use client";

import React, { useState, useEffect, useRef } from "react";
import { LaunchKitTabs } from "./LaunchKitTabs";
import {
  Search,
  Sparkles,
  TrendingUp,
  Coins,
  Clock,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Code,
  Database,
  Mail,
  BookOpen,
  Users,
  ChevronRight,
  Info,
  ExternalLink,
  Globe,
  Wrench,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Share2,
  ChevronDown,
  Lock,
  Compass,
  Download,
  MessageSquare,
  X,
  Send,
  Bot,
  ChevronUp,
} from "lucide-react";
import {
  searchSaaSIdeas,
  generateLaunchKit,
  loginUser,
  registerUser,
  logoutUser,
  getSessionUser,
  loadApiSettings,
  updateApiSettings,
  chatWithAgent,
  getRealtimeSuggestions,
  sendLaunchKitEmail,
  addToSupabaseAction,
  syncToSupabaseAction,
  checkDomainAvailabilityAction,
} from "./actions";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// --- Types ---
interface SaasIdea {
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  targetAudience: string;
  painSolved: string;
  competitors: string[];
  gtmChannel: string;
  buildComplexity: "simple" | "moderate" | "complex";
  integrationComplexity: "simple" | "moderate" | "complex";
  roi: {
    buildCostUSD: string;
    monthlyExpensesUSD: string;
    realisticMRRMonth1USD: string;
    breakEvenMonths: number;
    roiMonth1Pct: string;
    assumptions: string;
  };
  domains: {
    domain: string;
    likelihood: "High" | "Medium" | "Low";
    reason: string;
  }[];
}

interface LaunchKit {
  lovablePrompt: string;
  buildRoadmap: {
    week: string;
    title: string;
    tasks: string[];
  }[];
  noCodeStack: {
    tool: string;
    role: string;
    why: string;
    cost: string;
  }[];
  marketingAssets: {
    landingHeadline: string;
    landingSubheadline: string;
    ctaButton: string;
    elevatorPitch: string;
    coldEmail: {
      subject: string;
      body: string;
    };
    socialPost: string;
    socialContentStrategy: string;
    blogPostIdeas: string[];
  };
  salesScript: {
    introduction: string;
    discoveryQuestions: string[];
    pitchValueProps: string[];
    objectionHandling: string[];
    callToAction: string;
  };
  pricingTiers?: {
    name: string;
    price: string;
    features: string[];
  }[];
  marketValidation?: {
    goNoGoScore: string;
    proofOfDemand: string;
    redFlags: string[];
  };
  preSellChecklist?: string[];
  databaseRequirements: {
    schemaDescription: string;
    sqlSchema?: string;
    tables: {
      name: string;
      fields: string[];
      purpose: string;
    }[];
  };
}

// Pre-defined Boring B2B Niches
const LEGACY_NICHES = [
  {
    id: "amazon-fba",
    name: "Amazon FBA Sellers",
    icon: "📦",
    desc: "Re-stock limits forecasting, PPC bid automation, and hijacker alerts.",
  },
  {
    id: "auto-repair",
    name: "Auto Repair & Body Shops",
    icon: "🚗",
    desc: "Diagnostic code logging, parts ordering workflows, and mechanic bay scheduling.",
  },
  {
    id: "fitness-studios",
    name: "Boutique Fitness Studios",
    icon: "🧘‍♀️",
    desc: "Class capacity management, instructor substitutions, and recurring membership billing.",
  },
  {
    id: "childcare",
    name: "Childcare & Daycares",
    icon: "🧸",
    desc: "Daily activity reporting, meal tracking, and secure parent check-in/out.",
  },
  {
    id: "cnc-manufacturing",
    name: "CNC & Custom Manufacturing",
    icon: "⚙️",
    desc: "Machine uptime monitoring, raw material inventory tracking, and custom quoting.",
  },
  {
    id: "landscaping",
    name: "Commercial Landscaping",
    icon: "🌿",
    desc: "Seasonal weather dispatching, crew work-order signoffs, and pesticide logs.",
  },
  {
    id: "plumbing",
    name: "Commercial Plumbing",
    icon: "🚰",
    desc: "Pipeline diagnostic logs, commercial parts inventory, and emergency contractor dispatching.",
  },
  {
    id: "construction",
    name: "Commercial Roofing/Subcontractors",
    icon: "🏗️",
    desc: "Subcontractor dispatching, daily logs, and weather-delay reporting.",
  },
  {
    id: "content-creators",
    name: "Content Creators & Influencers",
    icon: "📹",
    desc: "Sponsorship contract tracking, cross-platform scheduling, and asset storage.",
  },
  {
    id: "dentist",
    name: "Dental Practice Ops",
    icon: "🦷",
    desc: "HIPAA compliance checklists, instrument sterilization tracking, and hygiene chair scheduling.",
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing Agencies",
    icon: "📈",
    desc: "Client portal reporting, ad spend monitoring, and cross-platform campaign approvals.",
  },
  {
    id: "dry-cleaning",
    name: "Dry Cleaning & Laundry",
    icon: "🧥",
    desc: "Pick-up route planners, locker integrations, and batch notification emails.",
  },
  {
    id: "ecommerce-ops",
    name: "E-Commerce & D2C Brands",
    icon: "🛒",
    desc: "Multi-channel inventory sync, reverse logistics/returns, and supplier communication.",
  },
  {
    id: "freelance-designers",
    name: "Freelance Design & Dev",
    icon: "🎨",
    desc: "Client feedback loop, milestone invoicing, and retainer hours tracking.",
  },
  {
    id: "hvac",
    name: "HVAC & Electrical",
    icon: "🔌",
    desc: "Scheduling, inventory tracking, and client signatures for contractors.",
  },
  {
    id: "veterinary",
    name: "Independent Veterinary Practices",
    icon: "🐾",
    desc: "Client reminder automation, inventory waste management, and boarding logs.",
  },
  {
    id: "cleaning",
    name: "Janitorial & Cleaning",
    icon: "🧹",
    desc: "Supply inventory tracking, contract shift checklists, and automated client invoicing.",
  },
  {
    id: "logistics",
    name: "Local Fleet & Courier Logistics",
    icon: "🚚",
    desc: "Driver route handoffs, fuel surcharge calculators, and proof of delivery.",
  },
  {
    id: "niche-agriculture",
    name: "Niche Agriculture (Orchards/Greenhouses)",
    icon: "🌱",
    desc: "Harvest yield tracking, micro-climate monitoring logs, and seasonal labor scheduling.",
  },
  {
    id: "online-course",
    name: "Online Course Creators",
    icon: "🎓",
    desc: "Student engagement analytics, drip sequence automation, and community moderation.",
  },
  {
    id: "pest-control",
    name: "Pest Control & Exterminators",
    icon: "🐜",
    desc: "Chemical usage tracking, service area optimization, and recurring billing.",
  },
  {
    id: "physical-therapy",
    name: "Physical Therapy Clinics",
    icon: "🏃‍♂️",
    desc: "Home exercise program generation, progress notes, and insurance pre-authorization.",
  },
  {
    id: "property-management",
    name: "Property Management & HOAs",
    icon: "🏘️",
    desc: "Maintenance request ticketing, violation tracking, and community amenity booking.",
  },
  {
    id: "remote-recruitment",
    name: "Remote HR & Recruitment",
    icon: "🤝",
    desc: "Asynchronous video interviews, onboarding checklists, and payroll compliance.",
  },
  {
    id: "storage",
    name: "Self Storage Facilities",
    icon: "📦",
    desc: "Locker rental automation, gate integrations, and automated delinquent tenant notifications.",
  },
  {
    id: "food-distributors",
    name: "Specialty Food Distributors",
    icon: "🥖",
    desc: "Perishable inventory tracking, delivery route optimization, and wholesale ordering.",
  },
  {
    id: "waste-management",
    name: "Waste Management & Scrap Yards",
    icon: "♻️",
    desc: "Scale measurement recording, scrap pricing feeds, and roll-off bin tracking.",
  },
];

// Fallback SQL generator for older cached/saved LaunchKits
function generateSqlFallback(
  tables: { name: string; fields: string[]; purpose: string }[],
): string {
  if (!tables || tables.length === 0) return "-- No tables defined";

  let sql = `-- PostgreSQL / Supabase Schema SQL (Generated Fallback)\n`;
  sql += `-- Created from target launch kit table requirements\n\n`;

  tables.forEach((table) => {
    sql += `-- Table: ${table.name}\n`;
    sql += `-- Purpose: ${table.purpose}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;

    const parsedFields = table.fields.map((field) => {
      const cleanField = field.trim();
      const colonIndex = cleanField.indexOf(":");

      let name = "";
      let remaining = "";

      if (colonIndex !== -1) {
        name = cleanField.substring(0, colonIndex).trim();
        remaining = cleanField.substring(colonIndex + 1).trim();
      } else {
        const spaceIdx = cleanField.indexOf(" ");
        if (spaceIdx !== -1) {
          name = cleanField.substring(0, spaceIdx).trim();
          remaining = cleanField.substring(spaceIdx + 1).trim();
        } else {
          name = cleanField;
          remaining = "text";
        }
      }

      let sqlName = name.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!sqlName) sqlName = "column_name";

      let sqlType = "text";
      let constraints = "";
      let comment = remaining;

      const lowerRem = remaining.toLowerCase();

      if (lowerRem.startsWith("uuid")) {
        sqlType = "uuid";
        if (lowerRem.includes("primary")) {
          constraints += " PRIMARY KEY DEFAULT gen_random_uuid()";
        }
      } else if (
        lowerRem.startsWith("text") ||
        lowerRem.startsWith("varchar") ||
        lowerRem.startsWith("string")
      ) {
        sqlType = "text";
        if (lowerRem.includes("unique")) {
          constraints += " UNIQUE";
        }
        if (lowerRem.includes("not null")) {
          constraints += " NOT NULL";
        }
      } else if (
        lowerRem.startsWith("timestamp") ||
        lowerRem.startsWith("date") ||
        lowerRem.startsWith("time")
      ) {
        sqlType = "timestamp with time zone";
        if (
          lowerRem.includes("now") ||
          lowerRem.includes("created_at") ||
          lowerRem.includes("default")
        ) {
          constraints += " DEFAULT now()";
        }
      } else if (
        lowerRem.startsWith("int") ||
        lowerRem.startsWith("num") ||
        lowerRem.startsWith("float") ||
        lowerRem.startsWith("serial")
      ) {
        sqlType = lowerRem.startsWith("serial") ? "serial" : "integer";
        if (lowerRem.includes("primary")) {
          constraints += " PRIMARY KEY";
        }
      } else if (
        lowerRem.startsWith("bool") ||
        lowerRem.startsWith("boolean")
      ) {
        sqlType = "boolean";
        if (lowerRem.includes("default false")) {
          constraints += " DEFAULT false";
        } else if (lowerRem.includes("default true")) {
          constraints += " DEFAULT true";
        }
      } else {
        const firstWord = remaining.split(/[\s()]/)[0].toLowerCase();
        if (
          [
            "integer",
            "bigint",
            "numeric",
            "boolean",
            "uuid",
            "jsonb",
            "json",
            "date",
            "timestamp",
          ].includes(firstWord)
        ) {
          sqlType = firstWord;
        }
      }

      return `  ${sqlName} ${sqlType}${constraints} -- ${comment}`;
    });

    sql += parsedFields.join(",\n");
    sql += `\n);\n\n`;
  });

  return sql.trim();
}

function TypewriterLog({ text, color }: { text: string; color: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 15);

    return () => clearInterval(typingInterval);
  }, [text]);

  return (
    <div className={`${color} leading-relaxed`}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-3 bg-current ml-1 animate-pulse align-middle" />
      )}
    </div>
  );
}

const TableNode = ({ data }: any) => {
  return (
    <div className="bg-ms-card border border-ms-border rounded shadow-lg min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-ms-text-muted !w-2 !h-2 !border-none"
      />
      <div className="bg-ms-bg/80 px-3 py-2 border-b border-ms-border font-ms font-bold text-xs text-white uppercase flex items-center gap-2">
        <Database className="w-3 h-3 text-ms-green" />
        {data.name}
      </div>
      <div className="p-2 flex flex-col gap-1">
        {data.fields.map((field: string, idx: number) => {
          const isFk =
            field.toLowerCase().includes("fk") ||
            field.toLowerCase().includes("foreign key");
          const isPk =
            field.toLowerCase().includes("pk") ||
            field.toLowerCase().includes("primary key");
          return (
            <div
              key={idx}
              className="flex items-center justify-between text-[10px] font-mono"
            >
              <span
                className={`truncate ${isPk ? "text-ms-yellow font-bold" : isFk ? "text-ms-green" : "text-ms-text-muted"}`}
              >
                {field.split(" ")[0]}
              </span>
              <span className="text-ms-text-muted opacity-50 ml-2">
                {field.split(" ").slice(1).join(" ")}
              </span>
            </div>
          );
        })}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-ms-text-muted !w-2 !h-2 !border-none"
      />
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

function VisualSchemaDiagram({ tables }: { tables: any[] }) {
  const nodes: Node[] = tables.map((table, idx) => ({
    id: table.name,
    type: "tableNode",
    position: { x: (idx % 2) * 350, y: Math.floor(idx / 2) * 250 },
    data: { name: table.name, fields: table.fields },
  }));

  const edges: Edge[] = [];
  tables.forEach((table) => {
    table.fields.forEach((field: string) => {
      const fieldLower = field.toLowerCase();
      const fieldName = fieldLower.split(" ")[0];

      if (
        fieldLower.includes("fk") ||
        fieldLower.includes("references") ||
        fieldName.endsWith("_id")
      ) {
        const targetTable = tables.find(
          (t) =>
            t.name !== table.name &&
            (fieldName === `${t.name}_id` ||
              fieldName === `${t.name.slice(0, -1)}_id` ||
              fieldName === t.name),
        );

        if (targetTable) {
          edges.push({
            id: `e-${table.name}-${targetTable.name}-${fieldName}`,
            source: table.name,
            target: targetTable.name,
            animated: true,
            style: { stroke: "#00f076", strokeWidth: 1.5, opacity: 0.6 },
          });
        }
      }
    });
  });

  return (
    <div className="h-[500px] w-full bg-[#111] border border-ms-border rounded-lg relative overflow-hidden mt-4">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Background color="#333" gap={16} />
      </ReactFlow>
    </div>
  );
}

function CompareNichesView() {
  const [niche1, setNiche1] = useState<string>("Dental Practices");
  const [niche2, setNiche2] = useState<string>("HVAC Services");

  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const getMetrics = (name: string) => {
    const hash = hashCode(name);
    const mrr = 5000 + (hash % 15000); // 5k to 20k
    const buildScore = (hash % 10) + 1; // 1 to 10
    const growth = 5 + (hash % 30); // 5% to 35%

    // Generate some chart data
    let base = 30 + (hash % 20);
    const data = [
      { month: "Jan", demand: base },
      { month: "Feb", demand: (base += hash % 5) },
      { month: "Mar", demand: (base -= hash % 3) },
      { month: "Apr", demand: (base += 5 + (hash % 8)) },
      { month: "May", demand: (base += 2 + (hash % 6)) },
      { month: "Jun", demand: (base += 8 + (hash % 10)) },
    ];

    return { mrr, buildScore, growth, data };
  };

  const metrics1 = getMetrics(niche1);
  const metrics2 = getMetrics(niche2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-ms-text-muted font-bold font-ms uppercase tracking-wider">
            Niche 1
          </label>
          <select
            value={niche1}
            onChange={(e) => setNiche1(e.target.value)}
            className="bg-ms-bg border border-ms-border text-white text-sm font-ms rounded px-3 py-2 focus:outline-none focus:border-ms-green w-full"
          >
            {LEGACY_NICHES.map((n) => (
              <option key={`n1-${n.id}`} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-ms-text-muted font-bold font-ms uppercase tracking-wider">
            Niche 2
          </label>
          <select
            value={niche2}
            onChange={(e) => setNiche2(e.target.value)}
            className="bg-ms-bg border border-ms-border text-white text-sm font-ms rounded px-3 py-2 focus:outline-none focus:border-ms-green w-full"
          >
            {LEGACY_NICHES.map((n) => (
              <option key={`n2-${n.id}`} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-ms-card border border-ms-border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left font-ms text-ms-text-muted">
          <thead className="text-[10px] text-white uppercase bg-ms-bg/80 border-b border-ms-border">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider">Metric</th>
              <th className="px-6 py-4 font-bold tracking-wider border-l border-ms-border text-ms-green w-1/3">
                {niche1}
              </th>
              <th className="px-6 py-4 font-bold tracking-wider border-l border-ms-border text-ms-yellow w-1/3">
                {niche2}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ms-border">
            <tr className="hover:bg-ms-bg/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white text-xs">
                Growth Trend (6Mo)
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <span className="text-ms-green font-bold">
                  +{metrics1.growth}%
                </span>
                <div className="h-16 mt-2 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics1.data}>
                      <Line
                        type="monotone"
                        dataKey="demand"
                        stroke="#00f076"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <span className="text-ms-yellow font-bold">
                  +{metrics2.growth}%
                </span>
                <div className="h-16 mt-2 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics2.data}>
                      <Line
                        type="monotone"
                        dataKey="demand"
                        stroke="#ffeb3b"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </td>
            </tr>
            <tr className="hover:bg-ms-bg/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white text-xs">
                Avg MRR Potential
              </td>
              <td className="px-6 py-4 border-l border-ms-border text-white">
                ${metrics1.mrr.toLocaleString()}/mo
              </td>
              <td className="px-6 py-4 border-l border-ms-border text-white">
                ${metrics2.mrr.toLocaleString()}/mo
              </td>
            </tr>
            <tr className="hover:bg-ms-bg/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white text-xs">
                Build Complexity
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-ms-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ms-green"
                      style={{ width: `${(metrics1.buildScore / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px]">{metrics1.buildScore}/10</span>
                </div>
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-ms-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ms-yellow"
                      style={{ width: `${(metrics2.buildScore / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px]">{metrics2.buildScore}/10</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "model"; text: string }[]
  >([
    {
      role: "model",
      text: "Hello! I'm your SaaS advisor. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [taskType, setTaskType] = useState<"general" | "complex" | "fast">(
    "general",
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");

    const newMessages = [
      ...messages,
      { role: "user" as const, text: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Map to Gemini history format
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }] as [{ text: string }],
      }));

      const reply = await chatWithAgent(history, userMessage, taskType);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, I encountered an error: " + e.message },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-ms-green rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 text-ms-bg"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-ms-card border border-ms-border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="bg-ms-bg border-b border-ms-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-ms-green" />
              <h3 className="text-sm font-bold text-white font-ms">
                Signal Engine AI
              </h3>
            </div>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="bg-ms-card border border-ms-border text-xs text-ms-text-muted rounded px-2 py-1 focus:outline-none"
            >
              <option value="fast">Flash Lite (Fast)</option>
              <option value="general">Flash (General)</option>
              <option value="complex">Pro (High Thinking)</option>
            </select>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            ref={scrollRef}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-ms-green text-ms-bg font-medium"
                      : "bg-ms-bg border border-ms-border text-ms-text-muted"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ms-bg border border-ms-border rounded-lg p-3 text-sm text-ms-text-muted flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-ms-text-muted animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-ms-text-muted animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-ms-text-muted animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-ms-border bg-ms-bg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about SaaS ideas..."
                className="flex-1 bg-ms-card border border-ms-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ms-green"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-ms-green text-ms-bg p-2 rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function MicroSaaSSignalEngine() {
  const [mounted, setMounted] = useState<boolean>(false);
  // Navigation
  const [activeTab, setActiveTab] = useState<
    "find" | "compare" | "saved" | "about" | "settings"
  >("find");

  // Input states
  const [selectedNiche, setSelectedNiche] = useState<string>("hvac");
  const [customNiche, setCustomNiche] = useState<string>("");
  const [mrrTarget, setMrrTarget] = useState<number>(5000);
  const [additionalContext, setAdditionalContext] = useState<string>("");

  // UI state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [generatedIdeas, setGeneratedIdeas] = useState<SaasIdea[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Launch Kit state
  const [activeIdeaIndex, setActiveIdeaIndex] = useState<number | null>(null);
  const [launchKits, setLaunchKits] = useState<
    Record<
      number,
      { loading: boolean; data: LaunchKit | null; error: string | null }
    >
  >({});
  const [kitTab, setKitTab] = useState<
    "prompt" | "stack" | "roadmap" | "marketing" | "sales" | "database"
  >("prompt");

  // Saved Ideas (Durable persistence via localStorage)
  const [savedIdeas, setSavedIdeas] = useState<
    { idea: SaasIdea; kit: LaunchKit | null; savedAt: string }[]
  >([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedSavedIdeas, setExpandedSavedIdeas] = useState<Record<number, boolean>>({});
  const [savedKitsSearchQuery, setSavedKitsSearchQuery] = useState("");

  // Track email dispatch status for launch kits
  const [emailStatus, setEmailStatus] = useState<
    Record<number, { success: boolean; message: string } | null>
  >({});

  // Real-time suggestions state
  const [realtimeKeywords, setRealtimeKeywords] = useState<string[]>([]);
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const finalNiche =
      customNiche ||
      LEGACY_NICHES.find((n) => n.id === selectedNiche)?.name ||
      selectedNiche ||
      "General B2B";

    if (!finalNiche) return;

    setIsSuggestionsLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await getRealtimeSuggestions(
          finalNiche,
          additionalContext,
        );
        if (data) {
          setRealtimeKeywords(data.keywords || []);
          setRealtimeSuggestions(data.suggestions || []);
        }
      } catch (err: any) {
        if (
          err?.message === "Failed to fetch" ||
          err?.message?.includes("fetch")
        ) {
          // Ignore harmless network drop during dev rebuilds
        } else {
          console.error("Error fetching real-time suggestions:", err);
        }
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedNiche, customNiche, additionalContext]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Card-specific actions loading state
  const [isEmailingCard, setIsEmailingCard] = useState<Record<number, boolean>>(
    {},
  );
  const [emailCardStatus, setEmailCardStatus] = useState<
    Record<number, { success: boolean; message: string } | null>
  >({});
  const [isSavingToSupabase, setIsSavingToSupabase] = useState<
    Record<number, boolean>
  >({});
  const [supabaseCardStatus, setSupabaseCardStatus] = useState<
    Record<number, { success: boolean; message: string; sql?: string } | null>
  >({});

  // Domain checking states
  const [domainCheckStatus, setDomainCheckStatus] = useState<
    Record<
      string,
      {
        checking?: boolean;
        available?: boolean;
        error?: string;
        price?: number;
      }
    >
  >({});

  // Expanded cards state
  const [expandedIdeas, setExpandedIdeas] = useState<Record<number, boolean>>(
    {},
  );

  // Active workspace actions loading state
  const [isEmailingActive, setIsEmailingActive] = useState<boolean>(false);
  const [activeEmailStatus, setActiveEmailStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSavingActiveToSupabase, setIsSavingActiveToSupabase] =
    useState<boolean>(false);
  const [activeSupabaseStatus, setActiveSupabaseStatus] = useState<{
    success: boolean;
    message: string;
    sql?: string;
  } | null>(null);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] =
    useState<boolean>(false);
  const [isAuthRegister, setIsAuthRegister] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // API Settings states
  const [apiSettings, setApiSettings] = useState({
    supabaseUrl: "",
    supabaseAnonKey: "",
    resendApiKey: "",
    godaddyApiKey: "",
    godaddyApiSecret: "",
    compactMode: false,
    fontFamily: "inter",
    fontSize: "base",
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load Saved Ideas & Session on Mount
  useEffect(() => {
    const savedWorkspace = localStorage.getItem("workspace_state");
    if (savedWorkspace) {
      try {
        const parsed = JSON.parse(savedWorkspace);
        if (parsed.selectedNiche) setSelectedNiche(parsed.selectedNiche);
        if (parsed.customNiche) setCustomNiche(parsed.customNiche);
        if (parsed.mrrTarget) setMrrTarget(parsed.mrrTarget);
        if (parsed.additionalContext)
          setAdditionalContext(parsed.additionalContext);
        if (parsed.generatedIdeas && parsed.generatedIdeas.length > 0) {
          setGeneratedIdeas(parsed.generatedIdeas);
          if (parsed.terminalLogs) setTerminalLogs(parsed.terminalLogs);
        }
      } catch (e) {
        console.error("Error parsing workspace state", e);
      }
    }

    setMounted(true);
    const saved = localStorage.getItem("saved_micro_saas");
    if (saved) {
      try {
        setSavedIdeas(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved ideas", e);
      }
    }

    // Check user session
    const savedSessionUser = localStorage.getItem("session_user");
    if (savedSessionUser) {
      setCurrentUser(savedSessionUser);
    }
    getSessionUser().then((email) => {
      setCurrentUser(email);
      if (email) {
        localStorage.setItem("session_user", email);
      } else {
        localStorage.removeItem("session_user");
      }
    });

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Auto-save workspace state
  useEffect(() => {
    if (!mounted) return;
    const stateToSave = {
      selectedNiche,
      customNiche,
      mrrTarget,
      additionalContext,
      generatedIdeas,
      terminalLogs,
    };
    localStorage.setItem("workspace_state", JSON.stringify(stateToSave));
  }, [
    mounted,
    selectedNiche,
    customNiche,
    mrrTarget,
    additionalContext,
    generatedIdeas,
    terminalLogs,
  ]);

  // Sync API Settings fetch with Operator Login
  useEffect(() => {
    if (currentUser?.toLowerCase() === "corranforce@gmail.com") {
      setIsLoadingSettings(true);
      loadApiSettings(currentUser)
        .then((settings) => {
          setApiSettings(settings);
          setSettingsMessage(null);
        })
        .catch((err) => {
          setSettingsMessage({
            type: "error",
            text: err.message || "Failed to load credentials.",
          });
        })
        .finally(() => {
          setIsLoadingSettings(false);
        });
    }
  }, [currentUser]);

  // Auth form submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmittingAuth(true);

    try {
      if (isAuthRegister) {
        const res = await registerUser(authEmail, authPassword);
        if (res.success) {
          setCurrentUser(res.email);
          localStorage.setItem("session_user", res.email);
          setAuthSuccess("Account successfully generated! Connecting...");
          setTimeout(() => {
            setShowAuthModal(false);
            setAuthEmail("");
            setAuthPassword("");
            setAuthSuccess(null);
          }, 1200);
        }
      } else {
        const res = await loginUser(authEmail, authPassword);
        if (res.success) {
          setCurrentUser(res.email);
          localStorage.setItem("session_user", res.email);
          setAuthSuccess("Access cipher verified. Initializing session...");
          setTimeout(() => {
            setShowAuthModal(false);
            setAuthEmail("");
            setAuthPassword("");
            setAuthSuccess(null);
          }, 1200);
        }
      }
    } catch (err: any) {
      setAuthError(
        err.message || "Authentication failed. Double check your credentials.",
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      localStorage.removeItem("session_user");
      if (activeTab === "settings") {
        setActiveTab("find");
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.toLowerCase() !== "corranforce@gmail.com") {
      setSettingsMessage({
        type: "error",
        text: "Operator authorization mismatch.",
      });
      return;
    }
    setIsSavingSettings(true);
    setSettingsMessage(null);

    try {
      const res = await updateApiSettings(currentUser, apiSettings);
      if (res.success) {
        setSettingsMessage({
          type: "success",
          text: "API configurations successfully integrated.",
        });
      }
    } catch (err: any) {
      setSettingsMessage({
        type: "error",
        text: err.message || "Failed to synchronize credentials.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Sync Saved Ideas to localStorage
  const saveToLocalStorage = (newSaved: typeof savedIdeas) => {
    setSavedIdeas(newSaved);
    localStorage.setItem("saved_micro_saas", JSON.stringify(newSaved));
  };

  useEffect(() => {
    if (!currentUser || savedIdeas.length === 0) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await syncToSupabaseAction(currentUser, savedIdeas);
        if (res.success && res.count > 0) {
          console.log(
            `Synced ${res.count} saved ideas to Supabase in the background.`,
          );
        }
      } catch (err) {
        console.error("Background sync error:", err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(syncInterval);
  }, [currentUser, savedIdeas]);

  // Log scrolling removed because we prepend logs
  useEffect(() => {
    // No-op
  }, [terminalLogs]);

  // Handle PDF Export
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportPdf = async (
    index: number,
    providedIdea?: SaasIdea,
    providedKit?: LaunchKit
  ) => {
    const idea = providedIdea || generatedIdeas[index];
    const kit = providedKit || launchKits[index]?.data;
    if (!idea || !kit) return;

    try {
      setIsExporting(true);
      const html2pdfModule = await import("html2pdf.js");
      // html2pdf.js can be tricky with exports, try both default and direct
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      const container = document.createElement("div");
      container.style.padding = "40px";
      container.style.fontFamily = "'Inter', sans-serif";
      container.style.color = "#000";
      container.style.backgroundColor = "#fff";
      container.style.lineHeight = "1.6";
      container.style.width = "800px";

      let html = `
        <div style="margin-bottom: 30px; border-bottom: 2px solid #00f076; padding-bottom: 20px;">
          <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #111;">${idea.name}</h1>
          <p style="font-size: 16px; margin: 0; color: #555; font-style: italic;">"${idea.tagline}"</p>
        </div>

        <h2 style="font-size: 20px; color: #222; margin-top: 20px;">Opportunity Spec</h2>
        <p><strong>Problem:</strong> ${idea.problem}</p>
        <p><strong>Solution:</strong> ${idea.solution}</p>
        <p><strong>Target Customer:</strong> ${idea.targetAudience}</p>
        <p><strong>Pain Solved:</strong> ${idea.painSolved || ""}</p>
        <p><strong>Build Complexity:</strong> ${idea.buildComplexity}</p>
        <p><strong>MRR Target:</strong> ${idea.roi?.realisticMRRMonth1USD || ""}</p>
        <p><strong>Estimated Build Cost:</strong> ${idea.roi?.buildCostUSD || ""}</p>
        <p><strong>Projected 1-Month ROI:</strong> ${idea.roi?.roiMonth1Pct || ""}</p>

        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">1. Vibe-Coding Prompt</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${kit.lovablePrompt}</div>

        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">2. Build Roadmap</h2>
      `;

      kit.buildRoadmap.forEach((week: any) => {
        html += `
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 16px; margin: 0 0 5px 0;">${week.week}</h3>
            <p style="margin: 0; font-size: 14px; font-weight: bold;">${week.title}</p>
            <ul style="margin: 5px 0 0 20px; font-size: 13px;">
              ${week.tasks.map((f: string) => `<li>${f}</li>`).join("")}
            </ul>
          </div>
        `;
      });

      html += `
        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">3. No-Code Tech Stack</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid #ddd;">
              <th style="padding: 8px;">Role</th>
              <th style="padding: 8px;">Tool</th>
              <th style="padding: 8px;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${kit.noCodeStack
              .map(
                (stack: any) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold;">${stack.role}</td>
                <td style="padding: 8px;">${stack.tool}</td>
                <td style="padding: 8px; color: #555;">${stack.cost}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h2 style="font-size: 20px; color: #222; margin-top: 30px; margin-bottom: 10px;">4. Marketing & Outreach</h2>
        <h3 style="font-size: 16px; margin: 0 0 5px 0;">Landing Page Headline</h3>
        <p style="font-size: 18px; font-weight: bold; background: #f0fdf4; padding: 10px; border-left: 4px solid #00f076;">${kit.marketingAssets.landingHeadline}</p>
        
        <h3 style="font-size: 16px; margin: 15px 0 5px 0;">Cold Email Template</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 14px; white-space: pre-wrap;"><strong>Subject:</strong> ${kit.marketingAssets.coldEmail.subject}

${kit.marketingAssets.coldEmail.body}</div>

        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">5. Database Schema</h2>
        <p style="font-size: 14px;">${kit.databaseRequirements.schemaDescription}</p>
      `;

      if (kit.databaseRequirements.sqlSchema) {
        html += `
          <div style="background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${kit.databaseRequirements.sqlSchema}</div>
        `;
      } else if (kit.databaseRequirements.tables) {
        // Fallback for older kits
        const fallbackSql = generateSqlFallback(
          kit.databaseRequirements.tables,
        );
        html += `
          <div style="background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${fallbackSql}</div>
        `;
      }

      container.innerHTML = html;

      const opt = {
        margin: 15,
        filename: `${idea.name.toLowerCase().replace(/\s+/g, "-")}-launch-kit.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(container).save();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Copy Button
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAppendContext = (text: string) => {
    setAdditionalContext((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (/[.,!?;]$/.test(trimmed)) {
        return `${trimmed} ${text}`;
      }
      return `${trimmed}, ${text}`;
    });
  };

  const selectedNicheNameForUI =
    customNiche ||
    LEGACY_NICHES.find((n) => n.id === selectedNiche)?.name ||
    selectedNiche ||
    "General B2B";

  // Run the crawler simulator and request ideas from Gemini
  const handleDiscover = async () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsScanning(true);
    setScanProgress(0);
    setGeneratedIdeas([]);
    setErrorMessage(null);
    setActiveIdeaIndex(null);
    setLaunchKits({});
    setTerminalLogs([]);

    const selectedNicheName = selectedNicheNameForUI;

    const mockLogs = [
      `[INIT] Booting B2B Opportunity Scraper Engine v2.1...`,
      `[CONNECT] Establishing tunnel to Google AI Studio Sandbox...`,
      `[SCANNING] Crawling online directories & niche industry subreddits for: "${selectedNicheName}"...`,
      `[ANALYZE] Parsing negative reviews for legacy software used by ${selectedNicheName} teams...`,
      `[COMPILING] Identifying key friction points: manual entry, missing mobile compliance, paper tickets...`,
      `[VALUATION] Calculating ROI metrics using MRR goal: $${mrrTarget}/mo...`,
      `[GENERATE] Formulating bespoke B2B Micro-SaaS ideas via Gemini 3.5...`,
      `[FINALIZE] Mapping technical feasibility and available dotcom domains...`,
    ];

    // Log typing simulation
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < mockLogs.length) {
        setTerminalLogs((prev) => [mockLogs[currentLogIndex], ...prev]);
        setScanProgress(
          Math.floor(((currentLogIndex + 1) / mockLogs.length) * 100),
        );
        currentLogIndex++;
      } else {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        triggerGeminiCall();
      }
    }, 700);
    scanIntervalRef.current = interval;
  };

  const triggerGeminiCall = async () => {
    const finalNiche =
      customNiche ||
      LEGACY_NICHES.find((n) => n.id === selectedNiche)?.name ||
      selectedNiche;
    try {
      const data = await searchSaaSIdeas(finalNiche, additionalContext);
      if (data && data.saasIdeas) {
        setGeneratedIdeas(data.saasIdeas);
        setTerminalLogs((prev) => [
          `[SUCCESS] 3 Premium B2B blueprints successfully loaded and validated! 🎉`,
          ...prev,
        ]);
      } else {
        throw new Error("Invalid output received. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "An error occurred during SaaS idea generation.",
      );
      setTerminalLogs((prev) => [
        `[ERROR] Scrape failed: ${err.message || "Unknown error"}`,
        ...prev,
      ]);
    } finally {
      setIsScanning(false);
      if (pageTopRef.current) {
        pageTopRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleEmailCard = async (idea: SaasIdea, index: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setIsEmailingCard((prev) => ({ ...prev, [index]: true }));
    setEmailCardStatus((prev) => ({ ...prev, [index]: null }));

    try {
      const kitData = launchKits[index]?.data || null;
      const res = await sendLaunchKitEmail(currentUser, idea, kitData);

      if (res.success) {
        setEmailCardStatus((prev) => ({
          ...prev,
          [index]: {
            success: true,
            message: `Sent blueprint email to ${currentUser}! 📬`,
          },
        }));
      } else {
        if (res.reason && res.reason.includes("RESEND_API_KEY")) {
          setEmailCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: `Resend API Key is missing. Configure RESEND_API_KEY in the Secrets section.`,
            },
          }));
        } else {
          setEmailCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: res.error || "Failed to send email.",
            },
          }));
        }
      }
    } catch (err: any) {
      setEmailCardStatus((prev) => ({
        ...prev,
        [index]: {
          success: false,
          message: err.message || "Failed to dispatch email.",
        },
      }));
    } finally {
      setIsEmailingCard((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSupabaseCard = async (idea: SaasIdea, index: number) => {
    setIsSavingToSupabase((prev) => ({ ...prev, [index]: true }));
    setSupabaseCardStatus((prev) => ({ ...prev, [index]: null }));

    try {
      const kitData = launchKits[index]?.data || null;
      const res = await addToSupabaseAction(idea, kitData);

      if (res.success) {
        setSupabaseCardStatus((prev) => ({
          ...prev,
          [index]: {
            success: true,
            message: "Blueprint pushed to Supabase table 'saved_ideas'! 🚀",
          },
        }));
      } else {
        if (res.reason === "SUPABASE_CONFIG_MISSING") {
          setSupabaseCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message:
                "Supabase config missing! Save your URL/Key under Settings first.",
            },
          }));
        } else if (res.reason === "TABLE_NOT_FOUND") {
          setSupabaseCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message:
                res.error ||
                "Table 'saved_ideas' not found (or schema cache needs reload). Click copy below to see the required SQL schema.",
              sql: res.sql,
            },
          }));
        } else {
          setSupabaseCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: res.error || "Failed to save to Supabase.",
            },
          }));
        }
      }
    } catch (err: any) {
      setSupabaseCardStatus((prev) => ({
        ...prev,
        [index]: {
          success: false,
          message: err.message || "Failed to save to Supabase.",
        },
      }));
    } finally {
      setIsSavingToSupabase((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleCheckDomain = async (domain: string) => {
    if (domainCheckStatus[domain]?.checking) return;

    setDomainCheckStatus((prev) => ({ ...prev, [domain]: { checking: true } }));

    try {
      const res = await checkDomainAvailabilityAction(domain);
      if (res.success) {
        setDomainCheckStatus((prev) => ({
          ...prev,
          [domain]: {
            checking: false,
            available: res.available,
            price: res.price,
          },
        }));
      } else {
        setDomainCheckStatus((prev) => ({
          ...prev,
          [domain]: {
            checking: false,
            error: res.error,
          },
        }));
      }
    } catch (err: any) {
      setDomainCheckStatus((prev) => ({
        ...prev,
        [domain]: {
          checking: false,
          error: err.message || "Failed to check domain.",
        },
      }));
    }
  };

  const handleEmailActive = async () => {
    if (activeIdeaIndex === null) return;
    const idea = generatedIdeas[activeIdeaIndex];
    if (!idea) return;

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setIsEmailingActive(true);
    setActiveEmailStatus(null);

    try {
      const kitData = launchKits[activeIdeaIndex]?.data || null;
      const res = await sendLaunchKitEmail(currentUser, idea, kitData);

      if (res.success) {
        setActiveEmailStatus({
          success: true,
          message: `Launch Kit successfully emailed to ${currentUser}! 📬`,
        });
      } else {
        if (res.reason && res.reason.includes("RESEND_API_KEY")) {
          setActiveEmailStatus({
            success: false,
            message:
              "Resend API Key is missing. Configure RESEND_API_KEY in the Secrets section.",
          });
        } else {
          setActiveEmailStatus({
            success: false,
            message: res.error || "Failed to send email.",
          });
        }
      }
    } catch (err: any) {
      setActiveEmailStatus({
        success: false,
        message: err.message || "Failed to dispatch email.",
      });
    } finally {
      setIsEmailingActive(false);
    }
  };

  const handleSupabaseActive = async () => {
    if (activeIdeaIndex === null) return;
    const idea = generatedIdeas[activeIdeaIndex];
    if (!idea) return;

    setIsSavingActiveToSupabase(true);
    setActiveSupabaseStatus(null);

    try {
      const kitData = launchKits[activeIdeaIndex]?.data || null;
      const res = await addToSupabaseAction(idea, kitData);

      if (res.success) {
        setActiveSupabaseStatus({
          success: true,
          message:
            "Launch Kit successfully pushed to Supabase table 'saved_ideas'! 🚀",
        });
      } else {
        if (res.reason === "SUPABASE_CONFIG_MISSING") {
          setActiveSupabaseStatus({
            success: false,
            message:
              "Supabase config missing! Enter your credentials under the Settings tab first.",
          });
        } else if (res.reason === "TABLE_NOT_FOUND") {
          setActiveSupabaseStatus({
            success: false,
            message:
              res.error ||
              "Table 'saved_ideas' not found (or schema cache needs reload).",
            sql: res.sql,
          });
        } else {
          setActiveSupabaseStatus({
            success: false,
            message: res.error || "Failed to save to Supabase.",
          });
        }
      }
    } catch (err: any) {
      setActiveSupabaseStatus({
        success: false,
        message: err.message || "Failed to save to Supabase.",
      });
    } finally {
      setIsSavingActiveToSupabase(false);
    }
  };

  // Generate Launch Kit for a specific idea
  const handleGenerateKit = async (idea: SaasIdea, index: number) => {
    setLaunchKits((prev) => ({
      ...prev,
      [index]: { loading: true, data: null, error: null },
    }));
    setEmailStatus((prev) => ({
      ...prev,
      [index]: null,
    }));
    setActiveIdeaIndex(index);
    setKitTab("prompt");

    try {
      const data = await generateLaunchKit(idea);
      setLaunchKits((prev) => ({
        ...prev,
        [index]: { loading: false, data: data, error: null },
      }));

      // Trigger automatic email dispatch if user is logged in
      if (currentUser) {
        setEmailStatus((prev) => ({
          ...prev,
          [index]: {
            success: true,
            message: `Dispatching Launch Kit email to ${currentUser}...`,
          },
        }));
        try {
          const emailRes = await sendLaunchKitEmail(currentUser, idea, data);
          if (emailRes.success) {
            setEmailStatus((prev) => ({
              ...prev,
              [index]: {
                success: true,
                message: `Launch Kit successfully emailed to ${currentUser}! 📬`,
              },
            }));
          } else {
            if (emailRes.reason && emailRes.reason.includes("RESEND_API_KEY")) {
              setEmailStatus((prev) => ({
                ...prev,
                [index]: {
                  success: false,
                  message: `Launch Kit ready! (Configure RESEND_API_KEY in secrets to receive emails) ⚙️`,
                },
              }));
            } else {
              setEmailStatus((prev) => ({
                ...prev,
                [index]: {
                  success: false,
                  message: `Could not email kit: ${emailRes.error || "Unknown delivery error"}`,
                },
              }));
            }
          }
        } catch (emailErr: any) {
          console.error("Error sending Launch Kit email:", emailErr);
          setEmailStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: `Failed to dispatch email: ${emailErr.message || "Unknown error"}`,
            },
          }));
        }
      } else {
        setEmailStatus((prev) => ({
          ...prev,
          [index]: {
            success: false,
            message: `Log in to automatically receive this Launch Kit by email.`,
          },
        }));
      }
    } catch (err: any) {
      console.error(err);
      setLaunchKits((prev) => ({
        ...prev,
        [index]: {
          loading: false,
          data: null,
          error: err.message || "Failed to generate Launch Kit.",
        },
      }));
    }
  };

  // Toggle saving an idea
  const toggleSaveIdea = (idea: SaasIdea, kit: LaunchKit | null) => {
    const isAlreadySaved = savedIdeas.some((s) => s.idea.name === idea.name);
    if (isAlreadySaved) {
      const updated = savedIdeas.filter((s) => s.idea.name !== idea.name);
      saveToLocalStorage(updated);
    } else {
      const updated = [
        ...savedIdeas,
        { idea, kit, savedAt: new Date().toLocaleDateString() },
      ];
      saveToLocalStorage(updated);
    }
  };

  const isSaved = (ideaName: string) => {
    return savedIdeas.some((s) => s.idea.name === ideaName);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ms-bg text-ms-text font-sans flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded border-4 border-ms-green border-t-transparent animate-spin mb-4"></div>
        <p className="text-xs font-ms text-ms-green animate-pulse">
          BOOTING RADAR SYSTEM v2.1...
        </p>
      </div>
    );
  }

  const filteredSavedIdeas = savedIdeas.filter(saved => {
    if (!savedKitsSearchQuery.trim()) return true;
    const query = savedKitsSearchQuery.toLowerCase();
    const idea = saved.idea;
    return (
      idea.name.toLowerCase().includes(query) ||
      idea.niche.toLowerCase().includes(query) ||
      idea.problem.toLowerCase().includes(query) ||
      idea.solution.toLowerCase().includes(query)
    );
  });

  return (
    <div
      ref={pageTopRef}
      className="min-h-screen bg-ms-bg text-ms-text font-sans"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          html {
            font-size: ${apiSettings.fontSize === "sm" ? "14px" : apiSettings.fontSize === "lg" ? "18px" : apiSettings.fontSize === "xl" ? "20px" : "16px"} !important;
          }
          ${
            apiSettings.fontFamily
              ? `
            body, .font-sans, .font-ms {
              font-family: ${
                apiSettings.fontFamily === "inter"
                  ? "var(--font-inter), sans-serif"
                  : apiSettings.fontFamily === "roboto"
                    ? "var(--font-roboto), sans-serif"
                    : apiSettings.fontFamily === "opensans"
                      ? "var(--font-opensans), sans-serif"
                      : apiSettings.fontFamily === "lato"
                        ? "var(--font-lato), sans-serif"
                        : apiSettings.fontFamily === "poppins"
                          ? "var(--font-poppins), sans-serif"
                          : apiSettings.fontFamily === "playfair"
                            ? "var(--font-playfair), serif"
                            : apiSettings.fontFamily === "mono"
                              ? "var(--font-mono), monospace"
                              : "var(--font-inter), sans-serif"
              } !important;
            }
          `
              : ""
          }
        `,
        }}
      />

      {/* Visual Ambient Grid Header */}
      <header className="border-b border-ms-border bg-ms-bg/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 bg-ms-green-dark border border-ms-green rounded flex items-center justify-center font-ms text-ms-green text-xl font-bold green-glow shrink-0">
              🛠️
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Signal Engine{" "}
                <span className="text-xs bg-ms-green-dark text-ms-green border border-ms-green px-1.5 py-0.5 rounded font-ms">
                  BETA
                </span>
              </h1>
              <p className="text-xs text-ms-text-muted font-ms">
                Micro-SaaS Signal Engine & Launch Kit Generator
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
            <nav className="flex items-center gap-2 border border-ms-border p-1 bg-ms-card rounded w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("find")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "find"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                FIND IDEAS
              </button>
              <button
                onClick={() => setActiveTab("compare")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "compare"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                COMPARE
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "saved"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                SAVED KITS ({savedIdeas.length})
              </button>
              {currentUser?.toLowerCase() === "corranforce@gmail.com" && (
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                    activeTab === "settings"
                      ? "bg-ms-green text-ms-bg font-bold"
                      : "text-ms-text-muted hover:text-white"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  API SETTINGS
                </button>
              )}
              <button
                onClick={() => setActiveTab("about")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "about"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                METHODOLOGY
              </button>
            </nav>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentUser ? (
                <div className="flex items-center gap-2.5 bg-ms-card border border-ms-border pl-3 pr-2 py-1 rounded w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-white leading-tight font-ms truncate max-w-[120px] sm:max-w-[160px]">
                      {currentUser}
                    </span>
                    <span className="text-[8px] text-ms-green font-ms leading-tight uppercase">
                      {currentUser.toLowerCase() === "corranforce@gmail.com"
                        ? "Operator"
                        : "Crew"}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-ms-text-muted hover:text-red-400 transition-colors text-[9px] font-ms border border-ms-border hover:border-red-900 bg-ms-bg rounded uppercase"
                    title="Terminate Session"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthRegister(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-ms-green-dark border border-ms-green hover:bg-ms-green hover:text-ms-bg transition-all text-xs font-ms text-ms-green font-bold rounded flex items-center justify-center gap-1.5 green-glow"
                >
                  <Lock className="w-3 h-3" />
                  AUTHENTICATE
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8">
        {activeTab === "find" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Input form & Scanner terminal */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Research Controls */}
              <div className="bg-ms-card border border-ms-border p-6 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-ms-green/5 blur-xl pointer-events-none rounded-full"></div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="text-ms-green font-ms text-sm font-bold">
                    01.
                  </div>
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase font-ms">
                    Configure Radar
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-ms text-ms-text-muted uppercase mb-1.5">
                      Target Niche / Industry
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {LEGACY_NICHES.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setSelectedNiche(n.id);
                            setCustomNiche("");
                            setAdditionalContext("");
                          }}
                          className={`p-2.5 text-left border rounded text-xs transition-all ${
                            selectedNiche === n.id && !customNiche
                              ? "border-ms-green bg-ms-green-dark/30 text-white"
                              : "border-ms-border bg-ms-bg text-ms-text-muted hover:border-ms-border-active hover:text-ms-text"
                          }`}
                        >
                          <div className="text-sm mb-1">{n.icon}</div>
                          <div className="font-bold truncate">{n.name}</div>
                        </button>
                      ))}
                    </div>

                    <div className="relative mt-2">
                      <select
                        value={selectedNiche}
                        onChange={(e) => {
                          setSelectedNiche(e.target.value);
                          setCustomNiche("");
                          setAdditionalContext("");
                        }}
                        className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs font-ms text-white focus:outline-none focus:border-ms-green"
                      >
                        <option value="">-- Or Select More Niches --</option>
                        {LEGACY_NICHES.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.icon} {n.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Or type a custom B2B niche..."
                        value={customNiche}
                        onChange={(e) => {
                          if (customNiche === "") {
                            setAdditionalContext("");
                          }
                          setCustomNiche(e.target.value);
                        }}
                        className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs font-ms text-white placeholder-gray-600 focus:outline-none focus:border-ms-green"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-ms text-ms-text-muted uppercase mb-1.5">
                      Target MRR (Monthly Income)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="2000"
                        max="25000"
                        step="1000"
                        value={mrrTarget}
                        onChange={(e) => setMrrTarget(parseInt(e.target.value))}
                        className="flex-1 accent-ms-green h-1 bg-ms-border rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-ms text-xs font-bold text-ms-green bg-ms-green-dark border border-ms-green/40 px-2 py-1 rounded">
                        ${mrrTarget.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-ms text-ms-text-muted uppercase mb-1.5">
                      Additional Context / Custom Constraints
                    </label>
                    <textarea
                      placeholder="e.g., 'Must fit on a mobile app', 'Must connect with quickbooks', 'I want something related to heavy scheduling'."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      rows={3}
                      className="w-full bg-ms-bg border border-ms-border rounded p-2.5 text-xs font-ms text-white placeholder-gray-600 focus:outline-none focus:border-ms-green"
                    />

                    {/* Real-time suggestions panel */}
                    <div className="mt-2.5 space-y-3">
                      {(realtimeKeywords.length > 0 ||
                        isSuggestionsLoading) && (
                        <div className="bg-ms-bg/50 border border-ms-border/50 rounded-lg p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-ms-text-muted font-ms font-bold uppercase tracking-wider flex items-center gap-1">
                              <Coins className="w-3 h-3 text-ms-yellow" />
                              High-Profit Focus Keywords
                            </span>
                            {isSuggestionsLoading && (
                              <span className="flex items-center gap-1 text-[10px] text-ms-green font-ms font-bold animate-pulse">
                                <span className="w-1.5 h-1.5 bg-ms-green rounded-full animate-ping"></span>
                                AI Refining...
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {realtimeKeywords.map((kw, idx) => {
                              const isAlreadyPresent = additionalContext
                                .toLowerCase()
                                .includes(kw.toLowerCase());
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleAppendContext(kw)}
                                  className={`px-2 py-1 text-[10px] font-ms rounded border transition-all duration-200 text-left flex items-center gap-1 ${
                                    isAlreadyPresent
                                      ? "bg-ms-green/20 border-ms-green text-ms-green font-bold shadow-[0_0_10px_rgba(0,240,118,0.15)] cursor-default"
                                      : "bg-ms-card border-ms-border text-ms-text-muted hover:border-ms-yellow hover:text-white"
                                  }`}
                                  disabled={isAlreadyPresent}
                                >
                                  {isAlreadyPresent && (
                                    <Check className="w-2.5 h-2.5 text-ms-green" />
                                  )}
                                  {kw}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Angles / Completions */}
                          {realtimeSuggestions.length > 0 && (
                            <div className="pt-2 border-t border-ms-border/40 space-y-1.5">
                              <span className="text-[10px] text-ms-text-muted font-ms font-bold uppercase tracking-wider block">
                                Recommended angles (Click to append):
                              </span>
                              <div className="space-y-1">
                                {realtimeSuggestions.map((sug, idx) => {
                                  const isAlreadyPresent = additionalContext
                                    .toLowerCase()
                                    .includes(sug.toLowerCase());
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleAppendContext(sug)}
                                      className={`w-full text-left p-1.5 rounded text-[10px] font-ms border transition-all flex items-center gap-1.5 ${
                                        isAlreadyPresent
                                          ? "bg-ms-green-dark/10 border-ms-green/20 text-ms-text-muted cursor-default"
                                          : "bg-ms-card/40 border-ms-border/30 text-ms-text-muted hover:border-ms-green hover:text-white"
                                      }`}
                                      disabled={isAlreadyPresent}
                                    >
                                      <span className="text-ms-green text-xs font-bold font-mono">
                                        +
                                      </span>
                                      <span className="truncate">{sug}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleDiscover}
                    disabled={isScanning}
                    className="w-full py-3.5 bg-ms-green text-ms-bg font-bold font-ms text-sm uppercase tracking-wide hover:bg-[#00d066] transition-all flex items-center justify-center gap-2 rounded shadow-lg disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isScanning ? "Scraping Markets..." : "Scan Legacy Markets"}
                  </button>
                </div>
              </div>

              {/* Terminal Logs Viewport */}
              <div className="bg-ms-bg border border-ms-border rounded-lg p-4 font-ms text-xs h-64 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-ms-border pb-2 mb-2 text-[10px] text-ms-text-muted uppercase">
                  <span>🛰️ Live Social & Forum Crawler</span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-ms-green animate-pulse" : "bg-red-500"}`}
                    ></span>
                    {isScanning ? "ACTIVE SCAN" : "IDLE"}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 text-[11px] pr-2 scrollbar-thin">
                  {terminalLogs.length === 0 ? (
                    <div className="text-gray-600 italic">
                      No scanner actions initiated. Await inputs.
                    </div>
                  ) : (
                    terminalLogs.map((log, i) => {
                      if (!log || typeof log !== "string") return null;
                      let color = "text-ms-text-muted";
                      if (log.startsWith("[INIT]")) color = "text-gray-500";
                      if (
                        log.startsWith("[SCANNING]") ||
                        log.startsWith("[CRAWL]")
                      )
                        color = "text-blue-400";
                      if (log.startsWith("[FOUND]"))
                        color = "text-ms-yellow font-bold";
                      if (log.startsWith("[SUCCESS]"))
                        color = "text-ms-green font-bold";
                      if (log.startsWith("[ERROR]"))
                        color = "text-red-400 font-bold";
                      return <TypewriterLog key={i} text={log} color={color} />;
                    })
                  )}
                </div>

                {isScanning && (
                  <div className="mt-3 border-t border-ms-border pt-2">
                    <div className="flex justify-between text-[10px] text-ms-text-muted mb-1">
                      <span>CRAWLING HIGH-FIDELITY B2B FORUMS</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-ms-border h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-ms-green h-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Ideas Grid & Active Launch Kit details */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Error Handler */}
              {errorMessage && (
                <div className="bg-red-950/40 border border-red-500/50 rounded-lg p-4 text-sm text-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Generative AI Error</div>
                    <p className="text-xs text-red-300 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Welcome Screen (If no ideas generated yet) */}
              {generatedIdeas.length === 0 && !isScanning && !errorMessage && (
                <div className="bg-ms-card border border-ms-border rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 bg-ms-green-dark/30 border border-ms-green/40 rounded-full flex items-center justify-center text-3xl mb-6 green-glow">
                    🔬
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Acreage of Boring B2B Markets Await
                  </h3>
                  <p className="text-sm text-ms-text-muted max-w-lg mb-6 leading-relaxed">
                    Most SaaS builders compete for flashy consumer apps or
                    general tools. True, highly profitable niches lie in offline
                    B2B sectors. Select an industry above to begin.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                    {LEGACY_NICHES.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setSelectedNiche(n.id);
                          setCustomNiche("");
                          setAdditionalContext("");
                        }}
                        className="p-3 bg-ms-bg border border-ms-border hover:border-ms-green rounded text-left transition-all group hover:bg-ms-green-dark/15"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{n.icon}</span>
                          <span className="text-xs font-bold text-white block truncate group-hover:text-ms-green transition-colors">
                            {n.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideas Display Grid */}
              {generatedIdeas.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-ms-border pb-3">
                    <h2 className="font-ms text-sm tracking-wider uppercase text-ms-yellow font-bold">
                      02. Selected Blueprints
                    </h2>
                    <span className="text-xs text-ms-text-muted font-ms">
                      3 underserved ideas found
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    {generatedIdeas.map((idea, index) => {
                      const isKitLoaded = !!launchKits[index]?.data;
                      const isKitLoading = !!launchKits[index]?.loading;

                      return (
                        <div
                          key={index}
                          className={`bg-ms-card border rounded-lg flex flex-col transition-all relative animate-fade-in ${
                            apiSettings.compactMode ? "p-3 pb-6" : "p-5 pb-8"
                          } ${
                            expandedIdeas[index]
                              ? "border-ms-green green-glow"
                              : "border-ms-border hover:border-ms-border-active"
                          }`}
                          style={{ animationFillMode: "both", animationDelay: `${index * 150}ms` }}
                        >
                          <div
                            className={`flex flex-col md:flex-row justify-between ${apiSettings.compactMode ? "gap-4" : "gap-6"}`}
                          >
                            <div className="flex-1">
                              <div className="flex justify-between items-center gap-2 mb-2">
                                <span
                                  className={`${apiSettings.compactMode ? "text-[10px]" : "text-xs"} text-ms-green bg-ms-green-dark border border-ms-green/30 px-2 py-0.5 rounded font-ms font-bold uppercase`}
                                >
                                  {idea.buildComplexity} BUILD
                                </span>
                                <div className="flex items-center gap-2.5 md:hidden">
                                  <button
                                    onClick={() => handleEmailCard(idea, index)}
                                    disabled={isEmailingCard[index]}
                                    className="text-ms-text-muted hover:text-ms-green disabled:opacity-50 transition-colors p-1"
                                    title="Email Idea"
                                  >
                                    {isEmailingCard[index] ? (
                                      <div className="w-3.5 h-3.5 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                                    ) : (
                                      <Mail className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSupabaseCard(idea, index)
                                    }
                                    disabled={isSavingToSupabase[index]}
                                    className="text-ms-text-muted hover:text-cyan-400 disabled:opacity-50 transition-colors p-1"
                                    title="Push to Supabase"
                                  >
                                    {isSavingToSupabase[index] ? (
                                      <div className="w-3.5 h-3.5 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                                    ) : (
                                      <Database className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleSaveIdea(
                                        idea,
                                        launchKits[index]?.data || null,
                                      )
                                    }
                                    className="text-ms-text-muted hover:text-ms-yellow transition-colors p-1"
                                  >
                                    <Bookmark
                                      className={`w-4 h-4 ${isSaved(idea.name) ? "fill-ms-yellow text-ms-yellow" : ""}`}
                                    />
                                  </button>
                                </div>
                              </div>

                              <h3
                                className={`${apiSettings.compactMode ? "text-sm" : "text-base"} font-bold text-white mb-1 leading-tight`}
                              >
                                {idea.name}
                              </h3>
                              <p
                                className={`${apiSettings.compactMode ? "text-[10px]" : "text-xs"} text-ms-yellow italic mb-2`}
                              >
                                &ldquo;{idea.tagline}&rdquo;
                              </p>

                              <p
                                className={`${apiSettings.compactMode ? "text-[10px]" : "text-xs"} text-ms-text-muted leading-relaxed mb-3`}
                              >
                                {idea.solution}
                              </p>
                            </div>

                            <div className="md:w-80 flex flex-col justify-between border-t md:border-t-0 md:border-l border-ms-border pt-3 md:pt-0 md:pl-6 space-y-3">
                              <div className="hidden md:flex items-center gap-3.5 justify-end mb-1">
                                <button
                                  onClick={() => handleEmailCard(idea, index)}
                                  disabled={isEmailingCard[index]}
                                  className="text-ms-text-muted hover:text-ms-green disabled:opacity-50 transition-colors flex items-center gap-1.5 text-[10px] font-ms font-bold uppercase"
                                >
                                  {isEmailingCard[index] ? (
                                    <div className="w-3 h-3 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                                  ) : (
                                    <Mail className="w-3.5 h-3.5" />
                                  )}
                                  Email
                                </button>

                                <button
                                  onClick={() =>
                                    handleSupabaseCard(idea, index)
                                  }
                                  disabled={isSavingToSupabase[index]}
                                  className="text-ms-text-muted hover:text-cyan-400 disabled:opacity-50 transition-colors flex items-center gap-1.5 text-[10px] font-ms font-bold uppercase"
                                >
                                  {isSavingToSupabase[index] ? (
                                    <div className="w-3 h-3 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                                  ) : (
                                    <Database className="w-3.5 h-3.5" />
                                  )}
                                  Supabase
                                </button>

                                <button
                                  onClick={() =>
                                    toggleSaveIdea(
                                      idea,
                                      launchKits[index]?.data || null,
                                    )
                                  }
                                  className="text-ms-text-muted hover:text-ms-yellow transition-colors flex items-center gap-1 text-[10px] font-ms font-bold uppercase"
                                >
                                  <Bookmark
                                    className={`w-3.5 h-3.5 ${isSaved(idea.name) ? "fill-ms-yellow text-ms-yellow" : ""}`}
                                  />
                                  {isSaved(idea.name) ? "Saved" : "Save Idea"}
                                </button>
                              </div>

                              {/* ROI Bento Panel */}
                              <div className="bg-ms-bg p-2.5 rounded border border-ms-border grid grid-cols-3 gap-1.5 text-center">
                                <div>
                                  <div className="text-[9px] text-ms-text-muted font-ms flex items-center justify-center gap-1">
                                    BUILD
                                    <div className="relative group">
                                      <Info className="w-2.5 h-2.5 cursor-help hover:text-white transition-colors" />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-ms-card border border-ms-border text-[10px] text-left text-white rounded hidden group-hover:block z-10 shadow-lg font-sans normal-case">
                                        Estimated upfront cost utilizing no-code
                                        platforms and AI development tools (e.g.
                                        database setup, hosting, API fees).
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs font-bold text-white">
                                    {idea.roi.buildCostUSD}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] text-ms-text-muted font-ms flex items-center justify-center gap-1">
                                    MRR TARGET
                                    <div className="relative group">
                                      <Info className="w-2.5 h-2.5 cursor-help hover:text-white transition-colors" />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-ms-card border border-ms-border text-[10px] text-left text-white rounded hidden group-hover:block z-10 shadow-lg font-sans normal-case">
                                        Projected Monthly Recurring Revenue
                                        based on early traction and realistic
                                        average revenue per user (ARPU) in this
                                        niche.
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs font-bold text-ms-green">
                                    {idea.roi.realisticMRRMonth1USD}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] text-ms-text-muted font-ms flex items-center justify-center gap-1">
                                    1-MO ROI
                                    <div className="relative group">
                                      <Info className="w-2.5 h-2.5 cursor-help hover:text-white transition-colors" />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-ms-card border border-ms-border text-[10px] text-left text-white rounded hidden group-hover:block z-10 shadow-lg font-sans normal-case">
                                        Return on Investment percentage after
                                        month one, estimated based on projected
                                        MRR relative to upfront build cost.
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs font-bold text-ms-yellow">
                                    {idea.roi.roiMonth1Pct}
                                  </div>
                                </div>
                              </div>

                              {/* Domain Checker */}
                              {idea.domains && idea.domains.length > 0 && (
                                <div className="bg-ms-bg/50 p-2.5 rounded border border-ms-border">
                                  <div className="text-[10px] text-ms-text-muted font-ms font-bold tracking-wider uppercase mb-2">
                                    Available Domains
                                  </div>
                                  <div className="space-y-1.5">
                                    {idea.domains.map((dom, domIdx) => {
                                      const status =
                                        domainCheckStatus[dom.domain];
                                      return (
                                        <div
                                          key={domIdx}
                                          className="flex items-center justify-between gap-2 text-xs"
                                        >
                                          <div className="font-mono text-white truncate flex-1">
                                            {dom.domain}
                                          </div>
                                          {status ? (
                                            <div className="flex items-center gap-1.5">
                                              {status.checking ? (
                                                <div className="w-3 h-3 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                                              ) : status.available ? (
                                                <span className="text-[10px] font-ms font-bold text-ms-green uppercase">
                                                  Avail{" "}
                                                  {status.price
                                                    ? `($${status.price / 1000000})`
                                                    : ""}
                                                </span>
                                              ) : (
                                                <span
                                                  className="text-[10px] font-ms font-bold text-ms-yellow uppercase"
                                                  title={
                                                    status.error || "Taken"
                                                  }
                                                >
                                                  Taken
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() =>
                                                handleCheckDomain(dom.domain)
                                              }
                                              className="text-[10px] font-ms font-bold text-cyan-400 hover:text-cyan-300 uppercase px-2 py-0.5 border border-cyan-500/30 rounded transition-colors"
                                            >
                                              Check
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Card Level Action Status Messages */}
                              {(emailCardStatus[index] ||
                                supabaseCardStatus[index]) && (
                                <div className="space-y-1.5 mt-1">
                                  {emailCardStatus[index] && (
                                    <div
                                      className={`p-2 rounded border text-[10px] font-ms flex items-center justify-between gap-1.5 ${
                                        emailCardStatus[index]?.success
                                          ? "bg-ms-green-dark/15 border-ms-green/30 text-ms-green"
                                          : "bg-ms-yellow/15 border-ms-yellow/30 text-ms-yellow"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {emailCardStatus[index]?.message}
                                      </span>
                                      <button
                                        onClick={() =>
                                          setEmailCardStatus((prev) => ({
                                            ...prev,
                                            [index]: null,
                                          }))
                                        }
                                        className="text-[9px] opacity-60 hover:opacity-100 font-bold"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                  {supabaseCardStatus[index] && (
                                    <div
                                      className={`p-2 rounded border text-[10px] font-ms space-y-1.5 ${
                                        supabaseCardStatus[index]?.success
                                          ? "bg-ms-green-dark/15 border-ms-green/30 text-ms-green"
                                          : "bg-ms-yellow/15 border-ms-yellow/30 text-ms-yellow"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className="truncate flex-1">
                                          {supabaseCardStatus[index]?.message}
                                        </span>
                                        <button
                                          onClick={() =>
                                            setSupabaseCardStatus((prev) => ({
                                              ...prev,
                                              [index]: null,
                                            }))
                                          }
                                          className="text-[9px] opacity-60 hover:opacity-100 font-bold self-start mt-0.5"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      {supabaseCardStatus[index]?.sql && (
                                        <div className="space-y-1 pt-1 border-t border-ms-border/30">
                                          <textarea
                                            readOnly
                                            value={
                                              supabaseCardStatus[index]?.sql
                                            }
                                            className="w-full h-24 font-mono text-[9px] bg-black/60 text-ms-green border border-ms-border/40 rounded p-1.5 focus:outline-none select-all"
                                          />
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                supabaseCardStatus[index]
                                                  ?.sql || "",
                                              );
                                              alert("SQL schema copied!");
                                            }}
                                            className="px-2 py-0.5 bg-ms-border/60 hover:bg-ms-border text-[9px] rounded text-white font-ms transition-all"
                                          >
                                            Copy SQL
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              <button
                                onClick={() => handleGenerateKit(idea, index)}
                                disabled={isKitLoading}
                                className={`w-full py-2.5 text-xs font-ms font-bold tracking-wider uppercase rounded flex items-center justify-center gap-1.5 transition-all ${
                                  isKitLoaded
                                    ? "bg-ms-green-dark border border-ms-green text-ms-green"
                                    : "bg-ms-green text-ms-bg hover:bg-[#00d066]"
                                }`}
                              >
                                {isKitLoading ? (
                                  <span className="animate-pulse">
                                    BUILDING KIT...
                                  </span>
                                ) : isKitLoaded ? (
                                  <>
                                    LAUNCH KIT ACTIVE{" "}
                                    <CheckCircle2 className="w-3.5 h-3.5 text-ms-green" />
                                  </>
                                ) : (
                                  <>
                                    GENERATE LAUNCH KIT{" "}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {expandedIdeas[index] && (
                            <div
                              className={`${apiSettings.compactMode ? "mt-4 pt-4 space-y-4" : "mt-6 pt-6 space-y-6"} border-t border-ms-border`}
                            >
                              <div
                                className={`grid grid-cols-1 md:grid-cols-2 ${apiSettings.compactMode ? "gap-4" : "gap-6"}`}
                              >
                                <div>
                                  <h4 className="text-[10px] font-bold text-ms-text-muted uppercase mb-2">
                                    PAIN SOLVED
                                  </h4>
                                  <p className="text-xs text-white bg-ms-bg p-3 rounded border border-ms-border leading-relaxed">
                                    {idea.painSolved}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-bold text-ms-text-muted uppercase mb-2">
                                    TARGET CUSTOMER
                                  </h4>
                                  <p className="text-xs text-white bg-ms-bg p-3 rounded border border-ms-border leading-relaxed">
                                    {idea.targetAudience}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-bold text-ms-text-muted uppercase mb-2">
                                  GTM CHANNEL
                                </h4>
                                <p className="text-xs text-white bg-ms-bg p-3 rounded border border-ms-border leading-relaxed">
                                  {idea.gtmChannel}
                                </p>
                              </div>

                              {isKitLoaded && (
                                <div className="mt-6 border-t border-ms-border pt-6">
                                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                      Generated Launch Kit
                                    </h3>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                      <button
                                        onClick={() => handleExportPdf(index)}
                                        disabled={isExporting}
                                        className="flex-1 sm:flex-none px-4 py-2 border border-ms-text-muted text-ms-text-muted hover:text-white hover:border-ms-border-active rounded text-xs font-ms font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                                      >
                                        {isExporting ? (
                                          <div className="w-3.5 h-3.5 rounded-full border-2 border-ms-text-muted border-t-transparent animate-spin" />
                                        ) : (
                                          <Download className="w-3.5 h-3.5" />
                                        )}
                                        {isExporting ? "EXPORTING..." : "EXPORT PDF"}
                                      </button>
                                      <button
                                        onClick={() => handleEmailCard(idea, index)}
                                        disabled={isEmailingCard[index]}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-ms-green text-ms-bg font-ms font-bold text-xs rounded hover:bg-[#00d066] transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                                      >
                                        {isEmailingCard[index] ? (
                                          <div className="w-3.5 h-3.5 rounded-full border-2 border-ms-bg/50 border-t-transparent animate-spin" />
                                        ) : (
                                          <Mail className="w-3.5 h-3.5" />
                                        )}
                                        {isEmailingCard[index] ? "EMAILING..." : "EMAIL PDF"}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {emailCardStatus[index] && (
                                    <div
                                      className={`mb-4 px-4 py-3 rounded text-xs font-ms flex items-center gap-2 ${
                                        emailCardStatus[index]?.success
                                          ? "bg-ms-green-dark border border-ms-green text-ms-green"
                                          : "bg-red-950 border border-red-500 text-red-400"
                                      }`}
                                    >
                                      <Info className="w-4 h-4 shrink-0" />
                                      {emailCardStatus[index]?.message}
                                    </div>
                                  )}

                                  <LaunchKitTabs kit={launchKits[index]?.data} onCopy={handleCopy} copiedText={copiedText} generateSqlFallback={generateSqlFallback} VisualSchemaDiagram={VisualSchemaDiagram} />
                                </div>
                              )}
                              {!isKitLoaded && (
                                <div className="text-xs text-ms-text-muted italic text-center py-4 bg-ms-bg rounded border border-ms-border/50">
                                  Generate a Launch Kit to view Pricing,
                                  Validation, Roadmap, Stack, and Scripts.
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() =>
                              setExpandedIdeas((prev) => ({
                                ...prev,
                                [index]: !prev[index],
                              }))
                            }
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-ms-card border border-ms-border rounded-full p-1 text-ms-text-muted hover:text-white hover:border-ms-border-active transition-all"
                            title={
                              expandedIdeas[index]
                                ? "Collapse Details"
                                : "Expand Details"
                            }
                          >
                            {expandedIdeas[index] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

                            </div>
            </div>
        )}

        {/* COMPARE NICHES TAB */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center border-b border-ms-border pb-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Niche Comparison Engine
                </h2>
                <p className="text-xs text-ms-text-muted font-ms mt-0.5">
                  Side-by-side analysis of industry viability and development
                  metrics.
                </p>
              </div>
            </div>
            <CompareNichesView />
          </div>
        )}

        {/* SAVED KITS TAB */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-ms-border pb-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Your Saved Launch Kits
                </h2>
                <p className="text-xs text-ms-text-muted font-ms mt-0.5">
                  Access saved B2B idea specs and copy development prompts
                  instantly.
                </p>
              </div>
              <button
                onClick={() => setShowClearConfirmModal(true)}
                className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-950/20 text-xs font-ms rounded transition-all"
              >
                CLEAR ALL
              </button>
            </div>

            {savedIdeas.length === 0 ? (
              <div className="py-24 text-center bg-ms-card border border-ms-border rounded-lg">
                <Bookmark className="w-12 h-12 text-ms-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">
                  No Saved Kits Yet
                </h3>
                <p className="text-sm text-ms-text-muted max-w-sm mx-auto leading-relaxed">
                  Go to the Find Ideas tab, generate B2B opportunity specs, and
                  save them. They will appear here safely.
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-ms-text-muted" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search saved kits by name, niche, problem, or solution..."
                    value={savedKitsSearchQuery}
                    onChange={(e) => setSavedKitsSearchQuery(e.target.value)}
                    className="w-full bg-ms-bg border border-ms-border rounded pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-ms-border-active transition-colors"
                  />
                </div>
                {filteredSavedIdeas.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-ms-text-muted">No saved kits match your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSavedIdeas.map((saved, idx) => {
                      // Get the original index to preserve correct mapping and toggling functionality
                      const originalIdx = savedIdeas.findIndex(s => s === saved);
                      return (
                      <div
                    key={originalIdx}
                    className={`bg-ms-card border border-ms-border ${apiSettings.compactMode ? "p-4" : "p-6"} rounded-lg relative flex flex-col justify-between`}
                  >
                    <div>
                      <div
                        className={`flex justify-between items-start gap-4 ${apiSettings.compactMode ? "mb-2" : "mb-3"}`}
                      >
                        <span
                          className={`${apiSettings.compactMode ? "text-[10px]" : "text-xs"} text-ms-green bg-ms-green-dark border border-ms-green/20 px-2 py-0.5 rounded font-ms font-bold uppercase`}
                        >
                          {saved.idea.buildComplexity} BUILD
                        </span>
                        <span className="text-[10px] text-ms-text-muted font-ms">
                          Saved {saved.savedAt}
                        </span>
                      </div>

                      <h3
                        className={`${apiSettings.compactMode ? "text-sm" : "text-base"} font-bold text-white mb-1`}
                      >
                        {saved.idea.name}
                      </h3>
                      <p
                        className={`${apiSettings.compactMode ? "text-[10px]" : "text-xs"} text-ms-yellow italic ${apiSettings.compactMode ? "mb-2" : "mb-3"}`}
                      >
                        &ldquo;{saved.idea.tagline}&rdquo;
                      </p>

                      <div
                        className={`space-y-3 ${apiSettings.compactMode ? "text-[10px] p-2" : "text-xs p-3"} text-ms-text-muted leading-relaxed bg-ms-bg rounded border border-ms-border mb-4`}
                      >
                        <p>
                          <strong>Problem:</strong> {saved.idea.problem}
                        </p>
                        <p>
                          <strong>Solution:</strong> {saved.idea.solution}
                        </p>
                        <p>
                          <strong>Target Customer:</strong>{" "}
                          {saved.idea.targetAudience}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedSavedIdeas(prev => ({ ...prev, [originalIdx]: !prev[originalIdx] }))}
                        className="flex-1 py-2.5 bg-ms-green text-ms-bg font-ms font-bold text-xs rounded hover:bg-[#00d066] transition-all"
                      >
                        {expandedSavedIdeas[originalIdx] ? "HIDE KIT" : "VIEW KIT"}
                      </button>

                      {saved.kit && (
                        <button
                          onClick={() =>
                            handleCopy(
                              saved.kit?.lovablePrompt || "",
                              `copied-saved-prompt-${originalIdx}`,
                            )
                          }
                          className="px-4 py-2 bg-ms-bg border border-ms-border text-xs font-ms text-white hover:border-ms-green rounded transition-colors flex items-center justify-center gap-1.5"
                        >
                          {copiedText === `copied-saved-prompt-${originalIdx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-ms-green" />{" "}
                              COPIED
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> PROMPT
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const updated = savedIdeas.filter(
                            (s) => s.idea.name !== saved.idea.name,
                          );
                          saveToLocalStorage(updated);
                        }}
                        className="px-3 py-2 border border-ms-border text-red-400 hover:border-red-500/40 rounded text-xs transition-colors"
                      >
                        DELETE
                      </button>
                    </div>

                    {expandedSavedIdeas[originalIdx] && saved.kit && (
                      <div className="mt-6 border-t border-ms-border pt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Saved Launch Kit
                          </h3>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                              onClick={() => handleExportPdf(originalIdx, saved.idea, saved.kit!)}
                              disabled={isExporting}
                              className="flex-1 sm:flex-none px-4 py-2 border border-ms-text-muted text-ms-text-muted hover:text-white hover:border-ms-border-active rounded text-xs font-ms font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                            >
                              {isExporting ? (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-ms-text-muted border-t-transparent animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              {isExporting ? "EXPORTING..." : "EXPORT PDF"}
                            </button>
                          </div>
                        </div>
                        <LaunchKitTabs kit={saved.kit} onCopy={handleCopy} copiedText={copiedText} generateSqlFallback={generateSqlFallback} VisualSchemaDiagram={VisualSchemaDiagram} inlineMode={true} />
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
            </>
            )}
          </div>
        )}

        {/* ABOUT / METHODOLOGY TAB */}
        {activeTab === "about" && (
          <div className="bg-ms-card border border-ms-border p-8 rounded-lg max-w-3xl mx-auto space-y-6">
            <div className="border-b border-ms-border pb-4">
              <h2 className="text-xl font-bold text-white">
                The Boring B2B SaaS Philosophy
              </h2>
              <p className="text-sm text-ms-text-muted mt-1">
                Why legacy, offline sectors produce the highest retention,
                easiest sales, and lowest churn startups.
              </p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-ms-text-muted">
              <p>
                In the modern SaaS landscape, 95% of builders compete for
                consumer tools, productivity widgets, or generic AI playgrounds.
                This leads to heavy competition, high customer acquisition costs
                (CAC), and extreme customer churn.
              </p>

              <div className="bg-ms-bg p-4 rounded-lg border border-ms-border space-y-3">
                <h4 className="text-xs font-bold text-ms-yellow font-ms uppercase">
                  Legacy Industries Are Different:
                </h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-ms-green font-bold">✔</span>
                    <span>
                      <strong>High Retention:</strong> B2B companies in roofing,
                      dry cleaning, or pest control do not switch platforms
                      often once integrated.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ms-green font-bold">✔</span>
                    <span>
                      <strong>Willingness to Pay:</strong> A dry cleaner losing
                      $1,000/mo in lost inventory easily pays $100-$300/mo to
                      solve it.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ms-green font-bold">✔</span>
                    <span>
                      <strong>Direct Outreach is Free:</strong> Finding roofing
                      contractors takes minutes on Google Maps, and you can
                      contact them directly. No expensive ad spend.
                    </span>
                  </li>
                </ul>
              </div>

              <h4 className="text-base font-bold text-white mt-6">
                How Signal Engine Operates:
              </h4>
              <p>
                Signal Engine is powered by advanced Gemini 3.5 reasoning. It
                scans and calculates:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>GTM Channel Validation:</strong> Where and how to
                  reach these offline business owners directly (phone, direct
                  mail, or local associations).
                </li>
                <li>
                  <strong>ROI Matrices:</strong> Estimating development costs
                  using AI tools and showing clear financial break-even
                  projections.
                </li>
                <li>
                  <strong>Vibe-Coding Prompts:</strong> Custom, detailed prompts
                  to build high-fidelity applications with dynamic state, local
                  mock persistence, database designs, Stripe billing
                  integrations, and automated emails.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* API SETTINGS TAB: RESTRICTED ACCESS FOR corranforce@gmail.com */}
        {activeTab === "settings" &&
          currentUser?.toLowerCase() === "corranforce@gmail.com" && (
            <div className="bg-ms-card border border-ms-border p-8 rounded-lg max-w-2xl mx-auto space-y-6">
              <div className="border-b border-ms-border pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wrench className="text-ms-green w-5 h-5" />
                    API Credentials & Settings
                  </h2>
                  <p className="text-xs text-ms-text-muted mt-1">
                    Configure integrations for Supabase, Resend, and GoDaddy
                    APIs.
                  </p>
                </div>
                <div className="text-[10px] font-ms bg-red-950/50 text-red-400 border border-red-900 px-2.5 py-1 rounded">
                  RESTRICTED ADMIN ACCESS
                </div>
              </div>

              {settingsMessage && (
                <div
                  className={`p-4 rounded border text-xs flex items-center gap-2 ${
                    settingsMessage.type === "success"
                      ? "bg-ms-green/10 border-ms-green/30 text-ms-green"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {settingsMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-ms-green shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{settingsMessage.text}</span>
                </div>
              )}

              {isLoadingSettings ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded border-2 border-ms-green border-t-transparent animate-spin"></div>
                  <p className="text-xs font-ms text-ms-green animate-pulse">
                    PULLING ENCRYPTED CREDENTIALS...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  {/* Supabase Section */}
                  <div className="space-y-4 border border-ms-border p-4 rounded bg-ms-bg/50">
                    <h3 className="text-xs font-bold text-ms-yellow font-ms uppercase flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-ms-yellow" />
                      Supabase Configuration
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                          Supabase API URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://your-project.supabase.co"
                          value={apiSettings.supabaseUrl}
                          onChange={(e) =>
                            setApiSettings({
                              ...apiSettings,
                              supabaseUrl: e.target.value,
                            })
                          }
                          className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                          Supabase Anon Key
                        </label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={apiSettings.supabaseAnonKey}
                          onChange={(e) =>
                            setApiSettings({
                              ...apiSettings,
                              supabaseAnonKey: e.target.value,
                            })
                          }
                          className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resend Section */}
                  <div className="space-y-4 border border-ms-border p-4 rounded bg-ms-bg/50">
                    <h3 className="text-xs font-bold text-ms-yellow font-ms uppercase flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-ms-yellow" />
                      Resend Email Configuration
                    </h3>
                    <div>
                      <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                        Resend API Key
                      </label>
                      <input
                        type="password"
                        placeholder="re_123456789..."
                        value={apiSettings.resendApiKey}
                        onChange={(e) =>
                          setApiSettings({
                            ...apiSettings,
                            resendApiKey: e.target.value,
                          })
                        }
                        className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                      />
                    </div>
                  </div>

                  {/* GoDaddy Section */}
                  <div className="space-y-4 border border-ms-border p-4 rounded bg-ms-bg/50">
                    <h3 className="text-xs font-bold text-ms-yellow font-ms uppercase flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-ms-yellow" />
                      GoDaddy Registrar Configuration
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                          GoDaddy API Key
                        </label>
                        <input
                          type="password"
                          placeholder="GoDaddy Key"
                          value={apiSettings.godaddyApiKey}
                          onChange={(e) =>
                            setApiSettings({
                              ...apiSettings,
                              godaddyApiKey: e.target.value,
                            })
                          }
                          className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                          GoDaddy API Secret
                        </label>
                        <input
                          type="password"
                          placeholder="GoDaddy Secret"
                          value={apiSettings.godaddyApiSecret}
                          onChange={(e) =>
                            setApiSettings({
                              ...apiSettings,
                              godaddyApiSecret: e.target.value,
                            })
                          }
                          className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-ms-bg p-5 rounded-lg border border-ms-border space-y-4">
                    <h3 className="text-xs font-ms text-ms-green uppercase font-bold flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      UI Preferences
                    </h3>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="block text-[10px] font-ms text-white uppercase mb-1">
                          Compact Mode
                        </label>
                        <p className="text-[10px] text-ms-text-muted">
                          Reduces padding and font sizes of idea cards to view
                          more at once.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={apiSettings.compactMode}
                          onChange={(e) =>
                            setApiSettings({
                              ...apiSettings,
                              compactMode: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-ms-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ms-text-muted peer-checked:after:bg-ms-green after:border after:rounded-full after:h-4 after:w-4 after:transition-all border border-ms-border peer-checked:border-ms-green/50"></div>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-[10px] font-ms text-white uppercase">
                        Font Face
                      </label>
                      <select
                        value={apiSettings.fontFamily}
                        onChange={(e) =>
                          setApiSettings({
                            ...apiSettings,
                            fontFamily: e.target.value,
                          })
                        }
                        className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                      >
                        <option value="inter">Inter (Sans Serif)</option>
                        <option value="roboto">Roboto (Sans Serif)</option>
                        <option value="opensans">Open Sans (Sans Serif)</option>
                        <option value="lato">Lato (Sans Serif)</option>
                        <option value="poppins">Poppins (Sans Serif)</option>
                        <option value="playfair">
                          Playfair Display (Serif)
                        </option>
                        <option value="mono">JetBrains Mono (Monospace)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-[10px] font-ms text-white uppercase">
                        Font Size
                      </label>
                      <select
                        value={apiSettings.fontSize}
                        onChange={(e) =>
                          setApiSettings({
                            ...apiSettings,
                            fontSize: e.target.value,
                          })
                        }
                        className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                      >
                        <option value="sm">Small</option>
                        <option value="base">Default</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("find")}
                      className="px-4 py-2 border border-ms-border hover:bg-ms-card text-xs rounded transition-colors text-ms-text-muted hover:text-white font-ms"
                    >
                      BACK TO RADAR
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-5 py-2 bg-ms-green hover:bg-[#00d066] text-ms-bg font-bold text-xs rounded transition-all font-ms flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <div className="w-3 h-3 rounded-full border border-ms-bg border-t-transparent animate-spin"></div>
                          SAVING...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          COMMIT CHANGES
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        {/* ACCESS DENIED VIEW */}
        {activeTab === "settings" &&
          currentUser?.toLowerCase() !== "corranforce@gmail.com" && (
            <div className="bg-ms-card border border-red-900/30 p-8 rounded-lg max-w-md mx-auto text-center space-y-4">
              <div className="w-12 h-12 bg-red-950/50 border border-red-500 rounded-full flex items-center justify-center text-red-400 mx-auto text-xl">
                ⚠️
              </div>
              <h2 className="text-base font-bold text-white">Access Denied</h2>
              <p className="text-xs text-ms-text-muted leading-relaxed">
                This API Settings page is strictly restricted to administrator
                credentials. Your account (
                <strong className="text-red-400">
                  {currentUser || "Anonymous"}
                </strong>
                ) is not authorized.
              </p>
              <button
                onClick={() => setActiveTab("find")}
                className="px-4 py-2 bg-ms-card border border-ms-border hover:border-ms-text-muted text-xs font-ms rounded text-white transition-all"
              >
                RETURN TO RADAR
              </button>
            </div>
          )}
      </main>

      {/* Retro Status Footer bar */}
      <footer className="border-t border-ms-border bg-ms-bg/50 px-4 py-3 mt-12 text-center text-[10px] text-ms-text-muted font-ms">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>SYSTEM ONLINE • MEM: 98.4% • CLOUD SANDBOX: ACTIVE</span>
          <span className="flex items-center gap-1.5">
            Powered by{" "}
            <span className="text-ms-green font-bold">Gemini 3.5 Flash</span>{" "}
            Server API proxy
          </span>
        </div>
      </footer>

      {/* AUTHENTICATION OVERLAY DIALOG */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-ms-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-ms-card border border-ms-border w-full max-w-sm rounded-lg overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 p-3">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-ms-text-muted hover:text-white text-xs font-ms p-1 transition-colors"
              >
                [✕] CLOSE
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-ms-green-dark border border-ms-green rounded flex items-center justify-center font-ms text-ms-green text-lg font-bold mx-auto mb-2">
                  🔐
                </div>
                <h3 className="text-base font-bold text-white font-ms">
                  {isAuthRegister
                    ? "REGISTER TERMINAL"
                    : "AUTHENTICATE SESSION"}
                </h3>
                <p className="text-[10px] text-ms-text-muted mt-1 font-ms">
                  {isAuthRegister
                    ? "Create a new local operator credential"
                    : "Verify operator code-keys to launch system"}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded font-ms flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-ms-green/10 border border-ms-green/20 text-ms-green text-xs rounded font-ms flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-ms-green" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-ms text-ms-text-muted uppercase mb-1">
                    Email Terminal Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="operator@domain.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green font-ms font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-ms text-ms-text-muted uppercase mb-1">
                    Secret Access Cipher
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green font-ms font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-2.5 bg-ms-green hover:bg-[#00d066] text-ms-bg font-bold text-xs rounded transition-all font-ms flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
                >
                  {isSubmittingAuth ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-ms-bg border-t-transparent animate-spin"></div>
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      {isAuthRegister ? "PROVISION USER" : "VERIFY SECURITY"}
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-ms-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthRegister(!isAuthRegister);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="text-[10px] text-ms-green hover:underline font-ms"
                >
                  {isAuthRegister
                    ? "Already configured? Verify security cipher"
                    : "Need to establish terminal? Provision user"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRMATION MODAL */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-ms-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-ms-card border border-red-500/30 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-red-950/30 border border-red-500/30 rounded flex items-center justify-center font-ms text-red-400 text-lg font-bold mx-auto mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-white font-ms">
                  CLEAR ALL SAVED KITS?
                </h3>
                <p className="text-[10px] text-ms-text-muted mt-1 font-ms">
                  This action is irreversible. All saved specs and development
                  prompts will be permanently deleted from local storage.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="flex-1 py-2.5 bg-ms-bg border border-ms-border hover:bg-ms-border text-white text-xs font-ms font-bold rounded transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    saveToLocalStorage([]);
                    setShowClearConfirmModal(false);
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-ms font-bold rounded transition-all"
                >
                  CONFIRM DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FloatingChatbot />
    </div>
  );
}
