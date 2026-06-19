import { z } from 'zod';
import { ProviderDefinition } from '../../../types/provider';
import { sendMail } from './sendMailCore';

export const emailProvider: ProviderDefinition = {
  name: 'email',

  templates: {
    basic_email: {
      provider_template_id: 'BASIC_EMAIL',
      schema: z.object({
        fromName: z.string(),
        fromEmail: z.email(),
        subject: z.string(),
        html: z.string(),
        replyTo: z.email().optional(),
      }),
    },
    login_otp: {
      provider_template_id: 'LOGIN_OTP_1',
      schema: z.object({
        fromName: z.string(),
        fromEmail: z.email(),
        subject: z.string(),
        html: z.string(),
        replyTo: z.email().optional(),
      }),
    },
  },

  async send({ to, template_id, variables }) {
    const ok = await sendMail({ to, ...variables, template_id });
    return ok;
  },
};
