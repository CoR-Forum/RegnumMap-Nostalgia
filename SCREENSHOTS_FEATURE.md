# Screenshots Management Feature

## Overview
A complete screenshot management tool that allows users to upload, organize, and manage screenshots with multilingual support (English, German, Spanish).

## Features Implemented

### 1. Backend API (index.php)
- **GET /api/screenshots** - Retrieve all screenshots
- **POST /api/screenshots** - Upload new screenshot with metadata
- **PUT /api/screenshots/{id}** - Update existing screenshot metadata
- **DELETE /api/screenshots/{id}** - Delete screenshot and file

### 2. Frontend UI
- Right-click context menu item: "Screenshots"
- Modal window with:
  - File upload with preview
  - Multilingual name fields (EN/DE/ES)
  - Multilingual description fields (EN/DE/ES)
  - Location field
  - X/Y coordinates (auto-filled from right-click position)
  - Screenshot list on the right side
  - Edit/Delete functionality

### 3. File Management
- Screenshots uploaded to: `public/assets/screenshots/`
- Metadata stored in: `public/assets/screenshots.json`
- Automatic filename sanitization (spaces, dots, commas → hyphens)
- Duplicate filename prevention

## How to Use

### Adding a Screenshot
1. Right-click on the map at desired location
2. Select "Screenshots" from context menu
3. Click "Screenshot File" and select an image file
4. (Optional) Enter name in EN, DE, or ES
5. (Optional) Enter description in EN, DE, or ES
6. (Optional) Enter location name
7. Verify X/Y coordinates (auto-filled from right-click position)
8. Click "Save"

### Editing a Screenshot
1. Open Screenshots manager (right-click → Screenshots)
2. Click on a screenshot in the list on the right
3. Edit the fields (note: file cannot be changed, only metadata)
4. Click "Update"

### Deleting a Screenshot
1. Open Screenshots manager
2. Click on a screenshot in the list
3. Click "Delete" button
4. Confirm deletion

## Data Structure

Screenshots are stored in `screenshots.json` with the following structure:

```json
[
  {
    "id": 1,
    "filename": "alsius-castle.jpg",
    "name": {
      "en": "Alsius Castle",
      "de": "Alsius Burg",
      "es": "Castillo de Alsius"
    },
    "description": {
      "en": "The majestic castle of Alsius",
      "de": "Die majestätische Burg von Alsius",
      "es": "El majestuoso castillo de Alsius"
    },
    "location": "Alsius Territory",
    "x": 1509,
    "y": 377,
    "uploadedBy": 123,
    "uploadedAt": 1706428800
  }
]
```

## File Naming Rules
- Based on `name_en`, `name_de`, or `name_es` (in that order)
- If no name provided, uses original filename
- Spaces, dots, commas, and special characters replaced with hyphens
- Duplicate names get numeric suffix (-1, -2, etc.)

## Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Security
- Requires authentication (validates session token)
- File type validation
- Filename sanitization
- Upload directory permissions (755)

## Technical Details

### Backend Functions
- `getScreenshotsFilePath()` - Returns path to screenshots.json
- `loadScreenshots()` - Loads and parses screenshots.json
- `saveScreenshots($screenshots)` - Saves screenshots array to JSON
- `sanitizeFilename($name)` - Sanitizes filename for filesystem
- `handleGetScreenshots()` - GET endpoint handler
- `handleAddScreenshot()` - POST endpoint handler with file upload
- `handleUpdateScreenshot($id)` - PUT endpoint handler
- `handleDeleteScreenshot($id)` - DELETE endpoint handler

### Frontend Components
- `window.screenshotManager.openModal(x, y)` - Opens modal with coordinates
- Draggable modal window
- Auto-preview on file selection
- List view with thumbnails
- Edit/delete functionality

## Notes
- All fields except X/Y coordinates are optional
- At least one name field (EN/DE/ES) should be provided for better organization
- The file upload is only required when creating new screenshots
- When editing, only metadata can be changed (not the file itself)
