<p align="right"><a href="README.md">中文</a></p>

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="System Design Algorithms in JS — consistent hashing ring and Snowflake 64-bit layout: nodes and keys addressed clockwise around the ring, bit bar 1+41+5+5+12">
</p>

<p align="center">
  <a href="https://xiaosang.cc/system-design-algorithms-js/">▶ Interactive Web Lab</a>
  ·
  <a href="https://github.com/holynova/system-design-algorithms-js">GitHub Repository</a>
</p>

System Design Algorithms in JS implements the classic algorithms and data structures from all 28 chapters of Alex Xu's *System Design Interview: An Insider's Guide* (Volumes 1 & 2) in vanilla JavaScript (Node.js ES Modules), zero dependencies. Every module is self-contained and runnable, with 58 unit tests and an interactive web lab.

## Screenshot

<p align="center">
  <img src="./assets/readme/screenshot.png" width="700" alt="Web lab: Chapter 1 LRU and LFU cache strategies, a 28-chapter index on the left, explanations and complexity tags on the right">
</p>

## Catalog

The full index with complexity notes is in [`CATALOG.md`](./CATALOG.md). Volume 1 has 15 chapters, Volume 2 has 13 — 49 algorithm modules in total:

**Volume 1: Core System Design Components (15 chapters)**

| Ch | Topic | Core Algorithms |
|:---|:---|:---|
| 01 | Scale from Zero to Millions of Users | LRU / LFU caches (O(1) doubly-linked list + Map) |
| 02 | Back-of-the-Envelope Estimation | Capacity calculator, Jeff Dean latency table |
| 03 | A Framework for System Design Interviews | 4-step evaluator and self-check list |
| 04 | Rate Limiter | Token bucket, leaky bucket, fixed window, sliding-window log/counter |
| 05 | Consistent Hashing | Hash ring, virtual nodes (default ×100), clockwise binary search |
| 06 | Key-Value Store | Vector clocks, Merkle tree, Bloom filter, gossip, quorum |
| 07 | Unique ID Generator in Distributed Systems | Snowflake (64-bit BigInt, clock-rollback defense) |
| 08 | URL Shortener | Base62 encoding, truncated-hash salt probing |
| 09 | Web Crawler | Polite URL frontier, SimHash |
| 10 | Notification System | Exponential backoff (Full/Equal Jitter), idempotency deduplicator |
| 11 | News Feed System | Hybrid fanout, K-way timeline merge |
| 12 | Chat System | Message sequencer, presence management |
| 13 | Search Autocomplete System | Top-K prefix trie |
| 14 | YouTube | DAG task scheduler (topological sort + cycle detection) |
| 15 | Google Drive | Block-level delta sync and deduplication |

**Volume 2: High-Concurrency Systems in Practice (13 chapters)**

| Ch | Topic | Core Algorithms |
|:---|:---|:---|
| 01 | Proximity Service | GeoHash, quadtree |
| 02 | Nearby Friends | Haversine distance, grid pub/sub |
| 03 | Google Maps | A* pathfinding, Slippy Map tile math |
| 04 | Distributed Message Queue | Segmented commit log, partition assigner (Range / Round-Robin) |
| 05 | Metrics Monitoring and Alerting | Time-series downsampling, sliding-window alert evaluation |
| 06 | Ad Click Event Aggregation | Watermarked stream windows (late-event side output) |
| 07 | Hotel Reservation System | Cross-date inventory anti-oversell (optimistic lock + TTL lease) |
| 08 | Distributed Email Service | Inverted index, Boolean retrieval |
| 09 | S3-like Object Storage | Erasure coding (N data + M parity chunks) |
| 10 | Real-Time Gaming Leaderboard | Skip list (Redis ZSET internals, O(log N) rank) |
| 11 | Payment System | Double-entry ledger, two-way reconciliation |
| 12 | Digital Wallet | Saga orchestrator, two-phase commit (2PC) |
| 13 | Stock Exchange | Matching engine and limit order book (price-time priority) |

## Quick Start

Zero dependencies, Node.js ≥ 18, no `npm install` needed:

```bash
git clone https://github.com/holynova/system-design-algorithms-js.git
cd system-design-algorithms-js

npm test        # 58 tests, 30 suites, verified 58 passing / 0 failing
npm run web     # local web lab at http://localhost:3000
npm run demo    # terminal demo of every algorithm

# Run a single algorithm directly (each file carries its own demo)
node src/v2/ch10-leaderboard/skip-list.js
node src/v1/ch05-consistent-hash/consistent-hash-ring.js
node src/v1/ch04-rate-limiter/token-bucket.js
```

## Interactive Web Lab

`index.html` + `web/` is the online lab for all 28 chapters: each chapter has scenario context, explanations, SVG architecture diagrams, Mermaid sequence charts and a source browser — plus tunable playgrounds: rate-limiter traffic injection, Snowflake ID encode/decode, hash-ring scale simulation, live order-book matching. Search and light/dark themes included.

## Tech

- Pure Node.js native ES Modules, zero npm dependencies; tests use Node's built-in `node:test`.
- Thorough teaching comments: every file opens with the book's context, the math model, an ASCII topology and complexity analysis.
- Defensive design: clock rollback, hash-ring wrap-around, tie-breaking and boundary truncation — the production-grade pitfalls are handled.

```
src/index.js            Unified export entry
src/v1/                 Volume 1, 15 chapters (ch01-cache … ch15-google-drive)
src/v2/                 Volume 2, 13 chapters (ch01-proximity … ch13-exchange)
test/v1.test.js         Volume 1 tests (37 cases)
test/v2.test.js         Volume 2 tests (21 cases)
examples/               Terminal demo entry for all algorithms
web/                    Interactive lab (app.js / data.js / svg-diagrams.js)
CATALOG.md              28-chapter panoramic index with complexity table
```
