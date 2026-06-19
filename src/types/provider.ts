import { ZodType } from 'zod';

export interface ProviderTemplateDefinition {
  provider_template_id: string;
  schema: ZodType<any>;
  mapVariables?: (variables: any) => any;
}

export interface ProviderTemplateMap {
  [templateId: string]: ProviderTemplateDefinition;
}

export interface ProviderDefinition {
  name: string;
  templates: ProviderTemplateMap;
  send: (payload: {
    to: string;
    template_id: string;
    variables: any;
  }) => Promise<{ ok: boolean; error?: string }>;
}
