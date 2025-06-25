/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { ImageModelTypeEnum } from './ImageModelTypeEnum';
import type { QualityTypeEnum } from './QualityTypeEnum';
import type { Transition } from './Transition';
import type { Zoom } from './Zoom';
export type IProjectVideoConfig_Output = {
    prompt: string;
    dynamic?: number;
    aspect_ratio?: string;
    image_generation_config_name?: string;
    image_model_type?: ImageModelTypeEnum;
    quality?: QualityTypeEnum;
    seed?: number;
    voiceover_volume?: number;
    music_volume?: number;
    sound_effect_volume?: number;
    transition?: (Transition | null);
    zoom?: (Zoom | null);
    auto_mode?: boolean;
    entity_ids?: Array<string>;
    watermark?: boolean;
    subtitles?: boolean;
    voiceover?: boolean;
};

