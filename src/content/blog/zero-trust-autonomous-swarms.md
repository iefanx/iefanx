---
title: 'Authenticated coordination for small robot teams'
description: 'A proposal for separating device identity, coordination, and physical safety under unreliable communication.'
pubDate: '2026-05-18'
topics: ['Robotics', 'Embedded Security', 'Coordination']
kind: 'research'
researchQuestion: 'How can a small robot team coordinate safely over unreliable communication?'
method: 'Simulation proposal · adversarial scenarios'
evaluation: 'Safe fallback, stale-state rejection, task completion'
status: 'Draft proposal'
featured: false
---

## Abstract

Small robot teams must coordinate over unreliable links while remaining safe when messages are missing or malicious. This proposal separates authenticated messaging from agreement and physical control. It defines an evaluation agenda for command provenance, stale-state rejection, and local fail-safe behavior. It does not introduce a proven consensus protocol or report hardware benchmarks.

## Problem statement

A valid signature establishes message provenance under its key assumptions. It does not establish that a sensor reading is true or that a proposed maneuver is safe. Likewise, collecting signatures is not a complete consensus protocol: ordering, conflicting proposals, membership, view changes, and progress require explicit definitions.

The question is whether a small team can retain useful coordination while rejecting stale or unauthorized commands and maintaining local safety during partitions.

## System boundaries

Treat the design as three components:

1. A provisioned identity and authenticated message layer.
2. A coordination layer with defined membership and ordering rules.
3. A local safety controller that can reject unsafe actions independently.

Hardware key protection reduces some extraction risks but does not guarantee honest firmware or sensors. Model physical capture, software compromise, and communication failure separately.

## Proposed experiment

Begin with a simulator and a centralized coordination baseline. Add authenticated sequence-numbered messages and bounded validity intervals. Define a safe fallback for missing updates before attempting a distributed agreement mechanism.

Inject message duplication, reordering, burst loss, partitions, delayed commands, and contradictory signed proposals. Evaluate collision avoidance and command rejection separately from mission completion. A system that safely pauses may have reduced availability while meeting its safety requirements.

For any later consensus experiment, specify the fault threshold, membership transitions, network timing assumptions, and exact protocol. Do not assume a threshold signature construction itself guarantees agreement or progress. During a partition, refusing an update may be necessary to preserve agreement.

## Measurement plan

Record the simulator version, control loop, radio model, scenario seeds, and fault injection schedule. Report task completion, unsafe actions, recovery duration, message volume, verification time, and peak memory. Hardware trials should record board revisions and firmware and should not inherit simulator timing claims.

Publish all scenarios, including those where coordination stops. Reproduce each measurement across multiple runs and state the statistical method. Baselines should use identical control and communication workloads.

## Limitations and status

No empirical validation, formal proof, or peer review accompanies this proposal. Numerical testbed and inference claims previously present at this URL were unsupported by repository artifacts and have been removed. The next step is a reproducible simulation with documented safety invariants.

## Further reading

- [RFC 9420: The Messaging Layer Security Protocol](https://www.rfc-editor.org/rfc/rfc9420) provides a reference for group security. Group encryption is distinct from robotic coordination and physical safety.
- [Trust when the network disappears](/blog/intermittent-edge-trust/) develops a narrower evaluation plan for command authentication and offline authorization.
