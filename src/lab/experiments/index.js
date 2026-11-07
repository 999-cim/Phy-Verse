import boyle from './01-boyle.js';
import charles from './02-charles.js';
import heatcap from './03-heatcap.js';
import latent from './04-latent.js';
import hooke from './05-hooke.js';
import ohm from './06-ohm.js';
import snell from './07-snell.js';
import pendulum from './08-pendulum.js';
import projectile from './09-projectile.js';
import conduction from './10-conduction.js';
import convection from './11-convection.js';
import radiation from './12-radiation.js';
import greenhouse from './13-greenhouse.js';
import wave from './14-wave.js';
import dimension from './15-dimension.js';

/** All 15 experiments, in the same order as the original EXPS array. */
export const experiments = [
  boyle, charles, heatcap, latent, hooke,
  ohm, snell, pendulum, projectile, conduction,
  convection, radiation, greenhouse, wave, dimension,
];
