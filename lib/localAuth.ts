/**
 * Local Device Authentication Utility using the Web Authentication API (WebAuthn / Passkeys)
 * Provides biometric/PIN verification using the native OS prompt (Windows Hello, FaceID, TouchID, Android Screen Lock).
 */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const STORAGE_KEY = 'accessories_exclusif_device_cred_id';

export const localAuth = {
  /**
   * Check if the device / browser supports platform authenticators with user verification (biometrics / PIN / passcode)
   */
  async isSupported(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false;
    }
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  },

  /**
   * Check if this device has already registered a local verification credential
   */
  isDeviceRegistered(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEY);
  },

  /**
   * Register the device by prompting the user for their biometrics/PIN
   */
  async registerDevice(email: string = 'admin@exclusif.cm'): Promise<boolean> {
    const isAvail = await this.isSupported();
    if (!isAvail) {
      throw new Error("L'authentification par empreinte/FaceID/PIN n'est pas disponible ou désactivée sur cet appareil.");
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "Accessoires Exclusifs Payout Protection",
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: email,
          displayName: "Gestionnaire de Virement"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256 (ECDSA)
          { type: "public-key", alg: -257 }  // RS256 (RSA)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000
      }
    })) as PublicKeyCredential;

    if (credential?.rawId) {
      const base64Id = arrayBufferToBase64(credential.rawId);
      localStorage.setItem(STORAGE_KEY, base64Id);
      return true;
    }

    return false;
  },

  /**
   * Prompt the user for biometric / PIN authentication
   */
  async verifyUser(): Promise<boolean> {
    const base64Id = localStorage.getItem(STORAGE_KEY);
    if (!base64Id) {
      throw new Error("Aucun appareil enregistré. Veuillez l'enregistrer d'abord.");
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credId = base64ToArrayBuffer(base64Id);

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
          id: credId,
          type: "public-key"
        }],
        userVerification: "required",
        timeout: 60000
      }
    })) as PublicKeyCredential;

    return !!assertion;
  },

  /**
   * Reset / clear local registration
   */
  clearRegistration(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
