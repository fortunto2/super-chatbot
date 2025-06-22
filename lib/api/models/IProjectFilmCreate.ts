/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { IProjectFilmConfig_Input } from './IProjectFilmConfig_Input';
export type IProjectFilmCreate = {
    config: IProjectFilmConfig_Input;
    thumbnail_url?: (string | null);
    type?: IProjectFilmCreate.type;
    template_name?: (string | null);
    style_name?: (string | null);
    music_id?: (string | null);
};
export namespace IProjectFilmCreate {
    export enum type {
        FILM = 'film',
    }
}

