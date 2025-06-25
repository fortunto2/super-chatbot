/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { PaymentTypeEnum } from '../models/PaymentTypeEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StripeService {
    /**
     * Stripe Checkout Session
     * @returns any Successful Response
     * @throws ApiError
     */
    public static stripeStripeCheckoutSession({
        type,
    }: {
        type: PaymentTypeEnum,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/payment-link/{type}',
            path: {
                'type': type,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stripe Webhook
     * @returns any Successful Response
     * @throws ApiError
     */
    public static stripeStripeWebhook({
        stripeSignature,
    }: {
        stripeSignature?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/webhook',
            headers: {
                'stripe-signature': stripeSignature,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
