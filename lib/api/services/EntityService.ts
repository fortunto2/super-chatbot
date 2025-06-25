/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { EntityTypeEnum } from '../models/EntityTypeEnum';
import type { IEntityCreate } from '../models/IEntityCreate';
import type { IEntityRead } from '../models/IEntityRead';
import type { IEntityUpdate } from '../models/IEntityUpdate';
import type { IResponsePaginated_IEntityRead_ } from '../models/IResponsePaginated_IEntityRead_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EntityService {
    /**
     * Get List
     * @returns IResponsePaginated_IEntityRead_ Successful Response
     * @throws ApiError
     */
    public static entityGetList({
        searchText,
        projectId,
        userId,
        type,
        _public,
        limit = 50,
        offset,
    }: {
        searchText?: (string | null),
        projectId?: (string | null),
        userId?: (string | null),
        type?: (EntityTypeEnum | null),
        _public?: (boolean | null),
        /**
         * Page size limit
         */
        limit?: number,
        /**
         * Page offset
         */
        offset?: number,
    }): CancelablePromise<IResponsePaginated_IEntityRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/entity',
            query: {
                'search_text': searchText,
                'project_id': projectId,
                'user_id': userId,
                'type': type,
                'public': _public,
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
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityCreate({
        requestBody,
    }: {
        requestBody: IEntityCreate,
    }): CancelablePromise<IEntityRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/entity',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get List By Ids
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityGetListByIds({
        requestBody,
    }: {
        requestBody: Array<string>,
    }): CancelablePromise<Array<IEntityRead>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/entity/list',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get By Id
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<IEntityRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/entity/{id}',
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
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: IEntityUpdate,
    }): CancelablePromise<IEntityRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/entity/{id}',
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
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<IEntityRead> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/entity/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Favorite
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityAddFavorite({
        id,
    }: {
        id: string,
    }): CancelablePromise<IEntityRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/entity/{id}/add-favorite',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Favorite
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityRemoveFavorite({
        id,
    }: {
        id: string,
    }): CancelablePromise<IEntityRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/entity/{id}/remove-favorite',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add To Project
     * @returns IEntityRead Successful Response
     * @throws ApiError
     */
    public static entityAddToProject({
        id,
        projectId,
    }: {
        id: string,
        projectId: string,
    }): CancelablePromise<IEntityRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/entity/{id}/add-to-project/{project_id}',
            path: {
                'id': id,
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
