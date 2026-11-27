export const DEFAULT_WHATSAPP_NUMBER = "+971 52 136 2224";

function labelLine(label: string, value?: string) {
  const normalized = value?.trim();
  return normalized ? `${label}: ${normalized}` : label;
}

export function toWhatsAppText(lines: string[]) {
  return encodeURIComponent(lines.filter(Boolean).join("\n"));
}

export function buildWhatsAppUrl({
  number = DEFAULT_WHATSAPP_NUMBER,
  lines,
}: {
  number?: string;
  lines: string[];
}) {
  const wa = number.replace(/[^\d]/g, "");
  const text = toWhatsAppText(lines);
  return `https://wa.me/${wa}?text=${text}`;
}

export function buildBuyerInquiryLines({
  fullName,
  phone,
  purpose,
  propertyType,
  propertyLocation,
  budget,
  extraLines = [],
}: {
  fullName?: string;
  phone?: string;
  purpose?: string;
  propertyType?: string;
  propertyLocation?: string;
  budget?: string;
  extraLines?: string[];
}) {
  const extras = extraLines.map((line) => line.trim()).filter(Boolean);

  return [
    "Hello ZAiN Int'l Group",
    "I'm interested in buying a property in Dubai, U.A.E.",
    "",
    labelLine("Full Name :", fullName),
    labelLine("Call & WhatsApp no. :", phone),
    labelLine("Purpose Investment or live-in :", purpose),
    labelLine("Preferred Property Type :", propertyType),
    labelLine("Preferred Property Location :", propertyLocation),
    labelLine("Budget in AED or US$ :", budget),
    ...(extras.length ? ["", ...extras] : []),
  ];
}
