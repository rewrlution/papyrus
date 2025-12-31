# Encryption Key Rotation Strategies

## Current Implementation

The API currently uses **AES-256-GCM** encryption with a single master encryption key stored in environment variables. All journal entries are encrypted with this key.

**Problem**: Rotating the encryption key requires decrypting all entries with the old key and re-encrypting with the new key, causing significant latency.

---

## Proposed Strategies

### Strategy 1: Envelope Encryption

**Concept**: Encrypt each journal with a unique Data Encryption Key (DEK), then encrypt the DEK with a Master Key (KEK - Key Encryption Key).

**Process**:

1. Generate a random 256-bit DEK for each journal entry
2. Encrypt journal content with DEK using AES-256-GCM
3. Encrypt the DEK with the master KEK
4. Store: `encryptedContent`, `encryptedDEK`, `keyVersion`, `iv`, `authTag`

**Schema Changes**:

```prisma
model Journal {
  // ... existing fields
  ciphertext    String  // content encrypted with DEK
  encryptedDek  String  // DEK encrypted with KEK
  keyVersion    Int     // which KEK version was used
  iv            String
  authTag       String
}
```

**Key Rotation Process**:

1. Generate new KEK (v2)
2. Keep old KEK (v1) for reading
3. For each journal:
   - Decrypt DEK using old KEK v1
   - Re-encrypt DEK using new KEK v2
   - Update `encryptedDek` and `keyVersion` fields
4. Content never needs decryption
5. Can process in batches or lazily on access

**Implementation Complexity**: Medium

---

### Strategy 2: Hierarchical Key Derivation (Per-User Keys)

**Concept**: Derive a unique encryption key for each user from a master key + user ID using a Key Derivation Function (KDF).

**Process**:

1. Generate one master key
2. For each user, derive user-specific key: `UserKey = HKDF(MasterKey, UserID, "journal-encryption")`
3. Encrypt all journals for a user with their UserKey
4. Store: `ciphertext`, `iv`, `authTag`, `keyVersion`

**Schema Changes**:

```prisma
model Journal {
  // ... existing fields
  ciphertext    String
  keyVersion    Int     // which master key version
  iv            String
  authTag       String
}
```

**Key Rotation Process**:

1. Generate new master key (v2)
2. Keep old master key (v1) for reading
3. Re-derive all user keys from new master key (pure computation)
4. For each journal:
   - Derive old user key from old master key
   - Decrypt content
   - Derive new user key from new master key
   - Re-encrypt content
5. Can prioritize active users first

**Implementation Complexity**: Medium

---

### Strategy 3: Password-Derived Encryption (Zero-Knowledge)

**Concept**: Encrypt journals client-side using a key derived from the user's password. Server stores encrypted data without knowing the encryption key.

**Process**:

1. Client derives encryption key: `UserKey = PBKDF2(password, salt, iterations)`
2. Client encrypts journal content before sending to server
3. Server stores encrypted data blindly
4. Client decrypts when fetching journals
5. Server never has access to plaintext or encryption keys

**Schema Changes**:

```prisma
model User {
  // ... existing fields
  keySalt       String  // for deriving encryption key
}

model Journal {
  // ... existing fields (no keyVersion needed)
  ciphertext    String
  iv            String
  authTag       String
}
```

**Key Rotation Process**:

- No server-side key rotation needed
- User can change password, which requires:
  1. Decrypt all journals with old password-derived key
  2. Re-encrypt with new password-derived key
  3. Happens client-side during password change

**Implementation Complexity**: High (requires client changes)

---

### Strategy 4: Multi-Key Versioning with Gradual Migration

**Concept**: Support multiple active encryption keys simultaneously, allowing gradual migration over time without immediate re-encryption.

**Process**:

1. Maintain multiple encryption keys (v1, v2, v3, etc.)
2. Track which key version encrypted each journal
3. New journals use latest key version
4. Old journals remain on old key versions
5. Re-encrypt lazily (on update) or via background job

**Schema Changes**:

```prisma
model Journal {
  // ... existing fields
  ciphertext    String
  keyVersion    Int     // which key encrypted this journal
  iv            String
  authTag       String
}
```

**Key Rotation Process**:

1. Generate new encryption key (v2)
2. Deploy both v1 and v2 keys to application
3. New journals: encrypt with v2
4. Existing journals: remain on v1 (can still be read)
5. Options for migration:
   - **Lazy**: Re-encrypt when user updates journal
   - **Background**: Batch job processes X journals per hour
   - **Hybrid**: Lazy for active users, background for inactive
6. After all data migrated to v2, retire v1 key

**Implementation Complexity**: Low

---

### Strategy 5: Multi-Key with Envelope Encryption (Hybrid)

**Concept**: Combine multi-key versioning with envelope encryption for best of both worlds.

**Process**:

1. Each journal has unique DEK
2. DEK encrypted with versioned KEK
3. Support multiple KEK versions simultaneously
4. Gradual migration of DEK encryption

**Schema Changes**:

```prisma
model Journal {
  // ... existing fields
  ciphertext    String  // encrypted with DEK
  encryptedDek  String  // DEK encrypted with KEK
  keyVersion    Int     // KEK version
  iv            String
  authTag       String
}
```

**Key Rotation Process**:

1. Generate new KEK (v2)
2. Keep old KEK (v1) for reading
3. New journals: encrypt DEK with KEK v2
4. Old journals: DEK still encrypted with KEK v1
5. Re-encrypt DEKs lazily or in background
6. Content never touched during rotation

**Implementation Complexity**: Medium-High

---

## Comparison Table

| Strategy                             | Reduces Re-encryption Latency | Eliminates Single Master Key | Zero-Knowledge | Gradual Migration | Implementation Complexity | Best For                 |
| ------------------------------------ | ----------------------------- | ---------------------------- | -------------- | ----------------- | ------------------------- | ------------------------ |
| **1. Envelope Encryption**           | ✅ Yes (32 bytes vs KB)       | ❌ No                        | ❌ No          | ⚠️ Partial        | Medium                    | Reducing rotation time   |
| **2. Per-User Key Derivation**       | ⚠️ Partial                    | ⚠️ Partial                   | ❌ No          | ✅ Yes            | Medium                    | User isolation           |
| **3. Client-Side Encryption**        | ✅ Yes (no server rotation)   | ✅ Yes                       | ✅ Yes         | N/A               | High                      | Maximum security         |
| **4. Multi-Key Versioning**          | ✅ Yes (spread over time)     | ❌ No                        | ❌ No          | ✅ Yes            | Low                       | Simple gradual migration |
| **5. Hybrid (Multi-Key + Envelope)** | ✅ Yes                        | ❌ No                        | ❌ No          | ✅ Yes            | Medium-High               | Enterprise scenarios     |

---

## Pros and Cons

### Strategy 1: Envelope Encryption

**Pros**:

- 100x faster rotation (re-encrypting 32-byte DEKs vs multi-KB content)
- Each journal isolated with unique DEK (better security)
- Industry standard (AWS KMS, Google Cloud KMS)
- Can integrate with HSM/key management services

**Cons**:

- Still depends on single master KEK
- Must still touch every record during rotation
- More complex encryption/decryption logic
- Adds storage overhead (~32 bytes per journal)

---

### Strategy 2: Per-User Key Derivation

**Pros**:

- User-level isolation (one user's key compromise doesn't affect others)
- Can rotate keys per user (targeted rotation)
- Can prioritize active users during migration
- Simpler than envelope encryption

**Cons**:

- Still requires re-encrypting content during rotation
- Still relies on master key
- User ID must be available during encryption/decryption
- Doesn't reduce re-encryption volume per journal

---

### Strategy 3: Client-Side Encryption

**Pros**:

- True zero-knowledge architecture
- No server-side key rotation needed ever
- Maximum security (server compromise doesn't expose data)
- Each user has independent key

**Cons**:

- Lost password = permanent data loss
- Can't search/index content server-side
- Complex client implementation
- Password change requires re-encrypting all data client-side
- Higher client-side CPU usage

---

### Strategy 4: Multi-Key Versioning

**Pros**:

- Simplest to implement
- Zero downtime during rotation
- Gradual migration (spread latency over weeks/months)
- Can retire old keys after migration complete
- Flexible migration strategies (lazy, background, hybrid)

**Cons**:

- Operational complexity (managing multiple keys)
- Still relies on master keys
- Content must be re-encrypted eventually
- Long transition period
- Must maintain old keys until migration complete

---

### Strategy 5: Hybrid (Multi-Key + Envelope)

**Pros**:

- Fast rotation (only re-encrypt DEKs)
- Zero downtime
- Gradual migration
- Best flexibility for enterprise needs
- Can integrate with external key management

**Cons**:

- Most complex implementation
- Highest storage overhead
- Must manage multiple KEKs
- Operational complexity
- May be overkill for smaller applications

---

## Recommendation

### For Your Current Use Case (Journal API):

**Primary Recommendation: Strategy 4 (Multi-Key Versioning)**

**Why**:

1. **Simplest implementation** - minimal code changes
2. **Zero downtime** - deploy new key alongside old key
3. **Flexible migration** - can process lazily or in background
4. **Good enough security** - keys rotate, just gradually
5. **Matches your scale** - personal journal app doesn't need enterprise-grade key management

**Implementation Steps**:

1. Add `keyVersion` column to Journal table (default: 1)
2. Update config to support multiple encryption keys
3. Modify encryption service to use key based on version
4. Deploy with both v1 and v2 keys
5. New entries use v2
6. Implement lazy re-encryption on journal updates
7. Optional: background job for inactive journals

---

### If Security Requirements Increase:

**Secondary Recommendation: Strategy 3 (Client-Side Encryption)**

If you need true zero-knowledge architecture (e.g., for marketing, compliance, or user trust), implement client-side encryption. But this requires:

- Client SDK/library for encryption
- Clear documentation about password loss
- Potentially backup key export feature

---

## Implementation Priority

1. **Now**: Strategy 4 (Multi-Key Versioning) - addresses immediate rotation latency concern
2. **Future**: Consider Strategy 3 (Client-Side) if zero-knowledge becomes a product differentiator
3. **Not Recommended**: Strategy 1 or 5 - adds complexity without eliminating single-key dependency

---

## Next Steps

1. Review and validate chosen strategy
2. Create database migration for schema changes
3. Update encryption service with key versioning logic
4. Implement key configuration management
5. Create background job for re-encryption (optional)
6. Update documentation
7. Test rotation process in staging environment
