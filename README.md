# Aither Apps

Aither Apps is the iPhone-inspired home screen and **single-install desktop hub** for the Aither app collection.

## v5.1 — One Desktop Install

The desktop edition is designed so users **do not need a separate download for every Aither app**.

Install **Aither Apps once**, then launch the entire user-facing Aither suite from the Aither Apps desktop launcher.

### Included desktop apps

- Aither Weather
- Aither Clock
- Aither Notes
- Aither Maps
- Aither Calculator
- Aither Dashboard
- Aither Files
- Aither Mail
- Aither Gaming
- Aither AI
- Aither Web

Each app opens from the Aither Apps launcher in its own native desktop window using its existing Aither web deployment. This keeps the apps independently updatable while avoiding 11 separate desktop installers.

AitherBackend remains shared infrastructure rather than a desktop app. AitherTech is intentionally excluded. Aither Admin/AitherError404 remains hidden and is not exposed through the normal launcher.

## Desktop features

- One Aither Apps desktop installation for the whole suite
- Native Windows, macOS, and Linux launcher
- Dedicated desktop windows for every connected Aither app
- Large-screen dashboard layout
- Keyboard-first search with `Ctrl/Cmd + K`
- Enter opens the first matching app
- Account & Data shortcut to Aither Dashboard
- Recent and Favorites launcher views
- Open Last App workflow
- Secure context-isolated Electron preload bridge
- Single-instance launcher behavior
- External non-Aither links open in the system browser
- Existing iPhone-style web launcher remains available for GitHub Pages and mobile

### Desktop development

```text
cd desktop
npm install
npm start
```

Build the single Aither Apps desktop installer with:

```text
npm run dist
```

That installer is the desktop hub; users should not install separate desktop packages for Weather, Clock, Notes, Maps, Calculator, Dashboard, Files, Mail, Gaming, AI, or Web.

## Web launcher

The browser version remains an iPhone-inspired home screen with responsive mobile and desktop layouts, search, pages, dock, edit mode, app library, and GitHub Pages support.

## Repository

https://github.com/AitherForge/AitherApps
