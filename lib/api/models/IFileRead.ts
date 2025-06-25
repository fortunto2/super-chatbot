/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { FileTypeEnum } from './FileTypeEnum';
import type { IAudioGenerationRead } from './IAudioGenerationRead';
import type { IImageGenerationRead } from './IImageGenerationRead';
import type { ITaskRead } from './ITaskRead';
import type { IVideoGenerationRead } from './IVideoGenerationRead';
export type IFileRead = {
    id: string;
    url: (string | null);
    thumbnail_url: (string | null);
    type: FileTypeEnum;
    image_generation_id: (string | null);
    image_generation: (IImageGenerationRead | null);
    video_generation_id: (string | null);
    video_generation: (IVideoGenerationRead | null);
    audio_generation_id?: (string | null);
    audio_generation: (IAudioGenerationRead | null);
    duration: (number | null);
    tasks?: Array<ITaskRead>;
};

