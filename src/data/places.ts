import type { Place, SeaLabel } from './types';

// ---------------------------------------------------------------------------
// Places that get a label once you're zoomed in far enough. z = minimum
// on-screen scale (see src/atlas) before the label shows.
// ---------------------------------------------------------------------------
export const PLACES: Place[] = [
  { n: 'Paris', p: [2.35, 48.857], z: 1200, big: 1 },
  { n: 'London', p: [-0.13, 51.507], z: 1200, big: 1 },
  { n: 'Portsmouth', p: [-1.09, 50.80], z: 5000 },
  { n: 'Southampton', p: [-1.40, 50.905], z: 7000 },
  { n: 'Plymouth', p: [-4.14, 50.37], z: 5000 },
  { n: 'Weymouth', p: [-2.46, 50.61], z: 7000 },
  { n: 'Cherbourg', p: [-1.62, 49.64], z: 4000, big: 1 },
  { n: 'Caen', p: [-0.37, 49.183], z: 4000, big: 1 },
  { n: 'Bayeux', p: [-0.70, 49.277], z: 14000 },
  { n: 'Carentan', p: [-1.247, 49.303], z: 20000 },
  { n: 'Sainte-Mère-Église', p: [-1.316, 49.408], z: 30000 },
  { n: 'Isigny', p: [-1.10, 49.318], z: 38000 },
  { n: 'Saint-Lô', p: [-1.09, 49.115], z: 12000 },
  { n: 'Villers-Bocage', p: [-0.656, 49.08], z: 26000 },
  { n: 'Tilly', p: [-0.62, 49.18], z: 38000 },
  { n: 'Coutances', p: [-1.445, 49.048], z: 14000 },
  { n: 'Lessay', p: [-1.53, 49.22], z: 30000 },
  { n: 'Périers', p: [-1.41, 49.19], z: 30000 },
  { n: 'Granville', p: [-1.597, 48.838], z: 16000 },
  { n: 'Avranches', p: [-1.357, 48.685], z: 9000 },
  { n: 'Mortain', p: [-0.94, 48.648], z: 14000 },
  { n: 'Vire', p: [-0.89, 48.84], z: 14000 },
  { n: 'Falaise', p: [-0.197, 48.893], z: 9000 },
  { n: 'Argentan', p: [-0.02, 48.745], z: 9000 },
  { n: 'Trun', p: [0.03, 48.843], z: 30000 },
  { n: 'Chambois', p: [0.105, 48.805], z: 20000 },
  { n: 'Flers', p: [-0.57, 48.75], z: 20000 },
  { n: 'Lisieux', p: [0.227, 49.146], z: 14000 },
  { n: 'Alençon', p: [0.09, 48.43], z: 8000 },
  { n: 'Le Mans', p: [0.20, 48.00], z: 5000 },
  { n: 'Laval', p: [-0.77, 48.07], z: 8000 },
  { n: 'Rennes', p: [-1.68, 48.11], z: 4000 },
  { n: 'Saint-Malo', p: [-2.02, 48.65], z: 7000 },
  { n: 'Brest', p: [-4.49, 48.39], z: 4000 },
  { n: 'Lorient', p: [-3.37, 47.75], z: 6000 },
  { n: 'Saint-Nazaire', p: [-2.21, 47.28], z: 6000 },
  { n: 'Nantes', p: [-1.55, 47.22], z: 5000 },
  { n: 'Angers', p: [-0.55, 47.47], z: 7000 },
  { n: 'Orléans', p: [1.91, 47.90], z: 5000 },
  { n: 'Chartres', p: [1.49, 48.44], z: 6000 },
  { n: 'Dreux', p: [1.37, 48.74], z: 9000 },
  { n: 'Évreux', p: [1.15, 49.02], z: 9000 },
  { n: 'Mantes', p: [1.72, 48.99], z: 9000 },
  { n: 'Vernon', p: [1.485, 49.09], z: 14000 },
  { n: 'Elbeuf', p: [1.01, 49.29], z: 14000 },
  { n: 'Rouen', p: [1.10, 49.44], z: 5000 },
  { n: 'Le Havre', p: [0.11, 49.49], z: 5000 },
  { n: 'Sens', p: [3.28, 48.20], z: 8000 },
  { n: 'Troyes', p: [4.08, 48.30], z: 6000 }
];
export const SEA_LABELS: SeaLabel[] = [
  { n: 'English Channel', p: [-2.3, 50.1], z: 1500, zmax: 16000 },
  { n: 'Baie de la Seine', p: [-0.55, 49.52], z: 16000, zmax: 90000 },
  { n: 'Bay of Biscay', p: [-4.2, 47.2], z: 2500, zmax: 16000 }
];
