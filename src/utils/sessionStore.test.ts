import { SavedSession } from '../types/session';
import {
  addClient, deleteClient, exportBackup, getClients, getSessions, importBackup, saveSession,
} from './sessionStore';

const session = (clientId: string, startedAt: number): SavedSession => ({
  id: `s${startedAt}`,
  clientId,
  tool: 'sortByCategories',
  startedAt,
  endedAt: startedAt,
  completed: true,
  trials: [],
});

beforeEach(() => localStorage.clear());

test('rejects blank and duplicate client codes, ignoring case', () => {
  expect(addClient('  ')).toBeNull();
  expect(addClient('A1')).not.toBeNull();
  expect(addClient('a1')).toBeNull();
  expect(getClients()).toHaveLength(1);
});

test('keeps sessions separate per client, oldest first', () => {
  saveSession(session('a', 2));
  saveSession(session('b', 3));
  saveSession(session('a', 1));
  expect(getSessions('a').map(s => s.startedAt)).toEqual([1, 2]);
});

test('deleting a client removes only that client\'s sessions', () => {
  const a = addClient('A1')!;
  const b = addClient('B2')!;
  saveSession(session(a.id, 1));
  saveSession(session(b.id, 2));
  deleteClient(a.id);
  expect(getSessions(a.id)).toEqual([]);
  expect(getSessions(b.id)).toHaveLength(1);
});

test('a backup restores everything, and a bad file changes nothing', () => {
  const a = addClient('A1')!;
  saveSession(session(a.id, 1));
  const backup = exportBackup();
  localStorage.clear();
  expect(importBackup('not json')).toBe(false);
  expect(importBackup('{"version":99}')).toBe(false);
  expect(getClients()).toEqual([]);
  expect(importBackup(backup)).toBe(true);
  expect(getSessions(a.id)).toHaveLength(1);
});

test('corrupted storage reads as empty instead of crashing', () => {
  localStorage.setItem('cognition.data.v1', '{oops');
  expect(getClients()).toEqual([]);
});
