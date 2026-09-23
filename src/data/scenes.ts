import type { Scene } from './types';

// ---------------------------------------------------------------------------
// Scenes. nation codes: us uk ca de fr pl all
// cam: bounding box [[W,S],[E,N]] or { globe: true, center: [lon,lat] }
// ---------------------------------------------------------------------------
export const SCENES: Scene[] = [
  {
    id: 'eve', day: -1, date: '5 June 1944', title: 'Fortress Europe',
    cam: { globe: true, center: [-13, 41.5] }, state: 's0', beaches: false,
    body: [
      'Four years after Dunkirk, Hitler’s Atlantic Wall runs from Norway to the Spanish border. The Allies have chosen to strike at Normandy, not the obvious short crossing to the Pas-de-Calais.',
      'After a 24-hour delay for weather, Eisenhower gives the order early on 5 June. The invasion goes in the next morning.'
    ],
    forces: [
      { n: 'all', k: 'Allied divisions committed to Overlord', v: '42', s: '23 US, 14 British, 3 Canadian, 1 French, 1 Polish' },
      { n: 'us', k: 'US personnel in Britain', v: '≈2.9 million', s: 'Army, air and naval, all services' },
      { n: 'de', k: 'German troops in France', v: '≈850,000', s: 'About 60 infantry and 10 panzer divisions' },
      { n: 'de', k: 'German troops in Normandy', v: '≈80,000', s: 'With a single panzer division, the 21st' }
    ],
    events: [], arrows: []
  },
  {
    id: 'crossing', day: -1, date: 'Night of 5–6 June', title: 'The crossing',
    cam: [[-4.3, 49.1], [1.0, 51.0]], state: 's0', beaches: false,
    body: [
      'From harbours between Cornwall and Sussex the fleet converges on a marshalling area south of the Isle of Wight, nicknamed Piccadilly Circus, then turns south down lanes swept clear of mines.',
      'More than 2,200 Allied bombers hit the coastal defences and inland targets ahead of the landings.'
    ],
    forces: [
      { n: 'all', k: 'Ships and landing craft', v: '≈7,000', s: 'Including ≈4,000 landing craft and 1,200 warships' },
      { n: 'all', k: 'Naval personnel', v: '≈195,000', s: 'From eight Allied navies' },
      { n: 'all', k: 'Aircraft supporting the invasion', v: '≈12,000', s: '' },
      { n: 'all', k: 'Troops landing by sea on D-Day', v: '≈133,000', s: 'Plus ≈23,400 by parachute and glider' }
    ],
    events: [
      { n: 'Piccadilly Circus', p: [-1.05, 50.35], k: 'point', note: 'Assembly area for the invasion fleet' }
    ],
    arrows: [
      { n: 'us', pts: [[-4.1, 50.30], [-3.0, 50.2], [-1.6, 50.3], [-1.12, 50.34]], dash: 1, w: 1.6 },
      { n: 'us', pts: [[-2.45, 50.56], [-1.8, 50.42], [-1.12, 50.34]], dash: 1, w: 1.6 },
      { n: 'uk', pts: [[-1.3, 50.76], [-1.15, 50.55], [-1.05, 50.36]], dash: 1, w: 1.6 },
      { n: 'uk', pts: [[0.05, 50.75], [-0.4, 50.55], [-0.98, 50.36]], dash: 1, w: 1.6 },
      { n: 'us', pts: [[-1.10, 50.28], [-1.12, 49.9], [-1.14, 49.47]], w: 2.2 },
      { n: 'us', pts: [[-1.05, 50.28], [-0.95, 49.9], [-0.88, 49.42]], w: 2.2 },
      { n: 'uk', pts: [[-1.00, 50.28], [-0.78, 49.9], [-0.58, 49.39]], w: 2.2 },
      { n: 'ca', pts: [[-0.97, 50.29], [-0.66, 49.9], [-0.44, 49.38]], w: 2.2 },
      { n: 'uk', pts: [[-0.94, 50.30], [-0.55, 49.9], [-0.29, 49.335]], w: 2.2 }
    ]
  },
  {
    id: 'airborne', day: 0, date: '00:16 – 02:30, 6 June', title: 'Airborne assault',
    cam: [[-1.55, 49.16], [0.2, 49.52]], state: 's0', beaches: false,
    body: [
      'Gliders of the British 6th Airborne Division land beside the Caen canal and Orne bridges at 00:16 and take both intact, sealing the eastern flank.',
      'From 01:30 the US 101st, then the 82nd, jump behind Utah to hold the causeways and the Merderet crossings. Thick cloud and flak scatter many of them miles from their drop zones.'
    ],
    forces: [
      { n: 'us', k: 'US 82nd and 101st Airborne', v: '≈15,500', s: 'Behind Utah, around Sainte-Mère-Église' },
      { n: 'uk', k: 'British 6th Airborne', v: '≈7,900', s: 'Including the 1st Canadian Parachute Battalion' },
      { n: 'all', k: 'Transport aircraft and gliders', v: '822', s: '' },
      { n: 'de', k: 'Defenders inland', v: '', s: '709th and 91st Divisions (west), 716th Division (east)' }
    ],
    events: [
      { n: 'Pegasus Bridge', p: [-0.274, 49.242], k: 'star', nat: 'uk', l: 1, note: 'Seized intact by glider coup de main, 00:16', lp: 'l' },
      { n: 'Merville Battery', p: [-0.198, 49.27], k: 'star', nat: 'uk', note: 'Silenced by 9th Parachute Battalion before dawn', lp: 't' },
      { n: 'Sainte-Mère-Église', p: [-1.316, 49.408], k: 'star', nat: 'us', note: 'Taken by the 82nd; among the first towns liberated' },
      { n: '101st drop zones', p: [-1.25, 49.37], k: 'para', nat: 'us', lp: 'b' },
      { n: '82nd drop zones', p: [-1.37, 49.40], k: 'para', nat: 'us', lp: 'l' },
      { n: '6th Airborne drop zones', p: [-0.23, 49.215], k: 'para', nat: 'uk', lp: 'b' }
    ],
    arrows: []
  },
  {
    id: 'beaches', day: 0, date: '06:30 – 07:45, 6 June', title: 'H-Hour on five beaches',
    cam: [[-1.42, 49.22], [-0.12, 49.50]], state: 's0', beaches: true,
    body: [
      'Along 50 miles of coast the landing craft go in on a rising tide. Americans hit Utah and Omaha at 06:30; British and Canadians land about an hour later on Gold, Juno and Sword, where the tide came in later.'
    ],
    forces: [
      { n: 'us', k: 'Utah: US 4th Infantry Division', v: '23,250' },
      { n: 'us', k: 'Omaha: US 1st and 29th Infantry Divisions', v: '34,250' },
      { n: 'uk', k: 'Gold: British 50th (Northumbrian) Division', v: '24,970' },
      { n: 'ca', k: 'Juno: 3rd Canadian Division', v: '21,400' },
      { n: 'uk', k: 'Sword: British 3rd Division', v: '28,845' },
      { n: 'de', k: 'Coastal defenders', v: '', s: '709th, 352nd and 716th Divisions; 21st Panzer near Caen' }
    ],
    forcesNote: 'Troops ashore by the end of 6 June',
    events: [],
    arrows: [
      { n: 'us', pts: [[-1.12, 49.47], [-1.15, 49.435], [-1.19, 49.42]], w: 3 },
      { n: 'us', pts: [[-0.88, 49.44], [-0.88, 49.40], [-0.88, 49.37]], w: 3 },
      { n: 'uk', pts: [[-0.565, 49.41], [-0.565, 49.37], [-0.565, 49.34]], w: 3 },
      { n: 'ca', pts: [[-0.435, 49.40], [-0.435, 49.365], [-0.435, 49.335]], w: 3 },
      { n: 'uk', pts: [[-0.29, 49.36], [-0.29, 49.325], [-0.29, 49.296]], w: 3 }
    ]
  },
  {
    id: 'omaha', day: 0, date: 'Morning, 6 June', title: 'Bloody Omaha',
    cam: [[-1.05, 49.315], [-0.76, 49.425]], state: 's0', beaches: true,
    body: [
      'Cloud made the bombing of Omaha almost useless, most of the amphibious tanks sank in heavy seas, and the experienced 352nd Division held the bluffs. For hours the assault was pinned at the waterline until small groups worked their way up the draws.',
      'To the west, US Rangers climbed the cliffs of Pointe du Hoc, found the guns had been moved inland, then tracked them down and wrecked them.'
    ],
    forces: [
      { n: 'us', k: 'Ashore at Omaha', v: '34,250' },
      { n: 'us', k: 'Casualties at Omaha', v: '≈2,400', s: 'Against ≈200 at Utah' },
      { n: 'us', k: '2nd Rangers at Pointe du Hoc', v: '≈225' },
      { n: 'de', k: 'Defenders', v: '', s: 'Elements of the 352nd and 716th Divisions' }
    ],
    events: [
      { n: 'Pointe du Hoc', p: [-0.989, 49.396], k: 'star', nat: 'us', note: 'Rangers scale 30 m cliffs under fire' },
      { n: 'Vierville draw', p: [-0.905, 49.378], k: 'point', nat: 'de' },
      { n: 'Colleville draw', p: [-0.85, 49.36], k: 'point', nat: 'de' }
    ],
    arrows: [
      { n: 'us', pts: [[-1.00, 49.43], [-0.995, 49.41], [-0.99, 49.398]], w: 2.4 },
      { n: 'us', pts: [[-0.905, 49.405], [-0.905, 49.39], [-0.905, 49.375]], w: 2.4 },
      { n: 'us', pts: [[-0.865, 49.395], [-0.865, 49.38], [-0.865, 49.36]], w: 2.4 },
      { n: 'us', pts: [[-0.84, 49.39], [-0.84, 49.375], [-0.845, 49.355]], w: 2.4 }
    ]
  },
  {
    id: 'nightfall', day: 0, date: 'Midnight, 6 June', title: 'A foothold, not yet a front',
    cam: [[-1.5, 49.17], [-0.08, 49.50]], state: 's1', beaches: true,
    body: [
      'By midnight about 156,000 Allied troops are in France, but no beachhead has reached its first-day objectives and Caen is still German.',
      '21st Panzer’s counter-attack reaches the sea through the gap between Juno and Sword before pulling back. Utah is still cut off from Omaha.'
    ],
    forces: [
      { n: 'us', k: 'American troops ashore', v: '≈73,000' },
      { n: 'uk', k: 'British troops ashore', v: '≈61,700' },
      { n: 'ca', k: 'Canadian troops ashore', v: '≈21,400' },
      { n: 'all', k: 'Allied casualties', v: '≈10,300', s: 'US ≈6,600, British ≈2,700, Canadian 946' },
      { n: 'de', k: 'German casualties', v: '4,000–9,000', s: 'Estimates vary widely' }
    ],
    events: [
      { n: 'Caen', p: [-0.37, 49.183], k: 'target', nat: 'de', note: 'D-Day objective, still in German hands' }
    ],
    arrows: [
      { n: 'de', pts: [[-0.40, 49.16], [-0.39, 49.23], [-0.355, 49.31]], w: 2.6 }
    ]
  },
  {
    id: 'linkup', day: 6, date: '12–13 June', title: 'The beachheads join',
    cam: [[-1.6, 49.02], [-0.05, 49.56]], state: 's2', beaches: true,
    body: [
      'The 101st Airborne takes Carentan on 12 June, joining Utah and Omaha into one continuous front.',
      'Next day a British armoured hook around Tilly is stopped dead at Villers-Bocage by Tiger tanks. German armour, including 12th SS and Panzer Lehr, is now massed in front of Caen.'
    ],
    forces: [
      { n: 'all', k: 'Landed by 11 June', v: '326,547', s: 'With 54,186 vehicles' },
      { n: 'us', k: 'US First Army (Bradley)', v: '', s: 'V and VII Corps' },
      { n: 'uk', k: 'British Second Army (Dempsey)', v: '', s: 'I and XXX Corps, including 3rd Canadian Division' },
      { n: 'de', k: 'German armour at Caen', v: '', s: '21st Panzer, 12th SS Hitlerjugend, Panzer Lehr' }
    ],
    events: [
      { n: 'Carentan', p: [-1.247, 49.303], k: 'star', nat: 'us', note: 'Taken 12 June, linking Utah and Omaha' },
      { n: 'Villers-Bocage', p: [-0.656, 49.08], k: 'clash', nat: 'de', note: '13 June: British 7th Armoured halted by Tigers' },
      { n: 'Caumont', p: [-0.80, 49.09], k: 'point', nat: 'us', note: 'Reached by US 1st Division, 13 June' }
    ],
    arrows: [
      { n: 'uk', pts: [[-0.78, 49.20], [-0.74, 49.12], [-0.67, 49.085]], w: 2.4 }
    ]
  },
  {
    id: 'storm', day: 12, date: '18–22 June', title: 'Cotentin cut, then the storm',
    cam: [[-2.0, 49.03], [-0.15, 49.74]], state: 's3', beaches: true,
    body: [
      'US 9th Division reaches the west coast at Barneville on 18 June, trapping the German forces in the north of the peninsula around Cherbourg.',
      'From 19 to 22 June the worst Channel storm in decades wrecks the American Mulberry harbour off Omaha and throws hundreds of craft onto the beaches. The British Mulberry at Arromanches is damaged but kept working.'
    ],
    forces: [
      { n: 'us', k: 'US VII Corps drives on Cherbourg', v: '', s: '4th, 9th and 79th Infantry Divisions' },
      { n: 'de', k: 'Defenders of the peninsula', v: '', s: 'Remnants of the 709th, 243rd, 91st and 77th Divisions' },
      { n: 'uk', k: 'Tilly-sur-Seulles', v: '', s: 'Taken by the 50th Division on 19 June after a week of fighting' }
    ],
    events: [
      { n: 'Barneville', p: [-1.76, 49.38], k: 'star', nat: 'us', note: 'West coast reached, 18 June' },
      { n: 'Mulberry A (Omaha)', p: [-0.87, 49.375], k: 'storm', nat: 'us', note: 'Destroyed in the storm' },
      { n: 'Mulberry B (Arromanches)', p: [-0.62, 49.345], k: 'harbour', nat: 'uk', note: 'Damaged, repaired, used until late autumn' }
    ],
    arrows: [
      { n: 'us', pts: [[-1.40, 49.40], [-1.55, 49.39], [-1.74, 49.385]], w: 2.4 },
      { n: 'us', pts: [[-1.35, 49.47], [-1.45, 49.54], [-1.58, 49.60]], w: 2.4 }
    ]
  },
  {
    id: 'cherbourg', day: 20, date: '26–30 June', title: 'Cherbourg falls; Epsom',
    cam: [[-2.05, 48.98], [-0.05, 49.76]], state: 's4', beaches: true,
    body: [
      'Cherbourg’s commander surrenders on 26 June and the last forts fall within days, but the port has been so thoroughly wrecked it will take weeks to handle cargo.',
      'West of Caen, Operation Epsom drives a salient across the Odon towards Hill 112 before II SS Panzer Corps counter-attacks and the offensive is halted.'
    ],
    forces: [
      { n: 'all', k: 'Landed by 30 June', v: '850,279', s: 'With 148,803 vehicles and 570,505 tons of supplies' },
      { n: 'us', k: 'Prisoners taken in the Cotentin', v: '≈39,000' },
      { n: 'uk', k: 'Operation Epsom, VIII Corps', v: '≈60,000', s: 'With some 600 tanks' },
      { n: 'us', k: 'US VII Corps casualties, 6 June – 1 July', v: '22,119' }
    ],
    events: [
      { n: 'Cherbourg', p: [-1.62, 49.64], k: 'star', nat: 'us', note: 'Surrendered 26 June' },
      { n: 'Hill 112', p: [-0.46, 49.128], k: 'clash', nat: 'uk', note: 'Fought over from 29 June to August' }
    ],
    arrows: [
      { n: 'us', pts: [[-1.45, 49.49], [-1.55, 49.57], [-1.61, 49.63]], w: 2.4 },
      { n: 'uk', pts: [[-0.52, 49.20], [-0.51, 49.15], [-0.47, 49.115]], w: 2.4 },
      { n: 'de', pts: [[-0.60, 49.06], [-0.55, 49.09], [-0.50, 49.125]], w: 2 }
    ]
  },
  {
    id: 'caen', day: 33, date: '4–9 July', title: 'Half of Caen',
    cam: [[-1.8, 48.98], [-0.05, 49.45]], state: 's5', beaches: true,
    body: [
      'Canadians take Carpiquet on 4 July. On the evening of the 7th, some 450 heavy bombers flatten much of the old city, and Operation Charnwood clears Caen north of the Orne by 9 July.',
      'In the west, American divisions grind through the bocage, where every hedgerow is a fortified line. La Haye-du-Puits falls on 8 July.'
    ],
    forces: [
      { n: 'all', k: 'Allied troops ashore', v: '1 million+', s: 'Passed in the first half of July' },
      { n: 'uk', k: 'Operation Charnwood', v: '', s: 'British 3rd and 59th, 3rd Canadian Divisions' },
      { n: 'de', k: 'Defending Caen', v: '', s: '12th SS Hitlerjugend and 16th Luftwaffe Field Division' }
    ],
    events: [
      { n: 'Caen', p: [-0.37, 49.183], k: 'star', nat: 'uk', note: 'Northern half taken, 9 July' },
      { n: 'Carpiquet', p: [-0.44, 49.185], k: 'point', nat: 'ca', note: 'Operation Windsor, 4 July' },
      { n: 'La Haye-du-Puits', p: [-1.545, 49.29], k: 'point', nat: 'us', note: 'Taken 8 July' }
    ],
    arrows: [
      { n: 'ca', pts: [[-0.47, 49.21], [-0.44, 49.20], [-0.40, 49.185]], w: 2.2 },
      { n: 'uk', pts: [[-0.36, 49.235], [-0.36, 49.21], [-0.365, 49.19]], w: 2.2 }
    ]
  },
  {
    id: 'goodwood', day: 42, date: '18–20 July', title: 'Saint-Lô and Goodwood',
    cam: [[-1.8, 48.98], [-0.05, 49.45]], state: 's6', beaches: true,
    body: [
      'Americans enter the ruins of Saint-Lô on 18 July. The same morning, after a massive air bombardment, three British armoured divisions strike south from the Orne bridgehead towards Bourguébus Ridge while Canadians clear Caen’s southern suburbs.',
      'Goodwood gains ground at a heavy cost in tanks, but it keeps the panzers pinned at Caen. Rommel is badly wounded on 17 July; on the 20th the bomb plot against Hitler fails.'
    ],
    forces: [
      { n: 'all', k: 'Allied troops ashore by 25 July', v: '≈1,452,000' },
      { n: 'de', k: 'German troops in Normandy, 23 July', v: '≈380,000' },
      { n: 'uk', k: 'Operation Goodwood', v: '', s: 'Guards, 7th and 11th Armoured Divisions' },
      { n: 'us', k: 'Saint-Lô', v: '', s: 'Taken by the 29th and 35th Divisions' }
    ],
    events: [
      { n: 'Saint-Lô', p: [-1.09, 49.115], k: 'star', nat: 'us', note: 'Taken 18–19 July' },
      { n: 'Bourguébus Ridge', p: [-0.30, 49.115], k: 'clash', nat: 'uk', note: 'Goodwood objective, 18–20 July' }
    ],
    arrows: [
      { n: 'uk', pts: [[-0.25, 49.225], [-0.27, 49.17], [-0.30, 49.125]], w: 2.8 },
      { n: 'ca', pts: [[-0.36, 49.18], [-0.36, 49.15], [-0.37, 49.12]], w: 2.2 },
      { n: 'us', pts: [[-1.12, 49.20], [-1.10, 49.16], [-1.09, 49.12]], w: 2.2 }
    ]
  },
  {
    id: 'cobra', day: 49, date: '25 July', title: 'Operation Cobra',
    cam: [[-1.75, 48.78], [-0.65, 49.32]], state: 's6', beaches: false,
    body: [
      'Some 1,500 heavy bombers carpet a narrow strip west of Saint-Lô. Bombs falling short kill more than 100 Americans, among them Lt Gen Lesley McNair, but Panzer Lehr, sitting in the target box, is shattered.',
      'On the 26th Collins’ VII Corps breaks through. With most German armour tied down opposite the British and Canadians at Caen, there is little left to close the gap.'
    ],
    forces: [
      { n: 'us', k: 'Heavy bombers, 25 July', v: '≈1,500', s: 'With medium bombers and fighter-bombers' },
      { n: 'us', k: 'US VII Corps assault', v: '6 divisions', s: 'Infantry to break in, armour to exploit' },
      { n: 'ca', k: 'First Canadian Army (Crerar)', v: '', s: 'Operational from 23 July on the eastern flank' },
      { n: 'de', k: 'Panzer Lehr Division', v: '', s: 'Wrecked under the bombing' }
    ],
    events: [
      { n: 'Cobra bombing zone', p: [-1.19, 49.155], k: 'bomb', nat: 'us', note: 'About 6 km by 2 km along the Périers–Saint-Lô road' },
      { n: 'Coutances', p: [-1.445, 49.048], k: 'point', nat: 'us', note: 'Reached 28 July' }
    ],
    arrows: [
      { n: 'us', pts: [[-1.20, 49.16], [-1.24, 49.08], [-1.30, 48.98]], w: 3.2 },
      { n: 'us', pts: [[-1.18, 49.16], [-1.30, 49.10], [-1.43, 49.05]], w: 2.4 },
      { n: 'us', pts: [[-1.52, 49.21], [-1.50, 49.12], [-1.46, 49.06]], w: 2 }
    ]
  },
  {
    id: 'avranches', day: 55, date: '30 July – 1 August', title: 'Breakout at Avranches',
    cam: [[-1.95, 48.45], [-0.15, 49.42]], state: 's8', beaches: false,
    body: [
      'US 4th Armored Division reaches Avranches on 30 July and seizes the bridge at Pontaubault intact. On 1 August Patton’s Third Army comes into being and pushes seven divisions through the single-road bottleneck in 72 hours.',
      'Bradley steps up to command 12th Army Group. The British open Operation Bluecoat, south from Caumont towards Mont Pinçon and Vire.'
    ],
    forces: [
      { n: 'us', k: '12th Army Group (Bradley)', v: '', s: 'First Army (Hodges), Third Army (Patton)' },
      { n: 'uk', k: '21st Army Group (Montgomery)', v: '', s: 'British Second Army (Dempsey), First Canadian Army (Crerar)' },
      { n: 'us', k: 'Divisions through Avranches in 72 hours', v: '7' }
    ],
    events: [
      { n: 'Avranches', p: [-1.357, 48.685], k: 'star', nat: 'us', note: 'Reached 30 July' },
      { n: 'Pontaubault bridge', p: [-1.35, 48.63], k: 'point', nat: 'us', note: 'Captured intact, 31 July' }
    ],
    arrows: [
      { n: 'us', pts: [[-1.45, 49.05], [-1.50, 48.88], [-1.40, 48.70]], w: 3.2 },
      { n: 'us', pts: [[-1.30, 48.98], [-1.25, 48.82], [-1.20, 48.72]], w: 2.4 },
      { n: 'uk', pts: [[-0.80, 49.10], [-0.83, 49.03], [-0.84, 48.96]], w: 2.4 }
    ]
  },
  {
    id: 'mortain', day: 62, date: '4–8 August', title: 'Brittany, Mortain, Totalize',
    cam: [[-5.0, 47.2], [0.6, 49.8]], state: 's9', beaches: false,
    body: [
      'Third Army races across Brittany: Rennes falls on 4 August and tanks reach Brest by the 7th, though the fortified ports hold out.',
      'Hitler orders a counter-stroke at Mortain to cut the Avranches corridor. On 7 August panzer divisions retake the town, but the US 30th Division holds Hill 317 and Allied fighter-bombers break the attack. That night the Canadians launch Operation Totalize down the Falaise road.'
    ],
    forces: [
      { n: 'us', k: 'Third Army in Brittany', v: '', s: 'VIII Corps with 4th and 6th Armored Divisions' },
      { n: 'de', k: 'Operation Lüttich', v: '4 panzer divs', s: '2nd, 116th, 1st SS and 2nd SS, all under strength' },
      { n: 'us', k: 'Cut off on Hill 317', v: '≈700', s: '2nd Battalion, 120th Infantry, for six days' },
      { n: 'ca', k: 'Operation Totalize', v: '', s: 'II Canadian Corps with 4th Canadian and 1st Polish Armoured' }
    ],
    events: [
      { n: 'Rennes', p: [-1.68, 48.11], k: 'star', nat: 'us', note: 'Taken 4 August' },
      { n: 'Hill 317', p: [-0.93, 48.65], k: 'clash', nat: 'us', note: 'Held against Lüttich, 7–12 August' },
      { n: 'Brest', p: [-4.49, 48.39], k: 'fort', nat: 'de', note: 'Fortress, holds out until 19 September' },
      { n: 'Lorient', p: [-3.37, 47.75], k: 'fort', nat: 'de', note: 'Held until May 1945' },
      { n: 'Saint-Nazaire', p: [-2.21, 47.28], k: 'fort', nat: 'de', note: 'Held until May 1945' },
      { n: 'Saint-Malo', p: [-2.02, 48.65], k: 'fort', nat: 'de', note: 'Falls 17 August' }
    ],
    arrows: [
      { n: 'us', pts: [[-1.35, 48.62], [-1.70, 48.30], [-2.60, 48.35], [-4.40, 48.42]], w: 2.6 },
      { n: 'us', pts: [[-1.35, 48.62], [-1.60, 48.10], [-2.70, 47.70], [-3.30, 47.78]], w: 2.2 },
      { n: 'us', pts: [[-1.30, 48.60], [-0.90, 48.30], [-0.77, 48.08]], w: 2.2 },
      { n: 'de', pts: [[-0.80, 48.62], [-0.94, 48.65], [-1.05, 48.68]], w: 2.6 },
      { n: 'ca', pts: [[-0.33, 49.14], [-0.32, 49.08], [-0.30, 49.035]], w: 2.4 }
    ]
  },
  {
    id: 'falaise', day: 71, date: '13–17 August', title: 'The Falaise pocket',
    cam: [[-1.25, 48.45], [0.55, 49.18]], state: 's10', beaches: false,
    body: [
      'Patton’s XV Corps swings north through Le Mans and Alençon to Argentan by 13 August, where Bradley halts it at the army-group boundary. The Canadians and Poles push south in Operation Tractable and take Falaise on 16–17 August.',
      'Between them the German Seventh Army and Fifth Panzer Army are nearly surrounded. Hitler finally allows a retreat. On 15 August a second Allied invasion lands in Provence.'
    ],
    forces: [
      { n: 'all', k: 'Allied forces around the pocket', v: '≈580,000', s: '23 divisions, ≈3,000 tanks and assault guns' },
      { n: 'de', k: 'Germans inside or near it', v: '≈200,000', s: 'Remnants of 24 divisions' },
      { n: 'us', k: 'Argentan', v: '', s: 'US XV Corps halted here, 13 August' },
      { n: 'ca', k: 'Falaise', v: '', s: 'Taken by 2nd Canadian Division, 16–17 August' }
    ],
    events: [
      { n: 'Falaise', p: [-0.197, 48.893], k: 'star', nat: 'ca', note: 'Taken 16–17 August' },
      { n: 'Argentan', p: [-0.02, 48.745], k: 'target', nat: 'us', note: 'US halt line, 13 August' },
      { n: 'The gap', p: [0.02, 48.82], k: 'gap', nat: 'de', note: 'German escape route east' }
    ],
    arrows: [
      { n: 'us', pts: [[0.20, 48.00], [0.12, 48.42], [0.00, 48.70]], w: 3 },
      { n: 'ca', pts: [[-0.28, 49.02], [-0.22, 48.96], [-0.19, 48.905]], w: 2.6 },
      { n: 'pl', pts: [[-0.10, 49.00], [-0.02, 48.93], [0.04, 48.86]], w: 2.4 },
      { n: 'de', pts: [[-0.35, 48.78], [-0.10, 48.80], [0.25, 48.84]], w: 2.4, dash: 1 }
    ]
  },
  {
    id: 'closed', day: 76, date: '19–21 August', title: 'The gap is closed',
    cam: [[-0.9, 48.45], [2.1, 49.35]], state: 's11', beaches: false,
    body: [
      'Polish and American troops meet at Chambois on 19 August. For two days the Polish 1st Armoured Division holds Mont Ormel, Hill 262, against Germans breaking out from inside and panzers attacking from outside, until Canadians relieve them and the pocket is sealed on the 21st.',
      'The Dives valley becomes a killing ground. Far to the east, US 79th Division crosses the Seine at Mantes on the 19th.'
    ],
    forces: [
      { n: 'de', k: 'Germans killed in the pocket', v: '≈10,000' },
      { n: 'de', k: 'Germans captured', v: '≈50,000' },
      { n: 'de', k: 'Escaped east', v: '20,000–50,000', s: 'Mostly without their heavy equipment' },
      { n: 'ca', k: 'Canadian casualties, Tractable to the gap', v: '≈5,500' },
      { n: 'pl', k: 'Polish 1st Armoured on Hill 262', v: '', s: 'Two battle groups under Maj-Gen Maczek' }
    ],
    events: [
      { n: 'Chambois', p: [0.105, 48.805], k: 'star', nat: 'pl', lp: 'b', note: 'Poles and Americans meet, 19 August' },
      { n: 'Hill 262', p: [0.15, 48.84], k: 'clash', nat: 'pl', note: 'Held by the Poles, 19–21 August' },
      { n: 'Mantes', p: [1.72, 48.99], k: 'star', nat: 'us', note: 'Seine crossed, 19–20 August' }
    ],
    arrows: [
      { n: 'us', pts: [[0.00, 48.70], [0.06, 48.76], [0.10, 48.80]], w: 2.4 },
      { n: 'pl', pts: [[0.05, 48.93], [0.12, 48.88], [0.14, 48.845]], w: 2.4 },
      { n: 'us', pts: [[1.37, 48.74], [1.55, 48.85], [1.72, 49.00]], w: 2.6 },
      { n: 'de', pts: [[-0.10, 48.82], [0.30, 48.95], [0.80, 49.20], [1.00, 49.40]], w: 2, dash: 1 }
    ]
  },
  {
    id: 'paris', day: 80, date: '25 August', title: 'Paris liberated',
    cam: [[-1.4, 47.95], [3.4, 49.62]], state: 's12', beaches: false,
    body: [
      'With the Paris Resistance in open revolt since 19 August, Eisenhower lets the French 2nd Armoured Division lead the way in. General Leclerc’s first tanks reach the Hôtel de Ville on the night of the 24th.',
      'The German commander, von Choltitz, surrenders on 25 August without carrying out orders to destroy the city. De Gaulle walks down the Champs-Élysées the next day.'
    ],
    forces: [
      { n: 'fr', k: 'French 2nd Armoured Division (Leclerc)', v: '', s: 'Under US V Corps, with the US 4th Infantry Division' },
      { n: 'uk', k: 'British Second Army', v: '', s: 'Crosses the Seine at Vernon, 25 August' },
      { n: 'all', k: 'Allied troops landed in France', v: '2,052,299', s: 'By the end of August' }
    ],
    events: [
      { n: 'Paris', p: [2.35, 48.857], k: 'star', nat: 'fr', note: 'Liberated 25 August' },
      { n: 'Vernon', p: [1.485, 49.09], k: 'point', nat: 'uk', note: 'Seine crossed by 43rd Division' }
    ],
    arrows: [
      { n: 'fr', pts: [[0.00, 48.74], [1.20, 48.60], [1.85, 48.65], [2.33, 48.84]], w: 3 },
      { n: 'uk', pts: [[0.70, 48.90], [1.10, 49.00], [1.48, 49.09]], w: 2.4 },
      { n: 'us', pts: [[2.00, 48.00], [2.70, 48.10], [3.25, 48.19]], w: 2.2 }
    ]
  },
  {
    id: 'end', day: 85, date: '30 August', title: 'Normandy won',
    cam: [[-5.0, 46.9], [4.3, 50.2]], state: 's12', beaches: true,
    body: [
      'By 30 August the last German units west of the Seine have crossed it or surrendered, and the Battle of Normandy is over. It took 85 days rather than the 90 planners had allowed to reach the Seine, and two German armies were wrecked.',
      'Within a week Allied spearheads are in Belgium.'
    ],
    forces: [
      { n: 'us', k: 'US casualties', v: '124,394', s: '20,668 killed' },
      { n: 'uk', k: 'British casualties', v: '≈65,000', s: '≈11,000 killed' },
      { n: 'ca', k: 'Canadian casualties', v: '18,444', s: '5,021 killed' },
      { n: 'pl', k: 'Polish casualties', v: '2,097' },
      { n: 'de', k: 'German losses', v: '≈400,000', s: 'Including ≈200,000 taken prisoner' },
      { n: 'fr', k: 'French civilians killed', v: '15,000–20,000' }
    ],
    events: [
      { n: 'Brest', p: [-4.49, 48.39], k: 'fort', nat: 'de' },
      { n: 'Lorient', p: [-3.37, 47.75], k: 'fort', nat: 'de' },
      { n: 'Saint-Nazaire', p: [-2.21, 47.28], k: 'fort', nat: 'de' },
      { n: 'Le Havre', p: [0.11, 49.49], k: 'fort', nat: 'de', note: 'Held until 12 September' },
      { n: 'Channel Islands', p: [-2.35, 49.33], k: 'fort', nat: 'de', note: 'Occupied until May 1945' }
    ],
    arrows: []
  }
];
