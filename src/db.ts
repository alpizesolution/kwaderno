import Dexie, { type Table } from 'dexie';

export interface DiaryEntry {
  id?: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface EncryptedEntry {
  id?: number;
  iv: string;
  ciphertext: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultRecord {
  id: 'main';
  salt: string;
  iterations: number;
  verifierIv: string;
  verifierCiphertext: string;
  createdAt: string;
  formatVersion: 1 | 2;
}

class KwadernoDatabase extends Dexie {
  entries!: Table<DiaryEntry, number>;
  encryptedEntries!: Table<EncryptedEntry, number>;
  vault!: Table<VaultRecord, string>;

  constructor() {
    super('KwadernoDatabase');
    this.version(1).stores({
      entries: '++id, createdAt, updatedAt',
    });
    this.version(2).stores({
      entries: '++id, createdAt, updatedAt',
      encryptedEntries: '++id, createdAt, updatedAt',
      vault: 'id',
    });
  }
}

export const db = new KwadernoDatabase();

const VAULT_ID = 'main' as const;
const PBKDF2_ITERATIONS = 600_000;
const CHECK_TEXT = 'kwaderno-vault-check:v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let activeKey: CryptoKey | null = null;

function requireCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('Hindi available ang secure encryption sa browser na ito. Gumamit ng updated browser sa HTTPS.');
  }
  return globalThis.crypto;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer as ArrayBuffer;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  requireCrypto().getRandomValues(bytes);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const subtle = requireCrypto().subtle;
  const material = await subtle.importKey('raw', toArrayBuffer(encoder.encode(passphrase)), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptText(key: CryptoKey, plaintext: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = randomBytes(12);
  const ciphertext = await requireCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoder.encode(plaintext)),
  );
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

async function decryptText(key: CryptoKey, iv: string, ciphertext: string): Promise<string> {
  const plaintext = await requireCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(fromBase64(iv)), tagLength: 128 },
    key,
    toArrayBuffer(fromBase64(ciphertext)),
  );
  return decoder.decode(plaintext);
}

export async function hasVault(): Promise<boolean> {
  return Boolean(await db.vault.get(VAULT_ID));
}

/**
 * Creates the vault and migrates any existing plaintext entries in one
 * IndexedDB transaction. If encryption or the transaction fails, legacy
 * entries are left untouched.
 */
export async function createVault(passphrase: string): Promise<void> {
  requireCrypto();
  if (!/^\d{6}$/.test(passphrase)) throw new Error('Gumamit ng eksaktong 6-digit PIN.');
  if (await hasVault()) throw new Error('May Kandadong Kwaderno na. I-unlock muna ito.');

  const salt = randomBytes(16);
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const verifier = await encryptText(key, CHECK_TEXT);
  const legacyEntries = await db.entries.toArray();

  const encrypted: EncryptedEntry[] = [];
  for (const entry of legacyEntries) {
    if (entry.id === undefined) throw new Error('May pahinang walang ID. Walang binagong entry; subukang muli.');
    const content = await encryptText(key, JSON.stringify({ title: entry.title, body: entry.body }));
    encrypted.push({
      id: entry.id,
      ...content,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }

  const vaultRecord: VaultRecord = {
    id: VAULT_ID,
    salt: toBase64(salt),
    iterations: PBKDF2_ITERATIONS,
    verifierIv: verifier.iv,
    verifierCiphertext: verifier.ciphertext,
    createdAt: new Date().toISOString(),
    formatVersion: 2,
  };

  await db.transaction('rw', db.entries, db.encryptedEntries, db.vault, async () => {
    if (await db.vault.get(VAULT_ID)) throw new Error('May nag-set up na ng vault. I-refresh at i-unlock ito.');
    const current = await db.entries.toArray();
    const unchanged = current.length === legacyEntries.length && current.every((entry) => {
      const original = legacyEntries.find((candidate) => candidate.id === entry.id);
      return original && original.updatedAt === entry.updatedAt && original.title === entry.title && original.body === entry.body;
    });
    if (!unchanged) throw new Error('May nagbago sa mga pahina habang nagse-set up. Walang tinanggal; i-refresh at subukang muli.');

    if (encrypted.length) await db.encryptedEntries.bulkPut(encrypted);
    await db.vault.add(vaultRecord);
    await db.entries.clear();
  });

  activeKey = key;
}

export async function unlockVault(passphrase: string): Promise<void> {
  requireCrypto();
  const record = await db.vault.get(VAULT_ID);
  if (!record) throw new Error('Wala pang vault. I-set up ang Kandadong Kwaderno.');
  if (record.formatVersion >= 2 && !/^\d{6}$/.test(passphrase)) {
    throw new Error('Ilagay ang iyong 6-digit PIN.');
  }
  const key = await deriveKey(passphrase, fromBase64(record.salt), record.iterations);
  try {
    const check = await decryptText(key, record.verifierIv, record.verifierCiphertext);
    if (check !== CHECK_TEXT) throw new Error('Maling passphrase.');
  } catch {
    activeKey = null;
    throw new Error('Hindi tumugma ang passphrase. Subukan ulit.');
  }
  activeKey = key;
}

export function lockVault(): void {
  activeKey = null;
}

function requireUnlockedKey(): CryptoKey {
  if (!activeKey) throw new Error('Naka-lock ang Kwaderno. I-unlock muna bago magpatuloy.');
  return activeKey;
}

export async function listEntries(): Promise<DiaryEntry[]> {
  const key = requireUnlockedKey();
  const encryptedEntries = await db.encryptedEntries.orderBy('updatedAt').reverse().toArray();
  const entries: DiaryEntry[] = [];

  for (const entry of encryptedEntries) {
    const decrypted = JSON.parse(await decryptText(key, entry.iv, entry.ciphertext)) as Pick<DiaryEntry, 'title' | 'body'>;
    entries.push({
      id: entry.id,
      title: decrypted.title,
      body: decrypted.body,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }
  return entries;
}

export async function saveEntry(
  entry: Pick<DiaryEntry, 'title' | 'body'>,
  id?: number,
): Promise<number> {
  const key = requireUnlockedKey();
  const now = new Date().toISOString();
  const content = await encryptText(key, JSON.stringify({
    title: entry.title.trim(),
    body: entry.body.trim(),
  }));

  if (id !== undefined) {
    const existing = await db.encryptedEntries.get(id);
    if (!existing) throw new Error('Hindi na makita ang pahinang ine-edit. I-refresh ang listahan at subukan ulit.');
    await db.encryptedEntries.update(id, {
      ...content,
      updatedAt: now,
    });
    return id;
  }

  return db.encryptedEntries.add({
    ...content,
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteEntry(id: number): Promise<void> {
  requireUnlockedKey();
  await db.encryptedEntries.delete(id);
}
