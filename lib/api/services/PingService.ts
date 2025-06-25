/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PingService {
    /**
     * Ping
     * @returns any Successful Response
     * @throws ApiError
     */
    public static pingPing(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ping',
        });
    }
    /**
     * Ping Head
     * @returns any Successful Response
     * @throws ApiError
     */
    public static pingPingHead(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/api/v1/ping',
        });
    }
}
