import { z } from 'zod';
import { ProviderDefinition } from '../../../types/provider';
import { sendWhatsAppMessage } from './twilioSend';

export const whatsappProvider: ProviderDefinition = {
  name: 'whatsapp',

  templates: {
    dialflow: 'HXa9cc9766cfdd966ae28b7ebc4ca0d09e',
  },

  schema: z.object({
    contentSid: z.string().nullable(),
  }),

  async send({ to, template_id, variables }) {
    const contentSid = variables.contentSid ?? template_id;
    console.log('content_sid: ', contentSid);
    const ok = await sendWhatsAppMessage(to, contentSid);
    return ok;
  },
};
