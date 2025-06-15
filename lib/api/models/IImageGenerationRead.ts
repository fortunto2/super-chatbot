/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IImageGenerationReferenceRead } from './IImageGenerationReferenceRead';
import type { ShotSizeEnum } from './ShotSizeEnum';
export type IImageGenerationRead = {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    shot_size?: (ShotSizeEnum | null);
    seed?: number;
    id: string;
    generation_config_name: (string | null);
    style_name: (string | null);
    references: Array<IImageGenerationReferenceRead>;
    entity_ids: Array<string>;
};

