/**
 * System Design Algorithms - Handcrafted SVG Visualizations
 * Provides clean, scalable, standalone SVG diagrams for key algorithmic concepts.
 */

export const SvgDiagrams = {
  /**
   * LRU / LFU Cache Architecture
   * Double Linked List + Hash Map O(1)
   */
  lruCache: () => `
    <svg viewBox="0 0 760 280" width="100%" height="280" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#58a6ff" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f85149" />
        </marker>
        <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1f2937" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
        <linearGradient id="mapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e3a8a" />
          <stop offset="100%" stop-color="#172554" />
        </linearGradient>
      </defs>

      <!-- Hash Map Section -->
      <g transform="translate(30, 20)">
        <rect width="700" height="60" rx="8" fill="url(#mapGrad)" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="20" y="35" fill="#93c5fd" font-size="14" font-weight="bold">Hash Map (Key → Node Pointer)</text>
        
        <rect x="230" y="15" width="80" height="30" rx="4" fill="#1e293b" stroke="#60a5fa"/>
        <text x="270" y="35" fill="#f8fafc" font-size="12" text-anchor="middle">"A": Node(A)</text>

        <rect x="330" y="15" width="80" height="30" rx="4" fill="#1e293b" stroke="#60a5fa"/>
        <text x="370" y="35" fill="#f8fafc" font-size="12" text-anchor="middle">"B": Node(B)</text>

        <rect x="430" y="15" width="80" height="30" rx="4" fill="#1e293b" stroke="#60a5fa"/>
        <text x="470" y="35" fill="#f8fafc" font-size="12" text-anchor="middle">"C": Node(C)</text>

        <text x="610" y="35" fill="#38bdf8" font-size="12">O(1) Hash Lookup</text>
      </g>

      <!-- Doubly Linked List Section -->
      <g transform="translate(30, 130)">
        <!-- Head Sentinel -->
        <rect x="10" y="20" width="80" height="60" rx="6" fill="#047857" stroke="#10b981" stroke-width="1.5"/>
        <text x="50" y="45" fill="#ecfdf5" font-size="13" font-weight="bold" text-anchor="middle">HEAD</text>
        <text x="50" y="65" fill="#a7f3d0" font-size="10" text-anchor="middle">Sentinel</text>

        <!-- Node A (MRU) -->
        <rect x="160" y="15" width="110" height="70" rx="6" fill="url(#nodeGrad)" stroke="#3b82f6" stroke-width="2"/>
        <text x="215" y="38" fill="#60a5fa" font-size="11" font-weight="bold" text-anchor="middle">Most Recently Used</text>
        <text x="215" y="58" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">Node A: (v1)</text>
        <text x="215" y="74" fill="#94a3b8" font-size="10" text-anchor="middle">prev ⇄ next</text>

        <!-- Node B -->
        <rect x="340" y="15" width="110" height="70" rx="6" fill="url(#nodeGrad)" stroke="#64748b" stroke-width="1.5"/>
        <text x="395" y="42" fill="#cbd5e1" font-size="11" text-anchor="middle">Node B: (v2)</text>
        <text x="395" y="65" fill="#94a3b8" font-size="10" text-anchor="middle">prev ⇄ next</text>

        <!-- Node C (LRU) -->
        <rect x="520" y="15" width="110" height="70" rx="6" fill="url(#nodeGrad)" stroke="#f85149" stroke-width="2"/>
        <text x="575" y="38" fill="#f87171" font-size="11" font-weight="bold" text-anchor="middle">Least Recently Used</text>
        <text x="575" y="58" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">Node C: (v3)</text>
        <text x="575" y="74" fill="#fca5a5" font-size="10" text-anchor="middle">← Evict on Full</text>

        <!-- Tail Sentinel -->
        <rect x="670" y="20" width="50" height="60" rx="6" fill="#b91c1c" stroke="#ef4444" stroke-width="1.5"/>
        <text x="695" y="45" fill="#fef2f2" font-size="13" font-weight="bold" text-anchor="middle">TAIL</text>
        <text x="695" y="65" fill="#fecaca" font-size="10" text-anchor="middle">Sentinel</text>

        <!-- Pointers (Arrows) -->
        <!-- Head <-> Node A -->
        <line x1="90" y1="40" x2="155" y2="40" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="155" y1="60" x2="95" y2="60" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>

        <!-- Node A <-> Node B -->
        <line x1="270" y1="40" x2="335" y2="40" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="335" y1="60" x2="275" y2="60" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>

        <!-- Node B <-> Node C -->
        <line x1="450" y1="40" x2="515" y2="40" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="515" y1="60" x2="455" y2="60" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>

        <!-- Node C <-> Tail -->
        <line x1="630" y1="40" x2="665" y2="40" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="665" y1="60" x2="635" y2="60" stroke="#58a6ff" stroke-width="2" marker-end="url(#arrow)"/>
      </g>

      <!-- Map pointer down lines -->
      <path d="M 300 80 L 300 110 L 215 110 L 215 140" fill="none" stroke="#60a5fa" stroke-dasharray="4,4" stroke-width="1.5" marker-end="url(#arrow)"/>
      <path d="M 400 80 L 400 140" fill="none" stroke="#60a5fa" stroke-dasharray="4,4" stroke-width="1.5" marker-end="url(#arrow)"/>
      <path d="M 500 80 L 500 110 L 575 110 L 575 140" fill="none" stroke="#60a5fa" stroke-dasharray="4,4" stroke-width="1.5" marker-end="url(#arrow)"/>

      <!-- Eviction indicator -->
      <path d="M 600 210 L 600 230 L 630 230" fill="none" stroke="#f85149" stroke-width="2" marker-end="url(#arrow-red)"/>
      <text x="640" y="235" fill="#f87171" font-size="12" font-weight="bold">O(1) Pop Tail.prev</text>
    </svg>
  `,

  /**
   * Token Bucket & Rate Limiting
   */
  tokenBucket: () => `
    <svg viewBox="0 0 760 290" width="100%" height="290" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <defs>
        <marker id="tb-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker id="tb-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
        <marker id="tb-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
        </marker>
      </defs>

      <!-- Token Refill Supplier -->
      <g transform="translate(40, 30)">
        <rect width="180" height="70" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="90" y="32" fill="#38bdf8" font-size="13" font-weight="bold" text-anchor="middle">Refill Rate (r)</text>
        <text x="90" y="55" fill="#94a3b8" font-size="12" text-anchor="middle">+r tokens / second</text>
      </g>

      <!-- Refill Arrow down -->
      <line x1="130" y1="100" x2="130" y2="150" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#tb-arrow)"/>

      <!-- The Bucket -->
      <g transform="translate(60, 155)">
        <!-- Bucket Outline (trapezoid-like) -->
        <path d="M 0 0 L 140 0 L 125 100 L 15 100 Z" fill="#0f172a" stroke="#64748b" stroke-width="2.5"/>
        
        <!-- Overflow line -->
        <line x1="140" y1="20" x2="190" y2="20" stroke="#eab308" stroke-dasharray="3,3"/>
        <text x="195" y="24" fill="#eab308" font-size="11">Capacity (Overflow discarded)</text>

        <!-- Tokens inside -->
        <circle cx="50" cy="80" r="10" fill="#38bdf8"/>
        <circle cx="75" cy="80" r="10" fill="#38bdf8"/>
        <circle cx="95" cy="80" r="10" fill="#38bdf8"/>
        <circle cx="60" cy="55" r="10" fill="#38bdf8"/>
        <circle cx="85" cy="55" r="10" fill="#38bdf8"/>
        
        <text x="70" y="35" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Tokens (Max C)</text>
      </g>

      <!-- Incoming Request Stream -->
      <g transform="translate(320, 100)">
        <rect width="180" height="70" rx="8" fill="#1e293b" stroke="#818cf8" stroke-width="1.5"/>
        <text x="90" y="32" fill="#c7d2fe" font-size="13" font-weight="bold" text-anchor="middle">Incoming Requests</text>
        <text x="90" y="55" fill="#a5b4fc" font-size="12" text-anchor="middle">1 Token per Request</text>
      </g>

      <!-- Check Decision Diamond -->
      <g transform="translate(560, 95)">
        <polygon points="50,0 100,40 50,80 0,40" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
        <text x="50" y="44" fill="#fef08a" font-size="11" font-weight="bold" text-anchor="middle">Tokens ≥ 1 ?</text>
      </g>

      <!-- Connectors -->
      <!-- Bucket -> Check -->
      <path d="M 185 205 L 300 205 L 300 135 L 320 135" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#tb-arrow)"/>
      <line x1="500" y1="135" x2="555" y2="135" stroke="#818cf8" stroke-width="2" marker-end="url(#tb-arrow)"/>

      <!-- Diamond Outcomes -->
      <!-- YES -> Forward Request -->
      <line x1="610" y1="95" x2="610" y2="40" stroke="#34d399" stroke-width="2"/>
      <line x1="610" y1="40" x2="660" y2="40" stroke="#34d399" stroke-width="2" marker-end="url(#tb-arrow-green)"/>
      <text x="618" y="70" fill="#34d399" font-size="11" font-weight="bold">YES</text>
      <rect x="660" y="20" width="85" height="40" rx="4" fill="#065f46" stroke="#10b981"/>
      <text x="702" y="45" fill="#ecfdf5" font-size="12" font-weight="bold" text-anchor="middle">Pass (200 OK)</text>

      <!-- NO -> 429 Drop -->
      <line x1="610" y1="175" x2="610" y2="230" stroke="#f87171" stroke-width="2"/>
      <line x1="610" y1="230" x2="660" y2="230" stroke="#f87171" stroke-width="2" marker-end="url(#tb-arrow-red)"/>
      <text x="618" y="205" fill="#f87171" font-size="11" font-weight="bold">NO</text>
      <rect x="660" y="210" width="85" height="40" rx="4" fill="#7f1d1d" stroke="#ef4444"/>
      <text x="702" y="235" fill="#fef2f2" font-size="11" font-weight="bold" text-anchor="middle">Drop (429)</text>
    </svg>
  `,

  /**
   * Consistent Hashing Ring with Virtual Nodes
   */
  consistentHashRing: () => `
    <svg viewBox="0 0 760 360" width="100%" height="360" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <defs>
        <marker id="ring-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 2 L 8 5 L 0 8 z" fill="#60a5fa" />
        </marker>
        <radialGradient id="ringBg" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stop-color="#0b1329" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#1e293b" stop-opacity="0.2"/>
        </radialGradient>
      </defs>

      <!-- Circle Hash Ring -->
      <g transform="translate(260, 180)">
        <!-- Outer circle range -->
        <circle cx="0" cy="0" r="140" fill="url(#ringBg)" stroke="#334155" stroke-width="4"/>
        <circle cx="0" cy="0" r="140" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4"/>

        <!-- Clockwise indicator arc -->
        <path d="M -70 -121 A 140 140 0 0 1 70 -121" fill="none" stroke="#60a5fa" stroke-width="3" marker-end="url(#ring-arrow)"/>
        <text x="0" y="-95" fill="#93c5fd" font-size="11" font-weight="bold" text-anchor="middle">Clockwise Lookup ↻</text>

        <!-- Center 2^32-1 Label -->
        <text x="0" y="5" fill="#cbd5e1" font-size="14" font-weight="bold" text-anchor="middle">Hash Ring</text>
        <text x="0" y="24" fill="#64748b" font-size="11" text-anchor="middle">[0, 2³² - 1]</text>

        <!-- Physical Node A & its virtual nodes (Blue) -->
        <!-- Node A#0 at 0 deg (140, 0) -->
        <circle cx="140" cy="0" r="12" fill="#2563eb" stroke="#bfdbfe" stroke-width="2"/>
        <text x="140" y="4" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">A-0</text>

        <!-- Node A#1 at 180 deg (-140, 0) -->
        <circle cx="-140" cy="0" r="12" fill="#2563eb" stroke="#bfdbfe" stroke-width="2"/>
        <text x="-140" y="4" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">A-1</text>

        <!-- Physical Node B & its virtual nodes (Green) -->
        <!-- Node B#0 at 90 deg (0, 140) -->
        <circle cx="0" cy="140" r="12" fill="#059669" stroke="#a7f3d0" stroke-width="2"/>
        <text x="0" y="144" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">B-0</text>

        <!-- Node B#1 at 270 deg (0, -140) -->
        <circle cx="0" cy="-140" r="12" fill="#059669" stroke="#a7f3d0" stroke-width="2"/>
        <text x="0" y="-136" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">B-1</text>

        <!-- Physical Node C & its virtual nodes (Purple) -->
        <!-- Node C#0 at 45 deg (99, 99) -->
        <circle cx="99" cy="99" r="12" fill="#7c3aed" stroke="#ddd6fe" stroke-width="2"/>
        <text x="99" y="103" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">C-0</text>

        <!-- Node C#1 at 225 deg (-99, -99) -->
        <circle cx="-99" cy="-99" r="12" fill="#7c3aed" stroke="#ddd6fe" stroke-width="2"/>
        <text x="-99" y="-95" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">C-1</text>

        <!-- Data Keys placed on the ring -->
        <!-- Key 1 at 20 deg (131, 48) -> route clockwise to C-0 (99,99) -->
        <circle cx="131" cy="48" r="6" fill="#f59e0b"/>
        <text x="155" y="52" fill="#fbbf24" font-size="11" font-weight="bold">k1 → C-0</text>

        <!-- Key 2 at 120 deg (-70, 121) -> route clockwise to A-1 (-140, 0) -->
        <circle cx="-70" cy="121" r="6" fill="#f59e0b"/>
        <text x="-120" y="140" fill="#fbbf24" font-size="11" font-weight="bold">k2 → A-1</text>

        <!-- Key 3 at 300 deg (70, -121) -> route clockwise to A-0 (140, 0) -->
        <circle cx="70" cy="-121" r="6" fill="#f59e0b"/>
        <text x="95" y="-125" fill="#fbbf24" font-size="11" font-weight="bold">k3 → A-0</text>
      </g>

      <!-- Right Side Explanations -->
      <g transform="translate(530, 40)">
        <rect width="210" height="280" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
        <text x="20" y="30" fill="#f8fafc" font-size="14" font-weight="bold">Core Highlights</text>

        <!-- Virtual Nodes -->
        <circle cx="28" cy="65" r="6" fill="#2563eb"/>
        <text x="42" y="69" fill="#93c5fd" font-size="12" font-weight="bold">Virtual Nodes (VN)</text>
        <text x="28" y="90" fill="#94a3b8" font-size="11">Each node mapped to K points</text>
        <text x="28" y="106" fill="#94a3b8" font-size="11">Eliminates data skewing.</text>

        <!-- Binary Search -->
        <circle cx="28" cy="135" r="6" fill="#059669"/>
        <text x="42" y="139" fill="#6ee7b7" font-size="12" font-weight="bold">Binary Search</text>
        <text x="28" y="160" fill="#94a3b8" font-size="11">Ring stored in sorted array.</text>
        <text x="28" y="176" fill="#94a3b8" font-size="11">O(log VN) lookup clockwise.</text>

        <!-- Minimal Migration -->
        <circle cx="28" cy="205" r="6" fill="#f59e0b"/>
        <text x="42" y="209" fill="#fde68a" font-size="12" font-weight="bold">Minimal Migration</text>
        <text x="28" y="230" fill="#94a3b8" font-size="11">Add/Remove node migrates</text>
        <text x="28" y="246" fill="#94a3b8" font-size="11">only 1/N fraction of keys!</text>
      </g>
    </svg>
  `,

  /**
   * Twitter Snowflake 64-bit ID Structure
   */
  snowflake: () => `
    <svg viewBox="0 0 760 220" width="100%" height="220" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Title -->
      <text x="380" y="30" fill="#f8fafc" font-size="16" font-weight="bold" text-anchor="middle">Twitter Snowflake 64-bit ID Binary Layout</text>

      <!-- 64-bit Segment Bar -->
      <g transform="translate(30, 60)">
        <!-- 1 bit: Sign -->
        <rect x="0" y="0" width="35" height="65" rx="4" fill="#374151" stroke="#9ca3af" stroke-width="1.5"/>
        <text x="17.5" y="32" fill="#f3f4f6" font-size="13" font-weight="bold" text-anchor="middle">0</text>
        <text x="17.5" y="50" fill="#9ca3af" font-size="10" text-anchor="middle">1 bit</text>

        <!-- 41 bits: Timestamp -->
        <rect x="42" y="0" width="370" height="65" rx="4" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="227" y="30" fill="#bfdbfe" font-size="14" font-weight="bold" text-anchor="middle">Timestamp (Milliseconds delta)</text>
        <text x="227" y="50" fill="#93c5fd" font-size="11" text-anchor="middle">41 bits (~69 years from custom epoch)</text>

        <!-- 5 bits: Datacenter ID -->
        <rect x="419" y="0" width="90" height="65" rx="4" fill="#065f46" stroke="#10b981" stroke-width="1.5"/>
        <text x="464" y="30" fill="#a7f3d0" font-size="13" font-weight="bold" text-anchor="middle">Datacenter</text>
        <text x="464" y="50" fill="#6ee7b7" font-size="11" text-anchor="middle">5 bits (0-31)</text>

        <!-- 5 bits: Worker ID -->
        <rect x="516" y="0" width="80" height="65" rx="4" fill="#581c87" stroke="#a855f7" stroke-width="1.5"/>
        <text x="556" y="30" fill="#e9d5ff" font-size="13" font-weight="bold" text-anchor="middle">Worker</text>
        <text x="556" y="50" fill="#c084fc" font-size="11" text-anchor="middle">5 bits (0-31)</text>

        <!-- 12 bits: Sequence -->
        <rect x="603" y="0" width="97" height="65" rx="4" fill="#7c2d12" stroke="#f97316" stroke-width="1.5"/>
        <text x="651" y="30" fill="#fed7aa" font-size="13" font-weight="bold" text-anchor="middle">Sequence</text>
        <text x="651" y="50" fill="#fdba74" font-size="11" text-anchor="middle">12 bits (4096/ms)</text>
      </g>

      <!-- Details beneath -->
      <g transform="translate(30, 155)">
        <text x="0" y="0" fill="#9ca3af" font-size="11">Sign Bit (Fixed 0)</text>
        <text x="42" y="0" fill="#60a5fa" font-size="11">• 2⁴¹ ms ≈ 2.19 × 10¹² ms ≈ 69.7 Years</text>
        <text x="42" y="18" fill="#60a5fa" font-size="11">• Natural chronological sorting</text>

        <text x="419" y="0" fill="#34d399" font-size="11">32 DCs</text>
        <text x="516" y="0" fill="#c084fc" font-size="11">32 Workers</text>
        <text x="419" y="18" fill="#a7f3d0" font-size="11">Up to 1024 distinct generator nodes</text>

        <text x="603" y="0" fill="#fb923c" font-size="11">Max 4,096 IDs / ms</text>
        <text x="603" y="18" fill="#fb923c" font-size="11">4.096 Million IDs / sec / node</text>
      </g>
    </svg>
  `,

  /**
   * Merkle Tree Binary Hash Tree
   */
  merkleTree: () => `
    <svg viewBox="0 0 760 300" width="100%" height="300" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <defs>
        <linearGradient id="rootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#b91c1c"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
      </defs>

      <!-- Root Hash -->
      <g transform="translate(290, 20)">
        <rect width="180" height="50" rx="8" fill="url(#rootGrad)" stroke="#ef4444" stroke-width="2"/>
        <text x="90" y="25" fill="#fecaca" font-size="13" font-weight="bold" text-anchor="middle">Top Merkle Root</text>
        <text x="90" y="42" fill="#fee2e2" font-size="11" text-anchor="middle">H(12 + 34)</text>
      </g>

      <!-- Connecting lines Level 1 -->
      <line x1="340" y1="70" x2="200" y2="110" stroke="#64748b" stroke-width="2"/>
      <line x1="420" y1="70" x2="560" y2="110" stroke="#64748b" stroke-width="2"/>

      <!-- Level 1 Intermediate Hashes -->
      <g transform="translate(130, 110)">
        <rect width="140" height="45" rx="6" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="70" y="24" fill="#bfdbfe" font-size="12" font-weight="bold" text-anchor="middle">Hash(12)</text>
        <text x="70" y="38" fill="#93c5fd" font-size="10" text-anchor="middle">H( Hash(1) + Hash(2) )</text>
      </g>

      <g transform="translate(490, 110)">
        <rect width="140" height="45" rx="6" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="70" y="24" fill="#bfdbfe" font-size="12" font-weight="bold" text-anchor="middle">Hash(34)</text>
        <text x="70" y="38" fill="#93c5fd" font-size="10" text-anchor="middle">H( Hash(3) + Hash(4) )</text>
      </g>

      <!-- Connecting lines Level 2 -->
      <line x1="170" y1="155" x2="100" y2="195" stroke="#64748b" stroke-width="1.5"/>
      <line x1="230" y1="155" x2="270" y2="195" stroke="#64748b" stroke-width="1.5"/>
      <line x1="530" y1="155" x2="460" y2="195" stroke="#64748b" stroke-width="1.5"/>
      <line x1="600" y1="155" x2="630" y2="195" stroke="#64748b" stroke-width="1.5"/>

      <!-- Leaf Hashes -->
      <g transform="translate(50, 195)">
        <rect width="100" height="35" rx="4" fill="#065f46" stroke="#10b981"/>
        <text x="50" y="22" fill="#a7f3d0" font-size="11" font-weight="bold" text-anchor="middle">Hash(Data 1)</text>
      </g>
      <g transform="translate(220, 195)">
        <rect width="100" height="35" rx="4" fill="#065f46" stroke="#10b981"/>
        <text x="50" y="22" fill="#a7f3d0" font-size="11" font-weight="bold" text-anchor="middle">Hash(Data 2)</text>
      </g>
      <g transform="translate(410, 195)">
        <rect width="100" height="35" rx="4" fill="#065f46" stroke="#10b981"/>
        <text x="50" y="22" fill="#a7f3d0" font-size="11" font-weight="bold" text-anchor="middle">Hash(Data 3)</text>
      </g>
      <g transform="translate(580, 195)">
        <rect width="100" height="35" rx="4" fill="#065f46" stroke="#10b981"/>
        <text x="50" y="22" fill="#a7f3d0" font-size="11" font-weight="bold" text-anchor="middle">Hash(Data 4)</text>
      </g>

      <!-- Underlying Data Chunks -->
      <g transform="translate(50, 245)">
        <rect width="100" height="30" rx="4" fill="#1e293b" stroke="#475569"/>
        <text x="50" y="19" fill="#cbd5e1" font-size="11" text-anchor="middle">Data Block 1</text>
      </g>
      <g transform="translate(220, 245)">
        <rect width="100" height="30" rx="4" fill="#1e293b" stroke="#475569"/>
        <text x="50" y="19" fill="#cbd5e1" font-size="11" text-anchor="middle">Data Block 2</text>
      </g>
      <g transform="translate(410, 245)">
        <rect width="100" height="30" rx="4" fill="#1e293b" stroke="#475569"/>
        <text x="50" y="19" fill="#cbd5e1" font-size="11" text-anchor="middle">Data Block 3</text>
      </g>
      <g transform="translate(580, 245)">
        <rect width="100" height="30" rx="4" fill="#1e293b" stroke="#475569"/>
        <text x="50" y="19" fill="#cbd5e1" font-size="11" text-anchor="middle">Data Block 4</text>
      </g>

      <!-- Audit Benefit Callout -->
      <text x="380" y="290" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">
        Audit Inconsistency in O(log N) comparisons across replicas
      </text>
    </svg>
  `,

  /**
   * QuadTree Spatial Partitioning
   */
  quadTree: () => `
    <svg viewBox="0 0 760 300" width="100%" height="300" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Left: 2D Spatial Subdivisions -->
      <g transform="translate(40, 25)">
        <!-- Outer Root Boundary -->
        <rect width="250" height="250" fill="#0f172a" stroke="#60a5fa" stroke-width="2"/>
        
        <!-- Primary 4 Quadrants -->
        <line x1="125" y1="0" x2="125" y2="250" stroke="#3b82f6" stroke-width="1.5"/>
        <line x1="0" y1="125" x2="250" y2="125" stroke="#3b82f6" stroke-width="1.5"/>

        <!-- Quadrant Labels -->
        <text x="60" y="30" fill="#64748b" font-size="13" font-weight="bold">NW</text>
        <text x="180" y="30" fill="#64748b" font-size="13" font-weight="bold">NE</text>
        <text x="60" y="155" fill="#64748b" font-size="13" font-weight="bold">SW</text>
        <text x="180" y="155" fill="#64748b" font-size="13" font-weight="bold">SE</text>

        <!-- Subdivided NE quadrant due to capacity > K -->
        <line x1="187.5" y1="0" x2="187.5" y2="125" stroke="#a855f7" stroke-width="1"/>
        <line x1="125" y1="62.5" x2="250" y2="62.5" stroke="#a855f7" stroke-width="1"/>

        <!-- Points of Interest (Pois) -->
        <circle cx="40" cy="80" r="4" fill="#38bdf8"/>
        <circle cx="85" cy="50" r="4" fill="#38bdf8"/>
        
        <circle cx="150" cy="30" r="4" fill="#ec4899"/>
        <circle cx="165" cy="45" r="4" fill="#ec4899"/>
        <circle cx="210" cy="20" r="4" fill="#ec4899"/>
        <circle cx="230" cy="90" r="4" fill="#ec4899"/>
        <circle cx="205" cy="100" r="4" fill="#ec4899"/>

        <circle cx="50" cy="200" r="4" fill="#38bdf8"/>
        <circle cx="170" cy="190" r="4" fill="#38bdf8"/>

        <!-- Search Radius Circle -->
        <circle cx="160" cy="40" r="45" fill="none" stroke="#eab308" stroke-width="2" stroke-dasharray="4,4"/>
        <text x="160" y="-8" fill="#facc15" font-size="11" font-weight="bold" text-anchor="middle">Query Range</text>
      </g>

      <!-- Right: Tree Representation -->
      <g transform="translate(360, 25)">
        <rect width="360" height="250" rx="8" fill="#1e293b" stroke="#334155"/>
        <text x="180" y="25" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">QuadTree Hierarchy</text>

        <!-- Root Node -->
        <rect x="140" y="45" width="80" height="30" rx="4" fill="#2563eb" stroke="#60a5fa"/>
        <text x="180" y="65" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">Root</text>

        <!-- Connectors -->
        <line x1="180" y1="75" x2="60" y2="120" stroke="#64748b" stroke-width="1.5"/>
        <line x1="180" y1="75" x2="140" y2="120" stroke="#64748b" stroke-width="1.5"/>
        <line x1="180" y1="75" x2="220" y2="120" stroke="#64748b" stroke-width="1.5"/>
        <line x1="180" y1="75" x2="300" y2="120" stroke="#64748b" stroke-width="1.5"/>

        <!-- Level 1 Children -->
        <rect x="35" y="120" width="50" height="25" rx="3" fill="#047857"/>
        <text x="60" y="137" fill="#a7f3d0" font-size="10" text-anchor="middle">NW (2)</text>

        <!-- NE is split! -->
        <rect x="115" y="120" width="50" height="25" rx="3" fill="#6d28d9" stroke="#c084fc"/>
        <text x="140" y="137" fill="#f3e8ff" font-size="10" font-weight="bold" text-anchor="middle">NE (*)</text>

        <rect x="195" y="120" width="50" height="25" rx="3" fill="#047857"/>
        <text x="220" y="137" fill="#a7f3d0" font-size="10" text-anchor="middle">SW (1)</text>

        <rect x="275" y="120" width="50" height="25" rx="3" fill="#047857"/>
        <text x="300" y="137" fill="#a7f3d0" font-size="10" text-anchor="middle">SE (1)</text>

        <!-- NE Sub-branches -->
        <line x1="140" y1="145" x2="110" y2="185" stroke="#9333ea" stroke-width="1.5"/>
        <line x1="140" y1="145" x2="170" y2="185" stroke="#9333ea" stroke-width="1.5"/>

        <rect x="90" y="185" width="40" height="22" rx="3" fill="#047857"/>
        <text x="110" y="200" fill="#a7f3d0" font-size="9" text-anchor="middle">ne-NW</text>

        <rect x="150" y="185" width="40" height="22" rx="3" fill="#047857"/>
        <text x="170" y="200" fill="#a7f3d0" font-size="9" text-anchor="middle">ne-SE</text>

        <text x="180" y="235" fill="#38bdf8" font-size="11" text-anchor="middle">Adaptive splitting: Dense cities split deep, oceans 1 cell</text>
      </g>
    </svg>
  `,

  /**
   * Redis ZSET / Skip List Multi-level Forward Pointers
   */
  skipList: () => `
    <svg viewBox="0 0 760 260" width="100%" height="260" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <defs>
        <marker id="sk-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
      </defs>

      <!-- Head Column -->
      <g transform="translate(40, 40)">
        <rect width="60" height="180" rx="4" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="30" y="25" fill="#bfdbfe" font-size="12" font-weight="bold" text-anchor="middle">HEAD</text>
        <line x1="0" y1="45" x2="60" y2="45" stroke="#3b82f6"/>
        <line x1="0" y1="90" x2="60" y2="90" stroke="#3b82f6"/>
        <line x1="0" y1="135" x2="60" y2="135" stroke="#3b82f6"/>

        <text x="30" y="40" fill="#93c5fd" font-size="10" text-anchor="middle">L3</text>
        <text x="30" y="85" fill="#93c5fd" font-size="10" text-anchor="middle">L2</text>
        <text x="30" y="130" fill="#93c5fd" font-size="10" text-anchor="middle">L1</text>
        <text x="30" y="170" fill="#93c5fd" font-size="10" text-anchor="middle">L0</text>
      </g>

      <!-- Node 1 (score: 10, height: 1) -->
      <g transform="translate(180, 175)">
        <rect width="55" height="45" rx="4" fill="#1e293b" stroke="#64748b"/>
        <text x="27.5" y="22" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">10</text>
        <text x="27.5" y="38" fill="#94a3b8" font-size="9" text-anchor="middle">User A</text>
      </g>

      <!-- Node 2 (score: 25, height: 3) -->
      <g transform="translate(320, 85)">
        <rect width="55" height="135" rx="4" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
        <text x="27.5" y="22" fill="#a7f3d0" font-size="10" text-anchor="middle">L2</text>
        <line x1="0" y1="45" x2="55" y2="45" stroke="#10b981"/>
        <text x="27.5" y="67" fill="#a7f3d0" font-size="10" text-anchor="middle">L1</text>
        <line x1="0" y1="90" x2="55" y2="90" stroke="#10b981"/>
        <text x="27.5" y="112" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">25</text>
        <text x="27.5" y="128" fill="#94a3b8" font-size="9" text-anchor="middle">User B</text>
      </g>

      <!-- Node 3 (score: 40, height: 2) -->
      <g transform="translate(460, 130)">
        <rect width="55" height="90" rx="4" fill="#1e293b" stroke="#64748b"/>
        <text x="27.5" y="22" fill="#cbd5e1" font-size="10" text-anchor="middle">L1</text>
        <line x1="0" y1="45" x2="55" y2="45" stroke="#64748b"/>
        <text x="27.5" y="67" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">40</text>
        <text x="27.5" y="82" fill="#94a3b8" font-size="9" text-anchor="middle">User C</text>
      </g>

      <!-- Node 4 (score: 88, height: 4) -->
      <g transform="translate(600, 40)">
        <rect width="55" height="180" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="27.5" y="25" fill="#fde68a" font-size="10" text-anchor="middle">L3</text>
        <line x1="0" y1="45" x2="55" y2="45" stroke="#f59e0b"/>
        <text x="27.5" y="70" fill="#fde68a" font-size="10" text-anchor="middle">L2</text>
        <line x1="0" y1="90" x2="55" y2="90" stroke="#f59e0b"/>
        <text x="27.5" y="115" fill="#fde68a" font-size="10" text-anchor="middle">L1</text>
        <line x1="0" y1="135" x2="55" y2="135" stroke="#f59e0b"/>
        <text x="27.5" y="157" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">88</text>
        <text x="27.5" y="173" fill="#94a3b8" font-size="9" text-anchor="middle">User D</text>
      </g>

      <!-- Forward Pointers with Spans -->
      <!-- L3: Head -> Node 4 (Span = 4) -->
      <path d="M 100 65 L 595 65" fill="none" stroke="#f59e0b" stroke-width="2" marker-end="url(#sk-arrow)"/>
      <text x="350" y="58" fill="#fde68a" font-size="11" font-weight="bold">L3 jump (span=4)</text>

      <!-- L2: Head -> Node 2 -> Node 4 -->
      <path d="M 100 110 L 315 110" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#sk-arrow)"/>
      <text x="200" y="103" fill="#7dd3fc" font-size="10">span=2</text>
      <path d="M 375 110 L 595 110" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#sk-arrow)"/>
      <text x="480" y="103" fill="#7dd3fc" font-size="10">span=2</text>

      <!-- L0: Base Linked List (all nodes) -->
      <path d="M 100 195 L 175 195" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#sk-arrow)"/>
      <path d="M 235 195 L 315 195" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#sk-arrow)"/>
      <path d="M 375 195 L 455 195" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#sk-arrow)"/>
      <path d="M 515 195 L 595 195" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#sk-arrow)"/>

      <!-- Bottom explanation -->
      <text x="380" y="245" fill="#94a3b8" font-size="12" text-anchor="middle">
        Redis ZSET uses Skip List for <tspan fill="#34d399" font-weight="bold">O(log N)</tspan> rank queries by accumulating pointer <tspan fill="#f59e0b" font-weight="bold">span</tspan> values!
      </text>
    </svg>
  `,

  /**
   * Limit Order Book (LOB) Matching Engine Depth Ladder
   */
  orderBook: () => `
    <svg viewBox="0 0 760 280" width="100%" height="280" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Title -->
      <text x="380" y="25" fill="#f8fafc" font-size="15" font-weight="bold" text-anchor="middle">Limit Order Book (Price-Time Priority FIFO)</text>

      <!-- Table Header -->
      <g transform="translate(40, 45)">
        <!-- Bids Header (Buy) -->
        <rect x="0" y="0" width="330" height="28" fill="#064e3b" rx="4"/>
        <text x="80" y="19" fill="#a7f3d0" font-size="12" font-weight="bold">Bids (Buy Orders) ↓</text>
        <text x="240" y="19" fill="#a7f3d0" font-size="12" font-weight="bold">Qty / Depth</text>

        <!-- Asks Header (Sell) -->
        <rect x="350" y="0" width="330" height="28" fill="#7f1d1d" rx="4"/>
        <text x="430" y="19" fill="#fecaca" font-size="12" font-weight="bold">Asks (Sell Orders) ↑</text>
        <text x="590" y="19" fill="#fecaca" font-size="12" font-weight="bold">Qty / Depth</text>
      </g>

      <!-- Depth Rows -->
      <g transform="translate(40, 80)">
        <!-- Bid Row 1 (Highest Bid - Top of Book) -->
        <rect x="0" y="0" width="330" height="32" fill="#065f46" fill-opacity="0.3" stroke="#059669" stroke-width="1"/>
        <text x="80" y="21" fill="#34d399" font-size="14" font-weight="bold">$100.20</text>
        <text x="240" y="21" fill="#ecfdf5" font-size="13">500 shs (3 orders)</text>

        <!-- Bid Row 2 -->
        <rect x="0" y="38" width="330" height="32" fill="#065f46" fill-opacity="0.15"/>
        <text x="80" y="59" fill="#10b981" font-size="13">$100.15</text>
        <text x="240" y="59" fill="#94a3b8" font-size="12">1,200 shs</text>

        <!-- Bid Row 3 -->
        <rect x="0" y="76" width="330" height="32" fill="#065f46" fill-opacity="0.08"/>
        <text x="80" y="97" fill="#059669" font-size="13">$100.10</text>
        <text x="240" y="97" fill="#64748b" font-size="12">2,500 shs</text>

        <!-- Ask Row 1 (Lowest Ask - Top of Book) -->
        <rect x="350" y="0" width="330" height="32" fill="#991b1b" fill-opacity="0.3" stroke="#dc2626" stroke-width="1"/>
        <text x="430" y="21" fill="#f87171" font-size="14" font-weight="bold">$100.25</text>
        <text x="590" y="21" fill="#fef2f2" font-size="13">350 shs (2 orders)</text>

        <!-- Ask Row 2 -->
        <rect x="350" y="38" width="330" height="32" fill="#991b1b" fill-opacity="0.15"/>
        <text x="430" y="59" fill="#ef4444" font-size="13">$100.30</text>
        <text x="590" y="59" fill="#94a3b8" font-size="12">800 shs</text>

        <!-- Ask Row 3 -->
        <rect x="350" y="76" width="330" height="32" fill="#991b1b" fill-opacity="0.08"/>
        <text x="430" y="97" fill="#b91c1c" font-size="13">$100.35</text>
        <text x="590" y="97" fill="#64748b" font-size="12">1,800 shs</text>
      </g>

      <!-- Bid-Ask Spread Indicator -->
      <g transform="translate(190, 205)">
        <rect width="380" height="40" rx="6" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>
        <text x="190" y="25" fill="#fef08a" font-size="13" font-weight="bold" text-anchor="middle">
          Bid-Ask Spread = $100.25 - $100.20 = $0.05
        </text>
      </g>

      <text x="380" y="268" fill="#94a3b8" font-size="11" text-anchor="middle">
        Market buy matches Ask $100.25 instantly | Limit orders queue FIFO at identical price levels
      </text>
    </svg>
  `,

  /**
   * Double-Entry Bookkeeping Ledger
   */
  doubleEntry: () => `
    <svg viewBox="0 0 760 270" width="100%" height="270" xmlns="http://www.w3.org/2000/svg" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Formula Banner -->
      <g transform="translate(140, 20)">
        <rect width="480" height="45" rx="6" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="240" y="28" fill="#f8fafc" font-size="15" font-weight="bold" text-anchor="middle">
          Accounting Equation: Assets = Liabilities + Equity
        </text>
      </g>

      <!-- Left T-Account: Cash / Asset Account -->
      <g transform="translate(80, 85)">
        <rect width="260" height="130" fill="#0f172a" stroke="#334155" stroke-width="1.5" rx="4"/>
        <rect width="260" height="30" fill="#1e293b" rx="4 4 0 0"/>
        <text x="130" y="20" fill="#60a5fa" font-size="13" font-weight="bold" text-anchor="middle">User Wallet (Asset)</text>
        
        <!-- T-shape bar -->
        <line x1="130" y1="30" x2="130" y2="130" stroke="#334155" stroke-width="1.5"/>
        <text x="65" y="48" fill="#34d399" font-size="11" font-weight="bold" text-anchor="middle">Debit (+)</text>
        <text x="195" y="48" fill="#f87171" font-size="11" font-weight="bold" text-anchor="middle">Credit (-)</text>

        <!-- Transaction rows -->
        <text x="65" y="75" fill="#f8fafc" font-size="12" text-anchor="middle">$100 (Deposit)</text>
        <text x="195" y="105" fill="#f8fafc" font-size="12" text-anchor="middle">$30 (Buy Item)</text>
      </g>

      <!-- Balance Operator -->
      <text x="380" y="155" fill="#38bdf8" font-size="28" font-weight="bold" text-anchor="middle">⇄</text>

      <!-- Right T-Account: Merchant Payable -->
      <g transform="translate(420, 85)">
        <rect width="260" height="130" fill="#0f172a" stroke="#334155" stroke-width="1.5" rx="4"/>
        <rect width="260" height="30" fill="#1e293b" rx="4 4 0 0"/>
        <text x="130" y="20" fill="#a855f7" font-size="13" font-weight="bold" text-anchor="middle">Merchant Payable (Liability)</text>
        
        <!-- T-shape bar -->
        <line x1="130" y1="30" x2="130" y2="130" stroke="#334155" stroke-width="1.5"/>
        <text x="65" y="48" fill="#34d399" font-size="11" font-weight="bold" text-anchor="middle">Debit (-)</text>
        <text x="195" y="48" fill="#f87171" font-size="11" font-weight="bold" text-anchor="middle">Credit (+)</text>

        <!-- Transaction rows -->
        <text x="195" y="105" fill="#f8fafc" font-size="12" text-anchor="middle">$30 (Received)</text>
      </g>

      <!-- Invariant Assertion Footer -->
      <g transform="translate(180, 230)">
        <text x="200" y="20" fill="#34d399" font-size="12" font-weight="bold" text-anchor="middle">
          ✓ Invariant: SUM(Debits) == SUM(Credits) in every single atomic transaction
        </text>
      </g>
    </svg>
  `
};
