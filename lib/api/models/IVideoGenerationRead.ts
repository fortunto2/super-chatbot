/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IGenerationConfigRead } from './IGenerationConfigRead';
import type { IVideoGenerationReferenceRead } from './IVideoGenerationReferenceRead';
export type IVideoGenerationRead = {
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
    id: string;
    generation_config_name: (string | null);
    generation_config: (IGenerationConfigRead | null);
    references: Array<IVideoGenerationReferenceRead>;
};

