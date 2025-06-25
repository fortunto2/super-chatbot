/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IProjectFilmCreate } from '../models/IProjectFilmCreate';
import type { IProjectFilmRead } from '../models/IProjectFilmRead';
import type { IProjectMediaCreate } from '../models/IProjectMediaCreate';
import type { IProjectMediaRead } from '../models/IProjectMediaRead';
import type { IProjectRead } from '../models/IProjectRead';
import type { IProjectUpdate } from '../models/IProjectUpdate';
import type { IProjectVideoCreate } from '../models/IProjectVideoCreate';
import type { IProjectVideoRead } from '../models/IProjectVideoRead';
import type { IResponsePaginated_IProjectRead_ } from '../models/IResponsePaginated_IProjectRead_';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { ProjectTypeEnum } from '../models/ProjectTypeEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectService {
    /**
     * Get List
     * @returns IResponsePaginated_IProjectRead_ Successful Response
     * @throws ApiError
     */
    public static projectGetList({
        type,
        searchText,
        userId,
        orderBy = 'created_at',
        order = 'descendent',
        limit = 50,
        offset,
    }: {
        type?: (ProjectTypeEnum | null),
        searchText?: (string | null),
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
    }): CancelablePromise<IResponsePaginated_IProjectRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project',
            query: {
                'type': type,
                'search_text': searchText,
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
     * Get By Id
     * @returns IProjectRead Successful Response
     * @throws ApiError
     */
    public static projectGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project/{id}',
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
     * @returns IProjectRead Successful Response
     * @throws ApiError
     */
    public static projectUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: IProjectUpdate,
    }): CancelablePromise<IProjectRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/project/{id}',
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
     * Test Token
     * Test endpoint to check token verification
     * @returns any Successful Response
     * @throws ApiError
     */
    public static projectTestToken({
        authorization,
    }: {
        authorization: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project/film/test-token',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Film Project
     * Create a new film project and start generating script
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectCreateFilmProject({
        requestBody,
    }: {
        requestBody: IProjectFilmCreate,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/film',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Txt2Script
     * Regenerate project script (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectTxt2Script({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: string,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/film/{id}/txt2script',
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
     * Script2Entities
     * Extract entities from script (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectScript2Entities({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/film/{id}/script2entities',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Script2Storyboard
     * Generate storyboard from script (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectScript2Storyboard({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/film/{id}/script2storyboard',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Storyboard2Video
     * Render final video from storyboard (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectStoryboard2Video({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/film/{id}/storyboard2video',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Timeline2Video
     * Render video from timeline (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectTimeline2Video({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/film/{id}/timeline2video',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Animate All
     * Animate all scenes in project (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectAnimateAll({
        id,
        generationConfigName,
        duration = 5,
    }: {
        id: string,
        generationConfigName: string,
        duration?: number,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/film/{id}/animate-all',
            path: {
                'id': id,
            },
            query: {
                'generation_config_name': generationConfigName,
                'duration': duration,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync To Beats
     * Sync scenes to music beats (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectSyncToBeats({
        id,
        dynamic,
    }: {
        id: string,
        dynamic: number,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/project/film/{id}/sync_to_beats',
            path: {
                'id': id,
            },
            query: {
                'dynamic': dynamic,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Regenerate Timeline
     * Regenerate project timeline (film projects only)
     * @returns IProjectFilmRead Successful Response
     * @throws ApiError
     */
    public static projectRegenerateTimeline({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectFilmRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/project/film/{id}/timeline',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Media Project
     * Create a new media project for collecting media files (images, videos, audio)
     * @returns IProjectMediaRead Successful Response
     * @throws ApiError
     */
    public static projectCreateMediaProject({
        requestBody,
    }: {
        requestBody: IProjectMediaCreate,
    }): CancelablePromise<IProjectMediaRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/media',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Test Token
     * Test endpoint to check token verification
     * @returns any Successful Response
     * @throws ApiError
     */
    public static projectTestToken1({
        authorization,
    }: {
        authorization: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project/video/test-token',
            headers: {
                'authorization': authorization,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Video
     * Create a new video project and start generating script
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectVideo({
        requestBody,
    }: {
        requestBody: IProjectVideoCreate,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/video',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Txt2Script
     * Regenerate project script
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectTxt2Script1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: string,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/video/{id}/txt2script',
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
     * Script2Entities
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectScript2Entities1({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/video/{id}/script2entities',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Script2Storyboard
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectScript2Storyboard1({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/video/{id}/script2storyboard',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Storyboard2Video
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectStoryboard2Video1({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/video/{id}/storyboard2video',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Timeline2Video
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectTimeline2Video1({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/video/{id}/timeline2video',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Animate All
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectAnimateAll1({
        id,
        generationConfigName,
        duration = 5,
    }: {
        id: string,
        generationConfigName: string,
        duration?: number,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/video/{id}/animate-all',
            path: {
                'id': id,
            },
            query: {
                'generation_config_name': generationConfigName,
                'duration': duration,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync To Beats
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectSyncToBeats1({
        id,
        dynamic,
    }: {
        id: string,
        dynamic: number,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/project/video/{id}/sync_to_beats',
            path: {
                'id': id,
            },
            query: {
                'dynamic': dynamic,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Regenerate Timeline
     * @returns IProjectVideoRead Successful Response
     * @throws ApiError
     */
    public static projectRegenerateTimeline1({
        id,
    }: {
        id: string,
    }): CancelablePromise<IProjectVideoRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/project/video/{id}/timeline',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Image
     * Create a new image project and start generating image file
     * @returns IProjectMediaRead Successful Response
     * @throws ApiError
     */
    public static projectImage({
        requestBody,
    }: {
        requestBody: IProjectMediaCreate,
    }): CancelablePromise<IProjectMediaRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/image',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
