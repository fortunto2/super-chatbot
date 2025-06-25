/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { Body_file_upload } from '../models/Body_file_upload';
import type { FileTypeEnum } from '../models/FileTypeEnum';
import type { GenerateAudioPayload } from '../models/GenerateAudioPayload';
import type { GenerateImagePayload } from '../models/GenerateImagePayload';
import type { GenerateVideoPayload } from '../models/GenerateVideoPayload';
import type { IFileRead } from '../models/IFileRead';
import type { IResponsePaginated_IFileRead_ } from '../models/IResponsePaginated_IFileRead_';
import type { ListOrderEnum } from '../models/ListOrderEnum';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FileService {
    /**
     * Get List
     * @returns IResponsePaginated_IFileRead_ Successful Response
     * @throws ApiError
     */
    public static fileGetList({
        userId,
        projectId,
        entityId,
        sceneId,
        types,
        orderBy = 'created_at',
        order = 'descendent',
        limit = 50,
        offset,
    }: {
        userId?: (string | null),
        projectId?: (string | null),
        entityId?: (string | null),
        sceneId?: (string | null),
        types?: (Array<FileTypeEnum> | null),
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
    }): CancelablePromise<IResponsePaginated_IFileRead_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/file',
            query: {
                'user_id': userId,
                'project_id': projectId,
                'entity_id': entityId,
                'scene_id': sceneId,
                'types': types,
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
     * @returns IFileRead Successful Response
     * @throws ApiError
     */
    public static fileGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<IFileRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/file/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete
     * @returns IFileRead Successful Response
     * @throws ApiError
     */
    public static fileDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<IFileRead> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/file/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload
     * @returns IFileRead Successful Response
     * @throws ApiError
     */
    public static fileUpload({
        formData,
        projectId,
        entityId,
        sceneId,
        type,
    }: {
        formData: Body_file_upload,
        projectId?: (string | null),
        entityId?: (string | null),
        sceneId?: (string | null),
        type?: (FileTypeEnum | null),
    }): CancelablePromise<IFileRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/file/upload',
            query: {
                'project_id': projectId,
                'entity_id': entityId,
                'scene_id': sceneId,
                'type': type,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Image
     * Legacy endpoint for generating images.
     * @returns IFileRead Successful Response
     * @throws ApiError
     */
    public static fileGenerateImage({
        requestBody,
    }: {
        requestBody: GenerateImagePayload,
    }): CancelablePromise<Array<IFileRead>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/file/generate-image',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Video
     * Legacy endpoint for generating videos.
     * @returns IFileRead Successful Response
     * @throws ApiError
     */
    public static fileGenerateVideo({
        requestBody,
    }: {
        requestBody: GenerateVideoPayload,
    }): CancelablePromise<IFileRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/file/generate-video',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Audio
     * @returns IFileRead Successful Response
     * @throws ApiError
     */
    public static fileGenerateAudio({
        requestBody,
    }: {
        requestBody: GenerateAudioPayload,
    }): CancelablePromise<IFileRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/file/generate-audio',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
