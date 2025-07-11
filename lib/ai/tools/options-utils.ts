import type { MediaOption, MediaResolution } from '@/lib/types/media-settings';
import {
  VIDEO_RESOLUTIONS,
  getModelCompatibleResolutions,
  getDefaultResolutionForModel,
} from '@/lib/config/video-constants';

/**
 * Finds a style from a list of available styles based on a case-insensitive and partial match.
 * @param styleName The name of the style to find.
 * @param availableStyles The list of available styles.
 * @returns The found MediaOption or null if not found.
 */
export function findStyle(
  styleName: string,
  availableStyles: MediaOption[],
): MediaOption | null {
  const normalizedStyleName = styleName.toLowerCase().trim();

  // Direct match by label or id
  let foundStyle = availableStyles.find(
    style =>
      style.label.toLowerCase() === normalizedStyleName ||
      style.id.toLowerCase() === normalizedStyleName,
  );

  if (foundStyle) return foundStyle;

  // Partial match
  foundStyle = availableStyles.find(
    style =>
      style.label.toLowerCase().includes(normalizedStyleName) ||
      style.id.toLowerCase().includes(normalizedStyleName) ||
      normalizedStyleName.includes(style.label.toLowerCase()) ||
      normalizedStyleName.includes(style.id.toLowerCase()),
  );

  return foundStyle || null;
}

type SelectableOption = {
  id: string;
  label: string;
  name?: string;
  [key: string]: any;
};

/**
 * Finds a generic option from a list by its value (id, label, or name).
 * @param value The value to search for.
 * @param options The list of available options.
 * @param defaultOption The default option to return if not found.
 * @returns The found option or the default.
 */
export function findOption<T extends SelectableOption>(
  value: string | undefined,
  options: T[],
  defaultOption: T,
): T {
  if (!value) return defaultOption;
  const normalizedValue = value.toLowerCase().trim();
  const found = options.find(
    o =>
      o.id.toLowerCase() === normalizedValue ||
      o.label.toLowerCase() === normalizedValue ||
      (o.name && o.name.toLowerCase() === normalizedValue) ||
      (o.apiName && (o as any).apiName.toLowerCase() === normalizedValue),
  );
  return found || defaultOption;
}

/**
 * Selects a resolution for video generation, ensuring compatibility with the selected model.
 * @param resolutionName The desired resolution.
 * @param modelIdentifier The identifier of the model (name or id).
 * @returns A compatible MediaOption for the resolution.
 */
export function selectResolution(
  resolutionName: string | undefined,
  modelIdentifier: string,
): MediaResolution {
  const compatibleResolutions = getModelCompatibleResolutions(modelIdentifier);
  const defaultForModel = getDefaultResolutionForModel(modelIdentifier);

  if (!resolutionName) {
    return defaultForModel;
  }

  const requestedResolution = VIDEO_RESOLUTIONS.find(
    r => r.label === resolutionName,
  );
  if (requestedResolution) {
    const isCompatible = compatibleResolutions.some(
      r => r.label === requestedResolution.label,
    );
    if (isCompatible) {
      return requestedResolution;
    } else {
      console.log(
        `🔧 ⚠️ Resolution ${resolutionName} not compatible with model ${modelIdentifier}, using ${defaultForModel.label} instead`,
      );
      return defaultForModel;
    }
  }

  return defaultForModel;
}

/**
 * Selects a style with complex fallback logic.
 * @param styleName The desired style name.
 * @param availableStyles A list of available styles.
 * @param defaultStyleOption The ultimate fallback style.
 * @returns The selected MediaOption for the style.
 */
export function selectStyle(
  styleName: string | undefined,
  availableStyles: MediaOption[],
  defaultStyleOption: MediaOption,
): MediaOption {
  // Case 1: No style specified, find a sensible default.
  if (!styleName) {
    const preferredDefaults = [
      'flux_steampunk',
      'steampunk',
      'flux_realistic',
      'realistic',
    ];
    for (const preferredId of preferredDefaults) {
      const preferredStyle = findStyle(preferredId, availableStyles);
      if (preferredStyle) {
        console.log('🔧 🎯 USING PREFERRED DEFAULT STYLE:', preferredStyle.label);
        return preferredStyle;
      }
    }
    if (availableStyles.length > 0) {
      console.log(
        '🔧 🎯 USING FIRST AVAILABLE AS DEFAULT:',
        availableStyles[0].label,
      );
      return availableStyles[0];
    }
    return defaultStyleOption;
  }

  // Case 2: Style is specified, try to find it.
  const foundStyle = findStyle(styleName, availableStyles);
  if (foundStyle) {
    console.log('🔧 ✅ STYLE MATCHED:', styleName, '->', foundStyle.label);
    return foundStyle;
  }

  // Case 3: Style specified but not found, try fallbacks.
  console.log(`🔧 ⚠️ STYLE NOT FOUND: ${styleName}, trying fallbacks...`);
  if (availableStyles.length > 0) {
    console.log(
      '🔧 🔄 USING FIRST AVAILABLE STYLE as fallback:',
      availableStyles[0].label,
    );
    return availableStyles[0];
  }

  return defaultStyleOption;
} 