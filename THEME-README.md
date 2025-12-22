# Custom CookieConsent Theme Guide

## How to Create and Use Custom Themes

### Quick Start

The custom theme is already set up! Just reload the browser to see it in action.

### How It Works

1. **Custom theme CSS file** (`cc-colors.css`) - Defines all color variables
2. **HTML class** (`cc-colors`) - Applied to the `<html>` element
3. **CSS loaded** after the main CookieConsent CSS

### Available Themes

You can switch between themes by changing the class on the `<html>` element:

```html
<!-- Custom theme (current) -->
<html lang="en" class="cc--custom-theme">

<!-- Built-in dark mode -->
<html lang="en" class="cc--darkmode">

<!-- No theme (default light) -->
<html lang="en">
```

### Creating Your Own Theme

1. **Copy `cc-colors.css`** and rename it (e.g., `my-theme.css`)

2. **Change the class name** in the CSS file:
```css
.cc--my-theme {
    /* Your custom variables */
}
```

3. **Customize the CSS variables** - Available variables:

#### Colors
- `--cc-bg` - Background color
- `--cc-primary-color` - Primary text color
- `--cc-secondary-color` - Secondary text color

#### Buttons
- `--cc-btn-primary-bg` - Primary button background
- `--cc-btn-primary-color` - Primary button text
- `--cc-btn-primary-hover-bg` - Primary button hover background
- `--cc-btn-primary-hover-color` - Primary button hover text
- `--cc-btn-secondary-bg` - Secondary button background
- `--cc-btn-secondary-color` - Secondary button text
- `--cc-btn-secondary-hover-bg` - Secondary button hover background
- `--cc-btn-secondary-hover-color` - Secondary button hover text

#### Toggle Switches
- `--cc-toggle-on-bg` - Toggle ON background
- `--cc-toggle-off-bg` - Toggle OFF background
- `--cc-toggle-on-knob-bg` - Toggle knob color when ON
- `--cc-toggle-off-knob-bg` - Toggle knob color when OFF
- `--cc-toggle-readonly-bg` - Read-only toggle background
- `--cc-toggle-readonly-knob-bg` - Read-only toggle knob

#### Cookie Categories
- `--cc-cookie-category-block-bg` - Category block background
- `--cc-cookie-category-block-border` - Category block border
- `--cc-cookie-category-block-hover-bg` - Category block hover background
- `--cc-cookie-category-block-hover-border` - Category block hover border

#### Layout
- `--cc-separator-border-color` - Border/separator color
- `--cc-footer-bg` - Footer background
- `--cc-footer-color` - Footer text color
- `--cc-footer-border-color` - Footer border color
- `--cc-overlay-bg` - Background overlay (when modal is open)

#### Border Radius
- `--cc-btn-border-radius` - Button border radius
- `--cc-modal-border-radius` - Modal border radius
- `--cc-pm-toggle-border-radius` - Toggle switch border radius

4. **Load your theme** in `index.html`:
```html
<html lang="en" class="cc--my-theme">
<head>
    <!-- ... -->
    <link rel="stylesheet" href="../../dist/cc.css">
    <link rel="stylesheet" href="my-theme.css">
</head>
```

### Dynamic Theme Switching

You can switch themes dynamically with JavaScript:

```javascript
// Switch to custom theme
document.documentElement.className = 'cc--custom-theme';

// Switch to dark mode
document.documentElement.className = 'cc--darkmode';

// Switch to default light theme
document.documentElement.className = '';

// Auto-detect system preference
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.className = 'cc--darkmode';
}
```

### Example Themes from Playground

#### Light Funky Theme
```css
.cc--light-funky {
    --cc-bg: #f9faff;
    --cc-primary-color: #112954;
    --cc-btn-primary-bg: #3859d0;
    --cc-btn-border-radius: 1rem .6rem 1.3rem .5rem / .5rem 1rem;
    /* ... */
}
```

#### Dark Turquoise Theme
```css
.cc--dark-turquoise {
    color-scheme: dark;
    --cc-bg: #161a1c;
    --cc-primary-color: #eff4f6;
    --cc-btn-primary-bg: #60fed2;
    --cc-btn-primary-color: #000;
    /* ... */
}
```

### Tips

1. **Always set `color-scheme`** to `light` or `dark` for proper system integration
2. **Test on mobile** - Use responsive design tools to check mobile view
3. **Check contrast** - Ensure text is readable on all backgrounds
4. **Use CSS variables** - Reference other variables for consistency (e.g., `var(--cc-bg)`)
5. **Override specific elements** - Add custom styles for fine-tuning

### Resources

- [Official Documentation](https://cookieconsent.orestbida.com/advanced/ui-customization.html)
- [Playground](https://playground.cookieconsent.orestbida.com/) - Test themes live
- [CSS Variables Reference](https://cookieconsent.orestbida.com/reference/configuration-reference.html)
