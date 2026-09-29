---
title: 'Readout: reading is a systems problem'
description: 'Inside an Android reader where document structure, Unicode, speech playback, and interrupted imports meet.'
pubDate: '2026-09-30'
topics: ['Reading & Listening', 'Android', 'Local-First']
kind: 'note'
status: 'Case study'
project: 'readout'
---

## The experience behind the architecture

A document reader starts with a familiar promise: open a file and continue reading. A listening companion extends that promise: turn the text into speech, pause it, and return without losing your place.

Readout is an Android application built around that experience. Its documented stack combines Kotlin, Jetpack Compose, Room, and the Android text-to-speech subsystem. The interesting engineering work happens between those components: extracting a sensible reading order, tracking position, and keeping narration aligned with the text.

This is a case study of the current implementation and project documentation. It does not report a usability study or a measured performance improvement.

## Import is more than opening a file

Different formats carry different kinds of structure. An EPUB describes a reading order through its package and spine. A DOCX document stores text in runs that can contain preserved spaces, tabs, and line breaks. A PDF may offer an extractable text layer, but that alone does not guarantee a natural reading order.

Readout has format-aware ingestion for PDF, EPUB, DOCX, plain text, and web articles. The design separates source-format parsing from the reading and listening surface. That gives both modes a shared representation of the extracted content.

The limitation matters too: text-layer extraction is not the same as optical character recognition. A scanned page needs additional handling. A clean-looking extraction can still require review when the source uses columns or unusual layout.

## Text has more than one size

A speech engine may limit input length. A string can be measured as UTF-16 code units, Unicode code points, or UTF-8 bytes, and these are not interchangeable.

Readout’s speech chunking implementation provides separate character and UTF-8 byte limits. It advances by code point, avoiding a split inside a surrogate pair, and prefers whitespace boundaries when possible. That is a specific implementation choice with a useful boundary: preserving code points does not automatically preserve every grapheme cluster, such as a sequence of characters that displays as one symbol.

Speech preparation also has to preserve meaning. A decimal, timestamp, abbreviation, or word in another language should not be casually rewritten just because a voice engine finds it awkward. Normalization is part of the content pipeline, not a cosmetic step at the end.

## Listening is a stateful interface

The documented playback design includes sentence-level narration, speech input splitting, a stall watchdog, speed controls, and interruption handling. Audio focus and headphone disconnect behavior matter because listening takes place alongside other phone activity.

A useful model keeps the document position separate from a provider’s transient playback state. Changing a voice, pausing, or recovering from a failed synthesis request should not silently change which passage the reader is following.

Optional translation introduces another asynchronous operation. Readout’s documentation describes generational request tokens so a response from an earlier document or language selection does not become the active result after the reader moves on.

## Recovery belongs in the product

The application uses Room for persistent document and reading state. Its import queue has a durable journal so interrupted batch imports have a recovery path. Backups are also treated as structured data operations rather than an uncontrolled file copy.

These are ordinary features with systems consequences. A reader notices them when an import is interrupted, an app process disappears, or a long document is opened again. Reliability is often the absence of a frustrating surprise.

## Local-first needs a clear boundary

Documents and reading progress are stored on the device. Optional online translation sends text to translation providers, and voice engines can have network-dependent modes. The project’s privacy documentation distinguishes these features from local reading and describes an offline-only voice preference.

That distinction is more useful than a blanket claim that every feature is always offline. Readers should be able to tell when a feature adds a network dependency.

## The next question

The implementation raises a good research question: how much meaning survives the path from imported document to spoken passage? A correctness benchmark would examine omitted text, reordered paragraphs, Unicode boundaries, and meaningful numeric expressions before judging voice quality.

The [document narration research proposal](/blog/document-narration-fidelity/) turns that question into an evaluation plan. The [workbench overview](/work/#readout) places it alongside the rest of the project.
