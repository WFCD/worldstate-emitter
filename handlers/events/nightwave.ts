import objectLike from '@/handlers/events/objectLike';
import type { BaseEventData, EventPacket } from '@/handlers/events/types';

interface Challenge extends BaseEventData {
  isDaily: boolean;
  isElite: boolean;
}

interface Nightwave extends BaseEventData {
  activeChallenges?: Challenge[];
}

interface NightwaveDeps {
  key: string;
  platform: string;
  language: string;
  cycleStart: Date | number;
  data: Nightwave;
  id?: string;
}

/**
 * Process nightwave challenges
 * @param nightwave - Nightwave data
 * @param deps - Dependencies for processing
 * @returns Array of packets to emit
 */
export default (nightwave: Nightwave, deps: NightwaveDeps): EventPacket[] => {
  const groups: Record<string, Challenge[]> = {
    daily: [],
    weekly: [],
    elite: [],
  };

  for (const challenge of nightwave.activeChallenges || []) {
    if (challenge.isDaily) {
      groups.daily.push(challenge);
    } else if (challenge.isElite) {
      groups.elite.push(challenge);
    } else {
      groups.weekly.push(challenge);
    }
  }

  const packets: EventPacket[] = [];
  for (const group of Object.keys(groups)) {
    const nightwaveWithGroup: Nightwave = {
      ...nightwave,
      activeChallenges: groups[group],
    };
    const p = objectLike(nightwaveWithGroup, {
      ...deps,
      data: nightwaveWithGroup,
      id: `nightwave.${group}`,
    });
    if (p) {
      packets.push(p);
    }
  }
  return packets;
};
