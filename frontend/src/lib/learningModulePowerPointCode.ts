import type { LearningModuleAudience, LearningModuleContentType } from "@/lib/learningModulePowerPointApi";

const AUDIENCE_CODES: Record<LearningModuleAudience, string> = {
  GENERAL: "GEN",
  TOP_LEADER: "TL",
  LEADER: "L",
  TOP_AGENT: "TA",
  AGENT: "A",
  NEW_LEADER: "NL",
  NEW_AGENT: "NA",
};

const CONTENT_CODES: Record<LearningModuleContentType, string> = {
  GENERAL: "GEN",
  LEADERSHIP: "LDR",
  MOTIVATION_COACH: "MOT",
  PERSONAL_SALES: "PS",
  RECRUITMENT: "REC",
  PRODUCT: "PROD",
  LEGAL_COMPLIANCE: "LEG",
  OPERATION: "OPS",
};

export function generateLearningModulePowerPointSuffix(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function shortHash8(input: string) {
  const enc = new TextEncoder();
  const bytes = enc.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const arr = Array.from(new Uint8Array(hash));
  const b64 = btoa(String.fromCharCode(...arr))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  const compact = b64.replace(/[^A-Za-z0-9]/g, "");
  return compact.substring(0, 8).toUpperCase();
}

export async function generateLearningModulePowerPointBaseCode(params: {
  duration: "D1" | "D2" | "D3";
  audience: LearningModuleAudience[];
  contentTypes: LearningModuleContentType[];
}) {
  const audienceCodes = params.audience.map((a) => AUDIENCE_CODES[a]).filter(Boolean);
  const contentCodes = params.contentTypes.map((c) => CONTENT_CODES[c]).filter(Boolean);
  const payload = `${params.duration}|${audienceCodes.join(",")}|${contentCodes.join(",")}`;
  const hash = await shortHash8(payload);
  return `${params.duration}-${hash}`;
}

export async function generateLearningModulePowerPointFullCode(params: {
  duration: "D1" | "D2" | "D3";
  audience: LearningModuleAudience[];
  contentTypes: LearningModuleContentType[];
  suffix?: string;
}) {
  const base = await generateLearningModulePowerPointBaseCode({
    duration: params.duration,
    audience: params.audience,
    contentTypes: params.contentTypes,
  });
  const suffix = params.suffix || generateLearningModulePowerPointSuffix(6);
  return `${base}-${suffix}`;
}
