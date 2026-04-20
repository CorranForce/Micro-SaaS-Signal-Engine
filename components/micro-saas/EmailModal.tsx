"use client";

import { useState, useEffect } from "react";
import { buildEmailHtml, buildPlainBody } from "@/lib/email-builder";
import { sendEmailAction } from "@/app/actions";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";

export const EmailModal = ({ idea, kit, roi, prefillEmail = "", hasServerResend = false, localResendKey = "", onClose }: any) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(prefillEmail);
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [sendErr, setSendErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  const htmlBody = buildEmailHtml(idea, kit, roi);
  const plainBody = buildPlainBody(idea, kit, roi);
  const subject = `🚀 Launch Kit: ${idea.name} — Micro-SaaS Blueprint`;

  const canUseResend = hasServerResend;

  const handleSendVerification = async () => {
    if (!auth.currentUser) return;
    setVerifying(true);
    setVerifyMsg("");
    try {
      await sendEmailVerification(auth.currentUser);
      setVerifyMsg("Verification email sent! Please check your inbox.");
    } catch (e: any) {
      setVerifyMsg(`Error: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async (overrideEmail?: string) => {
    const targetEmail = typeof overrideEmail === 'string' ? overrideEmail : email;
    if (!targetEmail.trim() || !canUseResend) return;
    setSending(true); setSendErr("");
    try {
      const res = await sendEmailAction(targetEmail, subject, htmlBody, localResendKey);
      if (res.error) {
        // Provide more specific feedback based on common Resend API errors
        const errStr = String(res.error).toLowerCase();
        if (errStr.includes("verification") || errStr.includes("verify")) {
          setSendErr("Domain not verified. You can only send to the email address registered with your Resend account until you verify a custom domain.");
        } else if (errStr.includes("api key") || errStr.includes("unauthorized")) {
          setSendErr("Invalid Resend API key. Please check your configuration.");
        } else if (errStr.includes("rate limit") || errStr.includes("429")) {
          setSendErr("Rate limit exceeded. Please try again later.");
        } else {
          setSendErr(`Failed to send: ${res.error}`);
        }
      } else {
        setSentOk(true);
      }
    } catch (e: any) { setSendErr(`Error: ${e.message}`); }
    finally { setSending(false); }
  };
  
  const handleMailto = (overrideEmail?: string) => {
    const targetEmail = typeof overrideEmail === 'string' ? overrideEmail : email;
    if (!targetEmail.trim()) return;
    const mailtoLink = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainBody)}`;
    // Create a temporary anchor element to trigger the mailto link
    // This is safer than window.open in some iframe environments
    const a = document.createElement('a');
    a.href = mailtoLink;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(plainBody);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToMe = () => {
    if (user?.email) {
      setEmail(user.email);
      if (canUseResend) {
        handleResend(user.email);
      } else {
        handleMailto(user.email);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.85)] z-[1000] flex items-center justify-center p-5">
      <div className="bg-ms-panel border border-ms-green w-full max-w-[720px] max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-ms-border flex justify-between items-center shrink-0">
          <div>
            <div className="font-ms text-[10px] text-ms-green font-bold tracking-[1.5px] mb-[3px]">✉ SEND LAUNCH KIT</div>
            <div className="font-ms text-[14px] text-ms-white font-bold">{idea.name}</div>
          </div>
          <button suppressHydrationWarning onClick={onClose} className="font-ms bg-transparent border border-ms-border-light text-ms-text-muted px-3 py-1.5 text-[12px] cursor-pointer">✕ Close</button>
        </div>
        <div className="px-5 py-3.5 border-b border-ms-border shrink-0 bg-ms-bg" suppressHydrationWarning>
          <div className="flex justify-between items-end mb-2">
            <div className="font-ms text-[10px] text-ms-green font-bold tracking-[1px]">SEND TO</div>
            {user && (
              <div className="font-ms text-[10px] flex items-center gap-2">
                {user.emailVerified ? (
                  <span className="text-ms-green">✓ Email Verified</span>
                ) : (
                  <span className="text-ms-red flex items-center gap-2">
                    ⚠ Email Unverified
                    <button 
                      onClick={handleSendVerification} 
                      disabled={verifying}
                      className="bg-ms-red/20 border border-ms-red text-ms-red px-2 py-0.5 rounded-[2px] cursor-pointer hover:bg-ms-red/30 transition-colors disabled:opacity-50"
                    >
                      {verifying ? "Sending..." : "Resend Verification"}
                    </button>
                  </span>
                )}
                {verifyMsg && <span className="text-ms-text-muted">{verifyMsg}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap" suppressHydrationWarning>
            <input suppressHydrationWarning type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className={`font-ms flex-1 min-w-[200px] bg-ms-panel border ${email ? "border-ms-green" : "border-ms-border"} text-ms-text px-3.5 py-2.5 text-[13px] outline-none`}
              onKeyDown={e => e.key === "Enter" && (canUseResend ? handleResend() : handleMailto())} />
            
            {user?.email && (
              <button suppressHydrationWarning onClick={handleSendToMe} className="font-ms bg-ms-panel border border-ms-border text-ms-text px-3.5 py-2.5 text-[12px] hover:text-ms-green hover:border-ms-green whitespace-nowrap cursor-pointer transition-colors">
                Send to Me
              </button>
            )}

            {canUseResend && (
              <button suppressHydrationWarning onClick={() => handleResend()} disabled={!email.trim() || sending} className={`font-ms px-[22px] py-2.5 text-[12px] font-bold whitespace-nowrap ${email && !sending ? "cursor-pointer" : "cursor-default"} ${sentOk ? "bg-ms-green-dark text-ms-green border border-ms-green" : email ? "bg-ms-green text-[#060f06] border-none" : "bg-ms-panel-light text-ms-text-muted border-none"}`}>
                {sentOk ? "✓ Sent!" : sending ? "⟳ Sending…" : "✉ Send via Resend"}
              </button>
            )}
            <button suppressHydrationWarning onClick={() => handleMailto()} disabled={!email.trim()} className={`font-ms border-none px-5 py-2.5 text-[12px] font-bold whitespace-nowrap ${email ? "bg-ms-green text-[#060f06] cursor-pointer" : "bg-[#142014] text-[#2a402a] cursor-default"}`}>
              ✉ Open Mail App
            </button>
            <button suppressHydrationWarning onClick={handleCopy} className={`font-ms px-3.5 py-2.5 text-[12px] cursor-pointer whitespace-nowrap border ${copied ? "bg-ms-green-dark border-ms-green text-ms-green" : "bg-transparent border-[#2a402a] text-[#6a8a6a]"}`}>
              {copied ? "✓ Copied" : "Copy Text"}
            </button>
          </div>
          {sendErr && (
            <div className="font-ms text-[11px] text-ms-red bg-ms-red-dark/20 border border-ms-red/30 px-3 py-2 mt-2 w-full">
              <div className="font-bold mb-1">⚠ ERROR SENDING EMAIL</div>
              <div className="mb-1">{sendErr}</div>
              <div className="text-ms-red/70 mt-1.5 flex flex-col gap-1">
                {sendErr.includes("Domain not verified") && (
                  <>
                    <span><strong>Action:</strong> You are using a sandbox domain. You must either:</span>
                    <ul className="list-disc pl-4 m-0">
                      <li>Send the email to the exact address you registered with Resend</li>
                      <li>Or <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-ms-green hover:underline">verify a custom domain on Resend</a> to send to anyone</li>
                    </ul>
                  </>
                )}
                {sendErr.includes("Invalid Resend API key") && (
                  <span><strong>Action:</strong> <a href="/settings" className="text-ms-green hover:underline">Go to Settings</a> to update your Resend API key.</span>
                )}
                {sendErr.includes("Rate limit") && "Action: Wait a few minutes before trying again."}
              </div>
            </div>
          )}
          <div className="font-ms text-[10px] text-ms-text-muted mt-1.5">
            {canUseResend ? "Sends a beautiful HTML email directly via Resend." : "Add a Resend API key in settings to send directly — or use your mail app."}
          </div>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-2.5">HTML EMAIL PREVIEW</div>
          <iframe srcDoc={htmlBody} className="w-full h-[480px] border border-ms-border bg-white rounded-[3px]" title="Email Preview" sandbox="allow-same-origin" />
        </div>
      </div>
    </div>
  );
};
