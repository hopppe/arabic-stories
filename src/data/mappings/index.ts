/**
 * Central export for all word mappings
 * Provides functions to get story-specific and common word mappings
 */

import { commonWordMappings } from './common-words';
import { littleRedRidingHoodMappings } from './little-red-riding-hood';
import { lostPhoneMappings } from './the-lost-phone';
import { threeLittlePigsMappings } from './the-three-little-pigs';
import { storyOfAdamMappings } from './story-of-adam';
import { storyOfJesusMappings } from './story-of-jesus';
import { secondTimothyMappings } from './2nd-timothy-1';

// Story IDs defined as constants to avoid typos
export const STORY_IDS = {
  LITTLE_RED_RIDING_HOOD: 'little-red-riding-hood',
  LOST_PHONE: 'the-lost-phone',
  THREE_LITTLE_PIGS: 'three-little-pigs',
  STORY_OF_ADAM: 'story-of-adam',
  STORY_OF_JESUS: 'story-of-jesus',
  SECOND_TIMOTHY: '2nd-timothy-1',
} as const;

// Type for story IDs
export type StoryId = typeof STORY_IDS[keyof typeof STORY_IDS];

// Map story IDs to their specific mappings
const storyMappings: Record<StoryId, Record<string, string>> = {
  [STORY_IDS.LITTLE_RED_RIDING_HOOD]: littleRedRidingHoodMappings,
  [STORY_IDS.LOST_PHONE]: lostPhoneMappings,
  [STORY_IDS.THREE_LITTLE_PIGS]: threeLittlePigsMappings,
  [STORY_IDS.STORY_OF_ADAM]: storyOfAdamMappings,
  [STORY_IDS.STORY_OF_JESUS]: storyOfJesusMappings,
  [STORY_IDS.SECOND_TIMOTHY]: secondTimothyMappings,
};

/**
 * Gets word mappings for a specific story
 * Combines both story-specific and common word mappings
 * Story-specific mappings take precedence over common ones
 */
export function getWordMappingsForStory(storyId: string): Record<string, string> {
  // Create a copy of common mappings as the base
  const mappings = { ...commonWordMappings };
  
  // If we have story-specific mappings, add them (they take precedence)
  if (storyId in storyMappings) {
    const storySpecificMappings = storyMappings[storyId as StoryId];
    Object.assign(mappings, storySpecificMappings);
  }
  
  return mappings;
}

/**
 * Gets all available word mappings across all stories
 * Story-specific mappings take precedence if there are conflicts
 */
export function getAllWordMappings(): Record<string, string> {
  // Start with common mappings
  const allMappings = { ...commonWordMappings };
  
  // Add all story-specific mappings
  Object.values(storyMappings).forEach(mappingSet => {
    Object.assign(allMappings, mappingSet);
  });
  
  return allMappings;
}

// Export all mappings for direct access if needed
export { 
  commonWordMappings, 
  littleRedRidingHoodMappings, 
  lostPhoneMappings,
  threeLittlePigsMappings,
  storyOfAdamMappings,
  storyOfJesusMappings,
  secondTimothyMappings
}; 