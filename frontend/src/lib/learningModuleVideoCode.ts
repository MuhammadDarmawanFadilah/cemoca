import type {
  LearningModuleAudience,
  LearningModuleContentType,
  LearningModuleVideoDuration,
} from "@/lib/learningModuleVideoApi";

const AUDIENCE_CODE: Record<LearningModuleAudience, string> = {
  GENERAL: "GEN",
  TOP_LEADER: "TL",
  LEADER: "L",
  TOP_AGENT: "TA",
  AGENT: "A",
  NEW_LEADER: "NL",
  NEW_AGENT: "NA",
};

const CONTENT_CODE: Record<LearningModuleContentType, string> = {
  GENERAL: "GEN",
  LEADERSHIP: "LDR",
  MOTIVATION_COACH: "MOT",
  PERSONAL_SALES: "PS",
  RECRUITMENT: "REC",
  PRODUCT: "PROD",
  LEGAL_COMPLIANCE: "LEG",
  OPERATION: "OPS",
};

const SUFFIX_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLearningModuleVideoSuffix(length = 6) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  let out = "";
  for (let i = 0; i < length; i++) {
    out += SUFFIX_ALPHABET[bytes[i] % SUFFIX_ALPHABET.length];
  }
  return out;
}

function normalizeCodes<T extends string>(values: T[], map: Record<T, string>) {
  return values.map((v) => map[v]).filter(Boolean);
}

async function sha256Hex(input: string) {
  const enc = new TextEncoder();
  const data = enc.encode(input);

  if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(digest);
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return hex.toUpperCase();
  }

  // Fallback (non-crypto) for environments without WebCrypto
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

export async function buildLearningModuleVideoCodePreview(input: {
  duration: LearningModuleVideoDuration | "";
  audience: LearningModuleAudience[];
  contentTypes: LearningModuleContentType[];
  suffix: string;
}) {
  const { duration, audience, contentTypes, suffix } = input;
  if (!duration || audience.length === 0 || contentTypes.length === 0) return "-";

  const audienceCodes = normalizeCodes(audience, AUDIENCE_CODE);
  const contentCodes = normalizeCodes(contentTypes, CONTENT_CODE);
  const payload = `${duration}|${audienceCodes.join(",")}|${contentCodes.join(",")}`;
  const hash = (await sha256Hex(payload)).slice(0, 8);
  return `${duration}-${hash}-${suffix}`;
}
