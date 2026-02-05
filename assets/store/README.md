# App Store Connect Assets

This folder contains all branding assets required for App Store Connect submission.

## Required Assets

### App Icon
- **app-icon-1024.png** - 1024x1024px (required for App Store listing)
  - No transparency (alpha channel)
  - No rounded corners (Apple adds these automatically)
  - PNG format

### Screenshots (Required for Each Device Size)
Upload these directly to App Store Connect.

#### iPhone Screenshots (6.7" Display - iPhone 14 Pro Max)
- **Dimensions:** 1290 x 2796 px (portrait) or 2796 x 1290 px (landscape)
- **Required:** 1-10 screenshots

#### iPhone Screenshots (6.5" Display - iPhone 11 Pro Max)
- **Dimensions:** 1242 x 2688 px (portrait) or 2688 x 1242 px (landscape)
- **Required:** 1-10 screenshots

#### iPhone Screenshots (5.5" Display - iPhone 8 Plus)
- **Dimensions:** 1242 x 2208 px (portrait) or 2208 x 1242 px (landscape)
- **Required:** 1-10 screenshots

#### iPad Screenshots (12.9" Display - iPad Pro)
- **Dimensions:** 2048 x 2732 px (portrait) or 2732 x 2048 px (landscape)
- **Required if supporting iPad:** 1-10 screenshots

### App Preview Videos (Optional)
- **Format:** MP4, MOV
- **Duration:** 15-30 seconds
- **Same dimensions as screenshots for each device size**

## Recommended Screenshots to Create

1. **Home/Guidance Screen** - Show the main guidance interface
2. **Chat Screen** - Display the AI chat interaction
3. **Bookmarks** - Show saved guidance
4. **Profile/Settings** - User personalization features
5. **Premium Features** - Highlight premium subscription benefits

## Branding Guidelines

### Colors
- **Primary:** #10b981 (Emerald Green)
- **Background:** Use ethereal/spiritual theme matching the app

### Logo Usage
- Use `NewLogo.png` as the primary logo
- Ensure sufficient padding around the logo
- Logo should be clearly visible on both light and dark backgrounds

## How to Generate Screenshots

### Option 1: Expo/EAS Screenshots
Run on a simulator and capture screenshots:
```bash
# iOS Simulator
xcrun simctl io booted screenshot screenshot.png
```

### Option 2: Fastlane Snapshot (Automated)
Set up fastlane for automated screenshot generation.

### Option 3: Manual Capture
1. Run the app on each device size simulator
2. Navigate to key screens
3. Press Cmd+S to save screenshot

## Asset Checklist

- [ ] App Icon (1024x1024)
- [ ] iPhone 6.7" Screenshots (at least 3)
- [ ] iPhone 6.5" Screenshots (at least 3)
- [ ] iPhone 5.5" Screenshots (at least 3)
- [ ] iPad Screenshots (if supporting iPad)
- [ ] App Preview Video (optional)
- [ ] Promotional Text (170 characters)
- [ ] Description (4000 characters max)
- [ ] Keywords (100 characters max)
- [ ] What's New text (for updates)
