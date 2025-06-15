/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { EntityCharacterConfig } from './EntityCharacterConfig';
import type { EntityLocationConfig } from './EntityLocationConfig';
import type { EntityObjectConfig } from './EntityObjectConfig';
import type { EntityTypeEnum } from './EntityTypeEnum';
import type { IEntityLoraCreate } from './IEntityLoraCreate';
export type IEntityCreate = {
    name: string;
    description?: (string | null);
    config?: (EntityCharacterConfig | EntityLocationConfig | EntityObjectConfig);
    type: EntityTypeEnum;
    file_id?: (string | null);
    voice_name?: (string | null);
    loras?: Array<IEntityLoraCreate>;
};

