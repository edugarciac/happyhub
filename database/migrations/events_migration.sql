-- =============================================================================
-- HappyHub – Event Hub Module Migration
-- Compatible con el schema existente (IDs INTEGER SERIAL):
--   users(id), reservations(id), event_types(id), partners(id)
-- Ejecutar en Neon SQL Editor
-- =============================================================================

-- ── Tabla principal ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_hub (
  id              SERIAL        PRIMARY KEY,
  user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_id  INTEGER       REFERENCES reservations(id) ON DELETE SET NULL,
  event_type_id   INTEGER       REFERENCES event_types(id)  ON DELETE SET NULL,
  name            VARCHAR(255)  NOT NULL,
  description     TEXT,
  status          VARCHAR(20)   NOT NULL DEFAULT 'planning'
                                CHECK (status IN ('planning','active','completed')),
  scheduled_at    TIMESTAMP     WITHOUT TIME ZONE,
  occurred_at     TIMESTAMP     WITHOUT TIME ZONE,
  location        VARCHAR(500),
  created_at      TIMESTAMP     WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Participantes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_hub_participants (
  id          SERIAL       PRIMARY KEY,
  event_id    INTEGER      NOT NULL REFERENCES event_hub(id) ON DELETE CASCADE,
  user_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  phone       VARCHAR(50),
  role        VARCHAR(50)  NOT NULL DEFAULT 'attendee',
  created_at  TIMESTAMP    WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Comentarios ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_hub_comments (
  id           SERIAL       PRIMARY KEY,
  event_id     INTEGER      NOT NULL REFERENCES event_hub(id) ON DELETE CASCADE,
  user_id      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  author_name  VARCHAR(255) NOT NULL,
  text         TEXT         NOT NULL,
  created_at   TIMESTAMP    WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Fotos (almacenadas en S3) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_hub_photos (
  id             SERIAL       PRIMARY KEY,
  event_id       INTEGER      NOT NULL REFERENCES event_hub(id) ON DELETE CASCADE,
  user_id        INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  s3_key         VARCHAR(500) NOT NULL,
  url            TEXT         NOT NULL,
  caption        TEXT,
  uploader_name  VARCHAR(255) NOT NULL,
  created_at     TIMESTAMP    WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Invitaciones WhatsApp / Email ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_hub_invitations (
  id              SERIAL      PRIMARY KEY,
  event_id        INTEGER     NOT NULL REFERENCES event_hub(id) ON DELETE CASCADE,
  participant_id  INTEGER     NOT NULL REFERENCES event_hub_participants(id) ON DELETE CASCADE,
  sent_via        VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  message         TEXT,
  whatsapp_link   TEXT,
  sent_at         TIMESTAMP   WITHOUT TIME ZONE,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','sent','confirmed','declined')),
  created_at      TIMESTAMP   WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, participant_id)
);

-- ── Álbum IA ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_hub_album (
  id            SERIAL    PRIMARY KEY,
  event_id      INTEGER   NOT NULL REFERENCES event_hub(id) ON DELETE CASCADE UNIQUE,
  photo_count   INTEGER   NOT NULL DEFAULT 0,
  ai_summary    TEXT,
  cover_s3_key  VARCHAR(500),
  cover_url     TEXT,
  generated_at  TIMESTAMP WITHOUT TIME ZONE,
  created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Souvenir 3D → usa tabla partners existente ────────────────────────────

CREATE TABLE IF NOT EXISTS event_hub_souvenirs (
  id                SERIAL       PRIMARY KEY,
  event_id          INTEGER      NOT NULL REFERENCES event_hub(id) ON DELETE CASCADE UNIQUE,
  partner_id        INTEGER      REFERENCES partners(id) ON DELETE SET NULL,
  design_name       VARCHAR(255) NOT NULL,
  design_notes      TEXT,
  quantity          INTEGER      NOT NULL DEFAULT 1,
  delivery_address  TEXT,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','printing','shipped','delivered')),
  tracking_url      TEXT,
  ordered_at        TIMESTAMP    WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at        TIMESTAMP    WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Índices ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_event_hub_user_id        ON event_hub(user_id);
CREATE INDEX IF NOT EXISTS idx_event_hub_reservation_id ON event_hub(reservation_id);
CREATE INDEX IF NOT EXISTS idx_event_hub_status         ON event_hub(status);
CREATE INDEX IF NOT EXISTS idx_event_hub_scheduled_at   ON event_hub(scheduled_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ehp_event_id             ON event_hub_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_ehc_event_id             ON event_hub_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_ehph_event_id            ON event_hub_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_ehi_event_id             ON event_hub_invitations(event_id);

-- ── Trigger updated_at ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_hub_updated_at ON event_hub;
CREATE TRIGGER trg_event_hub_updated_at
  BEFORE UPDATE ON event_hub
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
