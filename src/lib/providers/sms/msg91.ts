import { z } from 'zod';
import { ProviderDefinition } from '../../../types/provider';

export async function sendSmsWithMsg91(
  to: string,
  template_id: string,
  variables: Record<string, string | number>
) {
  const phone = to.startsWith('+') ? to.slice(1) : to;
  const resp = await fetch('https://control.msg91.com/api/v5/flow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: process.env.MSG91_AUTH_KEY!,
    },
    body: JSON.stringify({
      template_id,
      short_url: 0,
      recipients: [{ mobiles: phone, ...variables }],
    }),
  });

  if (!resp.ok) {
    console.log('msg91 Error:', resp.json());
    return { ok: false };
  }
  return { ok: true };
}

export const smsProvider: ProviderDefinition = {
  name: 'sms',

  templates: {
    login_otp: {
      provider_template_id: '6896c26d6eb66c66340e1242',
      schema: z.object({
        message: z.string(),
      }),
      mapVariables: (variables) => ({ var: variables.message }),
    },
    credential_wallet_login_otp: {
      provider_template_id: process.env.MSG91_TEMPLATE_ID!,
      schema: z.object({
        otp: z.string(),
        expiry: z.number(),
      }),
    },
  },

  async send({ to, template_id, variables }) {
    return await sendSmsWithMsg91(to, template_id, variables);
  },
};
