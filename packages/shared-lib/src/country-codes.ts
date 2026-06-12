/** Common country dialing codes for phone inputs. */
export type CountryCode = {
  code: string;
  iso: string;
  ar: string;
  en: string;
};

export const COUNTRY_CODES: CountryCode[] = [
  { code: "+20", iso: "EG", ar: "مصر", en: "Egypt" },
  { code: "+966", iso: "SA", ar: "السعودية", en: "Saudi Arabia" },
  { code: "+971", iso: "AE", ar: "الإمارات", en: "UAE" },
  { code: "+965", iso: "KW", ar: "الكويت", en: "Kuwait" },
  { code: "+974", iso: "QA", ar: "قطر", en: "Qatar" },
  { code: "+973", iso: "BH", ar: "البحرين", en: "Bahrain" },
  { code: "+968", iso: "OM", ar: "عُمان", en: "Oman" },
  { code: "+962", iso: "JO", ar: "الأردن", en: "Jordan" },
  { code: "+961", iso: "LB", ar: "لبنان", en: "Lebanon" },
  { code: "+964", iso: "IQ", ar: "العراق", en: "Iraq" },
  { code: "+963", iso: "SY", ar: "سوريا", en: "Syria" },
  { code: "+970", iso: "PS", ar: "فلسطين", en: "Palestine" },
  { code: "+212", iso: "MA", ar: "المغرب", en: "Morocco" },
  { code: "+213", iso: "DZ", ar: "الجزائر", en: "Algeria" },
  { code: "+216", iso: "TN", ar: "تونس", en: "Tunisia" },
  { code: "+218", iso: "LY", ar: "ليبيا", en: "Libya" },
  { code: "+249", iso: "SD", ar: "السودان", en: "Sudan" },
  { code: "+1", iso: "US", ar: "أمريكا", en: "USA" },
  { code: "+1", iso: "CA", ar: "كندا", en: "Canada" },
  { code: "+44", iso: "GB", ar: "بريطانيا", en: "UK" },
  { code: "+33", iso: "FR", ar: "فرنسا", en: "France" },
  { code: "+49", iso: "DE", ar: "ألمانيا", en: "Germany" },
  { code: "+39", iso: "IT", ar: "إيطاليا", en: "Italy" },
  { code: "+34", iso: "ES", ar: "إسبانيا", en: "Spain" },
  { code: "+90", iso: "TR", ar: "تركيا", en: "Turkey" },
  { code: "+91", iso: "IN", ar: "الهند", en: "India" },
  { code: "+86", iso: "CN", ar: "الصين", en: "China" },
];

export const DEFAULT_COUNTRY_CODE = "+20";

export function combinePhone(code: string, localNumber: string): string {
  const trimmed = localNumber.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/\s+/g, "");
  const local = trimmed.replace(/[\s-]/g, "").replace(/^0+/, "");
  return `${code}${local}`;
}
