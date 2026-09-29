---
title: 'What survives the journey from document to speech?'
description: 'A proposed benchmark for text order, Unicode boundaries, numeric meaning, and recoverable listening position.'
pubDate: '2026-09-30'
topics: ['Reading & Accessibility', 'Document Processing', 'Evaluation']
kind: 'research'
status: 'Draft proposal'
researchQuestion: 'Which kinds of meaning are lost between document import, text normalization, and speech playback?'
method: 'Corpus design · stage-by-stage correctness benchmark'
evaluation: 'Omissions, ordering, Unicode integrity, numeric meaning, resume accuracy'
---

## Abstract

Document narration connects format extraction, text segmentation, normalization, and a speech engine. Voice quality is only one part of the experience: a fluent narration can still omit a paragraph, alter a number, or resume in the wrong place. This proposal defines a stage-by-stage correctness benchmark for document-to-speech pipelines, motivated by the Readout project. It contains no measured results or completed user study.

## Research question

Which kinds of meaning are lost between the source document and the passage a listener receives, and at which stage do those losses occur?

The proposed study separates content fidelity from speech naturalness. A subjective voice preference cannot establish that the source text survived import. A string comparison also cannot establish that a number was spoken with its intended meaning.

## Corpus and reference representation

Create openly licensed or synthetic examples in EPUB, DOCX, PDF with text layers, plain text, and HTML. Annotate a canonical reading order and expected text for each example. Include headings, paragraphs, abbreviations, times, decimals, mixed scripts, supplementary Unicode characters, and combining sequences.

Treat scanned PDFs as a separate task because they require recognition rather than ordinary text-layer extraction. Document which formats and layouts each importer claims to support. Publish the source files and annotations so failures can be reproduced.

The first corpus should be small enough for manual review. Scale is a later concern; a large benchmark with an unreliable oracle would obscure the problem.

## Evaluate each transition

Capture intermediate outputs after extraction, segmentation, normalization, and chunking. Compare each output to the expected representation for that stage.

For extraction, track omitted text and paragraph-order errors. For segmentation, track boundaries that split semantic units. For chunking, verify both the engine input limit and reconstruction of the original sequence.

Unicode grapheme clusters and sentence boundaries need explicit policies. Unicode Standard Annex #29 is a primary reference for those boundary definitions [1]. A code-point-safe operation is not automatically grapheme-safe.

For numeric expressions, use a reviewed set of intended readings. Evaluate altered decimals, sign loss, timestamp changes, and unit separation. Distinguish a correct textual transformation from its actual spoken realization.

## Listening position as a separate invariant

Test pause, resume, voice changes, app interruption, and document switching against a stable passage identifier. A late callback from an earlier playback session must not move the active document’s position.

The Android text-to-speech API defines the engine-facing interface [2], but the application still owns its reading-state model. Record both the submitted passage and the application’s persisted resume position.

This experiment should include provider failures and interruption before completion. It should not treat a successful callback as sufficient evidence that a listener heard the passage correctly.

## Measures and reporting

Report omission counts, ordering violations, reconstruction mismatches, malformed Unicode boundaries, semantic numeric errors, and incorrect resume positions. Break results down by format and failure class instead of presenting a single composite score.

A later listening study could investigate comprehension and navigation effort with informed participants. That study would need its own protocol, participant consent, and review; it has not been performed here.

## Limitations and next steps

A reference representation can carry editorial judgment, particularly for tables, footnotes, and multi-column pages. Publish those choices with the corpus. Speech engines also vary by device, voice, and network mode, so record the exact configuration for any future audio evaluation.

The first deliverable would be corpus fixtures and a harness that records pipeline stages. The [Readout case study](/blog/readout-reading-is-a-systems-problem/) provides the project context for this proposal.

## References

1. Unicode Consortium. [Unicode Standard Annex #29: Unicode Text Segmentation](https://www.unicode.org/reports/tr29/).
2. Android Developers. [TextToSpeech API reference](https://developer.android.com/reference/android/speech/tts/TextToSpeech).
