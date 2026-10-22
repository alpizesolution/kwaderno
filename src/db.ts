import Dexie, { type Table } from 'dexie';

export interface DiaryEntry {
  id?: number;
  title: string;
  body: string;
  images?: string[];
  tags?: string[];
  mood?: string;
  favorite?: boolean;
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

function assertActiveKey(key: CryptoKey): void {
  if (activeKey !== key) throw new Error('Na-lock ang Kwaderno habang pinoproseso. I-unlock muli bago magpatuloy.');
}

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
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('Invalid base64 data.');
  }
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

export async function getVaultFormatVersion(): Promise<number> {
  const record = await db.vault.get(VAULT_ID);
  return record?.formatVersion ?? 0;
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
    const content = await encryptText(key, JSON.stringify({ title: entry.title, body: entry.body, images: entry.images ?? [], tags: entry.tags ?? [], mood: entry.mood ?? '', favorite: entry.favorite ?? false }));
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
      return original && JSON.stringify([original.updatedAt, original.title, original.body, original.images ?? [], original.tags ?? [], original.mood ?? '', original.favorite ?? false]) === JSON.stringify([entry.updatedAt, entry.title, entry.body, entry.images ?? [], entry.tags ?? [], entry.mood ?? '', entry.favorite ?? false]);
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

export async function listEntries(): Promise<DiaryEntry[]> {
  if (!activeKey) {
    if (await hasVault()) throw new Error('Naka-lock ang Kwaderno. I-unlock muna bago magpatuloy.');
    return db.entries.orderBy('updatedAt').reverse().toArray();
  }
  const key = activeKey;
  const encryptedEntries = await db.encryptedEntries.orderBy('updatedAt').reverse().toArray();
  const entries: DiaryEntry[] = [];

  for (const entry of encryptedEntries) {
    const plaintext = await decryptText(key, entry.iv, entry.ciphertext);
    assertActiveKey(key);
    let decrypted: Pick<DiaryEntry, 'title' | 'body' | 'images' | 'tags' | 'mood' | 'favorite'>;
    try {
      decrypted = JSON.parse(plaintext) as Pick<DiaryEntry, 'title' | 'body' | 'images' | 'tags' | 'mood' | 'favorite'>;
    } catch {
      throw new Error('May sirang encrypted entry. Hindi binago ang naka-save na data.');
    }
    if (!decrypted || typeof decrypted.title !== 'string' || typeof decrypted.body !== 'string' || (decrypted.images !== undefined && (!Array.isArray(decrypted.images) || !decrypted.images.every((image) => typeof image === 'string')))) {
      throw new Error('May invalid na encrypted entry. Hindi binago ang naka-save na data.');
    }
    entries.push({
      id: entry.id,
      title: decrypted.title,
      body: decrypted.body,
      images: decrypted.images ?? [],
      tags: Array.isArray(decrypted.tags) ? decrypted.tags : [],
      mood: typeof decrypted.mood === 'string' ? decrypted.mood : '',
      favorite: decrypted.favorite === true,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }
  assertActiveKey(key);
  return entries;
}

export async function saveEntry(
  entry: Pick<DiaryEntry, 'title' | 'body' | 'images' | 'tags' | 'mood' | 'favorite'>,
  id?: number,
): Promise<number> {
  const now = new Date().toISOString();
  if (!activeKey) {
    if (await hasVault()) throw new Error('Naka-lock ang Kwaderno. I-unlock muna bago magpatuloy.');
    const plainEntry = { title: entry.title.trim(), body: entry.body.trim(), images: entry.images ?? [], tags: entry.tags ?? [], mood: entry.mood ?? '', favorite: entry.favorite ?? false, updatedAt: now };
    if (await hasVault()) throw new Error('May Kandadong Kwaderno nang naka-set up. I-unlock muna bago magpatuloy.');
    if (id !== undefined) {
      const existing = await db.entries.get(id);
      if (!existing) throw new Error('Hindi na makita ang pahinang ine-edit. I-refresh ang listahan at subukan ulit.');
      await db.entries.update(id, plainEntry);
      return id;
    }
    return db.entries.add({ ...plainEntry, createdAt: now });
  }
  const key = activeKey;
  const content = await encryptText(key, JSON.stringify({
    title: entry.title.trim(),
    body: entry.body.trim(),
    images: entry.images ?? [],
    tags: entry.tags ?? [],
    mood: entry.mood ?? '',
    favorite: entry.favorite ?? false,
  }));

  assertActiveKey(key);
  if (id !== undefined) {
    const existing = await db.encryptedEntries.get(id);
    if (!existing) throw new Error('Hindi na makita ang pahinang ine-edit. I-refresh ang listahan at subukan ulit.');
    assertActiveKey(key);
    await db.encryptedEntries.update(id, {
      ...content,
      updatedAt: now,
    });
    return id;
  }

  assertActiveKey(key);
  const newId = await db.encryptedEntries.add({
    ...content,
    createdAt: now,
    updatedAt: now,
  });
  return newId;
}

export async function deleteEntry(id: number): Promise<void> {
  if (!activeKey) {
    if (await hasVault()) throw new Error('Naka-lock ang Kwaderno. I-unlock muna bago magpatuloy.');
    await db.entries.delete(id);
    return;
  }
  await db.encryptedEntries.delete(id);
}

const BACKUP_FORMAT = 'kwaderno-backup';
const BACKUP_VERSION = 1;
const BACKUP_ITERATIONS = 600_000;

export async function exportBackup(password: string): Promise<string> {
  if (password.length < 8) throw new Error('Gumamit ng backup password na hindi bababa sa 8 character.');
  const vaultKeyAtStart = activeKey;
  const entries = await listEntries();
  if (activeKey !== vaultKeyAtStart) {
    throw new Error('Nagbago ang lock state habang ginagawa ang backup. Walang na-download na backup; i-unlock at subukang muli.');
  }
  const payload = { format: BACKUP_FORMAT, version: BACKUP_VERSION, entries };
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt, BACKUP_ITERATIONS);
  const ciphertext = await requireCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: 128 }, key,
    toArrayBuffer(encoder.encode(JSON.stringify(payload))),
  );
  if (activeKey !== vaultKeyAtStart) {
    throw new Error('Nagbago ang lock state habang ginagawa ang backup. Walang na-download na backup; i-unlock at subukang muli.');
  }
  return JSON.stringify({
    format: BACKUP_FORMAT, version: BACKUP_VERSION, kdf: 'PBKDF2-SHA-256',
    iterations: BACKUP_ITERATIONS, salt: toBase64(salt), iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)), createdAt: new Date().toISOString(),
  }, null, 2);
}

export async function importBackup(text: string, password: string): Promise<{ imported: number; skipped: number }> {
  if (text.length > 100 * 1024 * 1024) throw new Error('Lampas 100 MB ang backup file.');
  let envelope: any;
  try { envelope = JSON.parse(text); } catch { throw new Error('Hindi mabasa ang backup file.'); }
  if (envelope?.format !== BACKUP_FORMAT || envelope?.version !== BACKUP_VERSION ||
      envelope?.kdf !== 'PBKDF2-SHA-256' || !Number.isInteger(envelope?.iterations) ||
      envelope.iterations < 100_000 || envelope.iterations > 2_000_000 ||
      typeof envelope.salt !== 'string' || typeof envelope.iv !== 'string' || typeof envelope.ciphertext !== 'string' ||
      envelope.salt.length > 64 || envelope.iv.length > 32 || envelope.ciphertext.length > 140 * 1024 * 1024) {
    throw new Error('Hindi suportado o sira ang backup file.');
  }
  let payload: any;
  try {
    const key = await deriveKey(password, fromBase64(envelope.salt), envelope.iterations);
    const plain = await requireCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(fromBase64(envelope.iv)), tagLength: 128 },
      key, toArrayBuffer(fromBase64(envelope.ciphertext)),
    );
    payload = JSON.parse(decoder.decode(plain));
  } catch { throw new Error('Hindi mabuksan ang backup. Suriin ang backup password at file.'); }
  if (payload?.format !== BACKUP_FORMAT || payload?.version !== BACKUP_VERSION || !Array.isArray(payload.entries) || payload.entries.length > 100_000) {
    throw new Error('Hindi valid ang laman ng backup.');
  }
  const incoming = payload.entries.map((entry: any) => {
    if (!entry || typeof entry.title !== 'string' || entry.title.length > 20_000 ||
      typeof entry.body !== 'string' || entry.body.length > 2_000_000 ||
      (entry.tags !== undefined && (!Array.isArray(entry.tags) || entry.tags.length > 10 || !entry.tags.every((tag: unknown) => typeof tag === 'string' && tag.length <= 30))) ||
      (entry.mood !== undefined && (typeof entry.mood !== 'string' || entry.mood.length > 40)) ||
      (entry.favorite !== undefined && typeof entry.favorite !== 'boolean') ||
      !Array.isArray(entry.images) || entry.images.length > 5 ||
      !entry.images.every((image: unknown) =>
        typeof image === 'string' && image.length <= 20 * 1024 * 1024 &&
        /^data:image\/(?:jpeg|png|webp|gif|avif);base64,/i.test(image)) ||
      typeof entry.createdAt !== 'string' || Number.isNaN(Date.parse(entry.createdAt)) ||
      typeof entry.updatedAt !== 'string' || Number.isNaN(Date.parse(entry.updatedAt))) {
      throw new Error('May entry na hindi valid. Walang na-import.');
    }
    return { title: entry.title, body: entry.body, images: entry.images as string[], tags: (entry.tags ?? []) as string[], mood: (entry.mood ?? '') as string, favorite: entry.favorite === true, createdAt: entry.createdAt, updatedAt: entry.updatedAt };
  });
  const vaultKeyAtStart = activeKey;
  const current = await listEntries();
  if (activeKey !== vaultKeyAtStart) {
    throw new Error('Nagbago ang lock state habang binubuksan ang backup. Walang na-import; i-unlock at subukang muli.');
  }
  const fingerprint = (e: DiaryEntry) => JSON.stringify([e.title, e.body, e.images ?? [], e.tags ?? [], e.mood ?? '', e.favorite ?? false, e.createdAt, e.updatedAt]);
  const seen = new Set(current.map(fingerprint));
  const unique = incoming.filter((entry: DiaryEntry) => {
    const key = fingerprint(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const key = activeKey;
  if (key !== vaultKeyAtStart) {
    throw new Error('Nagbago ang lock state habang naghahanda ng restore. Walang na-import; i-unlock at subukang muli.');
  }
  const plainRows: DiaryEntry[] = [];
  const encryptedRows: EncryptedEntry[] = [];
  for (const entry of unique) {
    if (key) {
      const encrypted = await encryptText(key, JSON.stringify({ title: entry.title, body: entry.body, images: entry.images, tags: entry.tags ?? [], mood: entry.mood ?? '', favorite: entry.favorite ?? false }));
      assertActiveKey(key);
      encryptedRows.push({ ...encrypted, createdAt: entry.createdAt, updatedAt: entry.updatedAt });
    } else plainRows.push(entry);
  }
  await db.transaction('rw', db.entries, db.encryptedEntries, db.vault, async () => {
    const vault = await db.vault.get(VAULT_ID);
    if (Boolean(vault) !== Boolean(key)) throw new Error('Nagbago ang lock state. Walang na-import; i-refresh at subukan ulit.');
    if (key) assertActiveKey(key);
    if (key && encryptedRows.length) {
      await db.encryptedEntries.bulkAdd(encryptedRows);
      assertActiveKey(key);
    }
    if (!key && plainRows.length) await db.entries.bulkAdd(plainRows);
  });
  return { imported: unique.length, skipped: incoming.length - unique.length };
}
