import z from 'zod';
import mailer from './email/mailer';
import msg91 from './sms/msg91';
import twillio from './whatsapp/twillio';

export const providers_schema = z.object({
  sms: z.any(),
  email: z.any(),
  whatsapp: z.any(),
});

export const providers: z.infer<typeof providers_schema> = {
  sms: msg91,
  email: mailer,
  whatsapp: twillio,
};
