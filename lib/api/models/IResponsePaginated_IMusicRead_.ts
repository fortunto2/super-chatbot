/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IMusicRead } from './IMusicRead';
import type { INextCursor } from './INextCursor';
export type IResponsePaginated_IMusicRead_ = {
    items: Array<IMusicRead>;
    total: (number | null);
    limit: (number | null);
    offset: (number | null);
    next?: (INextCursor | null);
};

