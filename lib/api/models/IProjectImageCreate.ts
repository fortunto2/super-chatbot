/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IImageGenerationCreate } from './IImageGenerationCreate';
import type { ProjectTypeEnum } from './ProjectTypeEnum';
export type IProjectImageCreate = {
    config: (IImageGenerationCreate | Record<string, any>);
    thumbnail_url?: (string | null);
    type: ProjectTypeEnum;
    template_name: (string | null);
    style_name?: (string | null);
    music_id?: (string | null);
    file_id?: (string | null);
};

