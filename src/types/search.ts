export interface SearchFormData {
  businessSector: string;
  city: string;
  address: string;
  country: string;
  maxLeads: number;
  emailLanguage: string;
  emailTone: string;
}

export const LANGUAGES = ['English', 'French', 'Spanish', 'German', 'Italian'] as const;
export const TONES = ['Professional', 'Casual', 'Direct', 'Friendly', 'Persuasive'] as const;
export const COUNTRIES = [
  'France', 'United States', 'United Kingdom', 'Germany', 'Spain',
  'Italy', 'Belgium', 'Switzerland', 'Canada', 'Netherlands',
  'Portugal', 'Brazil', 'Australia',
] as const;
