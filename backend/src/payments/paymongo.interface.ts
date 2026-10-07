export interface PaymongoCheckoutSession {
  data: {
    id: string;
    type: string;

    attributes: {
      checkout_url: string;

      reference_number?: string;

      status?: string;

      created_at?: number;

      updated_at?: number;
    };
  };
}

export interface PaymongoErrorResponse {
  errors?: Array<{
    code?: string;

    detail?: string;

    source?: {
      pointer?: string;
      attribute?: string;
    };
  }>;
}

export interface PaymongoPaymentSource {
  id?: string;

  type?: string;

  provider?:
    | string
    | {
        id?: string;
        code_id?: string;
        bank_institution_code?: string;
      };
}

export interface PaymongoPaymentAttempt {
  id: string;

  type?: string;

  attributes: {
    amount: number;

    currency?: string;

    status: string;

    paid_at?: number;

    payment_intent_id?: string;

    source?: PaymongoPaymentSource;
  };
}

export interface PaymongoCheckoutSessionResource {
  id: string;

  type?: string;

  attributes?: {
    reference_number?: string;

    metadata?: Record<string, string>;

    payment_intent?: {
      id?: string;
    };

    payments?: PaymongoPaymentAttempt[];

    status?: string;

    created_at?: number;

    updated_at?: number;
  };
}

/*
 * This is the event-resource webhook structure
 * observed from PayMongo in ngrok:
 *
 * data.type = "event"
 * data.attributes.type =
 *   "checkout_session.payment.paid"
 * data.attributes.data =
 *   Checkout Session
 */
export interface PaymongoWebhookEvent {
  data?: {
    id?: string;

    type?: string;

    attributes?: {
      type?: string;

      livemode?: boolean;

      data?: PaymongoCheckoutSessionResource;

      previous_data?: Record<string, unknown>;

      pending_webhooks?: number;

      created_at?: number;

      updated_at?: number;
    };
  };
}
