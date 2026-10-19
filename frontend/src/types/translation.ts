export type Language = 'python' | 'javascript';

export interface TranslationRequest {
  source_lang: Language;
  target_lang: Language;
  code: string;
  instructions?: string;
}

export interface ProviderInfo {
  provider: string;
  model: string;
  execution_time_ms?: number;
  verified: boolean;
}

export interface TranslationResponse {
  source_lang: Language;
  target_lang: Language;
  translated_code: string;
  explanation: string;
  warnings: string[];
  provider_info: ProviderInfo;
}

export interface ProviderStatusResponse {
  provider: string;
  available: boolean;
  model: string;
  details: string;
  setup_instructions?: string | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  app_name: string;
}

export interface ApiError {
  message: string;
  setup_instructions?: string | null;
  error_type?: string;
}
