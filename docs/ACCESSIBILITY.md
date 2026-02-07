# Accessibility (a11y) Audit & Guidelines

## WCAG Compliance

Target: **WCAG 2.1 Level AA**

### Perceivable

- [ ] All images have alt text
- [ ] Color contrast meets WCAG standards (4.5:1 for normal text, 3:1 for large text)
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] Content structure is clear (headings, lists, etc.)

### Operable

- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Sufficient time for users to read and use content
- [ ] No content that causes seizures
- [ ] Clear navigation

### Understandable

- [ ] Language of page is identified
- [ ] Consistent navigation
- [ ] Form labels and error messages are clear
- [ ] Error prevention (confirmations for destructive actions)

### Robust

- [ ] Valid HTML
- [ ] Proper ARIA labels where needed
- [ ] Screen reader compatible

## Testing Tools

### Automated Testing

- **WAVE** (Web Accessibility Evaluation Tool)
- **axe DevTools** (browser extension)
- **Lighthouse** (built into Chrome DevTools)
- **Pa11y** (command line tool)

### Manual Testing

- **Keyboard Navigation**: Test all functionality with keyboard only
- **Screen Reader**: Test with NVDA (Windows) or VoiceOver (Mac)
- **Color Contrast**: Use contrast checker tools
- **Zoom**: Test at 200% zoom

## Implementation Checklist

### Images

- [ ] All `<img>` tags have `alt` attributes
- [ ] Decorative images have empty alt: `alt=""`
- [ ] Complex images have descriptive alt text
- [ ] Icons have appropriate labels

### Forms

- [ ] All inputs have associated labels
- [ ] Error messages are clear and associated with fields
- [ ] Required fields are marked
- [ ] Form validation is accessible

### Navigation

- [ ] Skip links for main content
- [ ] Focus indicators are visible
- [ ] Focus order is logical
- [ ] ARIA landmarks used appropriately

### Color & Contrast

- [ ] Text meets contrast requirements
- [ ] Color is not the only means of conveying information
- [ ] Interactive elements have clear focus states

### Keyboard

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] No keyboard traps
- [ ] Escape key closes modals/dialogs

## shadcn/ui Components

Most shadcn/ui components are accessible by default, but verify:

- [ ] Button components have proper roles
- [ ] Dialog/Modal components trap focus correctly
- [ ] Dropdown menus are keyboard navigable
- [ ] Form components have proper labels

## Testing Commands

```bash
# Install Pa11y CLI
npm install -g pa11y

# Test a page
pa11y http://localhost:3000/v/[voucherId]

# Test with specific standard
pa11y --standard WCAG2AA http://localhost:3000
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
