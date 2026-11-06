// Device-only storage for clients, sessions, and programs, kept in the
// browser's localStorage. Nothing here leaves the device. Browser storage can
// be cleared or blocked, so reads fall back to empty and writes report failure
// instead of throwing - callers show the failure rather than losing data silently.

import { CognitionData, Client, Program, SavedSession, Category } from '../types/session';

const STORAGE_KEY = 'cognition.data.v1';

const emptyData = (): CognitionData => ({ version: 1, clients: [], sessions: [], programs: [] });

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isCognitionData(value: unknown): value is CognitionData {
  const data = value as CognitionData;
  return !!data
    && data.version === 1
    && Array.isArray(data.clients)
    && Array.isArray(data.sessions)
    && Array.isArray(data.programs);
}

function load(): CognitionData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return isCognitionData(parsed) ? parsed : emptyData();
  } catch {
    return emptyData();
  }
}

function save(data: CognitionData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// --- Clients ---
export function getClients(): Client[] {
  return load().clients;
}

export function addClient(code: string): Client | null {
  const data = load();
  const trimmed = code.trim();
  if (!trimmed || data.clients.some(c => c.code.toLowerCase() === trimmed.toLowerCase())) return null;
  const client: Client = { id: createId(), code: trimmed };
  data.clients.push(client);
  return save(data) ? client : null;
}

export function deleteClient(clientId: string): boolean {
  const data = load();
  data.clients = data.clients.filter(c => c.id !== clientId);
  data.sessions = data.sessions.filter(s => s.clientId !== clientId);
  data.programs = data.programs.filter(p => p.clientId !== clientId);
  return save(data);
}

// --- Sessions ---
export function getSessions(clientId: string): SavedSession[] {
  return load().sessions
    .filter(s => s.clientId === clientId)
    .sort((a, b) => a.startedAt - b.startedAt);
}

export function saveSession(session: SavedSession): boolean {
  const data = load();
  data.sessions.push(session);
  return save(data);
}

export function deleteSession(sessionId: string): boolean {
  const data = load();
  data.sessions = data.sessions.filter(s => s.id !== sessionId);
  return save(data);
}

// --- Programs ---
export function getProgram(clientId: string, category: Category): Program | null {
  return load().programs.find(p => p.clientId === clientId && p.category === category) ?? null;
}

export function getPrograms(clientId: string): Program[] {
  return load().programs.filter(p => p.clientId === clientId);
}

export function saveProgram(program: Program): boolean {
  const data = load();
  data.programs = [...data.programs.filter(p => p.id !== program.id), program];
  return save(data);
}

export function deleteProgram(programId: string): boolean {
  const data = load();
  data.programs = data.programs.filter(p => p.id !== programId);
  return save(data);
}

// The target moves to maintenance, and the change shows as a phase line.
export function markTargetMastered(program: Program, word: string): Program | null {
  const updated: Program = {
    ...program,
    targets: program.targets.map(t => (t.word === word ? { ...t, status: 'maintenance' as const } : t)),
    events: [...program.events, { at: Date.now(), label: `${word} mastered`, target: word }],
  };
  return saveProgram(updated) ? updated : null;
}

// --- Backup ---
export function exportBackup(): string {
  return JSON.stringify(load(), null, 2);
}

// Replaces everything on this device. Returns false, changing nothing, if the
// file isn't a valid backup.
export function importBackup(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    return isCognitionData(parsed) && save(parsed);
  } catch {
    return false;
  }
}
