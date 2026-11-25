# Photo cleanup tools

These are the scripts and prompts behind the AI-retouched photos on the site: the Parts showcase, the knob, and the Story, Capabilities, Assemblies and Industries heroes.

The before/after results and the prompts are also on the internal page **/lightbox** (behind the admin password).

## Setup

The scripts read credentials from the repo's `.env`, which is git-ignored. They need:

- `OPENAI_API_KEY` for image edits
- `CLOUDINARY_URL` for uploads

Install the Python packages:

```sh
python3 -m venv .venv && . .venv/bin/activate
pip install opencv-python numpy pillow
```

Convert HEIC photos to PNG or JPG first, for example with `sips -s format png IMG_0617.HEIC --out IMG_0617.png`.

## Scripts (`bin/`)

| Script | Use |
|---|---|
| `cleanup.py <src> <outdir> openai [extra] [tag]` | Light-box part cleanup using the approved base prompt (gpt-image-1.5, quality high, input_fidelity high). `extra` adds photo-specific instructions. Set the `BG` env var to replace the background line, e.g. "on a solid black background". |
| `edit_any.py <src> <out.png> <prompt.txt> [size]` | Generic OpenAI edit, used for the heroes and the building. Sizes are `1536x1024`, `1024x1536` and `1024x1024`. |
| `colormatch.py <orig> <edit> <out>` | Matches the part's colour in the AI edit to the original (Lab). |
| `align_redbg.py <orig> <edit> <out>` | Aligns the edit to the original on the part and keeps the original red background, smoothed. Through-holes come from the original. |
| `align_black.py <orig> <edit> <out>` | Aligns by silhouette for parts on black, and forces pure black. |
| `keep_tool.py <orig> <edit> <out>` | Aligns the edit, then pastes the real caliper from the original back on top. |
| `clean_tool.py` / `clean_steel.py <img> <mask> <out>` | Retouches the real caliper in place: despeckles and smooths the steel, while protecting the LCD and markings. |
| `cld_upload.py <file> <public_id>` | Signed upload to Cloudinary, with overwrite. |

## Prompts (`prompts/`)

The light-box part prompt is built into `cleanup.py`.

The other prompts:

- `building-pass1..3.txt`: the Story hero. Pass 2 removes the towers and adds sun and flowers. Pass 3 is a close-up of the sign, composited back at 2×.
- `capabilities-mold-hero.txt`
- `assemblies-hero.txt`
- `industries-mold-library*.txt`: v2 is the cleaner floor and wall version.
- `resin-board.txt`: the Story keepsake band.

## Hand fixes not captured here

Some one-off steps were run inline and were not saved as scripts:

- Pasting garbled AI text back from the original (the sign, business cards and the resin board labels), using ECC-aligned patches with a Lab colour match.
- The knob's floor reflection: the image mirrored across the floor line.
- Gain-matched red for the knob.

The approach for each is described on /lightbox under "Hand-fix toolkit".

## Rules

- Raster images go to Cloudinary. Never commit photos; `assets/parts-pics/` stays local.
- Gemini results were rejected. Use OpenAI gpt-image-1.5.
- Check the AI hasn't invented details, such as stamps, labels or text, before publishing.
