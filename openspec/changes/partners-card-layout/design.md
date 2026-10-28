## Decisions

- Card becomes a centered flex column: image → name → service type → description → links (`mt-auto` keeps links at the bottom).
- Image 160×160 with `object-contain`, so logos of any aspect ratio are never cropped; `next/image` serves a resized version.
- Placeholder (`Building2` icon on gray) when there is no image, so all cards in a row align.
