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

export interface PaymongoPaymentAttempt {
  id: string;

  attributes: {
    amount: number;

    currency?: string;

    status: string;

    paid_at?: number;

    source?: {
      id?: string;
      type?: string;
    };
  };
}

export interface PaymongoCheckoutWebhook {
  event_type?: string;

  data?: {
    type?: string;

    resource?: string;

    livemode?: boolean;

    created_at?: string;

    updated_at?: string;

    data?: {
      id: string;

      type?: string;

      attributes?: {
        reference_number?: string;

        metadata?: Record<
          string,
          string
        >;

        payment_intent?: {
          id?: string;
        };

        payments?: PaymongoPaymentAttempt[];
      };
    };
  };
}