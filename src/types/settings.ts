export type Settings = {
  $id: string;
  userId: string;
  developerName: string;
  portfolioUrl: string;
  email: string;
  defaultCountryFilter: string | null;
  defaultIndustries: string[];
  dailyLeadTarget: number | null;
  minimumLeadScore: number | null;
  followUpAfterDays: number | null;
  skills: string[];
  preferredServices: string[];
  createdAt: string;
  updatedAt: string;
};

export type SettingsInput = Omit<Settings, "$id" | "createdAt" | "updatedAt" | "userId"> & {
  defaultCountryFilter?: string | null;
  dailyLeadTarget?: number | null;
  minimumLeadScore?: number | null;
  followUpAfterDays?: number | null;
};
