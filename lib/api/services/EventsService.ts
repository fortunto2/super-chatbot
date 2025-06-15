/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EventsService {
    /**
     * Subscribe
     * @returns any Successful Response
     * @throws ApiError
     */
    public static subscribeApiV1EventsChannelGet({
        channel,
    }: {
        channel: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/events/{channel}',
            path: {
                'channel': channel,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
