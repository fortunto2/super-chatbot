/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IDataCreate } from '../models/IDataCreate';
import type { IDataRead } from '../models/IDataRead';
import type { IDataUpdate } from '../models/IDataUpdate';
import type { IResponsePaginated_IDataRead_ } from '../models/IResponsePaginated_IDataRead_';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DataService {
    /**
     * Get List
     * @returns IResponsePaginated_IDataRead_ Successful Response
     * @throws ApiError
     */
    public static dataGetList({
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
    }): CancelablePromise<IResponsePaginated_IDataRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/data',
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
     * @returns IDataRead Successful Response
     * @throws ApiError
     */
    public static dataCreate({
        requestBody,
    }: {
        requestBody: IDataCreate,
    }): CancelablePromise<IDataRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/data',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get List By Ids
     * @returns IDataRead Successful Response
     * @throws ApiError
     */
    public static dataGetListByIds({
        requestBody,
    }: {
        requestBody: Array<string>,
    }): CancelablePromise<Array<IDataRead>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/data/list',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get By Id
     * @returns IDataRead Successful Response
     * @throws ApiError
     */
    public static dataGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<IDataRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/data/{id}',
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
     * @returns IDataRead Successful Response
     * @throws ApiError
     */
    public static dataUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: IDataUpdate,
    }): CancelablePromise<IDataRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/data/{id}',
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
     * @returns IDataRead Successful Response
     * @throws ApiError
     */
    public static dataDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<IDataRead> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/data/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
