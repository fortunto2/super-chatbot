/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { GenerationSourceEnum } from './GenerationSourceEnum';
import type { GenerationTypeEnum } from './GenerationTypeEnum';
export type IGenerationConfigRead = {
    name: string;
    label?: (string | null);
    type: GenerationTypeEnum;
    source: GenerationSourceEnum;
    params: Record<string, any>;
};

