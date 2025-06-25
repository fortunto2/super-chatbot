/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IProjectVideoConfig_Input } from './IProjectVideoConfig_Input';
export type IProjectVideoCreate = {
    config: IProjectVideoConfig_Input;
    thumbnail_url?: (string | null);
    type?: IProjectVideoCreate.type;
    template_name?: (string | null);
    style_name?: (string | null);
    music_id?: (string | null);
};
export namespace IProjectVideoCreate {
    export enum type {
        FILM = 'film',
    }
}

