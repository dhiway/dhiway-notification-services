import { z } from 'zod';
import { ProviderDefinition } from '../../../types/provider';
import { sendWhatsAppMessage } from './twilioSend';

export const whatsappProvider: ProviderDefinition = {
  name: 'whatsapp',

  templates: {
    account: 'AC7d9a586f04da5da7f46a23c7fd936188',
    dialflow: 'HXa9cc9766cfdd966ae28b7ebc4ca0d09e',
  },

  schema: z.object({
    contentSid: z.string().nullable(),
  }),

  async send({ to, template_id, variables }) {
    const contentSid = variables.contentSid ?? template_id;
    const ok = await sendWhatsAppMessage(to, contentSid);
    return ok;
  },
};
