# Audio Setup Instructions

## 🔊 Adding Your Custom Alert Sound

To use your custom audio file for person detection alerts:

### 1. **Add Audio File**
Place your audio file in the `public` folder with the exact name:
```
public/pols-aagyi-pols.mp3
```

### 2. **Supported Audio Formats**
- **MP3** (recommended) - Best browser compatibility
- **WAV** - Universal support but larger file size
- **OGG** - Good compression, modern browser support

### 3. **File Requirements**
- **Name**: Must be exactly `pols-aagyi-pols.mp3`
- **Location**: Must be in the `/public` folder
- **Size**: Recommended under 1MB for fast loading
- **Duration**: 1-3 seconds for best user experience

### 4. **How It Works**
The app now:
1. **Preloads** your custom audio file when the app starts
2. **Plays your custom sound** immediately when a person is detected
3. **Falls back** to a generated beep if your file is missing or fails
4. **Caches** the audio for instant playback

### 5. **Testing Your Audio**
1. Add your `pols-aagyi-pols.mp3` file to the `public` folder
2. Refresh the browser
3. Check the browser console - you should see: `"Custom audio file preloaded successfully"`
4. When a person is detected, you'll hear your custom sound

### 6. **Troubleshooting**
If you don't hear your custom sound:

**Check the Console:**
- `"Custom audio file preloaded successfully"` = ✅ Working
- `"Custom audio file not found"` = ❌ File missing or wrong name
- `"Failed to preload custom audio"` = ❌ File format issue

**Common Solutions:**
- Ensure file is named exactly `pols-aagyi-pols.mp3`
- Make sure file is in the `public` folder (not `src` or other folders)
- Try converting to MP3 format if using different format
- Check file isn't corrupted by testing in a media player

### 7. **Audio Settings**
The app automatically:
- Adjusts volume based on user settings
- Throttles alerts to prevent spam (max once every 2 seconds)
- Handles browser autoplay restrictions gracefully

### 8. **Alternative Setup**
If you want to use a different filename, you can:
1. Update the filename in `src/utils/audio-manager.js`
2. Change `/pols-aagyi-pols.mp3` to your preferred filename
3. Make sure to update it in both the `preloadCustomAudio()` and `playAudio()` functions

Your custom audio will now play by default for all person detections! 🎵
