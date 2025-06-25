/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IResponsePaginated_IGenerationConfigRead_ } from '../models/IResponsePaginated_IGenerationConfigRead_';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GenerationConfigService {
    /**
     * Get List
     * @returns IResponsePaginated_IGenerationConfigRead_ Successful Response
     * @throws ApiError
     */
    public static generationConfigGetList({
        orderBy = 'name',
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
    }): CancelablePromise<IResponsePaginated_IGenerationConfigRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/generation-config',
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
}
