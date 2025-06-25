/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IImageGenerationReferenceCreate } from './IImageGenerationReferenceCreate';
import type { ShotSizeEnum } from './ShotSizeEnum';
export type IImageGenerationCreate = {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    shot_size?: (ShotSizeEnum | null);
    seed?: number;
    generation_config_name: string;
    batch_size?: (number | null);
    style_name?: (string | null);
    references?: Array<IImageGenerationReferenceCreate>;
    entity_ids?: (Array<string> | null);
    model_type?: (string | null);
};

