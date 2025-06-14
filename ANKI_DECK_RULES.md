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

### 6. **Card Orientation & Audio Logic (User-Defined)**

The system uses a **user-defined orientation** approach where users control what appears on front vs back of cards.

#### **Language Architecture**

- ✅ **contentLanguage**: The language of user input (e.g., English words they type)
- ✅ **frontLanguage**: User's preferred language for card front (e.g., Vietnamese)
- ✅ **backLanguage**: User's preferred language for card back (e.g., English)
- ✅ **sourceLanguage**: Maps to contentLanguage for API compatibility
- ✅ **targetLanguage**: The translation target language

#### **Card Content Placement**

- ✅ **Front content**: Determined by `frontLanguage` preference
  - If `frontLanguage === contentLanguage`: Front shows input text
  - If `frontLanguage !== contentLanguage`: Front shows translation
- ✅ **Back content**: Determined by `backLanguage` preference
  - If `backLanguage === contentLanguage`: Back shows input text
  - If `backLanguage !== contentLanguage`: Back shows translation

#### **Audio Placement Logic**

- ✅ **Front audio**: Audio for whatever language appears on front
- ✅ **Back audio**: Audio for whatever language appears on back
- ✅ **Dynamic mapping**: UI audio toggles map to source/target based on language preferences
- ✅ **User control**: Users choose card orientation, audio follows their preference

#### **Examples**

**Scenario 1: Vietnamese front, English back, English input**

- contentLanguage: `en`, frontLanguage: `vi`, backLanguage: `en`
- Front: Vietnamese translation + Vietnamese audio (if enabled)
- Back: English input + English audio (if enabled)
- Audio mapping: Front audio toggle → `generateTargetAudio`, Back audio toggle → `generateSourceAudio`

**Scenario 2: English front, Vietnamese back, English input**

- contentLanguage: `en`, frontLanguage: `en`, backLanguage: `vi`
- Front: English input + English audio (if enabled)
- Back: Vietnamese translation + Vietnamese audio (if enabled)
- Audio mapping: Front audio toggle → `generateSourceAudio`, Back audio toggle → `generateTargetAudio`

## 🧪 Valid Deck Permutations

### Card Orientation Combinations (4 types)

1. **Same Language Front/Back**: contentLanguage = frontLanguage = backLanguage (edge case)
2. **Input on Front**: frontLanguage = contentLanguage, backLanguage ≠ contentLanguage
3. **Translation on Front**: frontLanguage ≠ contentLanguage, backLanguage = contentLanguage
4. **Mixed Languages**: frontLanguage ≠ contentLanguage ≠ backLanguage (complex scenario)

### Audio Generation Options (4 combinations)

1. **No Audio**: Both `generateSourceAudio` and `generateTargetAudio` false
2. **Source Audio Only**: `generateSourceAudio` true, `generateTargetAudio` false
3. **Target Audio Only**: `generateSourceAudio` false, `generateTargetAudio` true
4. **Dual Audio**: Both `generateSourceAudio` and `generateTargetAudio` true

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

| Orientation Type     | Audio Options | Card Count | Content Type | Status         |
| -------------------- | ------------- | ---------- | ------------ | -------------- |
| Input on Front       | No Audio      | 1          | Simple       | ✅ Should Pass |
| Input on Front       | Source Only   | 5          | Unicode      | ✅ Should Pass |
| Input on Front       | Target Only   | 20         | Mixed        | ✅ Should Pass |
| Input on Front       | Dual Audio    | 50         | Simple       | ✅ Should Pass |
| Translation on Front | No Audio      | 1          | Unicode      | ✅ Should Pass |
| Translation on Front | Source Only   | 5          | Simple       | ✅ Should Pass |
| Translation on Front | Target Only   | 20         | Mixed        | ✅ Should Pass |
| Translation on Front | Dual Audio    | 50         | Unicode      | ✅ Should Pass |
| Same Language        | No Audio      | 1          | Simple       | ✅ Should Pass |
| Same Language        | Source Only   | 5          | Unicode      | ✅ Should Pass |
| Mixed Languages      | Target Only   | 20         | Mixed        | ✅ Should Pass |
| Mixed Languages      | Dual Audio    | 50         | Unicode      | ✅ Should Pass |

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

- **User-Defined Orientation**: Card content placement determined by frontLanguage/backLanguage preferences, not audio presence
- **Dynamic Audio Mapping**: Frontend audio toggles dynamically map to generateSourceAudio/generateTargetAudio based on language configuration
- **Language Architecture**: contentLanguage (input) + frontLanguage/backLanguage (display preferences) + sourceLanguage/targetLanguage (API compatibility)
- **Field Order**: Always front field first, then `\x1f`, then back field
- **Timestamp Base**: Use consistent base timestamp across all IDs in same deck
- **Buffer Validation**: Ensure audio buffers contain valid data before adding to deck
- **Content Flexibility**: Users can choose any supported language for front/back, independent of input language
