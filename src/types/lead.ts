export interface Lead {
  rowIndex: number;
  businessSector: string;
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: string;
  linkedinCompany: string;
  linkedinPerson: string;
  decisionMaker: string;
  emailSent: string;
  status: string;
}

export const SHEET_HEADERS = [
  'Business Sector',
  'Name',
  'Website',
  'Email',
  'Phone',
  'Address',
  'Category',
  'Rating',
  'LinkedIn Company',
  'LinkedIn Person',
  'Decision Maker',
  'Email Sent',
  'Status',
] as const;

export const HEADER_TO_KEY: Record<string, keyof Omit<Lead, 'rowIndex'>> = {
  'Business Sector': 'businessSector',
  'Name': 'name',
  'Website': 'website',
  'Email': 'email',
  'Phone': 'phone',
  'Address': 'address',
  'Category': 'category',
  'Rating': 'rating',
  'LinkedIn Company': 'linkedinCompany',
  'LinkedIn Person': 'linkedinPerson',
  'Decision Maker': 'decisionMaker',
  'Email Sent': 'emailSent',
  'Status': 'status',
};
