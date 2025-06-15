/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { INextCursor } from './INextCursor';
import type { ITemplateRead } from './ITemplateRead';
export type IResponsePaginated_ITemplateRead_ = {
    items: Array<ITemplateRead>;
    total: (number | null);
    limit: (number | null);
    offset: (number | null);
    next?: (INextCursor | null);
};

