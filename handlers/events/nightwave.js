import objectLike from './objectLike.js';

export default (nightwave, deps) => {
  const groups = {
    daily: [],
    weekly: [],
    elite: [],
  };

  (nightwave.activeChallenges || []).forEach((challenge) => {
    if (challenge.isDaily) {
      groups.daily.push(challenge);
    } else if (challenge.isElite) {
      groups.elite.push(challenge);
    } else {
      groups.weekly.push(challenge);
    }
  });

  const packets = [];
  Object.keys(groups).forEach((group) => {
    const p = objectLike(
      {
        ...nightwave,
        activeChallenges: groups[group],
      },
      {
        ...deps,
        id: `nightwave.${group}`,
      }
    );
    packets.push(p);
  });
  return packets;
};
