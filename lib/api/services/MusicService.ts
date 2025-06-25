/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { Body_music_create } from '../models/Body_music_create';
import type { IMusicDetailedRead } from '../models/IMusicDetailedRead';
import type { IMusicRead } from '../models/IMusicRead';
import type { IMusicUpdate } from '../models/IMusicUpdate';
import type { IResponsePaginated_IMusicRead_ } from '../models/IResponsePaginated_IMusicRead_';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MusicService {
    /**
     * Get List
     * @returns IResponsePaginated_IMusicRead_ Successful Response
     * @throws ApiError
     */
    public static musicGetList({
        orderBy = 'id',
        order = 'descendent',
        limit = 50,
        offset,
    }: {
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
    }): CancelablePromise<IResponsePaginated_IMusicRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music',
            query: {
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
     * @returns IMusicRead Successful Response
     * @throws ApiError
     */
    public static musicCreate({
        formData,
    }: {
        formData: Body_music_create,
    }): CancelablePromise<IMusicRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get List By Ids
     * @returns IMusicRead Successful Response
     * @throws ApiError
     */
    public static musicGetListByIds({
        requestBody,
    }: {
        requestBody: Array<string>,
    }): CancelablePromise<Array<IMusicRead>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/music/list',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get By Id
     * @returns IMusicDetailedRead Successful Response
     * @throws ApiError
     */
    public static musicGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<IMusicDetailedRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/music/{id}',
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
     * @returns IMusicRead Successful Response
     * @throws ApiError
     */
    public static musicUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: IMusicUpdate,
    }): CancelablePromise<IMusicRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/music/{id}',
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
     * @returns IMusicRead Successful Response
     * @throws ApiError
     */
    public static musicDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<IMusicRead> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/music/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
