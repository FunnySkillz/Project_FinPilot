import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_RECORD_KEY = 'finpilot_app_lock_pin_v1';
const LOCKOUT_AFTER_FAILURES = 5;
const LOCKOUT_DURATION_MS = 30_000;

export type PinRecord = {
  saltHex: string;
  hashHex: string;
  failedAttempts: number;
  lockUntilEpochMs: number | null;
};

export type PinVerifyResult = {
  success: boolean;
  lockedUntilEpochMs: number | null;
  remainingAttempts: number;
};

export function isValidPin(pin: string) {
  return /^[0-9]{4,6}$/.test(pin);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPin(saltHex: string, pin: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${saltHex}:${pin}`);
}

async function readRecord(): Promise<PinRecord | null> {
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    return null;
  }

  const stored = await SecureStore.getItemAsync(PIN_RECORD_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as PinRecord;
  } catch {
    return null;
  }
}

async function writeRecord(record: PinRecord) {
  await SecureStore.setItemAsync(PIN_RECORD_KEY, JSON.stringify(record));
}

export const pinAuthService = {
  async isSecureStoreAvailable() {
    return SecureStore.isAvailableAsync();
  },

  async hasPinRecordAsync() {
    return Boolean(await readRecord());
  },

  async setPinAsync(pin: string) {
    if (!isValidPin(pin)) {
      throw new Error('PIN must be 4 to 6 digits.');
    }

    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      throw new Error('Secure storage is not available on this platform.');
    }

    const saltHex = bytesToHex(Crypto.getRandomBytes(16));
    const hashHex = await hashPin(saltHex, pin);

    await writeRecord({
      saltHex,
      hashHex,
      failedAttempts: 0,
      lockUntilEpochMs: null,
    });
  },

  async verifyPinAsync(pin: string): Promise<PinVerifyResult> {
    const record = await readRecord();
    if (!record) {
      return { success: false, lockedUntilEpochMs: null, remainingAttempts: 0 };
    }

    const now = Date.now();
    if (record.lockUntilEpochMs && record.lockUntilEpochMs > now) {
      return {
        success: false,
        lockedUntilEpochMs: record.lockUntilEpochMs,
        remainingAttempts: 0,
      };
    }

    const hashHex = await hashPin(record.saltHex, pin);
    if (hashHex === record.hashHex) {
      await writeRecord({ ...record, failedAttempts: 0, lockUntilEpochMs: null });
      return {
        success: true,
        lockedUntilEpochMs: null,
        remainingAttempts: LOCKOUT_AFTER_FAILURES,
      };
    }

    const failedAttempts = record.failedAttempts + 1;
    const locked = failedAttempts >= LOCKOUT_AFTER_FAILURES;
    const nextRecord = {
      ...record,
      failedAttempts: locked ? 0 : failedAttempts,
      lockUntilEpochMs: locked ? now + LOCKOUT_DURATION_MS : null,
    };
    await writeRecord(nextRecord);

    return {
      success: false,
      lockedUntilEpochMs: nextRecord.lockUntilEpochMs,
      remainingAttempts: locked ? 0 : Math.max(0, LOCKOUT_AFTER_FAILURES - failedAttempts),
    };
  },

  async clearPinAsync() {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      try {
        await SecureStore.deleteItemAsync(PIN_RECORD_KEY);
      } catch {
        // Missing records can be treated as already cleared.
      }
    }
  },
};
