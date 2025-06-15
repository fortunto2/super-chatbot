/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Login Callback
     * @returns any Successful Response
     * @throws ApiError
     */
    public static authLoginCallback({
        redirectUrl,
    }: {
        redirectUrl: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/callback',
            query: {
                'redirect_url': redirectUrl,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Login
     * @returns any Successful Response
     * @throws ApiError
     */
    public static authLogin({
        redirectUrl,
    }: {
        redirectUrl: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/login',
            query: {
                'redirect_url': redirectUrl,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Token
     * @returns any Successful Response
     * @throws ApiError
     */
    public static authToken(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/token',
        });
    }
    /**
     * Logout
     * @returns any Successful Response
     * @throws ApiError
     */
    public static authLogout({
        redirectUrl,
    }: {
        redirectUrl: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/logout',
            query: {
                'redirect_url': redirectUrl,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
