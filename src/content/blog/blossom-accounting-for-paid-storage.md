---
title: 'Blossom: accounting for the storage you sell'
description: 'Inside a paid-storage extension where invoices, capacity grants, deduplicated blobs, and concurrent uploads share a ledger.'
pubDate: '2026-09-30'
topics: ['Storage Infrastructure', 'Blossom', 'Concurrency']
kind: 'note'
status: 'Case study'
project: 'blossom'
---

## A capacity promise needs an accounting model

Selling storage sounds like a simple exchange: a person pays, and a service gives them space. The engineering problem becomes more interesting when two uploads arrive together, a purchase is retried, or a storage grant expires.

The paid-storage extension connects these operations to a Nostr public key. It builds on the open-source Blossom server by hzrd149 and contributors. This article focuses on the extension’s documented account and quota model; it does not claim the upstream server or protocol as an original project.

## A file address is not an account balance

Blossom addresses binary content by its SHA-256 hash [1]. That gives the content layer a stable address. Account capacity is a separate concern: who can upload, how much space they have, and what retention policy applies.

A paid-storage account combines authenticated identity, purchases, and capacity grants. The extension exposes account information to the client, including active grants, usage, and stored files. Its service records purchase states such as pending, paid, expired, and failed.

Keeping those concepts separate helps explain a difficult state: the existence of a file does not itself show that a particular account has current capacity to upload another one.

## Reservations close a concurrency gap

Checking free space before an upload does not reserve that space. If two operations check simultaneously, they can both see the same available capacity.

The extension’s accounting includes upload reservations. Its quota summary combines capacity from active grants with used bytes and bytes reserved by in-flight uploads. Conceptually:

```text
available capacity = max(0, active capacity − used bytes − reserved bytes)
```

That equation describes the accounting model, not a proof that every concurrent path is correct. Correctness also depends on how reservations are created, committed, expired, and released after failure.

Those lifecycle boundaries are where testing earns its keep. Interrupted bodies, duplicate requests, and abandoned reservations should be represented in an explicit recovery model.

## A payment can arrive more than once in the application

A retry does not always mean a second purchase. Clients can retry after a timeout even if a previous operation committed. The storage service therefore needs a stable association between a purchase and the capacity it activates.

The database layer separates purchase records from storage grants. It also includes an outbox operation designed to be part of the transaction that activates capacity. The implementation makes these transitions inspectable rather than reducing them to a single boolean in the interface.

This is a case-study description, not a claim that every payment failure has been experimentally covered.

## Deduplication changes the questions

Content-addressed storage can recognize an already stored blob. That raises an accounting question distinct from physical disk usage: should a second account referencing the same bytes consume capacity, and what ownership or retention rules apply?

The answer should be a documented policy. Otherwise, a backend optimization can silently become a change to the customer’s storage contract.

Expiry has a similar boundary. Losing permission to upload, losing a capacity grant, and deleting an existing file are separate events. The client should explain the applicable behavior instead of leaving a person to infer it from an error.

## The user interface is part of the ledger

The Fanfares storage screen connects the backend model to purchasing and managing capacity. A useful interface distinguishes pending payment, credited capacity, current usage, and the next available action.

The deep engineering lesson is that infrastructure promises need visible state. A clear account model benefits the database, recovery logic, and the person deciding whether to trust the service.

See the [workbench overview](/work/#blossom) for the stack and scope, or the [Fanfares project story](/blog/fanfares-preview-payment-access/) for the publishing experience around it.

## Upstream reference

1. hzrd149 and contributors. [Blossom protocol](https://github.com/hzrd149/blossom). Upstream content-addressed storage specification. The paid-storage extension described here is an additional application layer.
