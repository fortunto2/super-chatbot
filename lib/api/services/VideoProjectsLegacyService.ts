/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IProjectVideoCreate } from '../models/IProjectVideoCreate';
import type { IProjectVideoRead } from '../models/IProjectVideoRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VideoProjectsLegacyService {
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
    public static projectTxt2Script({
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
    public static projectScript2Entities({
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
    public static projectScript2Storyboard({
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
    public static projectStoryboard2Video({
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
    public static projectTimeline2Video({
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
    public static projectAnimateAll({
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
    public static projectSyncToBeats({
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
    public static projectRegenerateTimeline({
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
}
