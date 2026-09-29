---
title: 'Time-Based Keyset Selection: Achieving Safe Key Rotation'
description: 'Discover how we implemented a versioned key derivation system that allows for seamless key rotation across client and server without breaking historical content.'
pubDate: '2026-04-23'
heroImage: '../../assets/key-rotation-hero.png'
topics: ['Cryptography', 'Key Rotation', 'Distributed Systems']
featured: true
---

Decryption in a distributed system is often a balancing act between security and availability. For a long time, the simplest approach was to use the "latest key" to decrypt content. However, as systems scale and security requirements evolve, rotating those keys becomes a necessity. 

The challenge? If you rotate a key, how do you ensure that content encrypted with the *old* key remains accessible without performing a massive, expensive re-encryption of all historical data?

We recently solved this by implementing **Time-Based Keyset Selection** and **Event-Versioned Key Derivation**. Here is a deep dive into how it works.

---

## The Core Idea: Versioning by Time

The fundamental shift in our architecture is that we no longer treat the "latest key" as the source of truth for decryption. Instead, we use **event-versioned key derivation**.

When a user attempts to unlock a piece of content, the system follows a deterministic path:
1. **Identify the canonical event** (the identity of the content).
2. **Read the event’s `created_at` timestamp**.
3. **Fetch/Derive the key** specific to that exact point in time.
4. **Decrypt** using that specific version.

Because old events retain their original timestamps, they continue to resolve to their original keys, even after the system's "active" key has rotated.

---

## Server-Side: The Keyschedule

On the server, we don't store explicit version numbers on every event. Instead, we use an implicit versioning system driven by a **Keyset Schedule**. This schedule consists of:
- `keyset_id`
- `active_from` (Unix timestamp)
- `key_binding`
- `salt_binding`

For any given timestamp $t$, the server selects the keyset with the largest `active_from` such that `active_from <= t`.

### The Decryption Path
When a client requests a key via `/request-key`, the server:
1. Resolves the canonical event for the provided identifier.
2. Reads the `created_at` timestamp.
3. Selects the corresponding keyset from the schedule.
4. Derives the content key and returns it.

This ensures that the server always provides the correct key for the content's "era," regardless of how many rotations have happened since.

---

## Client-Side: Version-Aware Caching

On the client, simply caching keys by their ID (UUID) is no longer sufficient. If a key rotates, a cached key for a specific ID might be "stale" or "too new" depending on which version of the event the user is looking at.

Our `keyStore.ts` now stores advanced metadata for every cached key:
- `uuid`
- `key`
- `naddr` (The canonical event identity)
- `eventCreatedAt`
- `savedAt`

### Intelligent Reuse Logic
Before using a cached key, the client performs a strict check. A key is reused **only if** both the `naddr` and the `eventCreatedAt` of the content being unlocked match the stored record. If there is a mismatch, the client ignores the cache and fetches a fresh key from the server.

This logic is implemented across our core stores, including `useUnlockStore.ts`, ensuring that bulk unlocks and remote data synchronization remain version-aware and collision-free.

---

## A Real-World Scenario: The Rotation Timeline

To see this in action, let's look at a typical rotation timeline:

1. **T1**: You publish **Event A**. The system uses the *Current Keyset*.
2. **R**: A **Server Rotation** occurs. A new keyset becomes active.
3. **T2**: You publish **Event B**. The system uses the *New Keyset*.

**When Unlocking:**
*   **Unlocking Event A**: The worker sees `created_at = T1`. Since `T1 < R`, it uses the old keyset. Decryption succeeds.
*   **Unlocking Event B**: The worker sees `created_at = T2`. Since `T2 > R`, it uses the new keyset. Decryption succeeds.

Old content remains safe; new content uses rotated material.


## Summary

By moving to a time-based keyset selection model, we've decoupled key rotation from content availability. Rotation is no longer a "breaking change"—it's a routine operation that enhances security while preserving the integrity of our historical data.

Stay tuned for more updates as we continue to harden our cryptographic infrastructure!
