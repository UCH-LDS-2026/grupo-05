// Persistencia de sesión. En web usa localStorage; en otros entornos cae a
// memoria (suficiente para el MVP, cuyo objetivo de demo es la web).

export type Player = { id: string; name: string };

const KEY_TOKEN = 'spot.token';
const KEY_PLAYER = 'spot.player';

let memToken: string | undefined;
let memPlayer: Player | undefined;

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

export function saveSession(token: string, player: Player): void {
  memToken = token;
  memPlayer = player;
  ls?.setItem(KEY_TOKEN, token);
  ls?.setItem(KEY_PLAYER, JSON.stringify(player));
}

export function clearSession(): void {
  memToken = undefined;
  memPlayer = undefined;
  ls?.removeItem(KEY_TOKEN);
  ls?.removeItem(KEY_PLAYER);
}
