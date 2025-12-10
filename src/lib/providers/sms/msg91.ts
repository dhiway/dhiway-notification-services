export const templates = {
  login: '6896c26d6eb66c66340e1242',
};

sendSmsWithMsg91('', '', templates.login);
export async function sendSmsWithMsg91(
  phoneNumber: string,
  message: string,
  template_id: string
) {
  const phone = phoneNumber.startsWith('+')
    ? phoneNumber.slice(1)
    : phoneNumber;
  const authKey = process.env.MSG91_AUTH_KEY!;
  const url = `https://control.msg91.com/api/v5/flow`;
  const body = JSON.stringify({
    template_id: template_id,
    short_url: 0,
    recipients: [
      {
        mobiles: phone,
        var: message,
      },
    ],
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: authKey,
    },
    body,
  });
  const response = await resp.text();
  if (!resp.ok) {
    const errorText = await resp.text();
    console.log(`MSG91 SMS send failed: ${errorText}`);
    return { ok: false };
  }

  return { ok: true, response: response };
}

export default {
  templates,
  async send(to: string, variables: any) {
    return await sendSmsWithMsg91(to, variables, templates.login);
  },
};
