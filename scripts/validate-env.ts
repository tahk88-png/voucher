#!/usr/bin/env tsx
/**
 * Environment variable validation script
 * Run: npm run validate:env
 * 
 * Validates required environment variables are set and have correct format.
 * Fails fast with clear error messages if validation fails.
 */

import fs from 'node:fs';
import path from 'node:path';

const requiredEnvVars = {
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL connection string',
    validate: (value: string) => {
      if (!value.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must start with postgresql://');
      }
      return true;
    },
  },
  AUTH_SECRET: {
    required: true,
    description: 'NextAuth secret (min 32 characters)',
    validate: (value: string) => {
      if (value.length < 32) {
        throw new Error('AUTH_SECRET must be at least 32 characters long');
      }
      if (value === 'change_me_min_32_chars_long_secret_key_here') {
        throw new Error('AUTH_SECRET must be changed from default value');
      }
      return true;
    },
  },
  NEXTAUTH_URL: {
    required: true,
    description: 'NextAuth URL (e.g., http://localhost:3000)',
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('NEXTAUTH_URL must be a valid URL');
      }
    },
  },
} as const;

const optionalEnvVars = {
  STRIPE_SECRET_KEY: {
    description: 'Stripe secret key (optional for dev)',
  },
  RESEND_API_KEY: {
    description: 'Resend API key (optional for dev)',
  },
  SMTP_HOST: {
    description: 'SMTP host (optional, for email magic links)',
  },
} as const;

function parseDotenv(contents: string) {
  const result: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex < 1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) result[key] = value;
  }

  return result;
}

function loadEnvFromFiles() {
  const candidates = ['.env', '.env.local'];
  const merged: Record<string, string> = {};

  for (const filename of candidates) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;
    Object.assign(merged, parseDotenv(fs.readFileSync(filePath, 'utf8')));
  }

  // Allow real environment variables to override file values.
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') merged[key] = value;
  }

  return merged;
}

function validateEnv() {
  console.log('🔍 Validating environment variables...\n');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const env = loadEnvFromFiles();
  
  // Check required vars
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = env[key];
    
    if (!value) {
      if (config.required) {
        errors.push(`❌ ${key}: Missing (required)`);
        console.error(`   ${config.description}`);
      }
      continue;
    }
    
    try {
      if (config.validate) {
        config.validate(value);
      }
      console.log(`✅ ${key}: OK`);
    } catch (error) {
      errors.push(`❌ ${key}: ${error instanceof Error ? error.message : 'Invalid'}`);
      console.error(`   ${config.description}`);
    }
  }
  
  // Check optional vars (warnings only)
  for (const [key, config] of Object.entries(optionalEnvVars)) {
    const value = env[key];
    if (!value) {
      warnings.push(`⚠️  ${key}: Not set (optional)`);
    } else {
      console.log(`✅ ${key}: Set`);
    }
  }
  
  console.log('');
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings (optional variables):');
    warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.error('❌ Validation failed:\n');
    errors.forEach(e => console.error(`   ${e}`));
    console.error('\n💡 Fix:');
    console.error('   1. Copy .env.example to .env: cp .env.example .env');
    console.error('   2. Edit .env and set all required variables');
    console.error('   3. Run this script again: npm run validate:env\n');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are valid!\n');
  process.exit(0);
}

// Run validation
validateEnv();
