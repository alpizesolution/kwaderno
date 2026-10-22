import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, createVault, deleteEntry, exportBackup, importBackup, listEntries, lockVault, saveEntry, unlockVault } from './db';

const sampleEntry = {
  title: 'Araw sa hardin',
  body: 'Tahimik ang umaga.',
  images: ['data:image/png;base64,aGVsbG8='],
  tags: ['personal', 'umaga'],
  mood: 'Payapa',
  favorite: true,
};

beforeEach(async () => {
  lockVault();
  await db.delete();
});

afterEach(async () => {
  lockVault();
  await db.delete();
});

describe('Kwadernoko local data safety', () => {
  it('saves and edits entries in local-only mode', async () => {
    const id = await saveEntry(sampleEntry);
    await saveEntry({ ...sampleEntry, title: 'Na-edit na pahina' }, id);

    const entries = await listEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ ...sampleEntry, title: 'Na-edit na pahina', id });
  });

  it('migrates plaintext entries into encrypted storage when creating a vault', async () => {
    const id = await saveEntry(sampleEntry);

    await createVault('123456');

    expect(await db.entries.count()).toBe(0);
    const encryptedRows = await db.encryptedEntries.toArray();
    expect(encryptedRows).toHaveLength(1);
    expect(JSON.stringify(encryptedRows)).not.toContain(sampleEntry.title);
    expect(JSON.stringify(encryptedRows)).not.toContain(sampleEntry.body);

    const entries = await listEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ ...sampleEntry, id });
  });

  it('blocks reading, saving, and deleting encrypted entries while locked', async () => {
    const id = await saveEntry(sampleEntry);
    await createVault('123456');
    lockVault();

    await expect(listEntries()).rejects.toThrow(/Naka-lock/);
    await expect(saveEntry({ ...sampleEntry, title: 'Hindi dapat ma-save' }, id)).rejects.toThrow(/Naka-lock/);
    await expect(deleteEntry(id)).rejects.toThrow(/Naka-lock/);
    expect(await db.encryptedEntries.count()).toBe(1);

    await unlockVault('123456');
    expect((await listEntries())[0].title).toBe(sampleEntry.title);
  });

  it('restores an encrypted backup without duplicating identical entries', async () => {
    await saveEntry(sampleEntry);
    await createVault('123456');
    const backup = await exportBackup('backup-pass-123');

    const [entry] = await listEntries();
    await deleteEntry(entry.id!);
    expect(await listEntries()).toHaveLength(0);

    const firstRestore = await importBackup(backup, 'backup-pass-123');
    expect(firstRestore).toEqual({ imported: 1, skipped: 0 });
    expect(await listEntries()).toHaveLength(1);

    const secondRestore = await importBackup(backup, 'backup-pass-123');
    expect(secondRestore).toEqual({ imported: 0, skipped: 1 });
    expect(await listEntries()).toHaveLength(1);
  });

  it('rejects an incorrect backup password without changing saved entries', async () => {
    await saveEntry(sampleEntry);
    await createVault('123456');
    const backup = await exportBackup('backup-pass-123');
    await saveEntry({ ...sampleEntry, title: 'Existing entry' });

    const before = await listEntries();
    await expect(importBackup(backup, 'wrong-password')).rejects.toThrow(/backup password|backup file/i);
    expect(await listEntries()).toEqual(before);
  });

  it('rejects malformed backup input without changing saved entries', async () => {
    await saveEntry(sampleEntry);
    await createVault('123456');
    const before = await listEntries();

    await expect(importBackup('{not json', 'backup-pass-123')).rejects.toThrow(/Hindi mabasa/);
    await expect(importBackup(JSON.stringify({ format: 'other', version: 1 }), 'backup-pass-123')).rejects.toThrow(/Hindi suportado/);
    expect(await listEntries()).toEqual(before);
  });
});
