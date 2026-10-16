import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import type { Prisma } from '../generated/prisma/client';

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
export const profileFields = [
  'address',
  'city',
  'province',
  'postalCode',
  'emergencyContactName',
  'emergencyContactPhone',
] as const;
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
// Match the existing identity rules: no inferred country code or punctuation removal.
export const normalizePhone = (value: string) => value.trim();
type EnvelopeRow = Record<string, unknown>;

@Injectable()
export class PrivateDataService {
  constructor(private readonly encryption: EncryptionService) {}

  index(field: 'email' | 'phone', value: string) {
    return this.encryption.blindIndex(
      field,
      field === 'email' ? normalizeEmail(value) : normalizePhone(value),
    );
  }

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

  private context(model: string, id: string, field: string) {
    return JSON.stringify(['condotel', 'private-data', 1, model, id, field]);
  }

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

  readField(
    model: string,
    id: string,
    field: string,
    row: EnvelopeRow,
  ): string | null {
    const ciphertext = row[`${field}Ciphertext`],
      iv = row[`${field}Iv`],
      authTag = row[`${field}AuthTag`];
    if ([ciphertext, iv, authTag].every((value) => value === null)) return null;
    if (
      typeof ciphertext !== 'string' ||
      typeof iv !== 'string' ||
      typeof authTag !== 'string'
    )
      throw new Error('Incomplete encrypted value.');
    return this.encryption.decrypt(
      { ciphertext, iv, authTag },
      this.context(model, id, field),
    );
  }

  writeContacts(id: string, data: { email?: string; phone?: string | null }) {
    const result: Record<string, string | null> = {};
    for (const field of ['email', 'phone'] as const) {
      if (data[field] === undefined) continue;
      const value =
        data[field] === null
          ? null
          : field === 'email'
            ? normalizeEmail(data[field]!)
            : normalizePhone(data[field]!);
      if (field === 'email' && !value) throw new Error('Email is required.');
      Object.assign(result, this.writeField('User', id, field, value || null));
      result[`${field}BlindIndex`] = value ? this.index(field, value) : null;
      result[field] = null;
    }
    return result;
  }

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
    )
      throw new Error('Contact integrity verification failed.');
    return { email, phone };
  }

  writeProfile(
    userId: string,
    data: Partial<Record<(typeof profileFields)[number], string | null>>,
  ) {
    const result: Record<string, string | null> = {};
    for (const field of profileFields) {
      if (data[field] === undefined) continue;
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

  private map(value: unknown): unknown {
    if (value === null || typeof value !== 'object' || value instanceof Date)
      return value;
    if (Array.isArray(value)) return value.map((item) => this.map(item));
    const row = value as EnvelopeRow;
    const result: EnvelopeRow = {};
    for (const [key, entry] of Object.entries(row)) {
      if (!/(Ciphertext|AuthTag|BlindIndex|Iv)$/.test(key))
        result[key] = this.map(entry);
    }
    if ('emailCiphertext' in row) Object.assign(result, this.readContacts(row));
    if ('specialRequestsCiphertext' in row)
      result.specialRequests = this.readField(
        'Reservation',
        String(row.id),
        'specialRequests',
        row,
      );
    if ('addressCiphertext' in row)
      for (const field of profileFields)
        result[field] = this.readField(
          'GuestProfile',
          String(row.userId),
          field,
          row,
        );
    return result;
  }
}
