/**
 * AnkiService Source Audio Test Suite
 * 
 * Modular test architecture for comprehensive audio functionality testing.
 * This replaces the monolithic AnkiServiceSourceAudio.test.ts (322 lines)
 * with focused, maintainable test modules.
 * 
 * Test Coverage:
 * - Rules validation and constraints
 * - Source audio only scenarios  
 * - Dual audio (source + target) scenarios
 * - Edge cases and performance testing
 * 
 * Each module is under 150 lines and focuses on specific functionality.
 */

// Import all test modules to run them as part of the test suite
import './rules-validation.test.js'
import './source-only.test.js'
import './dual-audio.test.js'

// Re-export test utilities for external use
export { AnkiAudioTestUtils } from './test-utils.js'
export type { DatabaseNote, MediaManifest, AudioTestCard } from './test-utils.js' 