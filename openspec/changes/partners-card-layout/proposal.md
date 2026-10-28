## Why

On `/partners` the partner image is a 56 px thumbnail next to the name, too small to recognise the partner now that images can be uploaded.

## What Changes

- Each partner card shows the image large (160 px), centered at the top.
- Below it, centered: name, service type, description, then website/phone links.
- Partners without an image show a neutral placeholder of the same size so cards stay aligned.

## Capabilities

### Modified Capabilities
- `partners-page`: new card layout.

## Impact

- `src/pages/partners.tsx` only. No data or API changes.
