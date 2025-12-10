import fs from 'fs';
import path from 'path';
import { ProviderDefinition } from '../../types/provider';

const providersDir = path.join(__dirname);

export const providers: Record<string, ProviderDefinition> = {};

for (const dir of fs.readdirSync(providersDir)) {
  const full = path.join(providersDir, dir);
  if (fs.statSync(full).isDirectory()) {
    const providerModule = require(path.join(full, 'index.js'));
    const provider = providerModule[Object.keys(providerModule)[0]];

    providers[provider.name] = provider;
  }
}
