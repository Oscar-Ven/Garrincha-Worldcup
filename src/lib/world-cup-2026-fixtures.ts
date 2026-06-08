export type GroupStageFixture = {
  fifaMatchNo: number;
  group: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  venue: string;
  city: string;
};

export type KnockoutFixture = {
  fifaMatchNo: number;
  stage: "ROUND_OF_32" | "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL";
  kickoffAt: string;
  venue: string;
  city: string;
  slotLabel: string;
};

export const groupStageFixtures: GroupStageFixture[] = [
  { fifaMatchNo: 1, group: "A", homeTeam: "Mexico", awayTeam: "South Africa", kickoffAt: "2026-06-11T19:00:00.000Z", venue: "Estadio Azteca", city: "Mexico City" },
  { fifaMatchNo: 2, group: "A", homeTeam: "South Korea", awayTeam: "Czechia", kickoffAt: "2026-06-12T02:00:00.000Z", venue: "Estadio Akron", city: "Guadalajara" },
  { fifaMatchNo: 3, group: "B", homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", kickoffAt: "2026-06-12T19:00:00.000Z", venue: "BMO Field", city: "Toronto" },
  { fifaMatchNo: 4, group: "D", homeTeam: "United States", awayTeam: "Paraguay", kickoffAt: "2026-06-13T01:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { fifaMatchNo: 5, group: "C", homeTeam: "Haiti", awayTeam: "Scotland", kickoffAt: "2026-06-14T01:00:00.000Z", venue: "Gillette Stadium", city: "Boston" },
  { fifaMatchNo: 6, group: "B", homeTeam: "Qatar", awayTeam: "Switzerland", kickoffAt: "2026-06-13T04:00:00.000Z", venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  { fifaMatchNo: 7, group: "C", homeTeam: "Brazil", awayTeam: "Morocco", kickoffAt: "2026-06-13T22:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey" },
  { fifaMatchNo: 8, group: "D", homeTeam: "Australia", awayTeam: "Turkiye", kickoffAt: "2026-06-14T19:00:00.000Z", venue: "BC Place", city: "Vancouver" },
  { fifaMatchNo: 9, group: "E", homeTeam: "Ivory Coast", awayTeam: "Ecuador", kickoffAt: "2026-06-14T23:00:00.000Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { fifaMatchNo: 10, group: "E", homeTeam: "Germany", awayTeam: "Curacao", kickoffAt: "2026-06-14T17:00:00.000Z", venue: "NRG Stadium", city: "Houston" },
  { fifaMatchNo: 11, group: "F", homeTeam: "Netherlands", awayTeam: "Japan", kickoffAt: "2026-06-14T20:00:00.000Z", venue: "AT&T Stadium", city: "Dallas" },
  { fifaMatchNo: 12, group: "F", homeTeam: "Sweden", awayTeam: "Tunisia", kickoffAt: "2026-06-15T02:00:00.000Z", venue: "Estadio BBVA", city: "Monterrey" },
  { fifaMatchNo: 13, group: "H", homeTeam: "Saudi Arabia", awayTeam: "Uruguay", kickoffAt: "2026-06-15T22:00:00.000Z", venue: "Hard Rock Stadium", city: "Miami" },
  { fifaMatchNo: 14, group: "H", homeTeam: "Spain", awayTeam: "Cape Verde", kickoffAt: "2026-06-15T16:00:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { fifaMatchNo: 15, group: "G", homeTeam: "Iran", awayTeam: "New Zealand", kickoffAt: "2026-06-16T01:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { fifaMatchNo: 16, group: "G", homeTeam: "Belgium", awayTeam: "Egypt", kickoffAt: "2026-06-15T19:00:00.000Z", venue: "Lumen Field", city: "Seattle" },
  { fifaMatchNo: 17, group: "I", homeTeam: "France", awayTeam: "Senegal", kickoffAt: "2026-06-16T19:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey" },
  { fifaMatchNo: 18, group: "I", homeTeam: "Iraq", awayTeam: "Norway", kickoffAt: "2026-06-16T19:00:00.000Z", venue: "Gillette Stadium", city: "Boston" },
  { fifaMatchNo: 19, group: "J", homeTeam: "Argentina", awayTeam: "Algeria", kickoffAt: "2026-06-17T01:00:00.000Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { fifaMatchNo: 20, group: "J", homeTeam: "Austria", awayTeam: "Jordan", kickoffAt: "2026-06-17T04:00:00.000Z", venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  { fifaMatchNo: 21, group: "L", homeTeam: "Ghana", awayTeam: "Panama", kickoffAt: "2026-06-17T23:00:00.000Z", venue: "BMO Field", city: "Toronto" },
  { fifaMatchNo: 22, group: "L", homeTeam: "England", awayTeam: "Croatia", kickoffAt: "2026-06-17T20:00:00.000Z", venue: "AT&T Stadium", city: "Dallas" },
  { fifaMatchNo: 23, group: "K", homeTeam: "Portugal", awayTeam: "DR Congo", kickoffAt: "2026-06-17T17:00:00.000Z", venue: "NRG Stadium", city: "Houston" },
  { fifaMatchNo: 24, group: "K", homeTeam: "Uzbekistan", awayTeam: "Colombia", kickoffAt: "2026-06-18T02:00:00.000Z", venue: "Estadio Azteca", city: "Mexico City" },
  { fifaMatchNo: 25, group: "A", homeTeam: "Czechia", awayTeam: "South Africa", kickoffAt: "2026-06-18T16:00:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { fifaMatchNo: 26, group: "B", homeTeam: "Switzerland", awayTeam: "Bosnia and Herzegovina", kickoffAt: "2026-06-18T16:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { fifaMatchNo: 27, group: "B", homeTeam: "Canada", awayTeam: "Qatar", kickoffAt: "2026-06-18T22:00:00.000Z", venue: "BC Place", city: "Vancouver" },
  { fifaMatchNo: 28, group: "A", homeTeam: "Mexico", awayTeam: "South Korea", kickoffAt: "2026-06-19T01:00:00.000Z", venue: "Estadio Akron", city: "Guadalajara" },
  { fifaMatchNo: 29, group: "C", homeTeam: "Brazil", awayTeam: "Haiti", kickoffAt: "2026-06-20T01:00:00.000Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { fifaMatchNo: 30, group: "C", homeTeam: "Scotland", awayTeam: "Morocco", kickoffAt: "2026-06-19T22:00:00.000Z", venue: "Gillette Stadium", city: "Boston" },
  { fifaMatchNo: 31, group: "D", homeTeam: "Turkiye", awayTeam: "Paraguay", kickoffAt: "2026-06-19T04:00:00.000Z", venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  { fifaMatchNo: 32, group: "D", homeTeam: "United States", awayTeam: "Australia", kickoffAt: "2026-06-19T19:00:00.000Z", venue: "Lumen Field", city: "Seattle" },
  { fifaMatchNo: 33, group: "E", homeTeam: "Germany", awayTeam: "Ivory Coast", kickoffAt: "2026-06-20T20:00:00.000Z", venue: "BMO Field", city: "Toronto" },
  { fifaMatchNo: 34, group: "E", homeTeam: "Ecuador", awayTeam: "Curacao", kickoffAt: "2026-06-21T00:00:00.000Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { fifaMatchNo: 35, group: "F", homeTeam: "Netherlands", awayTeam: "Sweden", kickoffAt: "2026-06-20T17:00:00.000Z", venue: "NRG Stadium", city: "Houston" },
  { fifaMatchNo: 36, group: "F", homeTeam: "Tunisia", awayTeam: "Japan", kickoffAt: "2026-06-20T04:00:00.000Z", venue: "Estadio BBVA", city: "Monterrey" },
  { fifaMatchNo: 37, group: "H", homeTeam: "Uruguay", awayTeam: "Cape Verde", kickoffAt: "2026-06-21T22:00:00.000Z", venue: "Hard Rock Stadium", city: "Miami" },
  { fifaMatchNo: 38, group: "H", homeTeam: "Spain", awayTeam: "Saudi Arabia", kickoffAt: "2026-06-21T16:00:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { fifaMatchNo: 39, group: "G", homeTeam: "Belgium", awayTeam: "Iran", kickoffAt: "2026-06-21T19:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { fifaMatchNo: 40, group: "G", homeTeam: "New Zealand", awayTeam: "Egypt", kickoffAt: "2026-06-22T01:00:00.000Z", venue: "BC Place", city: "Vancouver" },
  { fifaMatchNo: 41, group: "I", homeTeam: "Norway", awayTeam: "Senegal", kickoffAt: "2026-06-23T00:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey" },
  { fifaMatchNo: 42, group: "I", homeTeam: "France", awayTeam: "Iraq", kickoffAt: "2026-06-22T21:00:00.000Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { fifaMatchNo: 43, group: "J", homeTeam: "Argentina", awayTeam: "Austria", kickoffAt: "2026-06-22T17:00:00.000Z", venue: "AT&T Stadium", city: "Dallas" },
  { fifaMatchNo: 44, group: "J", homeTeam: "Jordan", awayTeam: "Algeria", kickoffAt: "2026-06-23T03:00:00.000Z", venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  { fifaMatchNo: 45, group: "L", homeTeam: "England", awayTeam: "Ghana", kickoffAt: "2026-06-23T20:00:00.000Z", venue: "Gillette Stadium", city: "Boston" },
  { fifaMatchNo: 46, group: "L", homeTeam: "Panama", awayTeam: "Croatia", kickoffAt: "2026-06-23T23:00:00.000Z", venue: "BMO Field", city: "Toronto" },
  { fifaMatchNo: 47, group: "K", homeTeam: "Portugal", awayTeam: "Uzbekistan", kickoffAt: "2026-06-23T17:00:00.000Z", venue: "NRG Stadium", city: "Houston" },
  { fifaMatchNo: 48, group: "K", homeTeam: "Colombia", awayTeam: "DR Congo", kickoffAt: "2026-06-24T02:00:00.000Z", venue: "Estadio Akron", city: "Guadalajara" },
  { fifaMatchNo: 49, group: "C", homeTeam: "Scotland", awayTeam: "Brazil", kickoffAt: "2026-06-24T22:00:00.000Z", venue: "Hard Rock Stadium", city: "Miami" },
  { fifaMatchNo: 50, group: "C", homeTeam: "Morocco", awayTeam: "Haiti", kickoffAt: "2026-06-24T19:00:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { fifaMatchNo: 51, group: "B", homeTeam: "Switzerland", awayTeam: "Canada", kickoffAt: "2026-06-24T19:00:00.000Z", venue: "BC Place", city: "Vancouver" },
  { fifaMatchNo: 52, group: "B", homeTeam: "Bosnia and Herzegovina", awayTeam: "Qatar", kickoffAt: "2026-06-24T19:00:00.000Z", venue: "Lumen Field", city: "Seattle" },
  { fifaMatchNo: 53, group: "A", homeTeam: "Czechia", awayTeam: "Mexico", kickoffAt: "2026-06-25T01:00:00.000Z", venue: "Estadio Azteca", city: "Mexico City" },
  { fifaMatchNo: 54, group: "A", homeTeam: "South Africa", awayTeam: "South Korea", kickoffAt: "2026-06-25T01:00:00.000Z", venue: "Estadio BBVA", city: "Monterrey" },
  { fifaMatchNo: 55, group: "E", homeTeam: "Curacao", awayTeam: "Ivory Coast", kickoffAt: "2026-06-25T20:00:00.000Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { fifaMatchNo: 56, group: "E", homeTeam: "Ecuador", awayTeam: "Germany", kickoffAt: "2026-06-25T20:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey" },
  { fifaMatchNo: 57, group: "F", homeTeam: "Tunisia", awayTeam: "Netherlands", kickoffAt: "2026-06-25T23:00:00.000Z", venue: "AT&T Stadium", city: "Dallas" },
  { fifaMatchNo: 58, group: "F", homeTeam: "Japan", awayTeam: "Sweden", kickoffAt: "2026-06-25T23:00:00.000Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { fifaMatchNo: 59, group: "D", homeTeam: "Turkiye", awayTeam: "United States", kickoffAt: "2026-06-26T02:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { fifaMatchNo: 60, group: "D", homeTeam: "Paraguay", awayTeam: "Australia", kickoffAt: "2026-06-26T02:00:00.000Z", venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  { fifaMatchNo: 61, group: "I", homeTeam: "Norway", awayTeam: "France", kickoffAt: "2026-06-26T19:00:00.000Z", venue: "Gillette Stadium", city: "Boston" },
  { fifaMatchNo: 62, group: "I", homeTeam: "Senegal", awayTeam: "Iraq", kickoffAt: "2026-06-26T19:00:00.000Z", venue: "BMO Field", city: "Toronto" },
  { fifaMatchNo: 63, group: "G", homeTeam: "Egypt", awayTeam: "Iran", kickoffAt: "2026-06-27T03:00:00.000Z", venue: "Lumen Field", city: "Seattle" },
  { fifaMatchNo: 64, group: "G", homeTeam: "New Zealand", awayTeam: "Belgium", kickoffAt: "2026-06-27T03:00:00.000Z", venue: "BC Place", city: "Vancouver" },
  { fifaMatchNo: 65, group: "H", homeTeam: "Cape Verde", awayTeam: "Saudi Arabia", kickoffAt: "2026-06-27T00:00:00.000Z", venue: "NRG Stadium", city: "Houston" },
  { fifaMatchNo: 66, group: "H", homeTeam: "Uruguay", awayTeam: "Spain", kickoffAt: "2026-06-27T00:00:00.000Z", venue: "Estadio Akron", city: "Guadalajara" },
  { fifaMatchNo: 67, group: "L", homeTeam: "Panama", awayTeam: "England", kickoffAt: "2026-06-27T21:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey" },
  { fifaMatchNo: 68, group: "L", homeTeam: "Croatia", awayTeam: "Ghana", kickoffAt: "2026-06-27T21:00:00.000Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { fifaMatchNo: 69, group: "J", homeTeam: "Algeria", awayTeam: "Austria", kickoffAt: "2026-06-28T02:00:00.000Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { fifaMatchNo: 70, group: "J", homeTeam: "Jordan", awayTeam: "Argentina", kickoffAt: "2026-06-28T02:00:00.000Z", venue: "AT&T Stadium", city: "Dallas" },
  { fifaMatchNo: 71, group: "K", homeTeam: "Colombia", awayTeam: "Portugal", kickoffAt: "2026-06-27T23:30:00.000Z", venue: "Hard Rock Stadium", city: "Miami" },
  { fifaMatchNo: 72, group: "K", homeTeam: "DR Congo", awayTeam: "Uzbekistan", kickoffAt: "2026-06-27T23:30:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
];

export const knockoutFixtures: KnockoutFixture[] = [
  { fifaMatchNo: 73, stage: "ROUND_OF_32", kickoffAt: "2026-06-28T19:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles", slotLabel: "Group A 2nd place vs Group B 2nd place" },
  { fifaMatchNo: 74, stage: "ROUND_OF_32", kickoffAt: "2026-06-29T20:30:00.000Z", venue: "Gillette Stadium", city: "Boston", slotLabel: "Group E 1st place vs Best 3rd of Groups A/B/C/D/F" },
  { fifaMatchNo: 75, stage: "ROUND_OF_32", kickoffAt: "2026-06-29T20:30:00.000Z", venue: "Estadio BBVA", city: "Monterrey", slotLabel: "Group F 1st place vs Group C 2nd place" },
  { fifaMatchNo: 76, stage: "ROUND_OF_32", kickoffAt: "2026-06-29T17:00:00.000Z", venue: "NRG Stadium", city: "Houston", slotLabel: "Group C 1st place vs Group F 2nd place" },
  { fifaMatchNo: 77, stage: "ROUND_OF_32", kickoffAt: "2026-06-30T17:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey", slotLabel: "Group I 1st place vs Best 3rd of Groups C/D/F/G/H" },
  { fifaMatchNo: 78, stage: "ROUND_OF_32", kickoffAt: "2026-06-30T21:00:00.000Z", venue: "AT&T Stadium", city: "Dallas", slotLabel: "Group E 2nd place vs Group I 2nd place" },
  { fifaMatchNo: 79, stage: "ROUND_OF_32", kickoffAt: "2026-07-01T01:00:00.000Z", venue: "Estadio Azteca", city: "Mexico City", slotLabel: "Group A 1st place vs Best 3rd of Groups C/E/F/H/I" },
  { fifaMatchNo: 80, stage: "ROUND_OF_32", kickoffAt: "2026-07-01T16:00:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta", slotLabel: "Group L 1st place vs Best 3rd of Groups E/H/I/J/K" },
  { fifaMatchNo: 81, stage: "ROUND_OF_32", kickoffAt: "2026-07-02T00:00:00.000Z", venue: "Levi's Stadium", city: "San Francisco Bay Area", slotLabel: "Group D 1st place vs Best 3rd of Groups B/E/F/I/J" },
  { fifaMatchNo: 82, stage: "ROUND_OF_32", kickoffAt: "2026-07-01T20:00:00.000Z", venue: "Lumen Field", city: "Seattle", slotLabel: "Group G 1st place vs Best 3rd of Groups A/E/H/I/J" },
  { fifaMatchNo: 83, stage: "ROUND_OF_32", kickoffAt: "2026-07-03T01:00:00.000Z", venue: "BMO Field", city: "Toronto", slotLabel: "Group K 2nd place vs Group L 2nd place" },
  { fifaMatchNo: 84, stage: "ROUND_OF_32", kickoffAt: "2026-07-02T19:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles", slotLabel: "Group H 1st place vs Group J 2nd place" },
  { fifaMatchNo: 85, stage: "ROUND_OF_32", kickoffAt: "2026-07-03T03:00:00.000Z", venue: "BC Place", city: "Vancouver", slotLabel: "Group B 1st place vs Best 3rd of Groups E/F/G/I/J" },
  { fifaMatchNo: 86, stage: "ROUND_OF_32", kickoffAt: "2026-07-03T22:00:00.000Z", venue: "Hard Rock Stadium", city: "Miami", slotLabel: "Group J 1st place vs Group H 2nd place" },
  { fifaMatchNo: 87, stage: "ROUND_OF_32", kickoffAt: "2026-07-03T18:00:00.000Z", venue: "AT&T Stadium", city: "Dallas", slotLabel: "Group K 1st place vs Best 3rd of Groups D/E/I/J/L" },
  { fifaMatchNo: 88, stage: "ROUND_OF_32", kickoffAt: "2026-07-04T01:30:00.000Z", venue: "Arrowhead Stadium", city: "Kansas City", slotLabel: "Group D 2nd place vs Group G 2nd place" },
  { fifaMatchNo: 89, stage: "ROUND_OF_16", kickoffAt: "2026-07-04T21:00:00.000Z", venue: "Lincoln Financial Field", city: "Philadelphia", slotLabel: "Winner M74 vs Winner M77" },
  { fifaMatchNo: 90, stage: "ROUND_OF_16", kickoffAt: "2026-07-04T17:00:00.000Z", venue: "NRG Stadium", city: "Houston", slotLabel: "Winner M73 vs Winner M75" },
  { fifaMatchNo: 91, stage: "ROUND_OF_16", kickoffAt: "2026-07-05T20:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey", slotLabel: "Winner M76 vs Winner M78" },
  { fifaMatchNo: 92, stage: "ROUND_OF_16", kickoffAt: "2026-07-06T00:00:00.000Z", venue: "Estadio Azteca", city: "Mexico City", slotLabel: "Winner M79 vs Winner M80" },
  { fifaMatchNo: 93, stage: "ROUND_OF_16", kickoffAt: "2026-07-06T19:00:00.000Z", venue: "AT&T Stadium", city: "Dallas", slotLabel: "Winner M83 vs Winner M84" },
  { fifaMatchNo: 94, stage: "ROUND_OF_16", kickoffAt: "2026-07-07T00:00:00.000Z", venue: "Lumen Field", city: "Seattle", slotLabel: "Winner M81 vs Winner M82" },
  { fifaMatchNo: 95, stage: "ROUND_OF_16", kickoffAt: "2026-07-07T16:00:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta", slotLabel: "Winner M86 vs Winner M88" },
  { fifaMatchNo: 96, stage: "ROUND_OF_16", kickoffAt: "2026-07-07T20:00:00.000Z", venue: "BC Place", city: "Vancouver", slotLabel: "Winner M85 vs Winner M87" },
  { fifaMatchNo: 97, stage: "QUARTER_FINAL", kickoffAt: "2026-07-09T20:00:00.000Z", venue: "Gillette Stadium", city: "Boston", slotLabel: "Winner M89 vs Winner M90" },
  { fifaMatchNo: 98, stage: "QUARTER_FINAL", kickoffAt: "2026-07-10T19:00:00.000Z", venue: "SoFi Stadium", city: "Los Angeles", slotLabel: "Winner M93 vs Winner M94" },
  { fifaMatchNo: 99, stage: "QUARTER_FINAL", kickoffAt: "2026-07-11T21:00:00.000Z", venue: "Hard Rock Stadium", city: "Miami", slotLabel: "Winner M91 vs Winner M92" },
  { fifaMatchNo: 100, stage: "QUARTER_FINAL", kickoffAt: "2026-07-12T01:00:00.000Z", venue: "Arrowhead Stadium", city: "Kansas City", slotLabel: "Winner M95 vs Winner M96" },
  { fifaMatchNo: 101, stage: "SEMI_FINAL", kickoffAt: "2026-07-14T19:00:00.000Z", venue: "AT&T Stadium", city: "Dallas", slotLabel: "Winner M97 vs Winner M98" },
  { fifaMatchNo: 102, stage: "SEMI_FINAL", kickoffAt: "2026-07-15T19:00:00.000Z", venue: "Mercedes-Benz Stadium", city: "Atlanta", slotLabel: "Winner M99 vs Winner M100" },
  { fifaMatchNo: 103, stage: "THIRD_PLACE", kickoffAt: "2026-07-18T21:00:00.000Z", venue: "Hard Rock Stadium", city: "Miami", slotLabel: "Loser M101 vs Loser M102" },
  { fifaMatchNo: 104, stage: "FINAL", kickoffAt: "2026-07-19T19:00:00.000Z", venue: "MetLife Stadium", city: "New York/New Jersey", slotLabel: "Winner M101 vs Winner M102" },
];

export function matchVenueLabel(fixture: { venue: string; city: string }) {
  return `${fixture.venue}, ${fixture.city}`;
}
