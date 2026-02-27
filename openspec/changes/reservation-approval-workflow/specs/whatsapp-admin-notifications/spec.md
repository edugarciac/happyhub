## ADDED Requirements

### Requirement: Format WhatsApp message for admin
The system SHALL format WhatsApp notification with reservation details and action link.

#### Scenario: WhatsApp message formatting
- **WHEN** n8n prepares admin notification
- **THEN** message includes: "🆕 Nueva Reserva #[ID]\n👤 [name]\n📧 [email]\n📞 [phone]\n📅 [event_date]\n⏰ [time_slot]\n👥 [guests] personas\n💰 [total_price]€\n\n👉 Revisar: https://www.happyhub.es/admin/approve-reservation/[id]"

### Requirement: Send WhatsApp via Business API
The system SHALL use WhatsApp Business API with WHATSAPP_API_TOKEN for sending messages.

#### Scenario: Send message to business number
- **WHEN** n8n sends WhatsApp notification
- **THEN** message is sent to +34624645517 using WhatsApp Business Cloud API

#### Scenario: Handle WhatsApp API failure
- **WHEN** WhatsApp API returns error or timeout
- **THEN** n8n logs error and sends fallback email to admin instead
