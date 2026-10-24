# Module 15 — Account, Navigation, and Appearance Preferences

This chapter documents the account and theme features currently present in LUNA. It is written as a learning aid: read the code beside this guide, then explain each flow in your own words.

## Files to inspect

- `frontend/src/components/layout/Sidebar.tsx` — navigation items and click handling.
- `frontend/src/App.tsx` — maps the active page to a React page component.
- `frontend/src/context/AppContext.tsx` — shared theme preference and persistence.
- `frontend/src/pages/SettingsPage.tsx` — settings tabs and the appearance/account panels.
- `frontend/src/pages/ProfilesPage.tsx` — signup/sign-in UI and account profile UI.
- `frontend/src/index.css` — global CSS variables for light and dark surfaces.
- `backend/auth.py` — SQLite account records, password hashing, and session helpers.

## 1. Navigation: About before Dashboard

In `Sidebar.tsx`, the `primaryNav` array defines the order of the main navigation items. React renders the array in order, so placing the About item before Dashboard makes it appear first. Each item has an `id`, label, and icon. The click handler calls the shared page setter with that item's ID.

The sidebar does not itself render every page. The selected page ID is held in application state; `App.tsx` reads it and chooses the corresponding component. This separation keeps navigation controls independent from page content.

## 2. Shared theme state

In `AppContext.tsx`, the theme preference is typed as one of three string values:

- `system` — follow the operating system's `prefers-color-scheme` setting.
- `light` — explicitly use the light palette.
- `dark` — explicitly use the dark palette.

The state initializer reads `luna_app_theme` from `localStorage`. It accepts only the three known values; a missing or invalid value falls back to `system`. This is a browser preference, not an account setting stored in SQLite, so it applies to that browser profile.

A React `useEffect` runs when the preference changes. It saves the value, then either removes `data-theme` from the root HTML element for system mode or sets `data-theme="light"` / `data-theme="dark"`. CSS can then select the appropriate variables. The `color-scheme` property also informs browser-rendered controls about the intended palette.

### Follow the data flow

1. The user clicks a theme choice in Settings.
2. `SettingsPage.tsx` calls `setAppTheme(option.id)`.
3. React updates `appTheme` in `AppContext.tsx`.
4. The context effect writes the preference to `localStorage` and updates the root element.
5. CSS selectors in `index.css` switch shared design tokens.
6. On a later visit in the same browser, the initializer reads the saved preference.

## 3. CSS variables and theme coverage

CSS custom properties such as `--bg-app`, `--bg-card`, `--text-main`, and `--border-subtle` centralize colours. Components that use `var(--text-main)` automatically follow the selected theme without needing separate styles for every mode.

A component that hardcodes a colour (for example, `color: #fff`) may not adapt correctly. Therefore, a successful TypeScript build is not proof that every page looks correct in all themes. Manually inspect Dashboard, Library, Reader, Audiobooks, Profiles, Settings, dialogs, empty states, and form controls in all three modes and at narrow/mobile widths.

## 4. Settings and account navigation

The Account tab in `SettingsPage.tsx` is a shortcut to the existing Profiles page; it does not implement password reset or email verification. The interface states this limitation so users are not led to believe those flows exist.

The Appearance tab presents System, Light, and Dark choices. The selected option uses `aria-pressed` so assistive technology can identify which button is active. The status text reports the current preference.

## 5. Passwords and sessions (backend)

In `backend/auth.py`, registration validates the username, email, display name, and password before inserting a user into SQLite. A random salt is generated for each account, and `hashlib.scrypt` derives a password hash. The database stores the salt and derived hash, not the original password.

During sign-in, LUNA looks up the username first and falls back to email. It hashes the submitted password with the account's salt and compares the result using `hmac.compare_digest`. A failed match returns no user. Successful sign-in creates a random bearer token, but stores only its SHA-256 digest in the session table. Session lookup checks that the token exists and has not expired.

These protections reduce risks but do not replace a full security review. Keep secrets out of Git, use HTTPS if the app is ever exposed beyond localhost, and do not describe local account storage as cloud account synchronization.

## 6. Manual verification checklist

- [ ] Open About LUNA and confirm it appears before Dashboard in the sidebar.
- [ ] Open Settings without entering the developer code.
- [ ] Select Light, refresh the page, and confirm Light remains selected.
- [ ] Repeat for Dark and System; in System mode, change the OS appearance and verify the app follows it.
- [ ] Visit key pages in all three themes and look for low-contrast text, unreadable icons, or hardcoded backgrounds.
- [ ] Open Settings → Account and follow the profile shortcut.
- [ ] Create a test account, sign out, sign in with the same username/password, and confirm a wrong password is rejected.
- [ ] Inspect browser developer tools for frontend errors and check the backend terminal for API errors.

Do not use a real password for test accounts. Manual verification is still required even when the automated CI workflow passes.
