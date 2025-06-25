/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IImageGenerationCreate } from './IImageGenerationCreate';
export type IProjectMediaCreate = {
    config: (IImageGenerationCreate | Record<string, any>);
    thumbnail_url?: (string | null);
    type?: IProjectMediaCreate.type;
    template_name: (string | null);
    style_name?: (string | null);
    music_id?: (string | null);
    file_id?: (string | null);
};
export namespace IProjectMediaCreate {
    export enum type {
        MEDIA = 'media',
    }
}

