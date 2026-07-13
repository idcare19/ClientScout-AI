import type { Lead } from "@/types/lead";
import type { OutreachChannel, WebsiteAudit, WebsiteOpportunityType } from "@/types/verification";

type TemplateResult = {
  subject: string | null;
  message: string;
  followUpMessage: string | null;
  finalFollowUpMessage: string | null;
  opportunityType: WebsiteOpportunityType;
  templateKey: string;
};

function greetingForLead(lead: Lead) {
  const name = lead.contactPerson?.trim();
  return name ? `Hi ${name}` : `Hi ${lead.businessName} team`;
}

function serviceLine(lead: Lead, opportunityType: WebsiteOpportunityType) {
  const map: Record<WebsiteOpportunityType, string> = {
    no_public_website_found:
      "I help businesses create a clear website that makes it easy for customers to learn about services and get in touch.",
    broken_or_unreachable: "I help businesses restore a reliable website presence with a cleaner, easier-to-access experience.",
    mobile_experience: "I help businesses improve the mobile experience so customers can quickly explore services on their phones.",
    contact_flow: "I help businesses add clearer contact and enquiry paths so customers can reach the right person faster.",
    whatsapp_integration: "I help businesses add WhatsApp enquiry flows that make it easy for customers to start a conversation.",
    enquiry_form: "I help businesses add clearer enquiry forms and lead-capture paths on their website.",
    booking_flow: "I help businesses create smoother booking and appointment flows for customers.",
    performance: "I help businesses improve website performance and keep the experience responsive.",
    redesign: "I help businesses refresh older websites into clearer, more modern experiences.",
    maintenance: "I help businesses maintain a dependable website presence and reduce avoidable issues.",
    no_clear_opportunity: "I help businesses improve their online presence in practical, measurable ways.",
    needs_manual_review: "I help businesses improve their online presence in practical, measurable ways.",
  };
  return map[opportunityType] ?? map.no_clear_opportunity;
}

function factsLine(lead: Lead, audit?: WebsiteAudit | null) {
  if (audit?.auditStatus === "unsafe_url") {
    return "I only reviewed the public URL you already shared, and I did not attempt to log in or submit anything.";
  }
  if (audit?.auditStatus === "completed") {
    return "I reviewed the public homepage and noted a few factual observations from what was visible in the HTML.";
  }
  if (!lead.website) {
    return "While checking your public online presence, I could not find a dedicated website where customers can clearly explore your services.";
  }
  return "I reviewed the public website linked in your lead record and noted a few factual observations.";
}

function opportunityQuestion(channel: OutreachChannel) {
  if (channel === "linkedin") return "Could you point me to the person responsible for your website or digital operations?";
  return "Would you be open to a complimentary homepage concept?";
}

function channelFriendlyName(channel: OutreachChannel) {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "linkedin") return "LinkedIn";
  return "email";
}

export function generateStaticOutreachDraft({
  lead,
  channel,
  opportunityType,
  developerName,
  portfolioUrl,
  skills,
  preferredServices,
  audit,
}: {
  lead: Lead;
  channel: OutreachChannel;
  opportunityType: WebsiteOpportunityType;
  developerName: string;
  portfolioUrl: string;
  skills: string[];
  preferredServices: string[];
  audit?: WebsiteAudit | null;
}): TemplateResult {
  const greeting = greetingForLead(lead);
  const intro = factsLine(lead, audit);
  const service = serviceLine(lead, opportunityType);
  const serviceHint = skills.length ? `I usually work with ${skills.slice(0, 3).join(", ")}.` : "I work on practical websites and lead-capture improvements.";
  const preferredServiceHint = preferredServices.length ? `Relevant work: ${preferredServices.slice(0, 3).join(", ")}.` : null;
  const portfolio = `Portfolio: ${portfolioUrl}`;
  const permission = opportunityQuestion(channel);

  const shortMessage = [
    greeting,
    "",
    `I'm ${developerName}, a full-stack web developer.`,
    intro,
    service,
    serviceHint,
    preferredServiceHint,
    portfolio,
    "",
    permission,
  ]
    .filter(Boolean)
    .join("\n");

  const subjectMap: Record<OutreachChannel, string | null> = {
    whatsapp: null,
    email: `${lead.businessName} website opportunity`,
    linkedin: `${lead.businessName} digital presence`,
  };

  const followUpMessage = [
    greeting,
    "",
    `Just following up on my earlier note about ${lead.businessName}.`,
    "If you'd like, I can share a quick idea for improving the homepage or enquiry flow.",
    portfolio,
  ].join("\n");

  const finalFollowUpMessage = [
    greeting,
    "",
    `I wanted to send one last note in case this is useful for ${lead.businessName}.`,
    "If now isn't the right time, no problem at all.",
    portfolio,
  ].join("\n");

  return {
    subject: subjectMap[channel],
    message: shortMessage,
    followUpMessage,
    finalFollowUpMessage,
    opportunityType,
    templateKey: `${channel}_${opportunityType}`,
  };
}

export function getChannelLabel(channel: OutreachChannel) {
  return channelFriendlyName(channel);
}
