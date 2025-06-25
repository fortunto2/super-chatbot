/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IResponsePaginated_IStyleRead_ } from '../models/IResponsePaginated_IStyleRead_';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StyleService {
    /**
     * Get List
     * @returns IResponsePaginated_IStyleRead_ Successful Response
     * @throws ApiError
     */
    public static styleGetList({
        searchText,
        tags,
        excludeTags,
        orderBy = 'name',
        order = 'descendent',
        limit = 50,
        offset,
    }: {
        searchText?: (string | null),
        tags?: (Array<string> | null),
        excludeTags?: (Array<string> | null),
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
    }): CancelablePromise<IResponsePaginated_IStyleRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/style',
            query: {
                'search_text': searchText,
                'tags': tags,
                'exclude_tags': excludeTags,
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
