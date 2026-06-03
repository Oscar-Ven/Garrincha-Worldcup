const teamIsoCodes: Record<string, string> = {
  ALGERIA: "DZ",
  ARGENTINA: "AR",
  AUSTRALIA: "AU",
  AUSTRIA: "AT",
  BELGIUM: "BE",
  "BOSNIA AND HERZEGOVINA": "BA",
  BRAZIL: "BR",
  CANADA: "CA",
  "CAPE VERDE": "CV",
  COLOMBIA: "CO",
  CROATIA: "HR",
  CURACAO: "CW",
  CZECHIA: "CZ",
  "DR CONGO": "CD",
  ECUADOR: "EC",
  EGYPT: "EG",
  ENGLAND: "GB-ENG",
  FRANCE: "FR",
  GERMANY: "DE",
  GHANA: "GH",
  HAITI: "HT",
  IRAN: "IR",
  IRAQ: "IQ",
  "IVORY COAST": "CI",
  JAPAN: "JP",
  JORDAN: "JO",
  MEXICO: "MX",
  MOROCCO: "MA",
  NETHERLANDS: "NL",
  "NEW ZEALAND": "NZ",
  NORWAY: "NO",
  PANAMA: "PA",
  PARAGUAY: "PY",
  PORTUGAL: "PT",
  QATAR: "QA",
  "SAUDI ARABIA": "SA",
  SCOTLAND: "GB-SCT",
  SENEGAL: "SN",
  "SOUTH AFRICA": "ZA",
  "SOUTH KOREA": "KR",
  SPAIN: "ES",
  SWEDEN: "SE",
  SWITZERLAND: "CH",
  TUNISIA: "TN",
  TURKIYE: "TR",
  "UNITED STATES": "US",
  URUGUAY: "UY",
  UZBEKISTAN: "UZ",
};

const fifaIsoCodes: Record<string, string> = {
  ALG: "DZ",
  ARG: "AR",
  AUS: "AU",
  AUT: "AT",
  BEL: "BE",
  BIH: "BA",
  BRA: "BR",
  CAN: "CA",
  CPV: "CV",
  COL: "CO",
  CRO: "HR",
  CUW: "CW",
  CZE: "CZ",
  COD: "CD",
  ECU: "EC",
  EGY: "EG",
  ENG: "GB-ENG",
  FRA: "FR",
  GER: "DE",
  GHA: "GH",
  HAI: "HT",
  IRN: "IR",
  IRQ: "IQ",
  CIV: "CI",
  JPN: "JP",
  JOR: "JO",
  MEX: "MX",
  MAR: "MA",
  NED: "NL",
  NZL: "NZ",
  NOR: "NO",
  PAN: "PA",
  PAR: "PY",
  POR: "PT",
  QAT: "QA",
  KSA: "SA",
  SCO: "GB-SCT",
  SEN: "SN",
  RSA: "ZA",
  KOR: "KR",
  ESP: "ES",
  SWE: "SE",
  SUI: "CH",
  TUN: "TN",
  TUR: "TR",
  USA: "US",
  URU: "UY",
  UZB: "UZ",
};

const nationalityIsoCodes: Record<string, string> = {
  BELGIUM: "BE",
  MOROCCO: "MA",
  FRANCE: "FR",
  BRAZIL: "BR",
  ARGENTINA: "AR",
  NETHERLANDS: "NL",
  GERMANY: "DE",
  SPAIN: "ES",
  PORTUGAL: "PT",
  ENGLAND: "GB-ENG",
  "UNITED STATES": "US",
};

export function normalizeFlagKey(value?: string | null) {
  return value?.trim().toUpperCase().replace(/\s+/g, " ") ?? "";
}

export function isoCodeForTeam(team: { name?: string | null; fifaCode?: string | null; flagUrl?: string | null }) {
  const fifaCode = normalizeFlagKey(team.fifaCode);
  const name = normalizeFlagKey(team.name);
  // Parse "flag:BRA" → "BRA" as a last-resort fallback when fifaCode lookup fails
  const flagUrlCode = team.flagUrl?.startsWith("flag:") ? normalizeFlagKey(team.flagUrl.slice(5)) : null;
  return (
    fifaIsoCodes[fifaCode] ??
    teamIsoCodes[name] ??
    (flagUrlCode ? fifaIsoCodes[flagUrlCode] : null) ??
    null
  );
}

export function isoCodeForNationality(nationality?: string | null) {
  const key = normalizeFlagKey(nationality);
  return nationalityIsoCodes[key] ?? teamIsoCodes[key] ?? null;
}

export function flagEmojiForIso(isoCode?: string | null) {
  if (!isoCode) return null;
  if (isoCode === "GB-ENG") return "🏴";
  if (isoCode === "GB-SCT") return "🏴";
  if (!/^[A-Z]{2}$/.test(isoCode)) return null;

  return String.fromCodePoint(...isoCode.split("").map((letter) => 127397 + letter.charCodeAt(0)));
}

export function flagLabel(name?: string | null, isoCode?: string | null) {
  if (!isoCode) return "Unknown flag";
  return `${name || isoCode} flag`;
}

export const seedFifaCodes: Record<string, string> = {
  Algeria: "ALG",
  Argentina: "ARG",
  Australia: "AUS",
  Austria: "AUT",
  Belgium: "BEL",
  "Bosnia and Herzegovina": "BIH",
  Brazil: "BRA",
  Canada: "CAN",
  "Cape Verde": "CPV",
  Colombia: "COL",
  Croatia: "CRO",
  Curacao: "CUW",
  Czechia: "CZE",
  "DR Congo": "COD",
  Ecuador: "ECU",
  Egypt: "EGY",
  England: "ENG",
  France: "FRA",
  Germany: "GER",
  Ghana: "GHA",
  Haiti: "HAI",
  Iran: "IRN",
  Iraq: "IRQ",
  "Ivory Coast": "CIV",
  Japan: "JPN",
  Jordan: "JOR",
  Mexico: "MEX",
  Morocco: "MAR",
  Netherlands: "NED",
  "New Zealand": "NZL",
  Norway: "NOR",
  Panama: "PAN",
  Paraguay: "PAR",
  Portugal: "POR",
  Qatar: "QAT",
  "Saudi Arabia": "KSA",
  Scotland: "SCO",
  Senegal: "SEN",
  "South Africa": "RSA",
  "South Korea": "KOR",
  Spain: "ESP",
  Sweden: "SWE",
  Switzerland: "SUI",
  Tunisia: "TUN",
  Turkiye: "TUR",
  "United States": "USA",
  Uruguay: "URU",
  Uzbekistan: "UZB",
};
