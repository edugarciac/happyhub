import {
  reservationSchema,
  contactSchema,
  loginSchema,
  reviewSchema,
  eventTypeSchema,
  partnerSchema,
  serviceSchema,
  clientUpdateSchema,
  reservationAdminSchema,
  validatePhone,
  isReservationEligibleForReview,
} from '../utils/validators';

describe('reservationSchema', () => {
  const validData = {
    name: 'Juan García',
    email: 'juan@example.com',
    phone: '612345678',
    eventType: 'cumpleaños' as const,
    date: '2025-06-15',
    timeSlot: 'morning' as const,
    guests: 20,
    paymentMethod: 'card' as const,
  };

  it('accepts valid reservation data', () => {
    const result = reservationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts valid data with optional extras and message', () => {
    const result = reservationSchema.safeParse({
      ...validData,
      extras: ['catering', 'decoracion'],
      message: 'Fiesta sorpresa',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = reservationSchema.safeParse({ ...validData, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = reservationSchema.safeParse({ ...validData, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('rejects phone shorter than 9 characters', () => {
    const result = reservationSchema.safeParse({ ...validData, phone: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid event type', () => {
    const result = reservationSchema.safeParse({ ...validData, eventType: 'wedding' });
    expect(result.success).toBe(false);
  });

  it('rejects guests below 1', () => {
    const result = reservationSchema.safeParse({ ...validData, guests: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects guests above 150', () => {
    const result = reservationSchema.safeParse({ ...validData, guests: 200 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid payment method', () => {
    const result = reservationSchema.safeParse({ ...validData, paymentMethod: 'bitcoin' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time slot', () => {
    const result = reservationSchema.safeParse({ ...validData, timeSlot: 'dawn' });
    expect(result.success).toBe(false);
  });

  it('rejects empty date', () => {
    const result = reservationSchema.safeParse({ ...validData, date: '' });
    expect(result.success).toBe(false);
  });
});

describe('contactSchema', () => {
  const validContact = {
    name: 'María López',
    email: 'maria@example.com',
    subject: 'Información sobre eventos',
    message: 'Me gustaría saber más sobre las opciones disponibles.',
  };

  it('accepts valid contact data', () => {
    expect(contactSchema.safeParse(validContact).success).toBe(true);
  });

  it('rejects short subject', () => {
    expect(contactSchema.safeParse({ ...validContact, subject: 'Hi' }).success).toBe(false);
  });

  it('rejects short message', () => {
    expect(contactSchema.safeParse({ ...validContact, message: 'Hello' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: 'secret123' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'secret123' }).success).toBe(false);
  });

  it('rejects short password', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: '12345' }).success).toBe(false);
  });
});

describe('reviewSchema', () => {
  it('accepts valid review', () => {
    expect(reviewSchema.safeParse({ reservation_id: 1, rating: 5 }).success).toBe(true);
  });

  it('accepts review with text', () => {
    expect(reviewSchema.safeParse({ reservation_id: 1, rating: 4, review_text: 'Great!' }).success).toBe(true);
  });

  it('rejects rating below 1', () => {
    expect(reviewSchema.safeParse({ reservation_id: 1, rating: 0 }).success).toBe(false);
  });

  it('rejects rating above 5', () => {
    expect(reviewSchema.safeParse({ reservation_id: 1, rating: 6 }).success).toBe(false);
  });

  it('rejects review_text over 500 chars', () => {
    const longText = 'a'.repeat(501);
    expect(reviewSchema.safeParse({ reservation_id: 1, rating: 3, review_text: longText }).success).toBe(false);
  });
});

describe('eventTypeSchema', () => {
  it('accepts valid event type', () => {
    expect(eventTypeSchema.safeParse({ name: 'Cumpleaños' }).success).toBe(true);
  });

  it('rejects short name', () => {
    expect(eventTypeSchema.safeParse({ name: 'A' }).success).toBe(false);
  });

  it('rejects icon over 10 chars', () => {
    expect(eventTypeSchema.safeParse({ name: 'Test', icon: '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉' }).success).toBe(false);
  });
});

describe('partnerSchema', () => {
  it('accepts valid partner', () => {
    expect(partnerSchema.safeParse({ name: 'Catering Plus', service_type: 'Catering' }).success).toBe(true);
  });

  it('accepts partner with empty string URLs', () => {
    expect(partnerSchema.safeParse({
      name: 'Catering Plus',
      service_type: 'Catering',
      logo_url: '',
      website: '',
    }).success).toBe(true);
  });

  it('rejects invalid URL for logo_url', () => {
    expect(partnerSchema.safeParse({
      name: 'Catering Plus',
      service_type: 'Catering',
      logo_url: 'not-a-url',
    }).success).toBe(false);
  });
});

describe('serviceSchema', () => {
  it('accepts valid service', () => {
    expect(serviceSchema.safeParse({
      reservation_id: 1,
      service_name: 'DJ Set',
      service_type: 'Entertainment',
      price: 200,
    }).success).toBe(true);
  });

  it('rejects negative price', () => {
    expect(serviceSchema.safeParse({
      reservation_id: 1,
      service_name: 'DJ Set',
      service_type: 'Entertainment',
      price: -50,
    }).success).toBe(false);
  });
});

describe('clientUpdateSchema', () => {
  it('accepts partial updates', () => {
    expect(clientUpdateSchema.safeParse({ name: 'New Name' }).success).toBe(true);
    expect(clientUpdateSchema.safeParse({ role: 'admin' }).success).toBe(true);
    expect(clientUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid role', () => {
    expect(clientUpdateSchema.safeParse({ role: 'superadmin' }).success).toBe(false);
  });

  it('rejects empty name', () => {
    expect(clientUpdateSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('reservationAdminSchema', () => {
  it('accepts valid admin reservation', () => {
    expect(reservationAdminSchema.safeParse({
      user_id: 1,
      event_date: '2025-06-15',
      time_slot: 'afternoon',
      guests: 30,
    }).success).toBe(true);
  });

  it('rejects invalid time slot', () => {
    expect(reservationAdminSchema.safeParse({
      user_id: 1,
      event_date: '2025-06-15',
      time_slot: 'dawn',
      guests: 30,
    }).success).toBe(false);
  });

  it('rejects 0 guests', () => {
    expect(reservationAdminSchema.safeParse({
      user_id: 1,
      event_date: '2025-06-15',
      time_slot: 'morning',
      guests: 0,
    }).success).toBe(false);
  });
});

describe('validatePhone', () => {
  it('validates a 9-digit Spanish number', () => {
    expect(validatePhone('612345678')).toBe(true);
  });

  it('validates a number with country code', () => {
    expect(validatePhone('+34612345678')).toBe(true);
  });

  it('validates a number with dashes', () => {
    expect(validatePhone('612-345-678')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validatePhone('')).toBe(false);
  });

  it('rejects letters', () => {
    expect(validatePhone('abcdefghi')).toBe(false);
  });
});

describe('isReservationEligibleForReview', () => {
  it('returns true for confirmed past reservation', () => {
    expect(isReservationEligibleForReview({
      status: 'confirmed',
      event_date: '2020-01-01',
    })).toBe(true);
  });

  it('returns false for pending reservation', () => {
    expect(isReservationEligibleForReview({
      status: 'pending',
      event_date: '2020-01-01',
    })).toBe(false);
  });

  it('returns false for cancelled reservation', () => {
    expect(isReservationEligibleForReview({
      status: 'cancelled',
      event_date: '2020-01-01',
    })).toBe(false);
  });

  it('returns false for future confirmed reservation', () => {
    expect(isReservationEligibleForReview({
      status: 'confirmed',
      event_date: '2099-12-31',
    })).toBe(false);
  });
});
