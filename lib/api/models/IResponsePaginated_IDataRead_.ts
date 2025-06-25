/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IDataRead } from './IDataRead';
import type { INextCursor } from './INextCursor';
export type IResponsePaginated_IDataRead_ = {
    items: Array<IDataRead>;
    total: (number | null);
    limit: (number | null);
    offset: (number | null);
    next?: (INextCursor | null);
};

