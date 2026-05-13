import { z } from 'zod';
import { ProviderDefinition } from '../../types/provider';

function sampleValueFromSchema(schema: any): any {
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
  if (Array.isArray(schema.anyOf)) {
    const nonNull = schema.anyOf.find((item: any) => item.type !== 'null');
    return sampleValueFromSchema(nonNull ?? schema.anyOf[0]);
  }

  switch (schema.type) {
    case 'string':
      return schema.format === 'email' ? 'user@example.com' : 'string';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return sampleVariablesFromSchema(schema);
    case 'null':
      return null;
    default:
      return null;
  }
}

function sampleVariablesFromSchema(schema: any) {
  const properties = schema.properties ?? {};
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      sampleValueFromSchema(value),
    ])
  );
}

function sampleRecipient(providerName: string) {
  if (providerName === 'email') return 'user@example.com';
  if (providerName === 'sms' || providerName === 'whatsapp')
    return '+918888888888';
  return '<recipient>';
}

export function serializeProvider(provider: ProviderDefinition) {
  const variablesSchema = z.toJSONSchema(provider.schema);
  const templatePayloads = Object.entries(provider.templates).map(
    ([template_id, provider_template_id]) => ({
      template_id,
      provider_template_id,
      payload: {
        channel: provider.name,
        template_id,
        to: sampleRecipient(provider.name),
        priority: 'other',
        variables: sampleVariablesFromSchema(variablesSchema),
      },
    })
  );

  return {
    name: provider.name,
    templates: provider.templates,
    template_payloads: templatePayloads,
    variables_schema: variablesSchema,
    notify_payload: {
      channel: provider.name,
      template_id: '<template_id>',
      to: sampleRecipient(provider.name),
      priority: 'other',
      variables: sampleVariablesFromSchema(variablesSchema),
    },
  };
}
