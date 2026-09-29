---
title: 'Key rotation without losing the past'
description: 'A design proposal for explicit key epochs, envelope encryption, and recoverable content migration.'
pubDate: '2026-09-30'
topics: ['Cryptography', 'Key Management', 'Distributed Systems']
kind: 'research'
researchQuestion: 'Can wrapping keys be rotated safely while reads, writes, and restores continue?'
method: 'Architecture proposal · fault injection'
evaluation: 'Crash recovery, metadata binding, retirement criteria'
status: 'Draft proposal'
featured: true
---

## Abstract

Encrypted content needs a lifecycle longer than any one operational key. This proposal examines how a service could rotate wrapping keys while retaining access to historical content, without treating a client-provided timestamp as authority. The proposed design combines randomly generated content keys, authenticated envelopes, explicit key identifiers, and a resumable migration journal. It offers a threat model and an evaluation plan; it does not report implementation results or a security proof.

## Research question

Can an encrypted content service migrate wrapping keys safely while readers and writers operate concurrently, including after crashes or delayed replication?

The target is content stored for long periods with changing device membership. Rotating an operational secret is useful, but recovery and revocation are different goals. Preserving historical decryption may conflict with erasing historical access. A design must say which goal it serves.

## Threat model and boundaries

Assume an attacker can read the storage database, replay old object versions, and interrupt migration. Assume clients may submit arbitrary timestamps. A trusted key service authorizes unwrap operations. The proposal does not protect content already copied by an authorized reader or prevent a compromised active key service from revealing keys.

A key epoch identifies a specific wrapping key. It is separate from the object creation time and the schema version. Explicit identifiers reduce ambiguity when clocks disagree, writes arrive late, or an object is imported from another service.

## Proposed envelope

For each new object, generate a fresh random content encryption key using a cryptographically secure random source. Encrypt with an established authenticated encryption library. Follow that library’s nonce requirements; do not invent a nonce from an untrusted timestamp.

Store the payload alongside an envelope containing:

- An immutable object identifier and tenant identifier.
- The schema and authenticated encryption algorithm versions.
- A wrapping key identifier and wrapped content key.
- Nonces, authentication tags, and an envelope revision.

Bind the object and tenant identifiers into authenticated associated data. Use canonical serialization so independent implementations authenticate identical bytes. Authenticate envelope metadata as part of the wrapping operation too. Wrapping a key is a cryptographic operation, not simply serializing it under a new identifier.

If derivation is required for separate purposes, use established domain separation with an unambiguous context. RFC 5869 is the relevant HKDF specification [1]. Derived keys still depend on the confidentiality of their source key; derivation does not erase that dependency.

## Migration as a state machine

New writes use the active wrapping epoch. Readers resolve the explicit identifier in the envelope. A migration worker unwraps each content key under its old wrapping key, rewraps it under the new one, and commits the envelope revision with a compare-and-swap operation.

The ciphertext can remain unchanged because the content key remains unchanged. This is appropriate for routine wrapping-key rotation. If the content key itself was exposed, rewrapping does not repair the exposure; the payload must be re-encrypted with a new content key, and already copied plaintext remains exposed.

Use these conceptual states:

```text
OLD_ENVELOPE → NEW_ENVELOPE_COMMITTED → OLD_KEY_RETIREMENT_ELIGIBLE
```

Key retirement is a global decision. It must account for replicas, backups, offline clients, and disaster recovery. An object-level success counter cannot establish that every retained copy has migrated. An authenticated revision alone also cannot prevent rollback unless the reader has an independent source of freshness, such as a trusted revision registry.

## Evaluation plan

Build a prototype with an append-only migration journal and fault injection at each persistence boundary. Generate objects with multiple tenants and concurrent writers. Verify that interrupted jobs resume, conflicting revisions are retried, and a key identifier cannot be substituted across tenants.

Measure migration throughput, unwrap service load, reader tail latency, and the maximum interval in which both epochs must remain accessible. Publish environment details, workload generation scripts, and all failures alongside measurements. Test restores from backups created before, during, and after migration.

Success means that every recoverable state has an explicit read or recovery path. It does not mean uninterrupted availability under every failure.

## Limitations and next steps

This architecture retains access through the key service. It does not provide forward secrecy for stored content while old content keys remain recoverable. Stronger historical erasure requires a different retention policy, and potentially deletion of keys and recoverable backups.

The next step is a prototype and review of the metadata binding, rollback model, and retirement criteria. No benchmarks have been performed for this proposal.

## References

1. Krawczyk, H. and Eronen, P. [RFC 5869: HMAC-based Extract-and-Expand Key Derivation Function](https://www.rfc-editor.org/rfc/rfc5869), 2010.
2. Barnes, R. et al. [RFC 9420: The Messaging Layer Security Protocol](https://www.rfc-editor.org/rfc/rfc9420), 2023. A related reference for epoch-based group security; not a specification for the storage proposal above.
