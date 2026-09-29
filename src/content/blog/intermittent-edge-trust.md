---
title: 'Trust when the network disappears'
description: 'An evaluation plan for device identity, replay resistance, and safe behavior in intermittently connected edge networks.'
pubDate: '2026-09-30'
topics: ['Embedded Security', 'Distributed Systems', 'Robotics']
kind: 'research'
researchQuestion: 'Which offline operations can remain authorized when revocation cannot be checked?'
method: 'Protocol design · simulator and hardware plan'
evaluation: 'Replay rejection, expiry, reconnect recovery'
status: 'Draft proposal'
featured: true
---

## Abstract

A disconnected edge device cannot continuously consult a central policy service. This creates a practical tension between local availability and timely revocation. This proposal examines bounded offline authorization for sensor and robotic networks. It defines a message format, failure model, and reproducible evaluation plan. The contribution is a set of testable hypotheses and design constraints, not a completed protocol or measured result.

## Research question

How should an edge device decide whether to accept a command when identity is verifiable but current authorization cannot be checked?

The distinction matters: a valid signature identifies a key that signed a message. It does not establish that the sender remains authorized, that the message is fresh, or that the requested action is safe.

## Assumptions and adversaries

Devices have provisioned identities and receive policy updates while connected. Attackers can capture, delay, duplicate, and reorder messages. Some devices may be compromised. Persistent replay state can survive normal restarts, but an adversary may attempt to roll it back.

Trusted time, tamper resistance, secure boot, and storage rollback protection must be stated as separate assumptions for each target board. A secure element alone does not establish all four. The proposal assumes a device can enter a locally defined safe state without waiting for the network.

## Proposed authorization model

Assign each capability a recipient, action scope, policy epoch, issuer, and validity bound. The receiving device evaluates the capability as well as the authenticated message. For actions with physical consequences, enforce local safety limits even if authorization succeeds.

A message binds these fields into canonical signed bytes:

```text
protocol_version | sender | recipient | policy_epoch
boot_session | sequence | action | payload_digest
```

A boot session identifier must be unpredictable or backed by an anti-rollback counter. Receivers persist a replay window for each sender and session. Window size is a workload choice: too small rejects legitimate reordered traffic; too large consumes memory and permits a broader acceptance interval. A recipient identifier prevents a valid command for one device from becoming a command for another.

Capabilities that expire by wall-clock time require trustworthy time. If a board cannot establish time after reboot, it must refresh authorization or restrict itself to explicitly permitted offline operations. Treating an unverified clock as trustworthy is not an acceptable fallback.

## Partition behavior

Partition handling should be defined per operation. Telemetry buffering can tolerate delayed synchronization. Membership changes and authorization upgrades may require a connected authority. Physical actuation requires application-specific limits and a safe timeout.

A partitioned device cannot learn a revocation issued elsewhere. Offline validity therefore creates an exposure window. The experiment should compare useful offline duration against the consequences of a stale capability rather than claim instantaneous revocation.

Group encryption can be studied separately using an established protocol such as Messaging Layer Security [1]. MLS does not replace application authorization, trusted time, replay rules for arbitrary application commands, or a safety controller.

## Experimental design

Use a simulator first, followed by a small instrumented hardware setup. Publish the board model, firmware revision, clock source, radio settings, storage guarantees, and application workload. Include a connected baseline without capability caching.

Test duplicate floods, out-of-order delivery, device reboot, persisted-state rollback, expired capabilities, stale policy epochs, and partitions with revocation during disconnection. Sweep loss rates and delay distributions; include burst loss, because independent random loss does not represent every real radio failure.

Measure acceptance and rejection correctness, reconnect recovery time, flash writes, verification energy, memory overhead, and command latency percentiles. Separate safety outcomes from availability outcomes: rejecting a command can be a correct result.

## Hypotheses and failure criteria

Bounded capabilities may improve offline availability for low-risk operations. Persistent replay protection may increase flash writes unless updates are batched or protected counters are available. Neither hypothesis is a finding yet.

Fail the design if a reboot enables a recorded command to be accepted again, if recipient binding is absent, or if an expired command can trigger an unsafe action. Document which tests cannot be supported by the chosen hardware.

## Limitations

This proposal does not claim Byzantine consensus, forward secrecy, or resistance to physical extraction. The first implementation should focus on command acceptance, policy refresh, and recovery. Consensus is a separate problem with additional assumptions about membership and network timing.

## References

1. Barnes, R. et al. [RFC 9420: The Messaging Layer Security Protocol](https://www.rfc-editor.org/rfc/rfc9420), 2023. Reference for group membership epochs and group key updates.
