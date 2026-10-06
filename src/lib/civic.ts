export const ISSUE_CATEGORIES = [
  { value: "ROAD_POTHOLE", label: "Road / Pothole", departmentCode: "ROADS", keywords: ["pothole", "road", "asphalt", "crater", "footpath"] },
  { value: "STREETLIGHT", label: "Broken Streetlight / Electrical Issue", departmentCode: "ELECTRICAL", keywords: ["streetlight", "light", "electric", "pole", "wire"] },
  { value: "WATER_LEAKAGE", label: "Water Leakage / Water Supply", departmentCode: "WATER", keywords: ["water", "leak", "pipe", "tap", "supply"] },
  { value: "DRAINAGE", label: "Drainage Overflow / Sewage", departmentCode: "DRAINAGE", keywords: ["drain", "sewage", "overflow", "gutter", "manhole"] },
  { value: "GARBAGE", label: "Garbage Dumping / Waste Collection", departmentCode: "WASTE", keywords: ["garbage", "waste", "trash", "dump", "rubbish"] },
  { value: "UNCLEAN_AREA", label: "Roadside Dust / Unclean Public Area", departmentCode: "SANITATION", keywords: ["dust", "dirty", "unclean", "cleaning", "litter"] },
  { value: "FOOTPATH", label: "Damaged Footpath / Public Infrastructure", departmentCode: "INFRA", keywords: ["footpath", "sidewalk", "pavement", "infrastructure", "railing"] },
  { value: "STORM_DAMAGE", label: "Fallen Tree / Storm Damage", departmentCode: "DISASTER", keywords: ["tree", "fallen", "storm", "branch", "debris"] },
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]["value"];

export const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted by staff",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  RESOLVED: "Resolved",
};

export function getCategory(value: string) {
  return ISSUE_CATEGORIES.find((item) => item.value === value);
}

export function suggestedCategory(text: string) {
  const normalized = text.toLowerCase();
  return ISSUE_CATEGORIES.find((category) => category.keywords.some((word) => normalized.includes(word)));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function isActiveStatus(status: string) {
  return !["COMPLETED", "RESOLVED"].includes(status);
}
