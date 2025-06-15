/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IVideoGenerationReferenceCreate } from './IVideoGenerationReferenceCreate';
export type IVideoGenerationCreate = {
    prompt?: string;
    negative_prompt?: string;
    seed?: number;
    duration?: number;
    /**
     * Video width in pixels
     */
    width?: (number | null);
    /**
     * Video height in pixels
     */
    height?: (number | null);
    /**
     * Video aspect ratio (e.g., '16:9', '9:16')
     */
    aspect_ratio?: (string | null);
    generation_config_name: string;
    references?: Array<IVideoGenerationReferenceCreate>;
    model_type?: (string | null);
};

