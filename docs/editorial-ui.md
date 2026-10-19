# LUNA Editorial UI — Design Notes

This update introduces an editorial, archive-inspired visual language based on the reference images supplied for this feature: muted paper tones, dark negative space, book spines, archive folders, and cassette labels.

## New UI elements

- **About LUNA**: a mission/introduction page reachable from the sidebar. It describes the offline-first goal and clearly distinguishes implemented PDF features from planned audio capabilities.
- **Shelf view**: a third Library view alongside Grid and List. It uses the current filtered library records, lets the user select a book, and opens the selected book in the existing reader flow.
- **FolderStack**: an interactive, responsive group of dashboard panels. Each tab exposes a useful route or status. It does not claim to be a real file-system folder.
- **TapeStack**: a cassette-inspired visual queue in Playlists. Selecting a tape calls the existing track-selection handler; it does not itself generate audio.

## Accessibility and responsive behavior

- Buttons are used for interactive book spines and folder tabs.
- Selected items expose `aria-pressed` or `aria-expanded`.
- Book titles wrap on the selected shelf cover to avoid forcing long titles outside the component.
- Shelf rows and filter chips can scroll horizontally on narrow screens.
- Components include small-screen layout rules and reduced-motion handling where relevant.

## Important limitations

The UI is visual presentation around the existing app state. It does not implement text-to-speech, real audio playback, persistent playlist edits, OCR, or automatic book categories. Current book records do not expose a reliable category field from the backend, so the shelf filters the books already visible in the Library rather than inventing category metadata.
