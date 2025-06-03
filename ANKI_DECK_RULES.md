# Anki Deck Generation Rules & Constraints

## 🚨 Critical Rules (Violations Cause 500 Errors)

### 1. **SQLite INTEGER Constraints**

- ✅ **Use timestamp in seconds**: `Math.floor(Date.now() / 1000)`
- ❌ **Never use milliseconds**: `Date.now()` (too large, causes overflow)
- ✅ **Safe ID range**: Use base timestamp + small offsets (< 10000)
- ❌ **Unsafe ID range**: IDs > 2^53 or negative numbers

### 2. **Media File Naming (STRICT)**

- ✅ **Sequential numeric only**: `0`, `1`, `2`, `3`...
- ❌ **String-based names**: `source_0`, `target_1`, `audio_file`
- ✅ **Media manifest format**: `{"0": "0.mp3", "1": "1.mp3"}`
- ❌ **Invalid manifest**: `{"source_0": "source_0.mp3"}`

### 3. **Audio Reference Consistency**

- ✅ **Exact match required**: Field `[sound:0.mp3]` → Media file `0`
- ❌ **Mismatched references**: Field `[sound:1.mp3]` but no media file `1`
- ✅ **Proper format**: `text[sound:N.mp3]` where N exists in media
- ❌ **Invalid format**: `text[audio:file.mp3]` or `text(sound:0.mp3)`

### 4. **Database Schema Compliance**

- ✅ **Field separator**: Use `\x1f` between front/back fields
- ✅ **Required tables**: `col`, `notes`, `cards`, `revlog`, `graves`
- ✅ **Required indexes**: All standard Anki indexes must exist
- ❌ **Missing schema**: Skipping tables or indexes causes corruption

## 🎯 Content Rules (Best Practices)

### 5. **Text Content**

- ✅ **Unicode support**: Vietnamese diacritics, emoji, special chars
- ✅ **HTML allowed**: Basic formatting like `<b>`, `<i>`
- ⚠️ **Length limits**: Keep fields under 1MB each (practical limit)
- ✅ **Empty fields**: Allowed but not recommended

### 6. **Audio Placement Logic**

- ✅ **Source audio only**: Front = source + audio, Back = target text
- ✅ **Target audio only**: Front = target + audio, Back = source text
- ✅ **Both audio**: Front = target + audio, Back = source + audio
- ✅ **No audio**: Front = target text, Back = source text

## 🧪 Valid Deck Permutations

### Audio Combinations (4 types)

1. **No Audio**: Text-only cards
2. **Source Audio Only**: English pronunciation
3. **Target Audio Only**: Vietnamese pronunciation
4. **Dual Audio**: Both languages with audio

### Card Quantities (4 sizes)

1. **Single Card**: 1 card (edge case testing)
2. **Small Deck**: 3-5 cards (typical testing)
3. **Medium Deck**: 20-30 cards (realistic use)
4. **Large Deck**: 50-100 cards (stress testing)

### Content Variations (3 types)

1. **Simple Text**: Basic ASCII characters
2. **Unicode Text**: Vietnamese diacritics, special characters
3. **Mixed Content**: Combination of simple and complex text

## 🔍 Test Coverage Matrix

| Audio Type  | Card Count | Content Type | Status         |
| ----------- | ---------- | ------------ | -------------- |
| None        | 1          | Simple       | ✅ Should Pass |
| None        | 5          | Unicode      | ✅ Should Pass |
| None        | 50         | Mixed        | ✅ Should Pass |
| Source Only | 1          | Simple       | ✅ Should Pass |
| Source Only | 5          | Unicode      | ✅ Should Pass |
| Source Only | 50         | Mixed        | ✅ Should Pass |
| Target Only | 1          | Simple       | ✅ Should Pass |
| Target Only | 5          | Unicode      | ✅ Should Pass |
| Target Only | 50         | Mixed        | ✅ Should Pass |
| Dual Audio  | 1          | Simple       | ✅ Should Pass |
| Dual Audio  | 5          | Unicode      | ✅ Should Pass |
| Dual Audio  | 50         | Mixed        | ✅ Should Pass |

## ❌ Known Failure Patterns

### Database Errors

- **"A number was invalid or out of range"**: ID overflow (use seconds not milliseconds)
- **"No such table"**: Missing schema tables or indexes
- **"Database is locked"**: Concurrent access (use proper cleanup)

### Media Errors

- **"Missing media file"**: Field references non-existent audio
- **"Invalid media manifest"**: String keys instead of numeric
- **"Corrupted audio"**: Invalid Buffer data or wrong file format

### Import Errors

- **"Invalid package"**: Malformed ZIP structure
- **"Unsupported format"**: Wrong file extensions or MIME types
- **"Deck already exists"**: Conflicting deck IDs (use unique timestamps)

## 🛠️ Debugging Checklist

When a deck fails to import:

1. ✅ **Check IDs**: Are all IDs reasonable numbers (< 10^12)?
2. ✅ **Check media**: Are all files named 0, 1, 2... sequentially?
3. ✅ **Check references**: Do `[sound:N.mp3]` match existing media files?
4. ✅ **Check schema**: Are all required tables and indexes present?
5. ✅ **Check ZIP**: Does the .apkg extract correctly?

## 📝 Implementation Notes

- **Sequential Media Assignment**: Target audio gets 0, 1, 2... then source audio continues numbering
- **Field Order**: Always front field first, then `\x1f`, then back field
- **Timestamp Base**: Use consistent base timestamp across all IDs in same deck
- **Buffer Validation**: Ensure audio buffers contain valid data before adding to deck
