import fs from 'fs';

type SecretConfig = {
  secret: string;
};

let SECRETS: Record<string, SecretConfig> = {};

export function loadSecrets() {
  const path = process.env.INTERNAL_SECRETS_JSON;
  if (!path) throw new Error('INTERNAL_SECRETS_JSON not set');

  SECRETS = JSON.parse(fs.readFileSync(path, 'utf-8'));
  console.log(`Loaded ${Object.keys(SECRETS).length} internal secrets`);
}

export function getSecret(keyId: string): string | null {
  return SECRETS[keyId]?.secret ?? null;
}
