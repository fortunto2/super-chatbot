/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IProjectMediaCreate } from '../models/IProjectMediaCreate';
import type { IProjectMediaRead } from '../models/IProjectMediaRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ImageProjectsLegacyService {
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
