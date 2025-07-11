export interface Company {
  id: string;
  name: string;
  website_url?: string;
  logo_url?: string;
  primary_domain?: string;
  organization_id: string;
  headquarters_address?: string;
  industry?: string;
  publicly_traded_symbol?: string;
  publicly_traded_exchange?: string;
  linkedin_url?: string;
  crunchbase_url?: string;
  primary_phone?: {
    number: string;
    source: string;
  };
  languages?: string[];
  alexa_ranking?: number;
  phone?: string;
  keywords?: string[];
  founded_year?: number;
  company_type?: string;
  annual_revenue?: number;
  total_funding?: number;
  latest_funding_round_date?: string;
  latest_funding_amount?: number;
  num_employees?: number;
  num_employees_range?: string;
  technologies?: string[];
  suborganizations?: any[];
  account_id?: string;
  account?: {
    id: string;
    name: string;
    domain: string;
  };
}

export interface SearchResponse {
  organizations: Company[];
  companies?: Company[]; // Alternative field name that Apollo API might use
  breadcrumbs: any[];
  partial_results_only: boolean;
  disable_eu_prospecting: boolean;
  num_fetch_result: number;
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface SearchFilters {
  companyName: string;
  location: string;
  employeeRange: string;
  businessArea: string;
  page: number;
  perPage: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export class ApolloApiError extends Error {
  public status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApolloApiError';
    this.status = status;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApolloApiError);
    }
  }
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title: string;
  email?: string;
  contact_emails?: Array<{
    email: string;
    email_status: string;
    email_source?: string;
    position: number;
    free_domain?: boolean;
  }>;
  phone_numbers?: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
    position: number;
    status: string;
    dnc_status?: string;
    dialer_flags?: {
      country_name: string;
      country_enabled: boolean;
      high_risk_calling_enabled: boolean;
      potential_high_risk_number: boolean;
    };
  }>;
  organization_id?: string;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    primary_domain?: string;
  };
  employment_history?: Array<{
    organization_id: string;
    organization_name: string;
    title: string;
    start_date?: string;
    end_date?: string;
    current: boolean;
  }>;
  city?: string;
  state?: string;
  country?: string;
  headline?: string;
  photo_url?: string;
  twitter_url?: string;
  github_url?: string;
  facebook_url?: string;
  extrapolated_email_confidence?: number;
  personal_emails?: Array<{
    email: string;
    email_status: string;
    position: number;
  }>;
  work_email?: string;
  extrapolated_email?: string;
  business_email?: string;
  primary_email?: string;
  verified_email?: string;
  professional_email?: string;
  departments?: string[];
  subdepartments?: string[];
  functions?: string[];
  seniority?: string;
  headline?: string;
  present_raw_address?: string;
  linkedin_uid?: string;
  email_status?: string;
  email_source?: string;
  sanitized_phone?: string;
  time_zone?: string;
  account?: {
    id: string;
    name: string;
    website_url?: string;
    primary_domain?: string;
    logo_url?: string;
  };
  free_domain?: boolean;
  is_likely_to_engage?: boolean;
}

export interface PeopleSearchResponse {
  contacts: Person[];
  people: Person[];
  breadcrumbs: any[];
  partial_results_only: boolean;
  disable_eu_prospecting: boolean;
  num_fetch_result: number;
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
  model_ids?: string[];
  derived_params?: any;
}

export interface PeopleSearchFilters {
  organizationId?: string;
  personTitles?: string[];
  personSeniorities?: string[];
  personLocations?: string[];
  keywords?: string;
  page: number;
  perPage: number;
}

export interface EmailSearchFilters {
  personId: string;
  organizationId?: string;
}

export interface EmailSearchResponse {
  person: Person;
  emails: Array<{
    email: string;
    email_status: string; // 'verified' | 'guessed' | 'available'
    email_source?: string;
    position: number;
    free_domain?: boolean;
    confidence?: number;
  }>;
  phone_numbers: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
    position: number;
    status: string;
    dnc_status?: string;
    dnc_status?: string;
  }>;
  success: boolean;
  message?: string;
}