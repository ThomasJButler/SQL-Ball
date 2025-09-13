# Enhanced UI Design for Premier League Oracle

This document outlines the CSS improvements made to enhance the user interface of the Premier League Oracle application.

## Design Goals

-   **Refined Aesthetic:** Create a more premium and visually appealing look and feel.
-   **Improved Visual Hierarchy:** Make it easier for users to scan and understand information.
-   **Enhanced User Experience:** Introduce subtle interactions and animations for a more engaging feel.
-   **Consistency:** Ensure a consistent design language across the application.
-   **Accessibility:** Improve color contrast and readability.

## Key Changes

### 1. Color System Refinement

-   **Updated Palette:** Introduced a richer, more cohesive color palette using Tailwind CSS variables for both light and dark modes.
-   **Semantic Colors:** Defined variables like `--primary`, `--secondary`, `--accent`, `--success`, `--warning`, `--error` for clearer intent in styling.
-   **Improved Contrast:** Adjusted text and background colors for better readability and accessibility, especially in dark mode.

### 2. Enhanced Component Styling

-   **Cards (`.card`):** Added softer shadows, refined borders, and a subtle hover effect (increased shadow, border highlight).
-   **Buttons (`.btn`, `.btn-primary`, etc.):**
    -   Implemented a slight lift (`transform: translateY`) and shadow increase on hover.
    -   Refined focus states for better accessibility.
    -   Added disabled states.
    -   Introduced an outline button style (`.btn-outline`).
-   **Stat Cards (`.stat-card`, `.stat-value`, `.stat-label`):** Improved styling for clarity and visual appeal.
-   **Form Elements (`.form-input`, `.form-select`):** Enhanced focus states and dark mode appearance.
-   **Badges (`.badge`, `.badge-success`, etc.):** Refined styling for better visual distinction in both light and dark modes.

### 3. New UI Components & Effects

-   **Gradient Text (`.gradient-text`):** Added a utility for creating animated gradient text for headings or highlights.
-   **Shimmer Effect (`.shimmer`):** Included a loading shimmer effect utility.
-   **Divider (`.divider`):** A simple horizontal rule component.
-   **Avatar (`.avatar`):** Basic styling for user avatars.
-   **Tooltip (`.tooltip`):** A utility class for simple tooltips (requires parent with `group` class).
-   **Dropdown (`.dropdown`, `.dropdown-item`):** Basic styling for dropdown menus.
-   **Tabs (`.tab`, `.tab-active`):** Styling for tabbed navigation.
-   **Navbar (`.navbar`) & Sidebar (`.sidebar`):** Added basic structural styles with background blur effect for the navbar.

### 4. Typography & Layout

-   **Font Smoothing:** Enabled anti-aliasing for smoother text rendering.
-   **Font Features:** Enabled specific OpenType features for potentially better character rendering.
-   **Body Styling:** Set base background and text colors with smooth transitions for theme switching.
-   **Responsive Adjustments:** Included a basic media query to adjust padding and button size on smaller screens (`max-width: 768px`).

### 5. Animations

-   **Keyframes:** Defined keyframes for `fadeIn`, `slideInRight`, `slideInBottom`, `bounceIn`, `gradient`, and `shimmer`.
-   **Utility Classes:** Created corresponding utility classes (`.animate-fade-in`, etc.) to easily apply these animations.

### 6. Dark Mode Enhancements

-   **Chart.js:** Added specific filter rules to improve the appearance of Chart.js charts in dark mode by inverting colors more naturally.
-   **Consistent Variables:** Ensured all color variables have corresponding dark mode values.

## Implementation

These styles are implemented in `src/app.css` using Tailwind CSS's `@layer base`, `@layer components`, and `@layer utilities` directives.

-   **Base:** Defines CSS variables and basic HTML/body styles.
-   **Components:** Contains reusable component classes (like `.card`, `.btn`).
-   **Utilities:** Includes animation utility classes.

This approach leverages Tailwind's utility-first methodology while providing well-defined custom components for consistency.