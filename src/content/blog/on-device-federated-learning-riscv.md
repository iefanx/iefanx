---
title: 'What can a microcontroller actually learn?'
description: 'A research proposal for measuring the memory, energy, and privacy limits of federated adaptation on constrained devices.'
pubDate: '2026-07-12'
topics: ['Edge AI', 'Federated Learning', 'Privacy']
kind: 'research'
researchQuestion: 'When does local model adaptation justify its memory and energy costs?'
method: 'Comparative feasibility study'
evaluation: 'Peak memory, energy, accuracy, update size'
status: 'Draft proposal'
featured: true
---

## Abstract

Federated learning moves some computation toward the devices where data originates. It does not, by itself, establish privacy or make local training feasible on a microcontroller. This proposal studies small-model adaptation on constrained hardware, comparing frozen-feature inference, last-layer training, and full-model training where resources permit. No hardware measurements or accuracy results are claimed.

## Research question

When does local model adaptation provide enough benefit to justify its memory, energy, and communication costs on an embedded device?

Federated averaging provides a useful baseline for decentralized training [1]. Applying it to a constrained device requires a separate accounting of model weights, activations, gradients, optimizer state, and communication buffers. An inference memory budget cannot be reused as a training memory estimate.

## Proposed comparison

Evaluate three alternatives on the same data partition and sensor task:

- A fixed model that performs inference only.
- A frozen feature extractor with a trainable final layer.
- A fully trainable small model, only if the measured memory budget permits it.

Choose a concrete board before selecting the model. Record its architecture, usable SRAM, flash, compiler, numeric representation, and radio. Avoid generalizing a result from one board to an entire instruction set.

## Privacy boundaries

Keeping raw data on a device reduces raw-data transfer. Model updates can still reveal information. Transport encryption protects updates in transit, while secure aggregation and differential privacy address different threats.

A privacy experiment must define its adversary, whether protection is user-level or example-level, clipping rule, sampling method, noise mechanism, and accounting across rounds. A privacy parameter without these details is not an interpretable guarantee. The initial feasibility experiment should not claim formal differential privacy unless it includes a reviewed mechanism and accountant.

## Evaluation plan

Use an openly licensed dataset with a documented task. Partition data both uniformly and unevenly across simulated clients. Compare adaptation against the fixed model on held-out data, including devices whose data distribution differs from the training distribution.

Instrument peak live memory rather than relying on binary size. Measure energy per local training step, update payload size, radio energy, and end-to-end round duration. Report unsuccessful configurations and out-of-memory failures.

Begin with simulation to identify candidate model sizes, then validate representative configurations on hardware. Publish seeds, preprocessing, hyperparameters, runtime versions, and measurement instrumentation. Accuracy and energy measurements must come from the same documented setup.

## Expected contribution

The intended output is a reproducible feasibility map, not a universal claim that federated learning belongs on every edge device. A useful negative result would show that training consumes too much memory or energy, while last-layer adaptation remains practical.

## Limitations and publication status

This is an unvalidated research proposal. There is no testbed, peer review, or empirical result attached to this article. Earlier numerical claims at this URL were not supported by repository artifacts and have been replaced by an evaluation plan.

## References

1. McMahan, H. B. et al. [Communication-Efficient Learning of Deep Networks from Decentralized Data](https://arxiv.org/abs/1602.05629), 2016/2017. Baseline reference for federated averaging.
