// Persistencia de sesión. En web usa localStorage; en otros entornos cae a
// memoria (suficiente para el MVP, cuyo objetivo de demo es la web).

export type Player = { id: string; name: string };
export type Owner = {
  id: string;
  name: string;
  status: 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO';
};

const KEY_TOKEN = 'spot.token';
const KEY_PLAYER = 'spot.player';
const KEY_OWNER = 'spot.owner';

let memToken: string | undefined;
let memPlayer: Player | undefined;
let memOwner: Owner | undefined;

const ls: Storage | undefined =
  typeof globalThis !== 'undefined' && (globalThis as any).localStorage
    ? (globalThis as any).localStorage
    : undefined;

export function getToken(): string | undefined {
  if (memToken) return memToken;
  return ls?.getItem(KEY_TOKEN) ?? undefined;
}

export function getPlayer(): Player | undefined {
  if (memPlayer) return memPlayer;
  const raw = ls?.getItem(KEY_PLAYER);
  return raw ? (JSON.parse(raw) as Player) : undefined;
}

export function getOwner(): Owner | undefined {
  if (memOwner) return memOwner;
  const raw = ls?.getItem(KEY_OWNER);
  return raw ? (JSON.parse(raw) as Owner) : undefined;
}

export function saveSession(token: string, player: Player): void {
  memToken = token;
  memPlayer = player;
  memOwner = undefined;
  ls?.setItem(KEY_TOKEN, token);
  ls?.setItem(KEY_PLAYER, JSON.stringify(player));
  ls?.removeItem(KEY_OWNER);
}

export function saveOwnerSession(token: string, owner: Owner): void {
  memToken = token;
  memOwner = owner;
  memPlayer = undefined;
  ls?.setItem(KEY_TOKEN, token);
  ls?.setItem(KEY_OWNER, JSON.stringify(owner));
  ls?.removeItem(KEY_PLAYER);
}

export function clearSession(): void {
  memToken = undefined;
  memPlayer = undefined;
  memOwner = undefined;
  ls?.removeItem(KEY_TOKEN);
  ls?.removeItem(KEY_PLAYER);
  ls?.removeItem(KEY_OWNER);
}
