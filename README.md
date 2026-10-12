# Keep Print Button — Chrome Extension

Adds a small hover 🖨️ button to each Google Keep note. Clicking it prints just that note via your system print dialog. It also adds a Print button inside the opened note editor.

## Install (Chrome / Edge / Brave)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `keep-print-button` folder (the one containing `manifest.json`)
5. Go to https://keep.google.com and refresh

## Use

- Hover any note card → a small printer button appears top-right → click it → system print dialog opens with just that note.
- Or open a note → click **🖨️ Print** in the editor → system print dialog opens.

## Notes

- Nothing leaves your browser. The extension only reads the note you click to print.
- Printed output contains just the note — Keep's buttons and toolbars are stripped from the printout, and the print header uses the note's title.
- If Google changes Keep's layout and buttons stop appearing, reload the extension and refresh Keep.
- To remove: `chrome://extensions` → Remove on "Keep Print Button".
