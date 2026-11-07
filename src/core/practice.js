import { readJson, writeJson, readRaw, writeRaw, STORAGE_KEYS } from './storage.js';

/**
 * Practice domain layer: 31 templates, question generation, numeric grading,
 * report calculations and export text. No DOM access in this module.
 */

export function PHY_rand(min, max, step) {
  if (!step) { step = 1; }
  var n = Math.round((max - min) / step);
  return +(min + Math.floor(Math.random() * (n + 1)) * step).toFixed(4);
}
export function PHY_f2(x) { return Number(x).toFixed(2); }
export function PHY_f1(x) { return Number(x).toFixed(1); }

export function extractNumbers(text) {
  var nums = [];
  var re = /-?\d+\.?\d*(?:[eE][+-]?\d+)?/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    var n = parseFloat(m[0]);
    if (!isNaN(n)) { nums.push(n); }
  }
  return nums;
}

export function checkNumericAnswer(text, answer) {
  var nums = extractNumbers(text);
  var tol = Math.abs(answer) * 0.02 + 1e-9;
  var hit = false;
  for (var n = 0; n < nums.length; n++) {
    if (Math.abs(nums[n] - answer) <= tol) { hit = true; break; }
  }
  return { hit: hit, nums: nums, tolerance: tol };
}

      export const PHY_HINTS = {
        mech_ff: "v^2 = u^2 + 2as, with u = 0",
        mech_proj: "Vertical: h = 1/2 g t^2",
        mech_newton: "F = ma",
        mech_mom: "m1 u1 + m2 u2 = (m1 + m2) v",
        mech_ke: "KE = 1/2 m v^2",
        mech_circ: "F = m v^2 / r",
        mech_gpe: "dPE = mgh",
        mech_spring: "EPE = 1/2 k x^2",
        mech_work_adv: "W = 1/2 m (v^2 - u^2)",
        heat_shc: "Q = mc(dT), c_water = 4200 J kg-1 K-1",
        heat_latent: "Q = mL, L_ice = 334000 J kg-1",
        heat_boyle: "p1 V1 = p2 V2 (constant T)",
        heat_ideal: "pV = nRT, R = 8.31",
        wave_eq: "v = f(lambda)",
        wave_snell: "n = sin i / sin r",
        wave_crit: "sin c = 1/n",
        wave_doppler: "f_obs = f_src x v / (v - v_src)",
        em_ohm: "V = IR",
        em_series: "R_total = R1 + R2 + R3",
        em_parallel: "1/R = 1/R1 + 1/R2",
        em_power: "P = VI",
        em_mag: "F = BIL",
        em_transformer: "Vp/Vs = Np/Ns",
        em_rc: "tau = RC",
        rad_half: "N = N0 (1/2)^n, n = t / T",
        rad_bind: "E = (dm) c^2, c = 3e8 m/s",
        rad_basic_intro: "Alpha = He nucleus = 2p + 2n",
        rad_decay_adv: "lambda = ln2 / t_half",
        astro_kepler: "T^2 proportional to a^3",
        astro_basic: "1 AU = 1.5e11 m, 1 ly = 9.46e15 m",
        astro_lum_adv: "F = L / (4 pi d^2)"
      };

      export const PHY_FORMULAS = [
        {
          group_key: "formula_mech",
          items: [
            { eq: "v = u + at", zh: "勻加速運動 — 速度", en: "Uniform acceleration — velocity" },
            { eq: "s = ut + 1/2 at^2", zh: "位移", en: "Displacement" },
            { eq: "v^2 = u^2 + 2as", zh: "速度與位移關係", en: "Velocity-displacement relation" },
            { eq: "F = ma", zh: "牛頓第二定律", en: "Newton's 2nd Law" },
            { eq: "W = Fs cos(theta)", zh: "功", en: "Work done" },
            { eq: "KE = 1/2 mv^2", zh: "動能", en: "Kinetic energy" },
            { eq: "PE = mgh", zh: "重力勢能", en: "Gravitational PE" },
            { eq: "p = mv", zh: "動量", en: "Momentum" },
            { eq: "F = mv^2 / r", zh: "向心力", en: "Centripetal force" }
          ]
        },
        {
          group_key: "formula_heat",
          items: [
            { eq: "Q = mc(dT)", zh: "比熱容", en: "Specific heat capacity" },
            { eq: "Q = mL", zh: "潛熱", en: "Latent heat" },
            { eq: "pV = nRT", zh: "理想氣體定律 (R = 8.31)", en: "Ideal gas law" },
            { eq: "p1V1/T1 = p2V2/T2", zh: "聯合氣體定律", en: "Combined gas law" },
            { eq: "E = 3/2 kT", zh: "分子平均動能", en: "Mean molecular KE" }
          ]
        },
        {
          group_key: "formula_wave",
          items: [
            { eq: "v = f(lambda)", zh: "波速、頻率、波長", en: "Wave speed" },
            { eq: "T = 1/f", zh: "週期", en: "Period" },
            { eq: "n = sin i / sin r", zh: "Snell 定律", en: "Snell's Law" },
            { eq: "sin c = 1/n", zh: "臨界角", en: "Critical angle" },
            { eq: "1/v + 1/u = 1/f", zh: "透鏡公式", en: "Lens equation" },
            { eq: "(lambda) D / d = y", zh: "雙縫干涉條紋間距", en: "Double-slit fringe spacing" }
          ]
        },
        {
          group_key: "formula_em",
          items: [
            { eq: "V = IR", zh: "歐姆定律", en: "Ohm's Law" },
            { eq: "P = VI = I^2 R = V^2 / R", zh: "電功率", en: "Electrical power" },
            { eq: "R_series = R1 + R2", zh: "串聯電阻", en: "Series resistors" },
            { eq: "1/R_parallel = 1/R1 + 1/R2", zh: "並聯電阻", en: "Parallel resistors" },
            { eq: "F = BIL sin(theta)", zh: "磁力", en: "Magnetic force on wire" },
            { eq: "F = qvB sin(theta)", zh: "帶電粒子磁力", en: "Magnetic force on charge" },
            { eq: "Vp/Vs = Np/Ns", zh: "理想變壓器", en: "Ideal transformer" },
            { eq: "E = -N (d(phi)/dt)", zh: "法拉第電磁感應定律", en: "Faraday's Law" }
          ]
        },
        {
          group_key: "formula_rad",
          items: [
            { eq: "N = N0 (1/2)^n", zh: "半衰期衰變", en: "Half-life decay" },
            { eq: "n = t / T_half", zh: "半衰期次數", en: "Number of half-lives" },
            { eq: "E = (dm) c^2", zh: "質能等價", en: "Mass-energy equivalence" },
            { eq: "T^2 proportional to a^3", zh: "克卜勒第三定律", en: "Kepler's 3rd Law" },
            { eq: "F = GMm / r^2", zh: "萬有引力定律", en: "Universal gravitation" }
          ]
        }
      ];

      export const PHY_TEMPLATES = [
        { id: "mech_ff",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "自由落體", subtopic_en: "Free Fall",
          difficulty: "basic",
          gen: function (lang) {
            var h = PHY_rand(1, 20, 0.5);
            var v = Math.sqrt(2 * 9.81 * h);
            if (lang === "en") {
              return {
                q: "A ball falls freely from rest at height " + h + " m. Find its landing speed. (g = 9.81 m s-2)",
                answer: v, unit: "m s-1", marks: 3,
                solution: "v = sqrt(2gh) = sqrt(2 x 9.81 x " + h + ") = " + PHY_f2(v) + " m s-1"
              };
            }
            return {
              q: "一顆小球從 " + h + " m 高處由靜止自由落下。求到達地面時的速度。（g = 9.81 m s-2）",
              answer: v, unit: "m s-1", marks: 3,
              solution: "v = sqrt(2gh) = sqrt(2 x 9.81 x " + h + ") = " + PHY_f2(v) + " m s-1"
            };
          }
        },
        { id: "mech_proj",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "水平拋體", subtopic_en: "Projectile",
          difficulty: "mid",
          gen: function (lang) {
            var h = PHY_rand(5, 45, 1);
            var u = PHY_rand(3, 20, 1);
            var t = Math.sqrt(2 * h / 9.81);
            if (lang === "en") {
              return {
                q: "A ball is projected horizontally at " + u + " m s-1 from a table " + h + " m high. Find the time of flight.",
                answer: t, unit: "s", marks: 3,
                solution: "h = 1/2 g t^2 -> t = sqrt(2 x " + h + " / 9.81) = " + PHY_f2(t) + " s"
              };
            }
            return {
              q: "一顆小球從 " + h + " m 高的桌邊以水平速度 " + u + " m s-1 拋出。求落地時間。",
              answer: t, unit: "s", marks: 3,
              solution: "h = 1/2 g t^2 -> t = sqrt(2 x " + h + " / 9.81) = " + PHY_f2(t) + " s"
            };
          }
        },
        { id: "mech_newton",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "牛頓第二定律", subtopic_en: "Newton 2nd",
          difficulty: "basic",
          gen: function (lang) {
            var m = PHY_rand(0.5, 10, 0.5);
            var a = PHY_rand(1, 8, 0.5);
            var F = m * a;
            if (lang === "en") {
              return {
                q: "A " + m + " kg object under a constant force has acceleration " + a + " m s-2. Find the net force.",
                answer: F, unit: "N", marks: 2,
                solution: "F = ma = " + m + " x " + a + " = " + PHY_f2(F) + " N"
              };
            }
            return {
              q: "質量 " + m + " kg 的物體受恆力作用，加速度 " + a + " m s-2。求淨力。",
              answer: F, unit: "N", marks: 2,
              solution: "F = ma = " + m + " x " + a + " = " + PHY_f2(F) + " N"
            };
          }
        },
        { id: "mech_mom",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "動量守恆", subtopic_en: "Momentum",
          difficulty: "mid",
          gen: function (lang) {
            var m1 = PHY_rand(1, 5, 0.5);
            var u1 = PHY_rand(2, 10, 1);
            var m2 = PHY_rand(1, 5, 0.5);
            var v = m1 * u1 / (m1 + m2);
            if (lang === "en") {
              return {
                q: "A " + m1 + " kg object moving at " + u1 + " m s-1 collides with a stationary " + m2 + " kg object (perfectly inelastic). Find the common velocity.",
                answer: v, unit: "m s-1", marks: 3,
                solution: "Momentum conservation:\n" + m1 + " x " + u1 + " = (" + m1 + " + " + m2 + ") v\nv = " + PHY_f2(v) + " m s-1"
              };
            }
            return {
              q: "質量 " + m1 + " kg 的物體以 " + u1 + " m s-1 撞向靜止的質量 " + m2 + " kg 物體，發生完全非彈性碰撞。求碰撞後共同速度。",
              answer: v, unit: "m s-1", marks: 3,
              solution: "動量守恆：\n" + m1 + " x " + u1 + " = (" + m1 + " + " + m2 + ") v\nv = " + PHY_f2(v) + " m s-1"
            };
          }
        },
        { id: "mech_ke",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "動能", subtopic_en: "Kinetic Energy",
          difficulty: "basic",
          gen: function (lang) {
            var m = PHY_rand(0.5, 10, 0.5);
            var v = PHY_rand(2, 20, 1);
            var E = 0.5 * m * v * v;
            if (lang === "en") {
              return {
                q: "A " + m + " kg object moves at " + v + " m s-1. Find its kinetic energy.",
                answer: E, unit: "J", marks: 2,
                solution: "KE = 0.5 m v^2 = 0.5 x " + m + " x " + v + "^2 = " + PHY_f1(E) + " J"
              };
            }
            return {
              q: "質量 " + m + " kg 的物體以 " + v + " m s-1 移動。求動能。",
              answer: E, unit: "J", marks: 2,
              solution: "KE = 0.5 m v^2 = 0.5 x " + m + " x " + v + "^2 = " + PHY_f1(E) + " J"
            };
          }
        },
        { id: "mech_circ",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "圓周運動", subtopic_en: "Circular",
          difficulty: "mid",
          gen: function (lang) {
            var m = PHY_rand(0.1, 2, 0.1);
            var r = PHY_rand(0.5, 3, 0.1);
            var v = PHY_rand(2, 10, 1);
            var Fc = m * v * v / r;
            if (lang === "en") {
              return {
                q: "A " + m + " kg ball moves uniformly on a circle of radius " + r + " m at " + v + " m s-1. Find the centripetal force.",
                answer: Fc, unit: "N", marks: 3,
                solution: "F = m v^2 / r = " + PHY_f2(Fc) + " N"
              };
            }
            return {
              q: "質量 " + m + " kg 小球以 " + v + " m s-1 在半徑 " + r + " m 圓形軌道等速運動。求向心力。",
              answer: Fc, unit: "N", marks: 3,
              solution: "F = m v^2 / r = " + PHY_f2(Fc) + " N"
            };
          }
        },
        { id: "mech_gpe",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "重力勢能", subtopic_en: "Gravitational PE",
          difficulty: "basic",
          gen: function (lang) {
            var m = PHY_rand(1, 50, 1);
            var h = PHY_rand(1, 20, 0.5);
            var E = m * 9.81 * h;
            if (lang === "en") {
              return {
                q: "A " + m + " kg object is lifted to " + h + " m. Find the increase in gravitational PE.",
                answer: E, unit: "J", marks: 2,
                solution: "dPE = mgh = " + m + " x 9.81 x " + h + " = " + PHY_f1(E) + " J"
              };
            }
            return {
              q: "質量 " + m + " kg 物體被提升到 " + h + " m 高度。求增加的重力勢能。",
              answer: E, unit: "J", marks: 2,
              solution: "dPE = mgh = " + m + " x 9.81 x " + h + " = " + PHY_f1(E) + " J"
            };
          }
        },
        { id: "mech_spring",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "彈性勢能", subtopic_en: "Elastic PE",
          difficulty: "mid",
          gen: function (lang) {
            var k = PHY_rand(50, 500, 10);
            var x = PHY_rand(0.05, 0.5, 0.05);
            var E = 0.5 * k * x * x;
            if (lang === "en") {
              return {
                q: "A spring (k = " + k + " N m-1) is compressed by " + x + " m. Find the elastic PE.",
                answer: E, unit: "J", marks: 2,
                solution: "EPE = 0.5 k x^2 = " + PHY_f2(E) + " J"
              };
            }
            return {
              q: "彈簧常數 " + k + " N m-1 的彈簧被壓縮 " + x + " m。求彈性勢能。",
              answer: E, unit: "J", marks: 2,
              solution: "EPE = 0.5 k x^2 = " + PHY_f2(E) + " J"
            };
          }
        },
        { id: "heat_shc",
          topic_zh: "熱學", topic_en: "Heat",
          subtopic_zh: "比熱容", subtopic_en: "Specific Heat",
          difficulty: "basic",
          gen: function (lang) {
            var m = PHY_rand(0.1, 2, 0.1);
            var dT = PHY_rand(10, 80, 5);
            var Q = m * 4200 * dT;
            if (lang === "en") {
              return {
                q: "Heating " + m + " kg of water raises T by " + dT + " degC. Find heat absorbed. (c = 4200 J kg-1 K-1)",
                answer: Q, unit: "J", marks: 2,
                solution: "Q = mc(dT) = " + m + " x 4200 x " + dT + " = " + PHY_f1(Q) + " J"
              };
            }
            return {
              q: "把 " + m + " kg 水加熱，溫度上升 " + dT + " 度C。求吸收的熱能。（c = 4200 J kg-1 K-1）",
              answer: Q, unit: "J", marks: 2,
              solution: "Q = mc(dT) = " + m + " x 4200 x " + dT + " = " + PHY_f1(Q) + " J"
            };
          }
        },
        { id: "heat_latent",
          topic_zh: "熱學", topic_en: "Heat",
          subtopic_zh: "潛熱", subtopic_en: "Latent Heat",
          difficulty: "basic",
          gen: function (lang) {
            var m = PHY_rand(0.05, 1, 0.05);
            var Q = m * 334000;
            if (lang === "en") {
              return {
                q: "How much energy is needed to completely melt " + m + " kg of 0 degC ice? (L = 334000 J kg-1)",
                answer: Q, unit: "J", marks: 2,
                solution: "Q = mL = " + m + " x 334000 = " + PHY_f1(Q) + " J"
              };
            }
            return {
              q: "把 " + m + " kg 的 0 度C 冰完全熔化成水，需多少能量？（L = 334000 J kg-1）",
              answer: Q, unit: "J", marks: 2,
              solution: "Q = mL = " + m + " x 334000 = " + PHY_f1(Q) + " J"
            };
          }
        },
        { id: "heat_boyle",
          topic_zh: "熱學", topic_en: "Heat",
          subtopic_zh: "波以耳定律", subtopic_en: "Boyle's Law",
          difficulty: "mid",
          gen: function (lang) {
            var p1 = PHY_rand(100, 200, 10);
            var V1 = PHY_rand(1, 5, 0.5);
            var p2 = PHY_rand(50, 300, 10);
            var V2 = p1 * V1 / p2;
            if (lang === "en") {
              return {
                q: "Ideal gas at constant T: pressure " + p1 + " kPa -> " + p2 + " kPa. Initial volume " + V1 + " L. Find final volume.",
                answer: V2, unit: "L", marks: 3,
                solution: "p1 V1 = p2 V2\nV2 = " + PHY_f2(V2) + " L"
              };
            }
            return {
              q: "一定量理想氣體在恆溫下，壓力由 " + p1 + " kPa 變為 " + p2 + " kPa。初始體積 " + V1 + " L，求最終體積。",
              answer: V2, unit: "L", marks: 3,
              solution: "p1 V1 = p2 V2\nV2 = " + PHY_f2(V2) + " L"
            };
          }
        },
        { id: "heat_ideal",
          topic_zh: "熱學", topic_en: "Heat",
          subtopic_zh: "理想氣體", subtopic_en: "Ideal Gas",
          difficulty: "adv",
          gen: function (lang) {
            var n = PHY_rand(0.5, 3, 0.5);
            var T = PHY_rand(250, 400, 10);
            var p = PHY_rand(100000, 300000, 10000);
            var V = n * 8.31 * T / p;
            if (lang === "en") {
              return {
                q: n + " mol of ideal gas at " + T + " K and " + p + " Pa. Find the volume. (R = 8.31 J mol-1 K-1)",
                answer: V, unit: "m3", marks: 3,
                solution: "pV = nRT\nV = nRT/p = " + V.toFixed(5) + " m3"
              };
            }
            return {
              q: n + " mol 理想氣體在 " + T + " K 及 " + p + " Pa 下。求體積。（R = 8.31 J mol-1 K-1）",
              answer: V, unit: "m3", marks: 3,
              solution: "pV = nRT\nV = nRT/p = " + V.toFixed(5) + " m3"
            };
          }
        },
        { id: "wave_eq",
          topic_zh: "波動", topic_en: "Waves",
          subtopic_zh: "波速公式", subtopic_en: "Wave Speed",
          difficulty: "basic",
          gen: function (lang) {
            var f = PHY_rand(20, 500, 10);
            var L = PHY_rand(0.1, 5, 0.1);
            var v = f * L;
            if (lang === "en") {
              return {
                q: "A wave has frequency " + f + " Hz and wavelength " + L + " m. Find its speed.",
                answer: v, unit: "m s-1", marks: 2,
                solution: "v = fL = " + f + " x " + L + " = " + PHY_f2(v) + " m s-1"
              };
            }
            return {
              q: "波的頻率 " + f + " Hz，波長 " + L + " m。求波速。",
              answer: v, unit: "m s-1", marks: 2,
              solution: "v = fL = " + f + " x " + L + " = " + PHY_f2(v) + " m s-1"
            };
          }
        },
        { id: "wave_snell",
          topic_zh: "波動", topic_en: "Waves",
          subtopic_zh: "折射定律", subtopic_en: "Refraction",
          difficulty: "mid",
          gen: function (lang) {
            var i = PHY_rand(20, 60, 5);
            var n = PHY_rand(1.3, 2.0, 0.05);
            var r = Math.asin(Math.sin(i * Math.PI / 180) / n) * 180 / Math.PI;
            if (lang === "en") {
              return {
                q: "Light enters glass (n = " + n + ") from air at " + i + " deg incidence. Find the angle of refraction.",
                answer: r, unit: "deg", marks: 3,
                solution: "n = sin i / sin r\nsin r = sin " + i + " / " + n + "\nr = " + PHY_f1(r) + " degrees"
              };
            }
            return {
              q: "光從空氣以入射角 " + i + " 度射入折射率 " + n + " 的玻璃。求折射角。",
              answer: r, unit: "度", marks: 3,
              solution: "n = sin i / sin r\nsin r = sin " + i + " / " + n + "\nr = " + PHY_f1(r) + " 度"
            };
          }
        },
        { id: "wave_crit",
          topic_zh: "波動", topic_en: "Waves",
          subtopic_zh: "臨界角", subtopic_en: "Critical Angle",
          difficulty: "mid",
          gen: function (lang) {
            var n = PHY_rand(1.3, 2.4, 0.05);
            var c = Math.asin(1 / n) * 180 / Math.PI;
            if (lang === "en") {
              return {
                q: "Glass has refractive index " + n + ". Find the critical angle from glass to air.",
                answer: c, unit: "deg", marks: 2,
                solution: "sin c = 1/n\nc = " + PHY_f1(c) + " degrees"
              };
            }
            return {
              q: "玻璃折射率 " + n + "。求光從玻璃射向空氣的臨界角。",
              answer: c, unit: "度", marks: 2,
              solution: "sin c = 1/n\nc = " + PHY_f1(c) + " 度"
            };
          }
        },
        { id: "wave_doppler",
          topic_zh: "波動", topic_en: "Waves",
          subtopic_zh: "都卜勒效應", subtopic_en: "Doppler Effect",
          difficulty: "adv",
          gen: function (lang) {
            var fs = PHY_rand(200, 1000, 10);
            var vs = PHY_rand(20, 80, 5);
            var fo = fs * 340 / (340 - vs);
            if (lang === "en") {
              return {
                q: "A source emits sound of " + fs + " Hz and approaches a stationary observer at " + vs + " m s-1. Find the observed frequency. (speed of sound = 340 m s-1)",
                answer: fo, unit: "Hz", marks: 3,
                solution: "f_obs = f_src x v / (v - v_src)\n= " + fs + " x 340 / (340 - " + vs + ")\n= " + PHY_f1(fo) + " Hz"
              };
            }
            return {
              q: "聲源發出 " + fs + " Hz 的聲音，以 " + vs + " m s-1 速度接近靜止的觀察者。求觀察到的頻率。（聲速 = 340 m s-1）",
              answer: fo, unit: "Hz", marks: 3,
              solution: "f_obs = f_src x v / (v - v_src)\n= " + fs + " x 340 / (340 - " + vs + ")\n= " + PHY_f1(fo) + " Hz"
            };
          }
        },
        { id: "em_ohm",
          topic_zh: "電磁", topic_en: "Electromagnetism",
          subtopic_zh: "歐姆定律", subtopic_en: "Ohm's Law",
          difficulty: "basic",
          gen: function (lang) {
            var V = PHY_rand(3, 24, 1);
            var R = PHY_rand(2, 100, 2);
            var I = V / R;
            if (lang === "en") {
              return {
                q: "A " + R + " ohm resistor has " + V + " V across it. Find the current.",
                answer: I, unit: "A", marks: 2,
                solution: "I = V/R = " + V + " / " + R + " = " + PHY_f2(I) + " A"
              };
            }
            return {
              q: "電阻 " + R + " 歐姆兩端電壓 " + V + " V。求通過的電流。",
              answer: I, unit: "A", marks: 2,
              solution: "I = V/R = " + V + " / " + R + " = " + PHY_f2(I) + " A"
            };
          }
        },
        { id: "em_series",
          topic_zh: "電磁", topic_en: "Electromagnetism",
          subtopic_zh: "串聯電阻", subtopic_en: "Series",
          difficulty: "basic",
          gen: function (lang) {
            var R1 = PHY_rand(2, 50, 2);
            var R2 = PHY_rand(2, 50, 2);
            var R3 = PHY_rand(2, 50, 2);
            var R = R1 + R2 + R3;
            if (lang === "en") {
              return {
                q: "Three resistors " + R1 + " ohm, " + R2 + " ohm, " + R3 + " ohm in series. Find equivalent resistance.",
                answer: R, unit: "ohm", marks: 2,
                solution: "R = R1 + R2 + R3 = " + R + " ohm"
              };
            }
            return {
              q: R1 + " 歐姆、" + R2 + " 歐姆、" + R3 + " 歐姆串聯，求等效電阻。",
              answer: R, unit: "歐姆", marks: 2,
              solution: "R = R1 + R2 + R3 = " + R + " 歐姆"
            };
          }
        },
        { id: "em_parallel",
          topic_zh: "電磁", topic_en: "Electromagnetism",
          subtopic_zh: "並聯電阻", subtopic_en: "Parallel",
          difficulty: "mid",
          gen: function (lang) {
            var R1 = PHY_rand(4, 100, 2);
            var R2 = PHY_rand(4, 100, 2);
            var R = R1 * R2 / (R1 + R2);
            if (lang === "en") {
              return {
                q: "Resistors " + R1 + " ohm and " + R2 + " ohm in parallel. Find equivalent resistance.",
                answer: R, unit: "ohm", marks: 3,
                solution: "R = R1 R2 / (R1 + R2) = " + PHY_f2(R) + " ohm"
              };
            }
            return {
              q: R1 + " 歐姆和 " + R2 + " 歐姆並聯，求等效電阻。",
              answer: R, unit: "歐姆", marks: 3,
              solution: "R = R1 R2 / (R1 + R2) = " + PHY_f2(R) + " 歐姆"
            };
          }
        },
        { id: "em_power",
          topic_zh: "電磁", topic_en: "Electromagnetism",
          subtopic_zh: "電功率", subtopic_en: "Power",
          difficulty: "basic",
          gen: function (lang) {
            var V = PHY_rand(3, 24, 1);
            var I = PHY_rand(0.5, 5, 0.5);
            var P = V * I;
            if (lang === "en") {
              return {
                q: "An appliance at " + V + " V draws " + I + " A. Find its power.",
                answer: P, unit: "W", marks: 2,
                solution: "P = VI = " + PHY_f2(P) + " W"
              };
            }
            return {
              q: "電器在電壓 " + V + " V 下通過 " + I + " A。求電功率。",
              answer: P, unit: "W", marks: 2,
              solution: "P = VI = " + PHY_f2(P) + " W"
            };
          }
        },
        { id: "em_mag",
          topic_zh: "電磁", topic_en: "Electromagnetism",
          subtopic_zh: "磁力", subtopic_en: "Magnetic Force",
          difficulty: "mid",
          gen: function (lang) {
            var B = PHY_rand(0.1, 2, 0.1);
            var I = PHY_rand(1, 10, 0.5);
            var L = PHY_rand(0.1, 1, 0.1);
            var F = B * I * L;
            if (lang === "en") {
              return {
                q: "A " + L + " m wire carrying " + I + " A is perpendicular to a " + B + " T field. Find the magnetic force.",
                answer: F, unit: "N", marks: 3,
                solution: "F = BIL = " + PHY_f2(F) + " N"
              };
            }
            return {
              q: "長 " + L + " m 載流導線垂直於 " + B + " T 磁場，電流 " + I + " A。求磁力。",
              answer: F, unit: "N", marks: 3,
              solution: "F = BIL = " + PHY_f2(F) + " N"
            };
          }
        },
        { id: "em_transformer",
          topic_zh: "電磁", topic_en: "Electromagnetism",
          subtopic_zh: "變壓器", subtopic_en: "Transformer",
          difficulty: "mid",
          gen: function (lang) {
            var Vp = PHY_rand(100, 240, 10);
            var Np = PHY_rand(500, 2000, 100);
            var Ns = PHY_rand(50, 500, 50);
            var Vs = Vp * Ns / Np;
            if (lang === "en") {
              return {
                q: "Ideal transformer: " + Np + " primary turns, " + Ns + " secondary turns, primary " + Vp + " V. Find secondary voltage.",
                answer: Vs, unit: "V", marks: 3,
                solution: "Vp/Vs = Np/Ns\nVs = " + PHY_f1(Vs) + " V"
              };
            }
            return {
              q: "理想變壓器初級 " + Np + " 匝，次級 " + Ns + " 匝。初級電壓 " + Vp + " V，求次級電壓。",
              answer: Vs, unit: "V", marks: 3,
              solution: "Vp/Vs = Np/Ns\nVs = " + PHY_f1(Vs) + " V"
            };
          }
        },
        { id: "em_rc",
          topic_zh: "電磁", topic_en: "Electromagnetism",
          subtopic_zh: "RC 電路時間常數", subtopic_en: "RC Time Constant",
          difficulty: "adv",
          gen: function (lang) {
            var R = PHY_rand(100, 10000, 100);
            var C = PHY_rand(1, 1000, 10) * 1e-6;
            var tau = R * C;
            if (lang === "en") {
              return {
                q: "An RC circuit has R = " + R + " ohm and C = " + (C * 1e6).toFixed(0) + " microF. Find the time constant (in s).",
                answer: tau, unit: "s", marks: 3,
                solution: "tau = RC = " + R + " x " + C.toExponential(2) + " = " + tau.toExponential(3) + " s"
              };
            }
            return {
              q: "RC 電路中 R = " + R + " 歐姆，C = " + (C * 1e6).toFixed(0) + " 微法拉。求時間常數（單位 s）。",
              answer: tau, unit: "s", marks: 3,
              solution: "tau = RC = " + R + " x " + C.toExponential(2) + " = " + tau.toExponential(3) + " s"
            };
          }
        },
        { id: "rad_basic_intro",
          topic_zh: "放射", topic_en: "Radioactivity",
          subtopic_zh: "放射線種類", subtopic_en: "Radiation Types",
          difficulty: "basic",
          gen: function (lang) {
            if (lang === "en") {
              return {
                q: "An alpha particle is emitted from a nucleus. What is its charge in units of e? (Answer as a positive integer)",
                answer: 2, unit: "e", marks: 1,
                solution: "Alpha particle = helium nucleus = 2 protons + 2 neutrons\nCharge = +2e"
              };
            }
            return {
              q: "α 粒子從原子核放出。求它的電荷（以基本電荷 e 為單位，填入正整數）。",
              answer: 2, unit: "e", marks: 1,
              solution: "α 粒子 = 氦原子核 = 2 個質子 + 2 個中子\n電荷 = +2e"
            };
          }
        },
        { id: "rad_half",
          topic_zh: "放射", topic_en: "Radioactivity",
          subtopic_zh: "半衰期", subtopic_en: "Half-life",
          difficulty: "mid",
          gen: function (lang) {
            var N0 = PHY_rand(100, 1000, 100);
            var T = PHY_rand(2, 10, 1);
            var k = PHY_rand(1, 5, 1);
            var t = T * k;
            var N = N0 * Math.pow(0.5, k);
            if (lang === "en") {
              return {
                q: "A radioactive sample starts with " + N0 + " nuclei, half-life " + T + " days. Find nuclei after " + t + " days.",
                answer: N, unit: "", marks: 3,
                solution: "n = " + k + " half-lives\nN = " + N0 + " x 0.5^" + k + " = " + PHY_f1(N)
              };
            }
            return {
              q: "放射性樣本最初有 " + N0 + " 個原子核，半衰期 " + T + " 天。求 " + t + " 天後剩餘原子核數。",
              answer: N, unit: "個", marks: 3,
              solution: "n = " + k + " 個半衰期\nN = " + N0 + " x 0.5^" + k + " = " + PHY_f1(N)
            };
          }
        },
        { id: "rad_bind",
          topic_zh: "放射", topic_en: "Radioactivity",
          subtopic_zh: "質能等價", subtopic_en: "Mass-Energy",
          difficulty: "adv",
          gen: function (lang) {
            var dmF = PHY_rand(0.01, 0.5, 0.01);
            var dm = dmF * 1e-27;
            var E = dm * 9e16 / 1.6e-13;
            if (lang === "en") {
              return {
                q: "Mass defect = " + dmF.toFixed(2) + " x 10^-27 kg. Find energy released (MeV). (1 MeV = 1.6 x 10^-13 J)",
                answer: E, unit: "MeV", marks: 3,
                solution: "E = dm c^2 = " + E.toFixed(1) + " MeV"
              };
            }
            return {
              q: "核反應質量虧損 " + dmF.toFixed(2) + " x 10^-27 kg。求釋放能量（MeV）。（1 MeV = 1.6 x 10^-13 J）",
              answer: E, unit: "MeV", marks: 3,
              solution: "E = dm c^2 = " + E.toFixed(1) + " MeV"
            };
          }
        },
        { id: "rad_decay_adv",
          topic_zh: "放射", topic_en: "Radioactivity",
          subtopic_zh: "衰變常數", subtopic_en: "Decay Constant",
          difficulty: "adv",
          gen: function (lang) {
            var T = PHY_rand(2, 20, 1);
            var lambda = Math.log(2) / (T * 86400);
            if (lang === "en") {
              return {
                q: "A radioactive isotope has a half-life of " + T + " days. Find its decay constant in s-1. (ln 2 = 0.693)",
                answer: lambda, unit: "s-1", marks: 3,
                solution: "lambda = ln2 / t_half\n= 0.693 / (" + T + " x 86400)\n= " + lambda.toExponential(3) + " s-1"
              };
            }
            return {
              q: "某放射性同位素的半衰期為 " + T + " 天。求其衰變常數（單位 s-1）。（ln 2 = 0.693）",
              answer: lambda, unit: "s-1", marks: 3,
              solution: "lambda = ln2 / t_half\n= 0.693 / (" + T + " x 86400)\n= " + lambda.toExponential(3) + " s-1"
            };
          }
        },
        { id: "astro_basic",
          topic_zh: "天文", topic_en: "Astronomy",
          subtopic_zh: "天文單位", subtopic_en: "Astronomical Unit",
          difficulty: "basic",
          gen: function (lang) {
            if (lang === "en") {
              return {
                q: "Approximately how many astronomical units (AU) are in one light-year? (Round to nearest 1000)",
                answer: 63000, unit: "AU", marks: 1,
                solution: "1 AU = 1.5e11 m, 1 ly = 9.46e15 m\n1 ly / 1 AU = 9.46e15 / 1.5e11 = 63067"
              };
            }
            return {
              q: "一光年約等於多少天文單位 (AU)？（取最接近的千位整數）",
              answer: 63000, unit: "AU", marks: 1,
              solution: "1 AU = 1.5e11 m，1 ly = 9.46e15 m\n1 ly / 1 AU ≈ 63067"
            };
          }
        },
        { id: "astro_kepler",
          topic_zh: "天文", topic_en: "Astronomy",
          subtopic_zh: "克卜勒第三定律", subtopic_en: "Kepler 3rd",
          difficulty: "mid",
          gen: function (lang) {
            var a = PHY_rand(1.5, 30, 0.5);
            var T = Math.pow(a, 1.5);
            if (lang === "en") {
              return {
                q: "An asteroid orbits the Sun with mean radius " + a + " AU. Find its orbital period (years).",
                answer: T, unit: "years", marks: 3,
                solution: "T^2 = a^3\nT = sqrt(" + (a * a * a).toFixed(2) + ") = " + PHY_f2(T) + " years"
              };
            }
            return {
              q: "小行星繞日平均軌道半徑 " + a + " AU。求公轉週期（年）。",
              answer: T, unit: "年", marks: 3,
              solution: "T^2 = a^3\nT = sqrt(" + (a * a * a).toFixed(2) + ") = " + PHY_f2(T) + " 年"
            };
          }
        },
        { id: "astro_lum_adv",
          topic_zh: "天文", topic_en: "Astronomy",
          subtopic_zh: "光度與距離", subtopic_en: "Luminosity & Distance",
          difficulty: "adv",
          gen: function (lang) {
            var L = PHY_rand(2, 50, 1);
            var d = PHY_rand(2, 20, 1);
            var F = L / (d * d);
            if (lang === "en") {
              return {
                q: "Star A has luminosity " + L + " L_sun and is " + d + " pc away. Find its apparent brightness relative to the Sun at 1 pc (as a number).",
                answer: F, unit: "", marks: 3,
                solution: "F = L / (4 pi d^2), in relative units:\nF = " + L + " / " + d + "^2 = " + F.toFixed(4)
              };
            }
            return {
              q: "恆星 A 的光度為 " + L + " 倍太陽光度，距離地球 " + d + " 秒差距。求它相對太陽的視亮度（太陽在 1 pc 時視亮度為 1）。",
              answer: F, unit: "相對值", marks: 3,
              solution: "F = L / (4 pi d^2)，相對值：\nF = " + L + " / " + d + "^2 = " + F.toFixed(4)
            };
          }
        },
        { id: "mech_work_adv",
          topic_zh: "力學", topic_en: "Mechanics",
          subtopic_zh: "功能定理", subtopic_en: "Work-Energy Theorem",
          difficulty: "adv",
          gen: function (lang) {
            var m = PHY_rand(1, 10, 0.5);
            var u = PHY_rand(2, 10, 1);
            var v = PHY_rand(11, 25, 1);
            var W = 0.5 * m * (v * v - u * u);
            if (lang === "en") {
              return {
                q: "A " + m + " kg object speeds up from " + u + " m s-1 to " + v + " m s-1. Find the net work done on it.",
                answer: W, unit: "J", marks: 3,
                solution: "W = 1/2 m (v^2 - u^2)\n= 0.5 x " + m + " x (" + v + "^2 - " + u + "^2)\n= " + PHY_f1(W) + " J"
              };
            }
            return {
              q: "質量 " + m + " kg 物體速度由 " + u + " m s-1 加速至 " + v + " m s-1。求淨功。",
              answer: W, unit: "J", marks: 3,
              solution: "W = 1/2 m (v^2 - u^2)\n= 0.5 x " + m + " x (" + v + "^2 - " + u + "^2)\n= " + PHY_f1(W) + " J"
            };
          }
        }
      ];

      export const PHY_TOPICS = [
        { id: "all", i18n_key: "topic_all" },
        { id: "力學", i18n_key: "topic_mech" },
        { id: "熱學", i18n_key: "topic_heat" },
        { id: "波動", i18n_key: "topic_wave" },
        { id: "電磁", i18n_key: "topic_em" },
        { id: "放射", i18n_key: "topic_rad" }
      ];

export const PHY_DIFFS = [
        { id: "basic", i18n_key: "diff_basic" },
        { id: "mid", i18n_key: "diff_mid" },
        { id: "adv", i18n_key: "diff_adv" }
      ];


/**
 * Returns the same question objects as the original PHY_generateQuestions.
 * UI remains responsible for state assignment and toasts.
 */
export function generateQuestionSet({ topic, difficulty, lang, count, templates = PHY_TEMPLATES }) {
  var topicPool = templates.slice();
  if (topic !== 'all') {
    topicPool = topicPool.filter(function (tpl) { return tpl.topic_zh === topic; });
  }
  if (topicPool.length === 0) return { empty: true, qs: [] };

  var pool = topicPool;
  var fallbackUsed = false;
  if (difficulty !== 'all') {
    var diffPool = topicPool.filter(function (tpl) { return tpl.difficulty === difficulty; });
    if (diffPool.length > 0) pool = diffPool;
    else { pool = topicPool; fallbackUsed = true; }
  }

  var qs = [];
  for (var i = 0; i < count; i++) {
    var tpl = pool[Math.floor(Math.random() * pool.length)];
    var result = tpl.gen(lang);
    result.template_id = tpl.id;
    result.topic_zh = tpl.topic_zh;
    result.topic_en = tpl.topic_en;
    result.subtopic_zh = tpl.subtopic_zh;
    result.subtopic_en = tpl.subtopic_en;
    qs.push(result);
  }
  return { empty: false, qs: qs, fallbackUsed: fallbackUsed };
}

export function computeReport(history, bestStreak) {
  var total = history.length;
  var sum = 0;
  var totalTime = 0;
  for (var i = 0; i < total; i++) {
    sum += (history[i].score / history[i].total) * 100;
    totalTime += (history[i].elapsed || 0);
  }
  return {
    total: total,
    avgPct: total ? Math.round(sum / total) : null,
    totalMin: Math.round(totalTime / 60),
    bestStreak: bestStreak
  };
}

export function buildReportText(history, bestStreak, lang, t) {
  var report = computeReport(history, bestStreak);
  var lines = [];
  lines.push(t('report_title') + ' - ' + new Date().toLocaleString());
  lines.push('==================================================');
  lines.push('');
  lines.push(t('report_total_attempts') + ': ' + report.total);
  lines.push(t('report_avg') + ': ' + report.avgPct + '%');
  lines.push(t('report_best_streak') + ': ' + report.bestStreak);
  lines.push(t('report_total_time') + ': ' + report.totalMin + t('report_min'));
  lines.push('');
  lines.push(t('report_recent') + ':');
  lines.push('--------------------------------------------------');
  var recent = history.slice(-30).reverse();
  for (var j = 0; j < recent.length; j++) {
    var r = recent[j];
    var d = new Date(r.ts);
    var topicName = (lang === 'en') ? r.topic_en : r.topic_zh;
    lines.push(d.toLocaleDateString() + ' ' + d.toLocaleTimeString() + ' | ' + topicName + ' | ' + r.score + '/' + r.total);
  }
  return lines.join('\n');
}

export function loadHistory() { return readJson(STORAGE_KEYS.history, []); }
export function saveHistory(history) { writeJson(STORAGE_KEYS.history, history); }
export function loadNotes() { return readJson(STORAGE_KEYS.notes, {}); }
export function saveNotes(notes) { writeJson(STORAGE_KEYS.notes, notes); }
export function loadStreak() {
  var s = readJson(STORAGE_KEYS.streak, null);
  return { current: (s && s.current) || 0, best: (s && s.best) || 0 };
}
export function saveStreak(current, best) { writeJson(STORAGE_KEYS.streak, { current: current, best: best }); }
export function loadLang() {
  var s = readRaw(STORAGE_KEYS.lang);
  return (s === 'en' || s === 'zh') ? s : 'zh';
}
export function saveLang(lang) { writeRaw(STORAGE_KEYS.lang, lang); }
export function loadTheme() {
  var t = readRaw(STORAGE_KEYS.theme);
  return (t === 'dark' || t === 'light') ? t : null;
}
export function saveTheme(theme) { writeRaw(STORAGE_KEYS.theme, theme); }
