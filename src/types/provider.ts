import { ZodType } from 'zod';

export interface ProviderTemplateMap {
  [templateId: string]: string;
}

export interface ProviderDefinition {
  name: string;
  templates: ProviderTemplateMap;
  schema: ZodType<any>;
  send: (payload: {
    to: string;
    template_id: string;
    variables: any;
  }) => Promise<{ ok: boolean; error?: string }>;
}
