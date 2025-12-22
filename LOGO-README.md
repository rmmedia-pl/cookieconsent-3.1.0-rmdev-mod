# Logo Feature Guide

## Overview

You can now add your company logo to the CookieConsent modal! The logo appears:
- **Desktop**: Left corner (before text)
- **Mobile**: Centered above text

## Quick Start

### 1. Enable Logo in Config

In your `cookieconsent-init.js`:

```javascript
CookieConsent.run({
    guiOptions: {
        consentModal: {
            showLogo: true  // Enable logo
        }
    }
    // ... rest of config
});
```

### 2. Replace Logo Files

Simply replace these files with your own logo (keep the same filenames):

- `cc-logo.png` - PNG format (primary, loaded first)
- `cc-logo.svg` - SVG format (fallback if PNG doesn't exist)

**Important**: Keep the filenames exactly as `cc-logo.png` and `cc-logo.svg`

## Logo Specifications

### Recommended Dimensions
- **Max width**: 120px
- **Max height**: 60px
- **Aspect ratio**: 2:1 (landscape orientation works best)

### File Formats
1. **PNG** (Primary) - Loaded first, best compatibility
2. **SVG** (Fallback) - Used only if PNG doesn't exist, scales perfectly

### Tips for Best Results
- Use transparent background
- Keep logo simple and readable at small sizes
- Test on both desktop and mobile
- Ensure good contrast with modal background

## How It Works

The logo automatically:
1. Tries to load `cc-logo.png` first (using HEAD request - no 404 errors in console)
2. Falls back to `cc-logo.svg` if PNG doesn't exist
3. If neither exists, no logo is shown (no console errors)
4. Positions itself:
   - **Desktop**: Left-aligned, before modal text
   - **Mobile** (≤640px): Center-aligned

## Disable Logo

To hide the logo, set `showLogo: false`:

```javascript
guiOptions: {
    consentModal: {
        showLogo: false  // Hide logo
    }
}
```

## Customizing Logo Appearance

You can customize the logo styling in your custom theme CSS:

```css
.cc--custom-theme .cm__logo {
    max-width: 150px;      /* Change max width */
    max-height: 80px;      /* Change max height */
    margin-bottom: 1.5em;  /* Adjust spacing below logo */
    opacity: 0.9;          /* Add transparency */
    filter: grayscale(0);  /* Apply filters */
}

/* Mobile-specific adjustments */
@media screen and (max-width: 640px) {
    .cc--custom-theme .cm__logo {
        max-width: 100px;  /* Smaller on mobile */
    }
}
```

## Example Logo Formats

### SVG Example
```svg
<svg width="120" height="60" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
  <!-- Your logo paths here -->
</svg>
```

### Creating Your Logo

1. **From existing image**:
   - Use online tools like [Convertio](https://convertio.co/png-svg/) to convert PNG to SVG
   - Or use design tools like Figma, Adobe Illustrator

2. **Optimize SVG**:
   - Use [SVGOMG](https://jakearchibald.github.io/svgomg/) to optimize file size
   - Remove unnecessary metadata

3. **Export PNG fallback**:
   - Export at 2x resolution (240x120px) for retina displays
   - Save as `cc-logo.png`

## Troubleshooting

### Logo not showing?
1. Check `showLogo: true` is set in config
2. Verify files are named exactly `cc-logo.svg` and `cc-logo.png`
3. Check browser console for loading errors
4. Ensure files are in the same directory as `index.html`

### Logo too large/small?
- Adjust `max-width` and `max-height` in CSS (see customization above)

### Logo not centered on mobile?
- Clear browser cache and reload
- Check if custom CSS is overriding mobile styles

## File Structure

```
demo/demo_gtm/
├── index.html
├── cookieconsent-init.js
├── cc-logo.png          ← Your PNG logo (primary)
├── cc-logo.svg          ← Your SVG fallback
└── cc-colors.css        ← Custom theme
```

## Notes

- The markdown linting warnings in THEME-README.md are cosmetic and don't affect functionality
- Logo feature works with all layouts (box, bar, cloud)
- Logo respects theme colors automatically
