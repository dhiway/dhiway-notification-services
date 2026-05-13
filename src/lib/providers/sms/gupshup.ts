import { ProviderDefinition } from 'src/types/provider';
import z from 'zod';

const sendSmsWithGupshup = async (
  _to: string,
  _templateId: string,
  _variables: unknown
) => {
  return { ok: true };
};

export const gupshupSmsProvider: ProviderDefinition = {
  name: 'gupshup-sms',
  templates: {},
  schema: z.object(),
  async send({ to, template_id, variables }) {
    return await sendSmsWithGupshup(to, template_id, variables);
  },
};
