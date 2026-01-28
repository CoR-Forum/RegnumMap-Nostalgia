# Screenshots API Migration

## Overview
The screenshot management system has been migrated from local file storage to an external API at `https://cor-forum.de/regnum/RegnumNostalgia/screenshots_api.php`. This eliminates Docker volume permission issues and centralizes file hosting.

## Changes Made

### Backend (api/index.php)

#### 1. Added Constants
```php
const SCREENSHOTS_API_URL = 'https://cor-forum.de/regnum/RegnumNostalgia/screenshots_api.php';
const SCREENSHOTS_API_KEY = getenv('SCREENSHOTS_API_KEY');
```

#### 2. Updated handleAddScreenshot()
- Removed local filesystem operations (mkdir, file permissions, move_uploaded_file)
- Implemented curl POST to external API with multipart/form-data
- Sends file as CURLFile and api_key for authentication
- Validates API response for success status
- Stores both filename and URL in metadata
- Expected API response format:
```json
{
  "success": true,
  "url": "https://cor-forum.de/regnum/RegnumNostalgia/screenshots/filename.jpg",
  "filename": "filename.jpg"
}
```

#### 3. Updated handleDeleteScreenshot()
- Removed local file deletion (unlink)
- Implemented curl DELETE to external API
- Sends api_key and filename as POST parameters
- Logs errors but doesn't fail request if external deletion fails
- Still removes metadata from local screenshots.json

### Frontend (public/index.html)

#### Updated Image References
Changed all local path constructions from:
```javascript
`/assets/screenshots/${screenshot.filename}`
```
To use the URL field:
```javascript
`${screenshot.url}`
```

Updated locations:
1. Map marker tooltips (line ~2842)
2. Screenshot list thumbnails (line ~3318)
3. Form preview images (line ~3345)

### Configuration

#### Environment Variable
Added to `.env.example` and documented in README.md:
```env
SCREENSHOTS_API_KEY=your_screenshots_api_key_here
```

## API Integration

### External API Specification
The remote API at `https://cor-forum.de/regnum/RegnumNostalgia/screenshots_api.php` provides:

**Authentication:**
- Accepts `X-API-KEY` HTTP header (preferred)
- Or `?api_key=...` query parameter

**Upload (action=upload):**
- URL: `?action=upload`
- Method: POST (multipart/form-data)
- Fields:
  - `screenshot` (required): The image file
  - `name` (optional): Suggested filename
- Returns:
```json
{
  "ok": true,
  "saved_as": "filename.jpg"
}
```

**Rename (action=rename):**
- URL: `?action=rename`
- Method: POST
- Fields:
  - `from`: Current filename
  - `to`: New filename
- Returns:
```json
{
  "ok": true,
  "renamed_to": "new_filename.jpg"
}
```

**Note:** No delete endpoint is provided. Deleted screenshots remain on the server.

### Upload Implementation
```php
$apiUrl = SCREENSHOTS_API_URL . '?action=upload';
$ch = curl_init($apiUrl);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => [
        'screenshot' => new CURLFile($file['tmp_name'], $file['type'], $filename),
        'name' => $filename
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-API-KEY: ' . SCREENSHOTS_API_KEY
    ]
]);

$response = curl_exec($ch);
$result = json_decode($response, true);

// Construct full URL from saved filename
$baseUrl = dirname(SCREENSHOTS_API_URL) . '/screenshots/';
$fileUrl = $baseUrl . $result['saved_as'];
```

### Delete Behavior
Since the remote API doesn't provide a delete endpoint, the `handleDeleteScreenshot()` function only removes the metadata from the local `screenshots.json` file. The actual image files remain on the server.

## Data Structure

### Screenshot Metadata (screenshots.json)
```json
{
  "id": 1,
  "filename": "screenshot_1234567890.jpg",
  "url": "https://cor-forum.de/regnum/RegnumNostalgia/screenshots/screenshot_1234567890.jpg",
  "name": {
    "en": "Battle at Trelleborg",
    "de": "Schlacht bei Trelleborg",
    "es": "Batalla en Trelleborg"
  },
  "description": {
    "en": "Epic siege",
    "de": "Epische Belagerung",
    "es": "Asedio épico"
  },
  "location": "Trelleborg Castle",
  "visibleCharacters": "PlayerOne, PlayerTwo",
  "x": 1234,
  "y": 5678,
  "uploadedBy": "username",
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

## Benefits
1. **No Docker Permissions**: Eliminates need for write access to local filesystem
2. **Centralized Storage**: All screenshots stored on dedicated server
3. **Simplified Deployment**: No need to manage local upload directories
4. **Duplicate Prevention**: External API handles filename conflicts
5. **CDN Ready**: Easy to add CDN in front of external API

## Testing
1. Set `SCREENSHOTS_API_KEY` in `.env` file
2. Restart containers: `docker-compose restart`
3. Upload a screenshot via right-click menu
4. Verify it appears on the map with correct image URL
5. Delete screenshot and verify it's removed from external API

## Rollback
If needed to rollback to local storage:
1. Revert changes in `handleAddScreenshot()` and `handleDeleteScreenshot()`
2. Update frontend to use `/assets/screenshots/${filename}` again
3. Restore volume mount write permissions
