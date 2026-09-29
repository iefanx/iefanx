---
title: 'Hardware-Based Key Derivation and Safe Rotation Without Re-Encrypting Content'
description: 'Learn how to use hardware devices as immutable root-of-trust for secure key derivation and implement safe key rotation without breaking past events or re-encrypting content.'
pubDate: '2025-11-07'
heroImage: '../../assets/blog-placeholder-4.jpg'
topics: ['Hardware Security', 'Cryptography', 'Key Management']
featured: false
---

## Short Answer

Use the hardware device as the immutable root-of-trust and derive event keys from it (not from a single mutable "master hash"). Concretely: have the hardware device produce a secure deterministic secret per event (eg. sign the event id / perform an ECDH/HKDF) and derive each event's content-encryption key (CEK) from that. That way you can "rotate" a user-facing master/KEK (used only to wrap or authorize access) without breaking past events—because the true CEKs are deterministically derived from the hardware key which never changes or leaves the device.

If you insist that the hardware device produce a single master-hash you control, you can implement rotation—but one of two things must happen for previous events to stay decryptable: (A) previous CEKs were derived from a stable hardware secret (recommended), or (B) you must re-wrap or multi-wrap every CEK under the new KEK (expensive / needs access to plaintext CEKs).

Below I give a concrete, safe design, the exact algorithms to use, a step-by-step recipe (including code-like pseudocode), alternative approaches with pros/cons, and an immediate action plan.

---

## 1. Recommended Design (Robust + Supports Rotation Without Re-Encrypting Content)

**Idea**: Use the hardware key as the ultimate secret. Derive each event's CEK from the hardware key + event identifier. Use an independent KEK (the "master hash" you mentioned) only to wrap CEKs for convenient storage or to protect metadata. If the KEK leaks you can rotate it freely—CEKs remain derivable because they come from the hardware key.

### Components & Algorithms (Recommended)

- **Hardware keypair**: use a device-held asymmetric keypair. Prefer X25519 (for ECDH) or Ed25519 (for signatures) depending on device capabilities. X25519 when device supports ECDH, Ed25519 if it only signs (we can sign and HKDF the signature).
- **KDF**: HKDF-SHA256 (RFC 5869).
- **CEK**: 256-bit symmetric key (for AES-256).
- **Content encryption**: AES-256-GCM (authenticated encryption).
- **Key wrapping** (optional): AES Key Wrap (RFC 3394) or simply AES-256-GCM on the CEK using a KEK.
- **Metadata/versioning**: store version, derivation-method, event-id, wrapped-cek, wrap-kek-id, hw-deriv-info.

### Derivation Choices—Two Safe Options

#### Option A—Device ECDH (Preferred if Device Supports X25519)

1. For each event, derive ephemeral public P_event deterministically from event_id (or use event_id as X25519 public via a deterministic map)—or have the client generate ephemeral keypair for the event.
2. Ask device to compute shared = X25519(device_priv, P_event) (device performs ECDH).
3. CEK = HKDF(shared, salt=event_id || context, info="CEK", L=32).

Device never exports device_priv. Anyone with the device can compute CEKs for events (or server that has permission). If you need offline verification, the device can perform unwrap operations instead of exporting keys.

#### Option B—Device Signs Then HKDF (Works if Device Can Only Sign—Widely Compatible)

1. sig = Sign(device_priv, "CEK-derive" || event_id || context)—deterministic signature (Ed25519/RSASSA-PSS).
2. CEK = HKDF(sig, salt=event_id || context, info="CEK", L=32).

This uses the signature bytes as high-entropy input to HKDF. As above, only the device can produce sig so CEKs are safe and deterministic.

### How Rotation Works

- The hardware device private key is stable and secret. CEKs are derived from it → rotation of a separate KEK (user-facing master hash) is safe and does not break decryption.
- The KEK you used to wrap CEKs or to protect metadata can be rotated by re-wrapping CEKs or by issuing a new KEK and storing both wrapped copies for a transition period.
- If the hardware private key is compromised, all bets are off—you cannot generate a new master and recover previous CEKs because the hardware key was the root-of-trust. So protect the hardware wallet fiercely.

---

## 2. If You Must Start From a "Master Hash" Created by the Hardware Device

You can still make this safe by making that master hash not the only secret. Use the hardware device to create a root secret and make the "master hash" a derived, versioned label:

- Device computes: root = HKDF(Sign(device_priv, "root-derive" || device_serial || salt), info="root", L=32).
- You publish/record master = HMAC(root, epoch || user_passphrase)—this master is the user-facing master-hash.
- Events derive CEKs from root (not from master): CEK = HKDF(root, salt=event_id, info="CEK", L=32).
- When master leaks, you can change epoch or passphrase and compute a new master without changing root or CEKs. In short, the user-facing master can be rotated; the real keys are under root on the device.

This meets your sentence "I will never use hardware device key directly—I'll use it to create a master hash" while preserving compatibility.

---

## 3. Concrete Step-by-Step Implementation (Pseudocode + Parameters)

I'll show the sign+HKDF variant (Option B) because it's broadly compatible with many hardware wallets.

### Parameters (Recommended)

- **Signature algorithm**: Ed25519 (if available) or device ECDSA with deterministic k (not ideal).
- **HKDF**: HKDF-SHA256
- **CEK length**: 32 bytes (256 bits)
- **Content cipher**: AES-256-GCM (128-bit tag)
- **KEK wrap**: AES-256-GCM or RFC3394 key wrap (wrap CEK only)
- **Metadata fields**: {version, event_id, derivation="ed25519+hkdf-sha256", wrapped_cek, wrap_kek_id, iv, aad}

### Derive CEK (Device Signs)

```python
# event_id: string/bytes (unique, canonical)
# context: app-specific string, e.g. "myapp:v1:content"
# device_sign(data) asks the hardware wallet to produce a deterministic signature

data_to_sign = b"CEK-derive||" + event_id + b"||" + context
sig = device_sign(data_to_sign)             # signature bytes only, never device_priv

CEK = HKDF_SHA256(input_key_material=sig,
                  salt=event_id || context,    # make salt unique per event
                  info=b"CEK",
                  L=32)                        # 32 bytes = AES-256 key
```

### Encrypt Content

```python
# use CEK to encrypt content with AES-256-GCM
iv = random(12)
ciphertext, tag = AES_256_GCM_Encrypt(CEK, iv, plaintext, aad=metadata)
store: {ciphertext, iv, tag, metadata}
```

### Wrap CEK with a User-Facing Master (Optional)

```python
# master_kek is a value you or your server holds (e.g. derived from user passphrase or device)
wrapped_cek = AES_256_GCM_Encrypt(master_kek, iv_wr, CEK, aad=wrap_meta)
store wrapped_cek alongside event metadata
```

### Decrypt Workflow

- To decrypt an event, client requests sig = device_sign("CEK-derive||event_id||context") and runs HKDF to recreate CEK, then AES-GCM-decrypt the content.
- If you used KEK wrapping and the client cannot call device (offline), unwrap CEK using KEK and decrypt.

---

## 4. Key Rotation Strategies & Tradeoffs

### A. Rotate KEK Only (Recommended Path)

KEK leaks → generate new KEK and re-wrap stored CEKs (or keep both wrapped copies). No change to CEK derivation; CEKs still derivable from device. Minimal risk; storage overhead or re-wrap time required.

**Pros**: Cheap, CEKs still valid.  
**Cons**: Must re-wrap stored CEKs or maintain multi-wrap copies for a transition.

### B. Re-Derive CEKs From a New Master (Impossible Without Device or Retained Secret)

If CEKs were derived solely from a master-hash that you must be able to change later and still derive old CEKs, you cannot do that unless the derivation includes an immutable secret (the device). If the master alone is the only secret and it leaks, previous CEKs cannot be recovered by a new master.

**Bottom line**: Don't make the single mutable master the only source for CEK derivation.

### C. Multi-Wrap for Zero Downtime Rotation

When rotating KEK, for each event store both wrapped_cek_kek_old and wrapped_cek_kek_new. Clients prefer new KEK; old copies can be removed after TTL.

**Pros**: Clients offline can still decrypt.  
**Cons**: Doubles storage for wrapped CEKs temporarily.

### D. Use Asymmetric Wrapping (Device Public Key)

Wrap CEKs with the device public key (e.g., ECIES with device pubkey). The device private key is required to unwrap. Rotating a user KEK does not affect anything. But if the device private key is lost, you lose access.

**Pros**: Strong; avoids KEK leaks.  
**Cons**: Requires device to support unwrapping or an unwrapping service.

---

## 5. Metadata & Versioning (Practical, Required)

Always store per-event metadata:

- version (e.g. 1)
- derivation_method (e.g. ed25519+hkdf-sha256)
- device_id or hw_pubkey_id
- event_id (canonical)
- wrapped_cek + wrap_kek_id (if wrapped)
- cipher (AES-256-GCM)

This allows future changes in algorithms without breaking compatibility.

---

## 6. Security Precautions & Threat Model

- **If hardware private key is compromised**: impossible to recover previous secrecy by rotation—you must consider that fully compromised. Rotate device keys and re-encrypt content (or invalidate).
- **If master (KEK) is compromised**: safe if CEKs derive from hardware. Re-wrap CEKs and/or revoke the leaked KEK.
- **Protect device backups**: losing the device private key = losing access in many designs.
- **Use AEAD** (AES-GCM or AES-SIV) for content encryption and for wrapping CEKs to get authenticity and confidentiality.

---

## 7. Short Code-Like Example (Python-Like Pseudocode)

```python
# high-level pseudocode for sign+HKDF approach

def derive_cek(device, event_id, context=b"myapp:v1"):
    data = b"CEK-derive||" + event_id + b"||" + context
    sig = device.sign(data)                       # device signs, returns signature bytes
    cek = HKDF_SHA256(ikm=sig, salt=event_id+context, info=b"cek", length=32)
    return cek

def encrypt_content(device, event_id, plaintext):
    cek = derive_cek(device, event_id)
    iv = os.urandom(12)
    ct, tag = aes_gcm_encrypt(cek, iv, plaintext, aad=event_id)
    return { "ciphertext": ct, "iv": iv, "tag": tag, "meta": {...} }
```

---

## 8. Alternatives You Might Not Have Thought Of

1. **Trusted Execution Environment (TEE) as root-of-trust**: use an HSM/TEE to derive CEKs on server side—easier for high-throughput server use, but trust and availability tradeoffs.
2. **Threshold/Multi-sig derivation**: split root secret across multiple devices/locations (Shamir or threshold signatures) so a single device leak doesn't break security.
3. **Deterministic per-event ephemeral keys + ephemeral storage**: generate ephemeral CEK per event and discard plaintext; keep only wrapped CEKs. Rotation is re-wrapping.
4. **Use AES-SIV / deterministic AEAD** if you want deterministic encryption for dedup but careful: deterministic encryption leaks equality patterns.

---

## 9. Practical Action Plan You Can Apply Now

1. **Decide hardware capability**: does your device support X25519 ECDH or only signatures? (If you told me the device model I could map exact API calls.)
2. **Implement Option B (sign+HKDF)** unless device supports X25519; it's broadly compatible and secure. Use Ed25519 if available.
3. **Choose HKDF-SHA256 and AES-256-GCM**. Create canonical event_id format (UTF-8 bytes, stable).
4. **Implement derive_cek(device, event_id)** per pseudocode and add metadata versioning.
5. **Use KEK wrapping for convenience** (AES-GCM wrap CEK)—but treat KEK as rotatable. Implement a wrap_kek_id field and support keeping multiple wrapped CEKs temporarily.
6. **Test**: create 3 events, leak KEK, rotate KEK, ensure CEKs derived from device still decrypt content.
7. **Document rotation procedures** and emergency procedures for lost/compromised hardware (revoke, re-encrypt, notify users).
8. **Optional**: implement multi-wrap during rotation and garbage-collect old wrapped CEKs after TTL.

---

## 10. Final Notes (Practical Reminders)

- If your priority is ability to rotate a single user-facing secret without re-encrypting all content, use the hardware device as the stable root-of-trust and derive CEKs from it. The "master hash" should be a wrapper/authorization token, not the ultimate CEK source.
- Always include version and derivation_method in metadata—this makes future algorithm changes safe.
- Use authenticated encryption everywhere (AES-GCM or better) and HKDF with a salt for domain separation.
