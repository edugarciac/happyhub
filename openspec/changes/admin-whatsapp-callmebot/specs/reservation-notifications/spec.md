## ADDED Requirements

### Requirement: Admin WhatsApp via CallMeBot
When `CALLMEBOT_API_KEY` is set, admin WhatsApp notifications SHALL be sent through CallMeBot to `ADMIN_WHATSAPP_NUMBER`; otherwise through WhatsApp Cloud API.

#### Scenario: New reservation with CallMeBot configured
- **WHEN** a reservation request is stored and `CALLMEBOT_API_KEY` is set
- **THEN** the admin SHALL receive a WhatsApp with the reservation summary

#### Scenario: CallMeBot error
- **WHEN** CallMeBot fails or returns an error page
- **THEN** the notification SHALL return false, the error SHALL be logged, and the reservation SHALL NOT fail
