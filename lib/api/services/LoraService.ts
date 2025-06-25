/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { ILoraCreate } from '../models/ILoraCreate';
import type { ILoraRead } from '../models/ILoraRead';
import type { ILoraUpdate } from '../models/ILoraUpdate';
import type { IResponsePaginated_ILoraRead_ } from '../models/IResponsePaginated_ILoraRead_';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { LoraStatusEnum } from '../models/LoraStatusEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LoraService {
    /**
     * Get List
     * @returns IResponsePaginated_ILoraRead_ Successful Response
     * @throws ApiError
     */
    public static loraGetList({
        searchText,
        status,
        userId,
        orderBy = 'id',
        order = 'descendent',
        limit = 50,
        offset,
    }: {
        searchText?: (string | null),
        status?: (LoraStatusEnum | null),
        userId?: (string | null),
        orderBy?: string,
        order?: ListOrderEnum,
        /**
         * Page size limit
         */
        limit?: number,
        /**
         * Page offset
         */
        offset?: number,
    }): CancelablePromise<IResponsePaginated_ILoraRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/lora',
            query: {
                'search_text': searchText,
                'status': status,
                'user_id': userId,
                'order_by': orderBy,
                'order': order,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create
     * @returns ILoraRead Successful Response
     * @throws ApiError
     */
    public static loraCreate({
        requestBody,
    }: {
        requestBody: ILoraCreate,
    }): CancelablePromise<ILoraRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/lora',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get By Id
     * @returns ILoraRead Successful Response
     * @throws ApiError
     */
    public static loraGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<ILoraRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/lora/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update
     * @returns ILoraRead Successful Response
     * @throws ApiError
     */
    public static loraUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: ILoraUpdate,
    }): CancelablePromise<ILoraRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/lora/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete
     * @returns ILoraRead Successful Response
     * @throws ApiError
     */
    public static loraDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<ILoraRead> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/lora/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
