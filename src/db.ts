import Dexie, { type Table } from 'dexie';

export interface DiaryEntry {
  id?: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

class KwadernoDatabase extends Dexie {
  entries!: Table<DiaryEntry, number>;

  constructor() {
    super('KwadernoDatabase');
    this.version(1).stores({
      entries: '++id, createdAt, updatedAt',
    });
  }
}

export const db = new KwadernoDatabase();

export async function listEntries(): Promise<DiaryEntry[]> {
  return db.entries.orderBy('updatedAt').reverse().toArray();
}

export async function saveEntry(
  entry: Pick<DiaryEntry, 'title' | 'body'>,
  id?: number,
): Promise<number> {
  const now = new Date().toISOString();

  if (id !== undefined) {
    const existing = await db.entries.get(id);
    if (!existing) {
      throw new Error('Hindi na makita ang pahinang ine-edit. I-refresh ang listahan at subukan ulit.');
    }

    await db.entries.update(id, {
      title: entry.title.trim(),
      body: entry.body.trim(),
      updatedAt: now,
    });
    return id;
  }

  return db.entries.add({
    title: entry.title.trim(),
    body: entry.body.trim(),
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteEntry(id: number): Promise<void> {
  await db.entries.delete(id);
}
