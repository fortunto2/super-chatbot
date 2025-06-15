/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { Body_scene_set_entity } from '../models/Body_scene_set_entity';
import type { Body_scene_update_order } from '../models/Body_scene_update_order';
import type { GenerateScenePayload } from '../models/GenerateScenePayload';
import type { IResponsePaginated_Union_ISceneRead__ISceneMinimalRead__ } from '../models/IResponsePaginated_Union_ISceneRead__ISceneMinimalRead__';
import type { ISceneCreate } from '../models/ISceneCreate';
import type { ISceneDetailedRead } from '../models/ISceneDetailedRead';
import type { ISceneRead } from '../models/ISceneRead';
import type { ISceneUpdate } from '../models/ISceneUpdate';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { SelectRelatedEnum } from '../models/SelectRelatedEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SceneService {
    /**
     * Get List
     * @returns IResponsePaginated_Union_ISceneRead__ISceneMinimalRead__ Successful Response
     * @throws ApiError
     */
    public static sceneGetList({
        projectId,
        orderBy = 'order',
        order = 'ascendent',
        selectRelated = 'full',
        limit = 50,
        offset,
    }: {
        projectId?: (string | null),
        orderBy?: string,
        order?: ListOrderEnum,
        selectRelated?: SelectRelatedEnum,
        /**
         * Page size limit
         */
        limit?: number,
        /**
         * Page offset
         */
        offset?: number,
    }): CancelablePromise<IResponsePaginated_Union_ISceneRead__ISceneMinimalRead__> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/scene',
            query: {
                'project_id': projectId,
                'order_by': orderBy,
                'order': order,
                'select_related': selectRelated,
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
     * @returns ISceneRead Successful Response
     * @throws ApiError
     */
    public static sceneCreate({
        requestBody,
    }: {
        requestBody: ISceneCreate,
    }): CancelablePromise<ISceneRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/scene',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get List By Ids
     * @returns ISceneRead Successful Response
     * @throws ApiError
     */
    public static sceneGetListByIds({
        requestBody,
    }: {
        requestBody: Array<string>,
    }): CancelablePromise<Array<ISceneRead>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/scene/list',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get By Id
     * @returns ISceneDetailedRead Successful Response
     * @throws ApiError
     */
    public static sceneGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<ISceneDetailedRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/scene/{id}',
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
     * @returns ISceneRead Successful Response
     * @throws ApiError
     */
    public static sceneUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: ISceneUpdate,
    }): CancelablePromise<ISceneRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/scene/{id}',
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
     * @returns ISceneRead Successful Response
     * @throws ApiError
     */
    public static sceneDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<ISceneRead> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/scene/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate
     * @returns ISceneRead Successful Response
     * @throws ApiError
     */
    public static sceneGenerate({
        requestBody,
    }: {
        requestBody: GenerateScenePayload,
    }): CancelablePromise<ISceneRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/scene/generate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Set Entity
     * @returns ISceneRead Successful Response
     * @throws ApiError
     */
    public static sceneSetEntity({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: Body_scene_set_entity,
    }): CancelablePromise<ISceneRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/scene/{id}/entity',
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
     * Update Order
     * @returns ISceneRead Successful Response
     * @throws ApiError
     */
    public static sceneUpdateOrder({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: Body_scene_update_order,
    }): CancelablePromise<ISceneRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/scene/{id}/order',
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
}
