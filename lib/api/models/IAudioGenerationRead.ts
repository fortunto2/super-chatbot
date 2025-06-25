/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { AudioTypeEnum } from './AudioTypeEnum';
export type IAudioGenerationRead = {
    type: AudioTypeEnum;
    prompt: string;
    model?: (string | null);
    duration?: (number | null);
    id: string;
    voice_name: (string | null);
    generation_config_name: (string | null);
};

