# Check Generator

A lightweight web app for creating printable checks in batches.

## Features

- Enter payee, date, amount, memo, bank/account data, and starting check number
- Set batch size (up to 100 checks per run)
- Auto-convert amount to words (e.g., `125.50` → `One hundred twenty-five dollars and 50/100`)
- Generates both front and back side for each check in the batch
- Print-optimized layout that hides the editor and prints generated pages only
- No dependencies required

## Run

Open `index.html` in any modern browser.

## Usage

1. Fill out the form fields and choose a batch size.
2. Review the generated front/back pages.
3. Click **Print Batch**.
4. In your browser print dialog, choose duplex (double-sided) and actual size / 100% scale for best alignment.
5. If the back side prints upside down, switch **Duplex Back Alignment** to **Rotate back side 180°** and print again.
6. Use **Flip on long edge** first; if alignment is mirrored on your printer, try **Flip on short edge**.

## Duplex alignment calibration

Front and back are now anchored to the same print slot coordinates.
If your printer still shifts slightly, adjust these variables in `styles.css`:

- `--print-slot-left`
- `--print-slot-top`
- `--print-check-width`
- `--print-check-height`

Use small steps (for example `0.02in`) and reprint until the two sides line up exactly on your check stock.

## Notes

- This tool is intended for formatting/printing assistance only.
- Ensure legal and banking compliance in your jurisdiction and with your financial institution.
- For MICR-like appearance, place an E-13B font file in `fonts/` as `E13B.woff2` (or `.woff`/`.ttf`).
