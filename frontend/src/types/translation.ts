export type Language = 'python' | 'javascript';
export type ProviderType = 'ollama' | 'gemini' | 'mock';

export interface ProviderConfig {
  provider: ProviderType;
  api_key?: string;
  model?: string;
  base_url?: string;
  consent_granted: boolean;
}

export interface TranslationRequest {
  source_lang: Language;
  target_lang: Language;
  code: string;
  instructions?: string;
  provider_config?: ProviderConfig;
}

export interface ProviderTestRequest {
  provider: ProviderType;
  api_key?: string;
  model?: string;
  base_url?: string;
}

export interface ProviderTestResponse {
  valid: boolean;
  provider: string;
  model: string;
  message: string;
  details?: string | null;
  error_type?: string | null;
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
