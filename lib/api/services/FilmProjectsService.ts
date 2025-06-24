/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IProjectFilmCreate } from '../models/IProjectFilmCreate';
import type { IProjectFilmRead } from '../models/IProjectFilmRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilmProjectsService {
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
}
