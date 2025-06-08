/**
 * AnkiService Source Audio Tests - Modular Architecture
 * 
 * This file has been refactored into a modular test suite.
 * The original 322-line monolithic test file has been split into:
 * 
 * - test-utils.ts: Shared utilities and helpers (140 lines)
 * - rules-validation.test.ts: Core rules and constraints (120 lines)
 * - source-only.test.ts: Source audio scenarios (140 lines)
 * - dual-audio.test.ts: Dual audio scenarios (150 lines)
 * - index.test.ts: Main test orchestrator (25 lines)
 * 
 * Total: 575 lines across 5 focused modules vs 322 lines in 1 monolithic file
 * Benefits: Better organization, easier maintenance, focused testing
 */

// Import the modular test suite
import './anki-source-audio/index.test.js' 