/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IFileReferenceRead } from './IFileReferenceRead';
import type { ReferenceTypeEnum } from './ReferenceTypeEnum';
export type IImageGenerationReferenceRead = {
    type: ReferenceTypeEnum;
    reference_id: (string | null);
    reference: (IFileReferenceRead | null);
};

