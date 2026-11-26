// WebAuthn (FIDO2 / Passkeys) helper for Fingerprint, Face ID, and Platform Biometrics

export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((base64url.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return Boolean(available);
    }
    return true;
  } catch {
    return false;
  }
}

export function detectDefaultDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Thiết bị Sinh trắc học';
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) return 'iPhone (Face ID / Touch ID)';
  if (/iPad/i.test(ua)) return 'iPad (Face ID / Touch ID)';
  if (/Android/i.test(ua)) return 'Android (Vân tay / Khuôn mặt)';
  if (/Macintosh|Mac OS/i.test(ua)) return 'MacBook (Touch ID)';
  if (/Windows/i.test(ua)) return 'Windows Hello';
  return 'Trình duyệt Sinh trắc học';
}

function mapWebAuthnError(err: any, lang: 'vi' | 'en'): string {
  const name = String(err?.name || '');
  const msg = String(err?.message || '');
  if (name === 'NotAllowedError') {
    return lang === 'vi'
      ? 'Thao tác vân tay / khuôn mặt đã bị hủy hoặc hết thời gian chờ.'
      : 'Biometric verification was cancelled or timed out.';
  }
  if (name === 'InvalidStateError') {
    return lang === 'vi'
      ? 'Thiết bị này đã được đăng ký sinh trắc học cho tài khoản của bạn rồi.'
      : 'This biometric device is already registered for your account.';
  }
  if (name === 'SecurityError' || msg.toLowerCase().includes('iframe') || msg.toLowerCase().includes('publickey-credentials')) {
    return lang === 'vi'
      ? 'Trình duyệt yêu cầu mở trang ở cửa sổ chính (HTTPS/localhost) để kích hoạt cảm biến vân tay / khuôn mặt.'
      : 'Open this site in a top-level HTTPS/localhost tab to use Fingerprint / Face ID.';
  }
  return msg || (lang === 'vi' ? 'Không thể xác thực sinh trắc học lúc này.' : 'Biometric authentication failed.');
}

export async function registerBiometricPasskey(
  apiFetch: (input: string, init?: RequestInit) => Promise<Response>,
  deviceName: string,
  lang: 'vi' | 'en' = 'vi'
): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return {
      ok: false,
      error:
        lang === 'vi'
          ? 'Trình duyệt hiện tại chưa hỗ trợ WebAuthn (Vân tay / Khuôn mặt).'
          : 'This browser does not support WebAuthn biometrics.',
    };
  }

  try {
    const optRes = await apiFetch('/api/auth/webauthn/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const opt = await optRes.json().catch(() => ({}));
    if (!optRes.ok) {
      return { ok: false, error: opt.error || 'Failed to initiate biometric registration' };
    }

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: base64UrlToUint8Array(opt.challenge),
      rp: opt.rp,
      user: {
        id: base64UrlToUint8Array(opt.user.id),
        name: opt.user.name,
        displayName: opt.user.displayName,
      },
      pubKeyCredParams: opt.pubKeyCredParams,
      timeout: opt.timeout || 60000,
      attestation: opt.attestation || 'none',
      authenticatorSelection: opt.authenticatorSelection,
      excludeCredentials: (opt.excludeCredentials || []).map((c: any) => ({
        type: 'public-key',
        id: base64UrlToUint8Array(c.id),
      })),
    };

    const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
    if (!cred) {
      return { ok: false, error: lang === 'vi' ? 'Không nhận được phản hồi sinh trắc học.' : 'No credential returned.' };
    }

    const attResp = cred.response as AuthenticatorAttestationResponse;
    const spkiBuf = typeof attResp.getPublicKey === 'function' ? attResp.getPublicKey() : null;
    const authDataBuf = typeof attResp.getAuthenticatorData === 'function' ? attResp.getAuthenticatorData() : null;
    const alg = typeof attResp.getPublicKeyAlgorithm === 'function' ? attResp.getPublicKeyAlgorithm() : -7;
    const transports = typeof attResp.getTransports === 'function' ? attResp.getTransports() : ['internal'];

    if (!spkiBuf || !authDataBuf) {
      return {
        ok: false,
        error:
          lang === 'vi'
            ? 'Trình duyệt phiên bản cũ chưa hỗ trợ xuất khóa công khai chuẩn WebAuthn Level 2. Hãy dùng Chrome/Safari/Edge mới nhất.'
            : 'Please use a modern Chrome, Safari, or Edge browser supporting WebAuthn Level 2.',
      };
    }

    const verifyRes = await apiFetch('/api/auth/webauthn/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId: cred.id,
        clientDataJSON: bufferToBase64Url(attResp.clientDataJSON),
        authenticatorData: bufferToBase64Url(authDataBuf),
        publicKeySpki: bufferToBase64Url(spkiBuf),
        alg,
        transports,
        deviceName: deviceName.trim() || detectDefaultDeviceLabel(),
      }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      return { ok: false, error: verifyData.error || 'Verification failed' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapWebAuthnError(err, lang) };
  }
}

export async function loginWithBiometricPasskey(
  apiFetch: (input: string, init?: RequestInit) => Promise<Response>,
  email?: string,
  lang: 'vi' | 'en' = 'vi'
): Promise<{ ok: boolean; token?: string; user?: any; biometricDevice?: string; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return {
      ok: false,
      error:
        lang === 'vi'
          ? 'Thiết bị/trình duyệt chưa hỗ trợ đăng nhập bằng Vân tay hoặc Khuôn mặt.'
          : 'Biometric sign-in is not supported on this browser.',
    };
  }

  try {
    const optRes = await apiFetch('/api/auth/webauthn/login/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email?.trim() || '' }),
    });
    const opt = await optRes.json().catch(() => ({}));
    if (!optRes.ok) {
      return { ok: false, error: opt.error || 'Failed to get biometric login challenge' };
    }

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: base64UrlToUint8Array(opt.challenge),
      rpId: opt.rpId,
      timeout: opt.timeout || 60000,
      userVerification: opt.userVerification || 'required',
      allowCredentials: Array.isArray(opt.allowCredentials)
        ? opt.allowCredentials.map((c: any) => ({
            type: 'public-key',
            id: base64UrlToUint8Array(c.id),
          }))
        : [],
    };

    const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
    if (!assertion) {
      return { ok: false, error: lang === 'vi' ? 'Không nhận được xác nhận sinh trắc học.' : 'No biometric assertion received.' };
    }

    const assertResp = assertion.response as AuthenticatorAssertionResponse;
    const verifyRes = await apiFetch('/api/auth/webauthn/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId: assertion.id,
        clientDataJSON: bufferToBase64Url(assertResp.clientDataJSON),
        authenticatorData: bufferToBase64Url(assertResp.authenticatorData),
        signature: bufferToBase64Url(assertResp.signature),
      }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      return { ok: false, error: verifyData.error || 'Biometric login failed' };
    }
    return {
      ok: true,
      token: verifyData.token,
      user: verifyData.user,
      biometricDevice: verifyData.biometricDevice,
    };
  } catch (err) {
    return { ok: false, error: mapWebAuthnError(err, lang) };
  }
}
