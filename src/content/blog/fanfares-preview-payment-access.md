---
title: 'Fanfares: from a public preview to purchased access'
description: 'A project story about connecting Nostr publishing, direct payments, encrypted content, and a comprehensible purchase flow.'
pubDate: '2026-09-30'
topics: ['Decentralized Publishing', 'Nostr', 'Payments']
kind: 'note'
status: 'Case study'
project: 'fanfares'
---

## A publishing problem before a protocol problem

A person deciding whether to buy a piece of digital content needs to understand what it is. A creator needs to show enough to make that decision possible without exposing everything being sold.

Fanfares brings that familiar publishing problem to Nostr. The project connects public previews, encrypted text and media, and Bitcoin payment flows. Its application client uses Next.js and TypeScript, while a companion Workers API handles payment verification and content-key delivery.

This account describes the documented project architecture and representative client code. It is collaborative project engineering; it does not claim sole authorship of the platform or an independent security audit.

## Preview and payload serve different purposes

The public portion of a publication helps someone discover and evaluate it. The protected portion carries the content available after purchase. Fanfares’ project documentation describes partially encrypted publications, including public text previews and preview audio alongside protected content.

This is an application convention. It should not be presented as a universally supported Nostr standard. Other clients can understand only the conventions they implement.

The interface needs to make the boundary legible. A preview is not a failed download. A locked chapter is not a broken player. Clear access states are part of making protocol-driven publishing usable.

## Payment is one event in a longer flow

The intended flow connects a publication to its payment recipients, then verifies the resulting payment evidence before releasing access. The project supports Lightning and Cashu payment paths.

NIP-57 describes Lightning zaps and their associated events [1]. Fanfares’ handling of payment evidence and encrypted access belongs to its own application architecture. A standard zap receipt and an application access decision are related, but they are not the same object.

The useful separation is:

```text
Discover preview → initiate payment → verify evidence → obtain key → open content
```

Each transition can have a different failure. A wallet can pay while a relay response is delayed. Verification can succeed while a media request fails. A purchase interface should retain enough state to recover rather than encouraging an unnecessary second payment.

## Key delivery defines a trust boundary

Decentralized publication does not remove every service dependency. In the documented architecture, the Workers API participates in verifying payments and delivering keys to eligible buyers.

That means a credible description should distinguish content distribution from the access service. Relay-based discovery can be decentralized while a particular access mechanism still depends on a service. Hiding that distinction would make the project sound more sovereign than its actual architecture establishes.

The engineering questions follow from the boundary: how are receipts associated with a buyer and publication, how are retries treated, and how do old purchases continue to resolve after a key lifecycle changes?

## Storage has its own contract

Content references need a storage path as well as a publishing path. The current client documentation includes a storage interface integrated with paid Blossom storage. Capacity purchases, quota reporting, and uploads therefore belong to the larger publishing experience.

The reader-facing interface should present the consequence of these operations. The protocol details become useful when a creator needs to understand access, retention, or ownership; they should not overwhelm a routine action.

## What this project illustrates

The product challenge is continuity across discovery, payment, access, and playback. Each subsystem can be reasonable on its own while the combined experience still fails at a boundary.

That is why Fanfares is a useful place to study systems through a product lens. The [workbench overview](/work/#fanfares) summarizes the project, and the [paid-storage case study](/blog/blossom-accounting-for-paid-storage/) follows one of its infrastructure dependencies.

## Reference

1. Nostr protocol contributors. [NIP-57: Lightning Zaps](https://github.com/nostr-protocol/nips/blob/master/57.md). Reference for the Lightning zap event flow, not a specification of Fanfares’ encrypted-access convention.
