import { useState, useEffect, useCallback } from 'react';

export type BiometricType = 'touchID' | 'faceID' | 'windowsHello' | 'android' | 'biometric';

export interface WebAuthnState {
  isSupported: boolean;
  isPlatformAuthenticatorAvailable: boolean;
  isAuthenticating: boolean;
  isEnrolled: boolean;
  credentialId: string | null;
  error: string | null;
  biometricType: BiometricType;
  biometricLabel: string;
}

// Helper to convert ArrayBuffer to base64url string
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to convert base64url string to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  let str = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const STORAGE_KEY = 'securechat_webauthn_credential_id';

/**
 * Web Authentication API (WebAuthn / navigator.credentials) Hook
 * Enables hardware-backed biometric authentication (Touch ID, Face ID, Windows Hello, Android Biometrics)
 * for secure application unlocking.
 */
export function useWebAuthn(userId: string, userName: string) {
  const [state, setState] = useState<WebAuthnState>({
    isSupported: false,
    isPlatformAuthenticatorAvailable: false,
    isAuthenticating: false,
    isEnrolled: false,
    credentialId: null,
    error: null,
    biometricType: 'biometric',
    biometricLabel: 'Device Biometric Authenticator',
  });

  // Check hardware and platform biometric capabilities
  useEffect(() => {
    async function checkSupport() {
      const hasWebAuthn = typeof window !== 'undefined' && Boolean(window.PublicKeyCredential) && Boolean(navigator.credentials);
      let hasPlatformAuth = false;

      if (hasWebAuthn && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        try {
          hasPlatformAuth = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
          hasPlatformAuth = false;
        }
      }

      // Infer biometric branding by user-agent and OS
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      let bioType: BiometricType = 'biometric';
      let bioLabel = 'Biometric Authenticator';

      if (ua.includes('iphone') || ua.includes('ipad')) {
        bioType = 'faceID';
        bioLabel = 'Apple Face ID / Touch ID';
      } else if (ua.includes('macintosh') || ua.includes('mac os')) {
        bioType = 'touchID';
        bioLabel = 'Touch ID';
      } else if (ua.includes('windows')) {
        bioType = 'windowsHello';
        bioLabel = 'Windows Hello (Face / Fingerprint)';
      } else if (ua.includes('android')) {
        bioType = 'android';
        bioLabel = 'Android Fingerprint / Face';
      } else {
        bioType = 'biometric';
        bioLabel = 'Platform Biometrics (WebAuthn)';
      }

      const storedCred = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

      setState({
        isSupported: hasWebAuthn,
        isPlatformAuthenticatorAvailable: hasPlatformAuth,
        isAuthenticating: false,
        isEnrolled: Boolean(storedCred),
        credentialId: storedCred,
        error: null,
        biometricType: bioType,
        biometricLabel: bioLabel,
      });
    }

    checkSupport();
  }, []);

  /**
   * Enroll a new platform biometric credential using navigator.credentials.create
   */
  const enroll = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.credentials || !window.PublicKeyCredential) {
      setState((prev) => ({
        ...prev,
        error: 'Web Authentication API is not supported in this browser.',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Extract clean rpId if valid
      let rpId: string | undefined = undefined;
      if (window.location.hostname && !window.location.hostname.includes(':') && window.location.hostname !== 'localhost') {
        rpId = window.location.hostname;
      }

      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: 'SecureChat E2EE Communications',
            ...(rpId ? { id: rpId } : {}),
          },
          user: {
            id: new TextEncoder().encode(userId || 'securechat_user_' + Date.now()),
            name: userName || 'Scholar',
            displayName: userName || 'SecureChat Scholar',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Hardware platform sensor (Touch ID, Windows Hello, Android Biometrics)
            userVerification: 'preferred',
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      };

      const newCredential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential | null;

      if (newCredential && newCredential.rawId) {
        const credId = bufferToBase64(newCredential.rawId);
        localStorage.setItem(STORAGE_KEY, credId);

        setState((prev) => ({
          ...prev,
          isAuthenticating: false,
          isEnrolled: true,
          credentialId: credId,
          error: null,
        }));
        return true;
      }

      throw new Error('Credential creation returned null or unexpected response.');
    } catch (err: any) {
      console.warn('[WebAuthn Enroll Notice]', err);
      let userFriendlyMsg = 'Hardware biometric prompt was cancelled or is restricted.';

      if (err.name === 'NotAllowedError') {
        userFriendlyMsg = 'Biometric request was cancelled or timed out by user.';
      } else if (err.name === 'SecurityError') {
        userFriendlyMsg = 'WebAuthn hardware access is restricted in this frame context.';
      } else if (err.name === 'NotSupportedError') {
        userFriendlyMsg = 'Platform biometric authenticator not supported by this device.';
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }

      setState((prev) => ({
        ...prev,
        isAuthenticating: false,
        error: userFriendlyMsg,
      }));
      return false;
    }
  }, [userId, userName]);

  /**
   * Authenticate using navigator.credentials.get (or automatically enroll if not yet registered)
   */
  const authenticate = useCallback(async (options?: { forceReEnroll?: boolean }): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.credentials || !window.PublicKeyCredential) {
      setState((prev) => ({
        ...prev,
        error: 'Web Authentication API (navigator.credentials) is not supported in this browser.',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const storedCredId = localStorage.getItem(STORAGE_KEY);

      // If user wants re-enroll or no credential is saved yet, trigger enrollment challenge
      if (options?.forceReEnroll || !storedCredId) {
        return await enroll();
      }

      // Try navigator.credentials.get with existing credential ID
      let allowCreds: PublicKeyCredentialDescriptor[] | undefined = undefined;
      try {
        allowCreds = [{
          id: base64ToBuffer(storedCredId),
          type: 'public-key',
          transports: ['internal'],
        }];
      } catch (parseErr) {
        console.warn('[WebAuthn] Stored credential parse error, falling back to enrollment:', parseErr);
      }

      let rpId: string | undefined = undefined;
      if (window.location.hostname && !window.location.hostname.includes(':') && window.location.hostname !== 'localhost') {
        rpId = window.location.hostname;
      }

      const requestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          ...(rpId ? { rpId } : {}),
          ...(allowCreds ? { allowCredentials: allowCreds } : {}),
        },
      };

      try {
        const assertion = await navigator.credentials.get(requestOptions);
        if (assertion) {
          setState((prev) => ({
            ...prev,
            isAuthenticating: false,
            error: null,
          }));
          return true;
        }
      } catch (getErr: any) {
        console.warn('[WebAuthn .get notice]:', getErr?.name, getErr?.message);
        // If credential not found or state invalidated, fallback to fresh registration
        if (getErr?.name !== 'NotAllowedError') {
          return await enroll();
        }
        throw getErr;
      }

      // If .get completed without error but returned empty, attempt enrollment
      return await enroll();
    } catch (err: any) {
      console.warn('[WebAuthn Authenticate Notice]', err);
      let userFriendlyMsg = 'Biometric verification cancelled or unavailable.';

      if (err.name === 'NotAllowedError') {
        userFriendlyMsg = 'Biometric verification prompt was cancelled by user or timed out.';
      } else if (err.name === 'SecurityError') {
        userFriendlyMsg = 'WebAuthn hardware access is restricted in this browser frame context.';
      } else if (err.name === 'NotSupportedError') {
        userFriendlyMsg = 'Platform biometric authenticator not supported on this device.';
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }

      setState((prev) => ({
        ...prev,
        isAuthenticating: false,
        error: userFriendlyMsg,
      }));
      return false;
    }
  }, [enroll]);

  /**
   * Reset registered platform biometric credential
   */
  const resetEnrollment = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState((prev) => ({
      ...prev,
      isEnrolled: false,
      credentialId: null,
      error: null,
    }));
  }, []);

  /**
   * Simulated biometric auth for headless/VM/restricted testing environments
   */
  const simulateBiometricAuth = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isAuthenticating: true, error: null }));
    await new Promise((res) => setTimeout(res, 800));
    setState((prev) => ({ ...prev, isAuthenticating: false, error: null }));
    return true;
  }, []);

  return {
    ...state,
    authenticate,
    enroll,
    resetEnrollment,
    simulateBiometricAuth,
  };
}
