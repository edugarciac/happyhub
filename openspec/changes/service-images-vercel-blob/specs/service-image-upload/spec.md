## ADDED Requirements

### Requirement: Admin uploads a service image to Vercel Blob
The system SHALL let an admin upload a JPG, PNG, WebP, GIF or AVIF image up to 5 MB for a service, store it in Vercel Blob and save its public URL in the service form.

#### Scenario: Successful upload
- **WHEN** an admin selects a 4 MB JPG in the service form
- **THEN** the file is uploaded directly from the browser to Vercel Blob under `services/`
- **AND** the preview shows the image from its `*.public.blob.vercel-storage.com` URL

#### Scenario: File too large
- **WHEN** an admin selects an image larger than 5 MB
- **THEN** the upload is not attempted and the form shows "Máximo 5MB"

#### Scenario: Unsupported type
- **WHEN** an admin selects an SVG or a non-image file
- **THEN** the upload is rejected and the form shows an error

#### Scenario: Upload fails
- **WHEN** the token request or the upload fails
- **THEN** the form shows the error message and the button leaves the "Subiendo..." state

### Requirement: Admin uploads a partner image to Vercel Blob
The system SHALL upload partner images from `/admin/partners` to Vercel Blob under `partners/`, with the same types and size limit as service images.

#### Scenario: Partner image upload
- **WHEN** an admin selects a PNG in the partner form
- **THEN** the image is stored in Blob, the preview shows it and `/partners` displays it after saving

#### Scenario: Delete partner with image
- **WHEN** an admin deletes a partner whose `logo_url` is a Blob URL
- **THEN** the blob is deleted and the partner row is removed

### Requirement: Only admins can obtain upload tokens
The system SHALL issue Blob upload tokens from `/api/upload` only to authenticated admins and only for allowed folders.

#### Scenario: Non-admin request
- **WHEN** a request without an admin session calls `/api/upload`
- **THEN** the response is 401 and no token is issued

#### Scenario: Folder not allowed
- **WHEN** an admin requests a token for a pathname outside the allowed folders
- **THEN** the response is 400 and no token is issued

### Requirement: Service images render everywhere
The system SHALL render Blob-hosted service images in `/admin/services` and `/servicios` through `next/image`.

#### Scenario: Public services page
- **WHEN** a visitor opens `/servicios` and a service has a Blob image
- **THEN** the image is displayed

### Requirement: Deleting a service deletes its image
The system SHALL delete the service's Blob image when the service is deleted; a failed image delete SHALL NOT block the service delete.

#### Scenario: Delete service with image
- **WHEN** an admin deletes a service whose `image_url` is a Blob URL
- **THEN** the blob is deleted and the service row is removed
