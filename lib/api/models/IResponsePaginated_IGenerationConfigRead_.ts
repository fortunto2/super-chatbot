/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IGenerationConfigRead } from './IGenerationConfigRead';
import type { INextCursor } from './INextCursor';
export type IResponsePaginated_IGenerationConfigRead_ = {
    items: Array<IGenerationConfigRead>;
    total: (number | null);
    limit: (number | null);
    offset: (number | null);
    next?: (INextCursor | null);
};

