export const providerConfig: any = {
  sms: { rate: 100, burst: 40 },
  email: { rate: 100, burst: 50 },
  whatsapp: { rate: 100, burst: 10 },
} as const;
