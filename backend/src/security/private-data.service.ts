import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import type { Prisma } from '../generated/prisma/client';

// Select encrypted contact envelopes and lookup hashes for authorized response mapping.
export const contactSelect = {
  emailCiphertext: true,
  emailIv: true,
  emailAuthTag: true,
  emailBlindIndex: true,
  phoneCiphertext: true,
  phoneIv: true,
  phoneAuthTag: true,
  phoneBlindIndex: true,
} as const;
// Apply the same protection to every persisted address/emergency-contact field.
export const profileFields = [
  'address',
  'city',
  'province',
  'postalCode',
  'emergencyContactName',
  'emergencyContactPhone',
] as const;
// Apply the existing trim-and-lowercase rule used for email identity and encrypted
// lookup.
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
// Match the existing identity rules: no inferred country code or punctuation removal.
export const normalizePhone = (value: string) => value.trim();
type EnvelopeRow = Record<string, unknown>;

// Encrypt private database fields and restore them only at authorized response boundaries.
@Injectable()
export class PrivateDataService {
  constructor(private readonly encryption: EncryptionService) {}

  // Normalize an email or phone value before computing its keyed lookup index.
  index(field: 'email' | 'phone', value: string) {
    return this.encryption.blindIndex(
      field,
      field === 'email' ? normalizeEmail(value) : normalizePhone(value),
    );
  }

  // Combine exact encrypted-contact lookup with partial username and single/multiword
  // name matching.
  contactSearch(value: string): Prisma.UserWhereInput[] {
    return [
      { firstName: { contains: value } },
      { lastName: { contains: value } },
      { username: { contains: value.toLowerCase() } },
      { emailBlindIndex: this.index('email', value) },
      { phoneBlindIndex: this.index('phone', value) },
      ...(value.trim().includes(' ')
        ? [
            {
              AND: value
                .trim()
                .split(/\s+/)
                .map((word) => ({
                  OR: [
                    { firstName: { contains: word } },
                    { lastName: { contains: word } },
                  ],
                })),
            },
          ]
        : []),
    ];
  }

  // Bind encryption to the model, record owner, and field so envelopes cannot be swapped
  // between records.
  private context(model: string, id: string, field: string) {
    return JSON.stringify(['condotel', 'private-data', 1, model, id, field]);
  }

  // Build the ciphertext/IV/tag columns for a nullable private field.
  writeField(model: string, id: string, field: string, value: string | null) {
    const encrypted =
      value === null
        ? null
        : this.encryption.encrypt(value, this.context(model, id, field));
    return {
      [`${field}Ciphertext`]: encrypted?.ciphertext ?? null,
      [`${field}Iv`]: encrypted?.iv ?? null,
      [`${field}AuthTag`]: encrypted?.authTag ?? null,
    };
  }

  // Validate envelope completeness and authenticate a nullable private field with its
  // record context.
  readField(
    model: string,
    id: string,
    field: string,
    row: EnvelopeRow,
  ): string | null {
    const ciphertext = row[`${field}Ciphertext`];
    const iv = row[`${field}Iv`];
    const authTag = row[`${field}AuthTag`];
    if ([ciphertext, iv, authTag].every((value) => value === null)) {
      return null;
    }
    if (
      typeof ciphertext !== 'string' ||
      typeof iv !== 'string' ||
      typeof authTag !== 'string'
    ) {
      throw new Error('Incomplete encrypted value.');
    }
    return this.encryption.decrypt(
      { ciphertext, iv, authTag },
      this.context(model, id, field),
    );
  }

  // Encrypt only supplied email/phone values, rebuild their indexes, and clear legacy
  // plaintext columns.
  writeContacts(id: string, data: { email?: string; phone?: string | null }) {
    const result: Record<string, string | null> = {};
    for (const field of ['email', 'phone'] as const) {
      if (data[field] === undefined) {
        continue;
      }
      const value =
        data[field] === null
          ? null
          : field === 'email'
            ? normalizeEmail(data[field]!)
            : normalizePhone(data[field]!);
      if (field === 'email' && !value) {
        throw new Error('Email is required.');
      }
      Object.assign(result, this.writeField('User', id, field, value || null));
      result[`${field}BlindIndex`] = value ? this.index(field, value) : null;
      result[field] = null;
    }
    return result;
  }

  // Decrypt contacts and verify their lookup indexes before returning the contact
  // values.
  readContacts(row: EnvelopeRow) {
    const id = String(row.id);
    const email = this.readField('User', id, 'email', row);
    const phone = this.readField('User', id, 'phone', row);
    if (
      !email ||
      this.index('email', email) !== row.emailBlindIndex ||
      (phone
        ? this.index('phone', phone) !== row.phoneBlindIndex
        : row.phoneBlindIndex !== null)
    ) {
      throw new Error('Contact integrity verification failed.');
    }
    return { email, phone };
  }

  // Encrypt supplied address/emergency-contact fields while preserving omitted profile
  // values.
  writeProfile(
    userId: string,
    data: Partial<Record<(typeof profileFields)[number], string | null>>,
  ) {
    const result: Record<string, string | null> = {};
    for (const field of profileFields) {
      if (data[field] === undefined) {
        continue;
      }
      const value =
        typeof data[field] === 'string' ? data[field].trim() || null : null;
      Object.assign(
        result,
        this.writeField('GuestProfile', userId, field, value),
      );
      result[field] = null;
    }
    return result;
  }

  // Encrypt reservation special requests while preserving the distinction between null
  // and empty text.
  writeNotes(id: string, value: string | null) {
    return {
      ...this.writeField('Reservation', id, 'specialRequests', value),
      specialRequests: null,
    };
  }

  // Only call at an authorized service boundary. Remove envelopes/indexes recursively,
  // including contacts selected through reservation/payment/report relations.
  response<T>(value: T): T & {
    email: string;
    phone: string | null;
    specialRequests: string | null;
  } {
    try {
      return this.map(value) as T & {
        email: string;
        phone: string | null;
        specialRequests: string | null;
      };
    } catch {
      throw new ServiceUnavailableException(
        'Protected information is unavailable. Check encryption keys and migration integrity.',
      );
    }
  }

  // Recursively remove internal envelopes/indexes and restore selected contact, profile,
  // and note values.
  private map(value: unknown): unknown {
    if (value === null || typeof value !== 'object' || value instanceof Date) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.map(item));
    }
    const row = value as EnvelopeRow;
    const result: EnvelopeRow = {};
    for (const [key, entry] of Object.entries(row)) {
      if (!/(Ciphertext|AuthTag|BlindIndex|Iv)$/.test(key)) {
        result[key] = this.map(entry);
      }
    }
    if ('emailCiphertext' in row) {
      Object.assign(result, this.readContacts(row));
    }
    if ('specialRequestsCiphertext' in row) {
      result.specialRequests = this.readField(
        'Reservation',
        String(row.id),
        'specialRequests',
        row,
      );
    }
    if ('addressCiphertext' in row) {
      for (const field of profileFields) {
        result[field] = this.readField(
          'GuestProfile',
          String(row.userId),
          field,
          row,
        );
      }
    }
    return result;
  }
}
