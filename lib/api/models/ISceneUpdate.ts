/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import type { SceneTextbox_Input } from './SceneTextbox_Input';
export type ISceneUpdate = {
    order?: (number | null);
    visual_description?: string;
    action_description?: string;
    dialogue?: Record<string, any>;
    transitions?: Record<string, any>;
    objects?: Array<SceneTextbox_Input>;
    timeline?: Record<string, any>;
    duration?: number;
    id: string;
    file_id: string;
    voiceover_id?: (string | null);
    sound_effect_id?: (string | null);
};

