const SIMULATOR_ACCESS_COOKIE = "leanstorming_sim_access";
const SIMULATOR_ACCESS_VALUE = "accepted";
const SIMULATOR_ACCESS_CODE = "LEAN";
const SIMULATOR_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const cookie of cookies) {
    const [rawKey, ...rawValueParts] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValueParts.join("="));
    }
  }

  return null;
}

export function hasSimulatorAccess(): boolean {
  return readCookieValue(SIMULATOR_ACCESS_COOKIE) === SIMULATOR_ACCESS_VALUE;
}

export function validateSimulatorAccessCode(input: string): boolean {
  return input.trim().toUpperCase() === SIMULATOR_ACCESS_CODE;
}

export function grantSimulatorAccess(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${SIMULATOR_ACCESS_COOKIE}=${encodeURIComponent(SIMULATOR_ACCESS_VALUE)}`,
    `Max-Age=${SIMULATOR_ACCESS_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax"
  ].join("; ");
}
