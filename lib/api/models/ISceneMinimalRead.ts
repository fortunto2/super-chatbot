/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { SceneTextbox_Output } from './SceneTextbox_Output';
/**
 * Минимальная версия сцены с основными полями без глубоких связей
 */
export type ISceneMinimalRead = {
    order: number;
    visual_description?: string;
    action_description?: string;
    dialogue?: Record<string, any>;
    transitions?: Record<string, any>;
    objects?: Array<SceneTextbox_Output>;
    timeline?: Record<string, any>;
    duration?: number;
    id: string;
    file_id: (string | null);
    voiceover_id: (string | null);
    sound_effect_id: (string | null);
};

