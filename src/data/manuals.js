export const MANUALS = {
  "boyle": {
    "zh": {
      "tools": [
        "密封玻璃氣缸與活塞",
        "波登壓力計 (Bourdon Gauge)",
        "不同質量的砝碼",
        "刻度尺",
        "數碼溫度計"
      ],
      "steps": [
        "檢查氣缸密封性，讀取並記錄初始狀態下氣柱的長度（對應體積 V₀）與波登壓力計的初始壓強 P₀。",
        "緩慢拖動砝碼放置在活塞頂部（或緩慢推動活塞），注意切勿動作過快以免氣體因快速壓縮而升溫。",
        "觀察溫度計讀數，待氣體溫度完全恢復至室溫且活塞靜止後，點擊記錄當前的體積 V 與總壓強 P。",
        "重複增減砝碼以獲取 5 至 6 組數據，在右側面板切換生成 P - V 曲線及 P - 1/V 線性圖象。"
      ],
      "why": "根據波義耳定律 (Boyle's Law)，對於一定質量（固定摩爾數 n）的理想氣體，在溫度 T 保持恆定（等溫過程）時，其壓強 P 與體積 V 成反比，公式表示為 PV = 常數（或 P₁V₁ = P₂V₂）。從 DSE 必考的分子運動論 (Kinetic Theory) 角度解釋：當氣缸體積 V 減小時，單位體積內的氣體分子數目密度增加；由於溫度 T 不變，分子的平均動能與平均碰撞速率保持不變，但分子撞擊容器內壁的頻率 (Frequency of collision) 顯著增加，因此在宏觀上表現為氣體壓強 P 增大。",
      "findings": "實驗顯示 P - V 圖象是一條光滑的雙曲線分支；當把橫坐標轉換為體積的倒數 (1/V) 時，P - 1/V 圖象呈現為一條穿過原點的直線，直接證明了 P ∝ 1/V。在 DSE 考試中需特別留意：P - 1/V 直線的斜率 (Slope = ΔP / Δ(1/V) = PV = nRT) 反映了氣體的溫度與質量，斜率越大代表實驗時的溫度越高或封入的氣體質量越大；此外，若實驗用的橡膠連接管過长，管內未被測量的氣體體積會導致直線不穿過原點（出現截距）。"
    },
    "en": {
      "tools": [
        "Airtight glass cylinder and piston",
        "Bourdon gauge",
        "Slotted weights of various masses",
        "Ruler (Scale)",
        "Digital thermometer"
      ],
      "steps": [
        "Check the airtightness of the cylinder, then read and record the initial length of the air column (corresponding to initial volume V₀) and the initial pressure P₀ from the Bourdon gauge.",
        "Slowly drag the weights onto the top of the piston (or push the piston slowly); avoid compressing the gas too quickly to prevent a temperature rise.",
        "Monitor the thermometer reading; once the gas cools back to room temperature and the piston comes to rest, click to record the current volume V and total pressure P.",
        "Repeat by adding or removing weights to obtain 5 to 6 sets of data, then switch the right panel to plot both the P - V curve and the linear P - 1/V graph."
      ],
      "why": "According to Boyle's Law, for a fixed mass (constant number of moles n) of an ideal gas at constant temperature T (isothermal process), its pressure P is inversely proportional to its volume V, expressed as PV = constant (or P₁V₁ = P₂V₂). From the perspective of Kinetic Theory (a key HKDSE topic): when the cylinder volume V decreases, the number density of gas molecules per unit volume increases. Since temperature T remains constant, the average kinetic energy and average speed of the molecules remain unchanged, but the frequency of collision of molecules against the container walls increases significantly, resulting macroscopically in an increased gas pressure P.",
      "findings": "The experiment shows that the P - V graph is a smooth hyperbola branch. When the horizontal axis is converted to the reciprocal of volume (1/V), the P - 1/V graph becomes a straight line passing through the origin, directly proving that P ∝ 1/V. For the HKDSE exam, note that the slope of the P - 1/V line (Slope = ΔP / Δ(1/V) = PV = nRT) reflects the temperature and mass of the trapped gas—a steeper slope indicates a higher temperature or a larger mass of trapped gas. Furthermore, if the rubber connecting tubing is too long, the unmeasured volume of air inside the tube will cause a non-zero intercept so the line does not pass through the origin."
    }
  },
  "charles": {
    "zh": {
      "tools": [
        "帶無摩擦活塞的密封毛細管氣缸",
        "恆溫可調水浴槽 (Water Bath)",
        "電熱器與攪拌器",
        "數碼溫度計",
        "毫米刻度尺"
      ],
      "steps": [
        "確保毛細管氣缸完全浸沒於水浴槽中，保持外部大氣壓強恆定，記錄初始水溫 T₀ 與氣柱長度（對應體積 V₀）。",
        "拖動滑桿開啟水浴電熱器進行緩慢加熱，同時點擊攪拌器使水溫均勻分佈。",
        "每當溫度上升 15 °C 時暫停加熱，待活塞停止移動且熱平衡後，點擊記錄氣體體積 V 與溫度 T。",
        "收集多組數據後繪製 V - T 圖象，並點擊「外推法 (Extrapolation)」按鈕將直線反向延伸至體積為零處。"
      ],
      "why": "根據查理定律 (Charles's Law)，一定質量的理想氣體在壓強 P 保持恆定（等壓過程）時，其體積 V 與絕對溫度 T（開爾文溫度）成正比，公式為 V / T = 常數（或 V₁ / T₁ = V₂ / T₂）。從分子運動論解釋：當氣體溫度 T 升高時，氣體分子的平均動能 (Eₖ ∝ T) 與運動速率隨之增大，分子對活塞的撞擊變得更猛烈且更頻繁；為了維持內部壓強等於外部恆定的大氣壓強，活塞必須向外移動使體積 V 膨脹，從而降低分子的單位體積密度以抵消撞擊力度的增加。",
      "findings": "若以攝氏溫度 (°C) 為橫坐標，V - T 圖象是一條具有正 Y 軸截距的直線，將其反向外推至與橫軸相交（即理論上 V = 0）時，交點即為「絕對零度 (-273 °C 或 0 K)」。若改用開爾文溫度 (K) 為橫坐標，圖象則為一條穿過原點的直線 (V ∝ T)。圖象的斜率 (Slope = ΔV / ΔT = nR / P) 與氣體摩爾數成正比、與外部壓強成反比；實驗中必須確保整個氣柱完全浸沒在水浴中，並持續攪拌以減小系統誤差。"
    },
    "en": {
      "tools": [
        "Sealed capillary tube with frictionless piston",
        "Thermostatic water bath",
        "Immersion heater and stirrer",
        "Digital thermometer",
        "Millimetre scale"
      ],
      "steps": [
        "Ensure the trapped air column in the capillary tube is completely immersed in the water bath under constant atmospheric pressure, then record the initial temperature T₀ and air column length (volume V₀).",
        "Drag the slider to turn on the heater for slow heating, and click the stirrer to maintain a uniform water temperature throughout the bath.",
        "Pause heating every 15 °C rise; once the piston stops moving and thermal equilibrium is reached, click to record the gas volume V and temperature T.",
        "Plot the V - T graph after collecting multiple data sets, and click the 'Extrapolation' button to extend the line backwards to where the volume reaches zero."
      ],
      "why": "According to Charles's Law, for a fixed mass of an ideal gas at constant pressure P (isobaric process), its volume V is directly proportional to its absolute temperature T (in Kelvin), given by V / T = constant (or V₁ / T₁ = V₂ / T₂). By Kinetic Theory: as gas temperature T increases, the average kinetic energy (Eₖ ∝ T) and speed of the gas molecules increase, causing harder and more frequent collisions against the piston. To keep the internal gas pressure equal to the constant external atmospheric pressure, the piston must move outwards to expand the volume V, reducing the molecular number density to compensate for the more vigorous collisions.",
      "findings": "When plotted against Celsius temperature (°C), the V - T graph is a straight line with a positive y-intercept; extrapolating this line backwards to intersect the temperature axis (where V = 0 theoretically) yields 'Absolute Zero (-273 °C or 0 K)'. When plotted against Kelvin temperature (K), the graph is a straight line passing through the origin (V ∝ T). The slope of the line (Slope = ΔV / ΔT = nR / P) is directly proportional to the number of moles of gas and inversely proportional to the external pressure. Key precautions include immersing the entire air column in the water bath and stirring continuously to minimize systematic errors."
    }
  },
  "heatcap": {
    "zh": {
      "tools": [
        "1 kg 標準鋁塊（帶雙孔）",
        "浸沒式電熱器 (Immersion Heater)",
        "焦耳計 (Joulemeter) 與低壓電源",
        "數碼溫度計",
        "聚苯乙烯隔熱墊及甘油（或導熱油）"
      ],
      "steps": [
        "將鋁塊置於聚苯乙烯隔熱墊上，向兩個插孔滴入少量甘油以增強熱接觸，再分別拖動插入電熱器與溫度計。",
        "將焦耳計讀數歸零，記錄鋁塊的初始溫度 T₀，然後點擊電源開關開始加熱。",
        "當焦耳計累積一定能量後關閉電源，繼續觀察溫度計，待讀數上升至「最高溫度 T_max」時點擊記錄。",
        "利用多組累積能量 E 與溫升 ΔT 數據繪製 E - ΔT 圖象，計算金屬塊的比熱容量 c。"
      ],
      "why": "比熱容量 (Specific Heat Capacity, c) 定義為使 1 kg 物質溫度上升 1 °C（或 1 K）所需的能量，核心公式為 E = mcΔT（若已知電熱器功率 P 與加熱時間 t，則 Pt = mcΔT）。當電熱器通電時，電能轉化為內能並傳遞給鋁塊，使鋁原子晶格振動加劇，平均分子動能增加，宏觀上表現為溫度升高。滴入甘油能排走插孔內的空氣，大幅提升電熱器、金屬塊與溫度計之間的熱傳導效率。",
      "findings": "實驗繪製的「輸入能量 - 溫升 (E - ΔT) 圖象」為一條直線，其斜率 (Slope = ΔE / ΔT = mc) 除以金屬塊質量 m 即為比熱容量 c。在 DSE 考試中經常考核誤差分析：由於實驗過程中必有部分熱能散失到周圍環境 (E_input = mcΔT + E_lost)，因此實驗測得的比熱容量數值通常會「大於」真實標準值；此外，關閉電源後必須讀取「最高溫度」，因為電熱器餘熱仍需時間傳導至溫度計。"
    },
    "en": {
      "tools": [
        "1 kg standard aluminium block (with two holes)",
        "Immersion heater",
        "Joulemeter and low-voltage power supply",
        "Digital thermometer",
        "Polystyrene insulating mat and glycerol (or oil)"
      ],
      "steps": [
        "Place the aluminium block on the polystyrene mat, add a few drops of glycerol into both holes to improve thermal contact, and insert the immersion heater and thermometer.",
        "Reset the joulemeter to zero, record the initial temperature T₀ of the block, and switch on the power supply to start heating.",
        "Switch off the power after a certain amount of energy is supplied, continue watching the thermometer, and record the 'maximum temperature T_max' reached.",
        "Plot the E - ΔT graph using multiple sets of energy supplied E and temperature rise ΔT to determine the specific heat capacity c of the metal block."
      ],
      "why": "Specific heat capacity (c) is defined as the energy required to raise the temperature of 1 kg of a substance by 1 °C (or 1 K), governed by the formula E = mcΔT (or Pt = mcΔT given heater power P and heating time t). When the heater is switched on, electrical energy is converted into internal energy and transferred to the aluminium block, intensifying the lattice vibrations of aluminium atoms and increasing their average kinetic energy, which manifests macroscopically as a temperature rise. Adding glycerol displaces trapped air in the holes, ensuring good thermal contact between the heater, metal block, and thermometer.",
      "findings": "The 'Energy supplied vs. Temperature rise (E - ΔT) graph' is a straight line whose slope (Slope = ΔE / ΔT = mc) divided by the block's mass m gives the specific heat capacity c. Error analysis is frequently tested in the HKDSE: because some heat is inevitably lost to the surroundings (E_input = mcΔT + E_lost), the experimental value of c is usually 'greater than' the true standard value. Additionally, students must record the highest temperature reached after switching off the heater, as residual heat takes time to conduct from the heater to the thermometer."
    }
  },
  "latent": {
    "zh": {
      "tools": [
        "盛水聚苯乙烯杯（保溫杯）",
        "大功率浸沒式電熱器",
        "高精度電子天平",
        "焦耳計 (Joulemeter)",
        "防濺托盤與支架"
      ],
      "steps": [
        "將盛水的聚苯乙烯杯放在電子天平上，拖動電熱器懸掛浸入水中（注意電熱器不可接觸杯底或杯壁）。",
        "開啟電源將水加熱至劇烈沸騰（保持 100 °C 恆溫），待沸騰穩定後，同時將焦耳計歸零並記錄初始質量 m₁。",
        "讓水持續沸騰汽化一段時間，直接記錄焦耳計讀數 E 與天平顯示的最終質量 m₂，計算汽化質量 Δm = m₁ - m₂。",
        "切換不同加熱時長獲取多組 (Δm, E) 數據，繪製 E - Δm 圖象以求得水的汽化比潛熱 l_v。"
      ],
      "why": "汽化比潛熱 (Specific Latent Heat of Vaporization, l_v) 是指在溫度不變的情況下，將 1 kg 液體完全轉化為氣體所需的能量，公式為 E = Δm · l_v。當水在 100 °C 沸騰時，電熱器提供的能量不再用於增加水分子的平均動能（因此溫度保持恆定），而是完全用於克服水分子之間的分子間引力，使液態水脫離束縛變成水蒸氣逸出，全部轉化為分子的勢能 (Potential Energy)。",
      "findings": "在沸騰過程中，「溫度 - 時間 (T - t) 圖象」呈現水平直線（斜率為零）；而「輸入能量 - 汽化質量 (E - Δm) 圖象」則為一條斜率正比於汽化比潛熱 l_v 的直線 (Slope = ΔE / Δ(Δm) = l_v)。DSE 常考兩大系統誤差：第一，水蒸氣在電熱器上方凝結並滴回杯中，會使測得的 Δm 偏小，導致計算出的 l_v 偏大；第二，若沸水濺出杯外，則會使 Δm 偏大，導致計算出的 l_v 偏小。"
    },
    "en": {
      "tools": [
        "Polystyrene cup containing water",
        "High-power immersion heater",
        "High-precision electronic balance",
        "Joulemeter",
        "Anti-splash tray and clamp stand"
      ],
      "steps": [
        "Place the water-filled polystyrene cup on the electronic balance, and suspend the immersion heater wholly in the water without touching the bottom or sides of the cup.",
        "Switch on the power until the water boils vigorously at a constant 100 °C; once boiling is steady, simultaneously reset the joulemeter and record the initial mass m₁.",
        "Allow the water to boil away for a period of time, then record the joulemeter reading E and final mass m₂ directly to calculate the mass of water boiled away Δm = m₁ - m₂.",
        "Collect multiple sets of (Δm, E) data over different heating durations and plot the E - Δm graph to find the specific latent heat of vaporization l_v of water."
      ],
      "why": "The specific latent heat of vaporization (l_v) is the energy required to change 1 kg of a liquid completely into gas without a change in temperature, given by E = Δm · l_v. When water boils at 100 °C, the energy supplied by the heater no longer increases the average kinetic energy of the water molecules (hence temperature stays constant); instead, it is entirely used to overcome the intermolecular attractive forces between water molecules, allowing liquid water to escape as steam and increasing the molecular potential energy.",
      "findings": "During boiling, the 'Temperature vs. Time (T - t) graph' is a horizontal line (zero slope), while the 'Energy supplied vs. Mass boiled away (E - Δm) graph' is a straight line with a slope equal to the specific latent heat of vaporization (Slope = ΔE / Δ(Δm) = l_v). Two classic systematic errors are tested in the HKDSE: first, steam condensing on the upper part of the heater and dripping back into the cup makes the measured Δm smaller than actual, yielding a calculated l_v that is too large; second, boiling water splashing out of the cup makes the measured Δm larger, yielding a calculated l_v that is too small."
    }
  },
  "hooke": {
    "zh": {
      "tools": [
        "螺旋彈簧 (Helical Spring)",
        "帶掛鉤的槽碼（砝碼組）",
        "附水平指針的定位標記",
        "垂直固定米尺",
        "鐵架台與夾具"
      ],
      "steps": [
        "將螺旋彈簧垂直懸掛在鐵架台上，調整米尺位置使水平指針正對刻度，記錄彈簧未掛載時的原長 l₀。",
        "逐一拖動砝碼掛在彈簧底部，待彈簧停止上下振動並靜止後，平視指針讀取總長度 l 並計算伸長量 x = l - l₀。",
        "每次增加砝碼後點擊「卸載檢查」，確認移除砝碼後彈簧能完全恢復原長 l₀（確保未超出彈性限度）。",
        "根據懸掛重量 F = mg 與伸長量 x 生成 F - x 圖象，並可切換過載模式觀察超出彈性限度後的曲線變化。"
      ],
      "why": "根據胡克定律 (Hooke's Law)，在彈性限度 (Elastic Limit) 內，彈簧所受的拉力（或恢復力）F 與其伸長量（或壓縮量）x 成正比，公式為 F = kx，其中 k 為彈簧的力常數（或彈簧常數，單位為 N m⁻¹），反映彈簧的軟硬程度（剛度）。當外力拉伸彈簧時，外力所作的功轉化為儲存在彈簧內的彈性勢能 (Elastic Potential Energy)，計算公式為 E_p = ½Fx = ½kx²。",
      "findings": "在彈性限度內，F - x 圖象是一條穿過原點的直線，其斜率 (Slope = ΔF / Δx = k) 即為彈簧的力常數 k（雙重串聯彈簧斜率減半，並聯則斜率加倍）；而圖線與橫軸（伸長量軸）所圍成的三角形面積 (Area = ½Fx) 則代表彈簧儲存的彈性勢能。一旦拉力過大超越彈性限度，圖象會向下彎曲偏離直線，彈簧發生永久塑性形變，卸載後無法回到原點。"
    },
    "en": {
      "tools": [
        "Helical spring",
        "Slotted weights with hanger",
        "Horizontal pointer (Fiducial marker)",
        "Vertically mounted half-metre rule",
        "Retort stand and clamp"
      ],
      "steps": [
        "Suspend the helical spring vertically from the retort stand, align the metre rule with the horizontal pointer, and record the original unstretched length l₀.",
        "Drag slotted weights onto the bottom of the spring one by one; once the spring stops oscillating, read the total length l at eye level to avoid parallax error and calculate the extension x = l - l₀.",
        "Click 'Unload Check' after each addition to verify that the spring returns completely to its original length l₀ when unloaded (ensuring the elastic limit is not exceeded).",
        "Plot the F - x graph using the stretching force F = mg and extension x, and toggle the overload mode to observe how the curve behaves beyond the elastic limit."
      ],
      "why": "According to Hooke's Law, within the elastic limit, the tension (or restoring force) F of a spring is directly proportional to its extension (or compression) x, expressed as F = kx, where k is the force constant (or spring constant, in N m⁻¹), which measures the stiffness of the spring. When an external force stretches the spring, the work done is stored as elastic potential energy (E_p) inside the spring, given by E_p = ½Fx = ½kx².",
      "findings": "Within the elastic limit, the F - x graph is a straight line passing through the origin, where the slope (Slope = ΔF / Δx = k) represents the force constant k (connecting two identical springs in series halves the slope, while connecting them in parallel doubles the slope). The area under the F - x graph (Area = ½Fx) represents the elastic potential energy stored in the spring. Once the stretching force exceeds the elastic limit, the graph bends downwards away from linearity; the spring undergoes permanent plastic deformation and fails to return to the origin upon unloading."
    }
  },
  "ohm": {
    "zh": {
      "tools": [
        "待測康銅金屬絲（與可切換鎢絲燈泡）",
        "直流可調電源與開關",
        "安培計 (Ammeter) 與伏特計 (Voltmeter)",
        "滑動變阻器 (Rheostat)",
        "連接導線"
      ],
      "steps": [
        "按照電路圖將電源、開關、滑動變阻器、安培計與待測金屬絲串聯，並將伏特計並聯在待測元件兩端。",
        "閉合開關前先將滑動變阻器的滑片拖動至最大阻值端以保護電路，隨後閉合開關記錄初始電壓 V 與電流 I。",
        "逐步拖動滑動變阻器滑片以改變待測元件兩端的電勢差，讀取並記錄 6 組不同的 (V, I) 數據。",
        "在面板切換待測元件為「鎢絲燈泡」，重複上述步驟並對比兩者的 I - V（或 V - I）特性曲線。"
      ],
      "why": "根據歐姆定律 (Ohm's Law)，在溫度及其他物理條件保持不變時，流經金屬導體的電流 I 與其兩端的電勢差（電壓）V 成正比，公式為 V = IR，其中 R 為導體的電阻。對於均勻金屬絲，其電阻還遵循 R = ρl / A（與長度 l 成正比，與橫截面積 A 成反比）。微觀上，當金屬溫度升高時，金屬正離子的晶格熱振動加劇，自由電子定向移動時與離子碰撞的頻率增加，導致電阻 R 增大。",
      "findings": "恆溫金屬絲屬於「歐姆導體 (Ohmic Conductor)」，其 V - I 圖象是穿過原點的直線，斜率等於電阻 R。若換成鎢絲燈泡（非歐姆導體），隨着電流增大，燈絲溫度大幅升高導致電阻增加：在 V - I 圖象上曲線斜率會隨電流增加而變陡；若繪製成 I - V 圖象，曲線斜率則會隨電壓增加而減小。需注意 DSE 必考概念：非歐姆元件在某一點的實際電阻 R 必須用該點的坐標比值 (V / I) 計算，而不能直接取曲線在該點的切線斜率！"
    },
    "en": {
      "tools": [
        "Constantan wire under test (switchable to tungsten filament lamp)",
        "DC variable power supply and switch",
        "Ammeter and Voltmeter",
        "Rheostat (Variable resistor)",
        "Connecting leads"
      ],
      "steps": [
        "Connect the power supply, switch, rheostat, ammeter, and constantan wire in series according to the circuit diagram, and connect the voltmeter in parallel across the component under test.",
        "Before closing the switch, drag the rheostat slider to its maximum resistance position to protect the circuit, then close the switch and record the initial voltage V and current I.",
        "Gradually move the rheostat slider to vary the potential difference across the component, reading and recording 6 sets of (V, I) data.",
        "Switch the component to the 'Tungsten Filament Lamp' on the panel, repeat the measurements, and compare the I - V (or V - I) characteristic curves of both components."
      ],
      "why": "According to Ohm's Law, provided that temperature and other physical conditions remain constant, the current I flowing through a metallic conductor is directly proportional to the potential difference (voltage) V across its ends, given by V = IR, where R is the resistance. For a uniform wire, resistance follows R = ρl / A (proportional to length l and inversely proportional to cross-sectional area A). Microscopically, as temperature rises, the thermal lattice vibrations of positive metal ions intensify, increasing the collision frequency between drifting free electrons and ions, which increases resistance R.",
      "findings": "A constantan wire at constant temperature is an 'Ohmic Conductor', producing a straight-line V - I graph through the origin with a slope equal to resistance R. For a tungsten filament lamp (non-ohmic conductor), increasing the current heats up the filament significantly and increases its resistance: on a V - I graph, the curve becomes steeper as current increases; on an I - V graph, the slope decreases as voltage increases. Crucial HKDSE concept: the actual resistance R of a non-ohmic component at a specific point must be calculated from the coordinate ratio (V / I) at that point, NOT from the tangent slope of the curve!"
    }
  },
  "snell": {
    "zh": {
      "tools": [
        "半圓形透明玻璃磚 (Semi-circular Glass Block)",
        "單束激光光線箱 (Ray Box)",
        "360° 全圓量角器刻度盤",
        "可切換介質材質庫（水、亞加力膠、鑽石）",
        "光強探測器"
      ],
      "steps": [
        "將半圓形玻璃磚平放在量角器中央，確保其平直邊與 90° - 270° 基準線重合，且圓心正對量角器中心 O 點。",
        "拖動光線箱從空氣一側對準圓心 O 點射入平直邊，由 15° 開始逐步增大入射角 θ₁，點擊記錄對應的折射角 θ₂。",
        "計算每組數據的 sin θ₁ 與 sin θ₂，在圖表面板生成 sin θ₁ - sin θ₂ 線性圖象。",
        "將光線箱拖動至玻璃磚的弧形邊一側（光由光密介質射向空氣），對準圓心 O 點慢慢增大入射角，觀察全內反射現象並記錄臨界角 C。"
      ],
      "why": "光從一種介質斜射入另一種光學密度不同的介質時，由於傳播速率 v 發生改變 (n = c / v)，光線會改變傳播方向，遵循斯涅耳定律 (Snell's Law)：n₁ sin θ₁ = n₂ sin θ₂。當光從空氣 (n₁ ≈ 1) 射入折射率為 n 的玻璃時，公式簡化為 n = sin θ₁ / sin θ₂。實驗選用半圓形玻璃磚並對準圓心入射，是因為光線在進出圓弧邊界時必定沿着半徑（即法線方向）傳播，在圓弧面不會發生二次偏折。",
      "findings": "實驗繪出的 sin θ₁ - sin θ₂ 圖象是一條穿過原點的直線（注意：θ₁ - θ₂ 圖象並非直線），其斜率 (Slope = sin θ₁ / sin θ₂) 即為玻璃磚的折射率 n。當光由玻璃射向空氣（光密射向光疏）且入射角超過臨界角 C (sin C = 1 / n) 時，折射光線完全消失，所有光能均被反射回玻璃內部，發生「全內反射 (Total Internal Reflection)」。介質的折射率 n 越大，其臨界角 C 越小，越容易發生全內反射。"
    },
    "en": {
      "tools": [
        "Semi-circular glass block",
        "Single-beam laser ray box",
        "360° full-circle protractor scale",
        "Switchable medium library (Water, Perspex, Diamond)",
        "Light intensity detector"
      ],
      "steps": [
        "Place the semi-circular glass block at the centre of the protractor, aligning its flat edge with the 90° - 270° baseline and its centre of curvature exactly at the origin O.",
        "Drag the ray box on the air side to direct a light ray at the centre O on the flat edge; increase the angle of incidence θ₁ in steps from 15° and record the corresponding angle of refraction θ₂.",
        "Calculate sin θ₁ and sin θ₂ for each data pair and generate the linear sin θ₁ - sin θ₂ graph on the chart panel.",
        "Drag the ray box to the curved side of the block (light travelling from an optically denser medium to air), aim at centre O, and slowly increase the angle of incidence to observe Total Internal Reflection and measure the critical angle C."
      ],
      "why": "When light travels obliquely from one medium into another of different optical density, its direction changes because its speed of propagation v changes (n = c / v), obeying Snell's Law: n₁ sin θ₁ = n₂ sin θ₂. For light travelling from air (n₁ ≈ 1) into glass of refractive index n, this simplifies to n = sin θ₁ / sin θ₂. Aiming the ray at the centre O of a semi-circular block ensures that light enters or leaves the curved boundary along the radius (i.e. along the normal, angle of incidence = 0°), preventing any secondary refraction at the curved surface.",
      "findings": "The plotted sin θ₁ - sin θ₂ graph is a straight line passing through the origin (note that a θ₁ - θ₂ graph is a curve, not a straight line), and its slope (Slope = sin θ₁ / sin θ₂) equals the refractive index n of the glass block. When light travels from glass into air (optically denser to less dense medium) and the angle of incidence exceeds the critical angle C (where sin C = 1 / n), the refracted ray disappears completely and all light energy is reflected back into the glass, resulting in 'Total Internal Reflection (TIR)'. A higher refractive index n gives a smaller critical angle C."
    }
  },
  "pendulum": {
    "zh": {
      "tools": [
        "高密度金屬擺錘 (Pendulum Bob)",
        "不可伸長輕質細繩",
        "帶夾具與米尺的鐵架台",
        "基準定位標記針 (Fiducial Marker)",
        "毫秒級數碼秒錶與光電門"
      ],
      "steps": [
        "調節細繩長度，用米尺測量從懸掛點到擺錘重心（球心）的垂直距離作為擺長 L，並將基準標記針放置在平衡位置正下方。",
        "將擺錘側向拉開一個小角度（必須小於 10°）後靜止釋放，確保單擺在單一垂直平面內擺動而不發生圓錐擺動。",
        "當擺錘經過平衡位置基準針時點擊秒錶開始計時，測量完成 20 次完整擺動的總時間 t，除以 20 得出單次擺動週期 T。",
        "改變擺長 L 重複實驗，在數據面板生成 T - L 曲線及線性化的 T² - L 圖象以求取重力加速度 g。"
      ],
      "why": "單擺在小角度擺動（θ < 10°）時可視為簡諧運動 (Simple Harmonic Motion)，其擺動週期 T 由公式 T = 2π√(L / g) 決定，兩邊平方後可得線性關係式：T² = (4π² / g) L。在擺動過程中，擺錘的重力勢能 (E_p = mgh) 與動能 (E_k = ½mv²) 不斷相互轉化：在兩端最高點處速度為零、勢能最大；經過平衡位置最低點時勢能最小、動能及速率達到最大。由公式可見，單擺週期 T 僅取決於擺長 L 與當地重力加速度 g，而與擺錘質量 m 無關。",
      "findings": "T - L 圖象呈現拋物線分支，而「週期平方 - 擺長 (T² - L) 圖象」則是一條穿過原點的直線。該直線的斜率為 Slope = Δ(T²) / ΔL = 4π² / g，由此可精確推算出實驗室的重力加速度 g = 4π² / Slope。DSE 實驗題必考兩個防誤差操作：第一，計時基準針必須設在「平衡位置（最低點）」，因為此處擺錘速率最快，視覺判斷經過瞬間的時間誤差最小；第二，測量 20 個週期求平均值可大幅減小人手按錶的反應時間誤差。"
    },
    "en": {
      "tools": [
        "High-density metal pendulum bob",
        "Light inextensible string",
        "Retort stand with clamp and metre rule",
        "Fiducial marker (Reference pin)",
        "Digital stopwatch and light gate"
      ],
      "steps": [
        "Adjust the string length, measure the vertical distance from the point of suspension to the centre of gravity of the bob as the pendulum length L, and place the fiducial marker directly below the equilibrium position.",
        "Displace the bob sideways by a small angle (must be less than 10°) and release it from rest, ensuring it swings in a single vertical plane without conical motion.",
        "Start the stopwatch as the bob passes the fiducial marker at the equilibrium position, measure the total time t for 20 complete oscillations, and divide by 20 to find the period T.",
        "Repeat the experiment for different lengths L, then plot both the T - L curve and the linearized T² - L graph to determine the acceleration due to gravity g."
      ],
      "why": "For small angles of oscillation (θ < 10°), a simple pendulum performs Simple Harmonic Motion (SHM) with a period T given by T = 2π√(L / g). Squaring both sides yields the linear equation T² = (4π² / g) L. During the swing, gravitational potential energy (E_p = mgh) and kinetic energy (E_k = ½mv²) continuously interconvert: at the extreme highest points, speed is zero and E_p is maximum; at the lowest equilibrium position, E_p is minimum while E_k and speed reach their maximum. The period T depends only on the length L and gravitational acceleration g, and is independent of the mass m of the bob.",
      "findings": "While the T - L graph is a curve, the 'Period squared vs. Length (T² - L) graph' is a straight line passing through the origin. Its slope is given by Slope = Δ(T²) / ΔL = 4π² / g, allowing accurate calculation of the acceleration due to gravity g = 4π² / Slope. Two essential HKDSE experimental precautions: first, place the fiducial marker at the 'equilibrium position (lowest point)' where the bob moves fastest, minimizing timing uncertainty when judging the exact moment of passage; second, time 20 oscillations and find the average to reduce human reaction time error."
    }
  },
  "projectile": {
    "zh": {
      "tools": [
        "可調角度與初速的彈射器 (Launcher)",
        "鋼珠與可開關空氣阻力模擬場",
        "發射口光電門測速儀 (Light Gate)",
        "3D 頻閃軌跡追蹤器 (Stroboscopic Tracker)",
        "水平距離與高度測量標尺"
      ],
      "steps": [
        "將彈射器固定在地面高度，拖動角度轉盤設定發射仰角 θ（如 30°、45°、60°），並鎖定彈簧壓縮檔位以固定初速 u。",
        "點擊發射按鈕，透過發射口的光電門自動讀取初速 u，並開啟 3D 頻閃追蹤器記錄鋼珠每隔 0.1 s 的空間位置。",
        "分別切換至「水平正視圖」與「垂直側視圖」，觀察水平分運動與垂直分運動的頻閃間距變化。",
        "固定初速 u 並改變不同仰角 θ 重複發射，記錄水平射程 R、最大高度 H 及飛行時間 t，查看 v_y - t 及 v_x - t 圖象。"
      ],
      "why": "拋體運動 (Projectile Motion) 的核心是「運動的獨立性原理」：在忽略空氣阻力的情況下，拋體在水平方向不受外力（a_x = 0），作勻速直線運動，位移公式為 s_x = (u cos θ)t；在垂直方向則僅受重力作用（加速度恆為 g 向下），作勻變速直線運動，位移公式為 s_y = (u sin θ)t - ½gt²，垂直速度為 v_y = u sin θ - gt。兩個方向的運動互不干擾，但共享相同的飛行時間 t，合運動軌跡為一條拋物線。",
      "findings": "頻閃照片顯示水平方向的相鄰球影間距相等（水平速度 v_x 恆定），垂直方向間距則先減小後增大。在「垂直速度 - 時間 (v_y - t) 圖象」中，圖線是一條斜率恆為 -g (-9.81 m s⁻²) 的直線，圖線與時間軸交點代表到達最高點的時刻（此時 v_y = 0，但合速度 v = u cos θ ≠ 0，加速度仍為 g 向下！）。在相同水平面發射時，仰角 θ = 45° 可獲得最大水平射程 R_max；而互餘仰角（如 30° 與 60°）在無空氣阻力下具有完全相同的水平射程。"
    },
    "en": {
      "tools": [
        "Adjustable-angle projectile launcher",
        "Steel ball with toggleable air resistance field",
        "Muzzle light gate speed sensor",
        "3D stroboscopic trajectory tracker",
        "Horizontal range and height measuring scales"
      ],
      "steps": [
        "Fix the launcher at ground level, drag the angle dial to set the launch angle θ (e.g., 30°, 45°, 60°), and lock the spring compression setting to maintain a constant initial speed u.",
        "Click the launch button to measure the initial speed u automatically via the light gate, and enable the 3D stroboscopic tracker to record the ball's position every 0.1 s.",
        "Switch between the 'Horizontal Top View' and 'Vertical Side View' to compare the stroboscopic spacing of the horizontal and vertical component motions.",
        "Keep the initial speed u constant while launching at various angles θ, recording the horizontal range R, maximum height H, and time of flight t, and inspect the v_y - t and v_x - t graphs."
      ],
      "why": "The core principle of Projectile Motion is the 'Independence of Horizontal and Vertical Motions': neglecting air resistance, the projectile experiences no horizontal net force (a_x = 0) and undergoes uniform motion with horizontal displacement s_x = (u cos θ)t. Vertically, it is acted upon only by gravity (constant downward acceleration g) and undergoes uniformly accelerated motion with s_y = (u sin θ)t - ½gt² and vertical velocity v_y = u sin θ - gt. Both motions occur independently while sharing the same time of flight t, combining to form a parabolic trajectory.",
      "findings": "Stroboscopic positions show equal horizontal spacing between adjacent images (constant horizontal velocity v_x = u cos θ), while vertical spacing decreases on the way up and increases on the way down. The 'Vertical velocity vs. Time (v_y - t) graph' is a straight line with a constant slope of -g (-9.81 m s⁻²); its x-intercept marks the instant the projectile reaches its highest point (where v_y = 0, but resultant speed is v = u cos θ ≠ 0 and acceleration is still g downwards!). When launched across level ground, a launch angle of θ = 45° gives the maximum horizontal range R_max, while complementary angles (such as 30° and 60°) yield the exact same horizontal range."
    }
  },
  "conduction": {
    "zh": {
      "tools": [
        "四合一導熱金屬架（銅、鋁、鐵、玻璃棒）",
        "恆溫電熱水槽（中心熱源）",
        "感溫變色液晶貼（或凡士林與圖釘）",
        "紅外線熱成像視角切換器",
        "數碼秒錶"
      ],
      "steps": [
        "將長度與粗細完全相同的銅棒、鋁棒、鐵棒及玻璃棒插入恆溫水槽側壁，確保各棒的一端同時接觸中心熱源。",
        "在每根長棒表面每隔 2 cm 黏貼感溫圖釘（用凡士林固定），或開啟 3D 感溫變色塗層模式。",
        "點擊注水加熱開關並啟動秒錶，觀察各根長棒上圖釘依次掉落的先後順序與變色推進速率。",
        "切換至「微觀粒子視角」，放大觀察金屬棒內自由電子運動與玻璃棒內原子晶格振動的差異。"
      ],
      "why": "熱傳導 (Conduction) 是物體在不發生宏觀位移的情況下，由高溫區域向低溫區域傳遞熱能的過程。在非金屬（如玻璃、木頭）中，熱傳導僅靠相鄰原子或分子的「晶格振動 (Lattice Vibration)」逐層碰撞傳遞，過程十分緩慢；而在金屬（如銅、鋁）中，除了晶格振動外，還存在大量可自由移動的「自由電子 (Free Electrons)」，受熱後的自由電子獲得極高動能並迅速向冷端擴散，與遠處的離子碰撞傳遞能量，使金屬成為極佳的熱導體。",
      "findings": "實驗清楚顯示圖釘掉落（或熱溫區推進）的快慢順序依次為：銅 > 鋁 > 鐵 >> 玻璃，證明金屬的導熱性能遠高於非金屬。若繪製棒上不同位置的「溫度 - 距離 (T - x) 圖象」，導熱率越高的材質在熱平衡前的溫度梯度越平緩。DSE 實驗設計常考「公平測試 (Fair Test)」條件：四根長棒的長度、橫截面積（粗細）以及表面的初始塗層必須完全相同，否則無法單純比較材質本身的導熱能力。"
    },
    "en": {
      "tools": [
        "Four-rod conduction apparatus (Copper, Aluminium, Iron, Glass rods)",
        "Thermostatic hot water tank (central heat source)",
        "Thermochromic liquid crystal strips (or Vaseline and drawing pins)",
        "Infrared thermal imaging view switcher",
        "Digital stopwatch"
      ],
      "steps": [
        "Insert the copper, aluminium, iron, and glass rods of identical length and diameter into the side of the hot water tank so that one end of each rod touches the central heat source simultaneously.",
        "Attach drawing pins at 2 cm intervals along each rod using equal amounts of Vaseline (or enable the 3D thermochromic colour-changing coating mode).",
        "Click to fill the tank with boiling water and start the stopwatch, observing the order in which the pins drop and the speed of colour progression along each rod.",
        "Switch to the 'Microscopic Particle View' to zoom in and compare free electron diffusion in metals against atomic lattice vibrations in glass."
      ],
      "why": "Conduction is the transfer of thermal energy from a hotter region to a colder region without net macroscopic movement of the medium itself. In non-metals (insulators like glass or wood), conduction occurs solely through 'Lattice Vibration', where vibrating atoms pass kinetic energy slowly to neighbouring atoms via collisions. In metals (like copper and aluminium), in addition to lattice vibration, there is a vast number of mobile 'Free Electrons'; when heated, these free electrons gain kinetic energy and diffuse rapidly towards the cooler end, colliding with distant atoms and making metals good conductors of heat.",
      "findings": "The experiment demonstrates that the rate of heat conduction follows the order: Copper > Aluminium > Iron >> Glass, proving that metals have much higher thermal conductivity than non-metals. On a 'Temperature vs. Distance (T - x) graph' along the rod, a material with higher thermal conductivity exhibits a gentler temperature gradient. In HKDSE experimental design questions, 'Fair Test' conditions are essential: all rods must have the exact same length, cross-sectional area (thickness), and initial amount of Vaseline to validly compare thermal conductivity across different materials."
    }
  },
  "convection": {
    "zh": {
      "tools": [
        "盛水透明燒杯（及可切換環形對流管）",
        "可移動本生燈熱源",
        "高錳酸鉀紫晶粒（及 3D 流體示蹤粒子）",
        "雙通道數碼溫度感應器",
        "鐵架台与隔熱石棉網"
      ],
      "steps": [
        "用鑷子拖動一顆高錳酸鉀紫晶粒（或開啟流體速度矢量粒子），輕輕放置在燒杯底部的一側邊緣。",
        "拖動本生燈至晶粒正下方的燒杯底部，點擊點火開關進行局部加熱。",
        "自由旋轉 3D 視角，觀察紫色水流受熱膨脹上升、在頂部冷卻後於另一側下沉的循環流動路徑。",
        "嘗試將熱源拖動至燒杯頂部邊緣加熱，對比觀察示蹤粒子的運動變化以及上下層溫度曲線的差異。"
      ],
      "why": "熱對流 (Convection) 是流體（液體或氣體）特有的熱傳遞機制，其核心物理原理源於流體受熱不均所導致的密度變化（密度公式 ρ = m / V）。當底部的水受熱時，質量 m 不變但體積 V 膨脹，導致局部熱水的密度 ρ 減小；由於熱水的密度小於周圍冷水，熱水受到浮力作用向上浮起，而上方密度較大的冷水則受重力作用流下填補空缺，周而復始便形成了傳遞熱能的「對流流 (Convection Current)」。",
      "findings": "實驗證明熱量能隨着流體的宏觀循環移動，迅速從底部傳遞至整個水體。若觀察上下兩處感應器的「溫度 - 時間 (T - t) 圖象」，其斜率 (Slope = ΔT / Δt) 代表水體的升溫速率：底部加熱時，頂層與底層的 T - t 圖象斜率均較大且數值接近，反映對流傳熱極快；若改為頂部加熱，底層 T - t 圖象的斜率幾乎為零，因為熱水密度小會停留在頂層無法下沉形成對流，且水本身是熱的不良導體。這直接解釋了電水壺發熱管必裝在底部、冷氣機必裝在高處的 DSE 常考應用。"
    },
    "en": {
      "tools": [
        "Transparent beaker of water (switchable to rectangular convection tube)",
        "Movable Bunsen burner heat source",
        "Potassium permanganate crystals (and 3D fluid tracer particles)",
        "Dual-channel digital temperature sensors",
        "Retort stand and wire gauze"
      ],
      "steps": [
        "Use tweezers to drag a purple crystal of potassium permanganate (or enable 3D velocity tracer particles) and place it gently at one side of the bottom of the beaker.",
        "Drag the Bunsen burner directly beneath the crystal at the bottom of the beaker and click ignite to apply localized heating.",
        "Rotate the 3D camera freely to observe the circulation path as the purple-dyed warm water expands and rises, cools near the top, and sinks down the opposite side.",
        "Move the heat source to heat the top edge of the water instead, comparing the tracer particle movement and the temperature curves at the top and bottom layers."
      ],
      "why": "Convection is a mode of heat transfer unique to fluids (liquids and gases), driven by density differences caused by uneven heating (density formula ρ = m / V). When water at the bottom is heated, its mass m stays constant while its volume V expands, reducing the density ρ of the warm water. Being less dense than the surrounding cooler water, the warm water rises due to buoyancy, while denser cooler water from above sinks under gravity to take its place, establishing a continuous circulation known as a 'Convection Current'.",
      "findings": "The experiment shows that thermal energy is rapidly transferred throughout the entire fluid via macroscopic circulation. On the 'Temperature vs. Time (T - t) graph' from the upper and lower sensors, the slope (Slope = ΔT / Δt) represents the rate of temperature rise: when heated from the bottom, both top and bottom sensors show steep, similar slopes due to rapid convection. When heated near the top, the bottom sensor's T - t slope is nearly zero because less dense warm water stays at the top without forming a convection current, and water itself is a poor conductor of heat. This explains why heating elements in electric kettles are placed at the bottom while air-conditioners are installed high up near the ceiling."
    }
  },
  "radiation": {
    "zh": {
      "tools": [
        "萊斯利方盒 (Leslie's Cube：含暗黑、亮銀、暗白表面)",
        "紅外線輻射感應器 (IR Sensor / 熱電堆)",
        "黑面與銀面雙溫差吸收金屬板",
        "高強度白熾紅外線加熱燈",
        "數碼溫度記錄儀"
      ],
      "steps": [
        "發射實驗：向萊斯利方盒注入沸水使其四面保持相同高溫，將紅外線輻射感應器依次移至距離各表面相同距離（如 5 cm）處，記錄輻射強度讀數。",
        "吸收實驗：切換至「輻射吸收場景」，將暗啞黑色金屬板與光亮銀色金屬板對稱放置在紅外線加熱燈兩側相同距離處。",
        "開啟中央加熱燈，即時觀察兩塊金屬板背後的數碼溫度計讀數變化。",
        "在圖表面板對比暗黑表面與亮銀表面在加熱（吸收）及冷卻（發射）過程中的 T - t 圖象。"
      ],
      "why": "熱輻射 (Radiation) 是以電磁波（主要是紅外線）形式傳遞熱能的過程，不依賴任何物質介質，可在真空中以光速 c (3 × 10⁸ m s⁻¹) 傳播。所有溫度高於絕對零度的物體都在不斷發射和吸收熱輻射，其發射與吸收效率取決於物體的「表面溫度」、「表面面積」以及「表面顏色與粗糙度」：暗啞黑色表面 (Dull Black Surface) 既是最好的熱輻射吸收體，也是最好的熱輻射發射體；而光亮銀色表面 (Shiny Silvery Surface) 則容易反射輻射，是極差的吸收體與發射體。",
      "findings": "在萊斯利方盒實驗中，即使四個表面溫度完全相同，紅外線感應器在暗啞黑色表面測得的輻射強度遠高於光亮銀色表面。在吸收與冷卻的「溫度 - 時間 (T - t) 圖象」中，曲線斜率 |ΔT / Δt| 代表吸熱或放熱速率：光照加熱時，暗黑金屬板的 T - t 圖象斜率顯著較大（升溫更快）；移走熱源自然冷卻時，暗黑表面的冷卻曲線向下傾斜也更陡峭（降溫更快）。因此保溫瓶內膽鍍銀是為了同時減少熱輻射的吸收與發射。"
    },
    "en": {
      "tools": [
        "Leslie's Cube (with dull black, shiny silvery, and matte white faces)",
        "Infrared radiation sensor (Thermopile)",
        "Dull black and shiny silvery absorption metal plates",
        "High-intensity radiant heater lamp",
        "Digital temperature data logger"
      ],
      "steps": [
        "Emission test: Fill Leslie's Cube with boiling water so all four vertical faces are at the same high temperature, then position the IR sensor at an equal distance (e.g., 5 cm) from each face in turn and record the radiation intensity.",
        "Absorption test: Switch to the 'Radiation Absorption Setup' and place the dull black plate and shiny silvery plate symmetrically at equal distances on either side of the radiant heater.",
        "Switch on the central heater lamp and observe the real-time temperature readings behind both metal plates.",
        "Compare the T - t graphs of the dull black and shiny silvery surfaces during both heating (absorption) and cooling (emission) on the chart panel."
      ],
      "why": "Thermal radiation is the transfer of heat in the form of electromagnetic waves (primarily infrared radiation), which requires no medium and travels through a vacuum at the speed of light c (3 × 10⁸ m s⁻¹). Every object above absolute zero continuously emits and absorbs thermal radiation at a rate dependent on its surface temperature, surface area, and surface nature: a 'Dull Black Surface' is both a good absorber and a good emitter of radiation, whereas a 'Shiny Silvery Surface' reflects most incident radiation, making it a poor absorber and a poor emitter.",
      "findings": "In the Leslie's Cube experiment, although all faces are at the exact same temperature, the IR sensor detects a much higher radiation intensity from the dull black face than from the shiny silvery face. On the 'Temperature vs. Time (T - t) graphs', the magnitude of the slope |ΔT / Δt| represents the rate of heat absorption or emission: under radiant heating, the dull black plate exhibits a steeper positive slope (heats up faster); when cooling in air, a blackened container also shows a steeper negative slope (cools down faster). Consequently, vacuum flasks use silvered glass walls to minimize heat transfer via radiation."
    }
  },
  "greenhouse": {
    "zh": {
      "tools": [
        "密封玻璃模擬大氣艙",
        "太陽短波輻射模擬光源",
        "二氧化碳 (CO₂) 濃度調節充氣閥",
        "艙內地表溫度計與紅外線長波探測器",
        "光子波長可視化濾鏡"
      ],
      "steps": [
        "設定大氣艙內為標準空氣成分，開啟太陽模擬光源照射艙底深色地表，觀察艙內溫度上升直至達到穩定恆溫（輻射平衡）。",
        "開啟「光子波長可視化濾鏡」，觀察入射的高頻短波輻射與地表發射的低頻長波紅外線。",
        "拖動充氣閥滑桿向艙內注入二氧化碳以提高溫室氣體濃度，觀察紅外線光子被氣體分子吸收並向四方重新發射的過程。",
        "記錄不同 CO₂ 濃度下的溫度變化曲線 (T - t 圖象)，對比最終達到的新平衡溫度。"
      ],
      "why": "溫室效應 (Greenhouse Effect) 的核心原理在於電磁波譜的選擇性吸收與「輻射平衡 (Radiative Equilibrium)」。太陽表面溫度極高，發出的能量主要集中在可見光與短波紅外線（短波輻射），能輕易穿透大氣層並被地球表面吸收；地表受熱後溫度較低，向外發射的是波長較長的紅外線（長波輻射）。大氣中的溫室氣體（如 CO₂、水蒸氣、甲烷）對短波輻射幾乎透明，但能強烈吸收地表發出的長波紅外線，並將部分能量重新向地面各方向輻射，從而減少地球散失到太空的淨熱量。",
      "findings": "在「溫度 - 時間 (T - t) 圖象」中，初始階段太陽輸入功率大於地球散熱功率，斜率 ΔT / Δt > 0（溫度上升）；隨着地表溫度升高，向外發射的紅外輻射功率隨之增大，當「吸收功率 = 散失功率」時，圖象斜率變為零，達到恆定的平衡溫度。當增加 CO₂ 濃度時，散失功率瞬間減小，打破原有平衡，T - t 曲線再次向上爬升，直至在更高的溫度下建立新的輻射平衡。這證明溫室氣體並非自己產生熱量，而是透過阻滯長波輻射散失來提高行星的平衡溫度。"
    },
    "en": {
      "tools": [
        "Sealed atmospheric simulation chamber",
        "Solar short-wave radiation simulator lamp",
        "Carbon dioxide (CO₂) concentration control valve",
        "Surface thermometer and long-wave IR detector",
        "Photon wavelength visualization filter"
      ],
      "steps": [
        "Set the chamber to standard air composition, switch on the solar simulator lamp to illuminate the dark surface at the bottom, and watch the temperature rise until it stabilizes at a constant equilibrium temperature.",
        "Enable the 'Photon Wavelength Filter' to distinguish incoming high-frequency short-wave solar radiation from outgoing low-frequency long-wave infrared radiation emitted by the surface.",
        "Drag the gas valve slider to inject CO₂ and increase greenhouse gas concentration, observing how long-wave infrared photons are absorbed and re-emitted in all directions.",
        "Record the temperature-time (T - t) curves under different CO₂ concentrations and compare the final equilibrium temperatures reached."
      ],
      "why": "The Greenhouse Effect is governed by wavelength-selective absorption across the electromagnetic spectrum and 'Radiative Equilibrium'. Because the Sun is extremely hot, it emits mainly visible light and short-wave infrared radiation, which easily penetrates the atmosphere and warms the Earth's surface. Being much cooler, the warmed Earth emits longer-wavelength infrared radiation (long-wave radiation). Greenhouse gases (such as CO₂, water vapour, and methane) are transparent to incoming short-wave radiation but strongly absorb outgoing long-wave infrared radiation, re-radiating part of the energy back towards the ground and reducing net heat loss to space.",
      "findings": "On the 'Temperature vs. Time (T - t) graph', initially the solar power absorbed exceeds the power radiated away, giving a positive slope ΔT / Δt > 0 (temperature rises). As surface temperature rises, the power of outgoing infrared radiation increases until 'Power Absorbed = Power Radiated', where the slope becomes zero and a constant equilibrium temperature is reached. Increasing CO₂ concentration reduces the rate of heat escaping to space, breaking the balance and causing the T - t curve to climb again until a higher equilibrium temperature is established."
    }
  },
  "wave": {
    "zh": {
      "tools": [
        "3D 透明水波槽 (Ripple Tank) 與投影屏",
        "可調頻率直線振子與雙球形點振源",
        "頻閃觀測器 (Stroboscope)",
        "淺水區亞加力膠墊塊",
        "可調寬度單縫與雙縫障礙板"
      ],
      "steps": [
        "開啟直線振子產生平面水波，調節頻閃觀測器頻率使水波圖樣在視野中「靜止」，用標尺測量相鄰亮紋（波峰）間距以得出波長 λ。",
        "折射實驗：拖動亞加力膠墊塊沉入水波槽底部形成淺水區，旋轉墊塊角度，觀察水波由深水區進入淺水區時的波長與方向變化。",
        "繞射實驗：移除墊塊並放入單縫障礙板，拖動滑桿改變縫寬 a（使其分別遠大於及接近波長 λ），觀察波穿過狹縫後的擴散程度。",
        "干涉實驗：切換為「雙球形相干點振源」，觀察水面上交錯出現的加強區（腹線）與相消區（節線），並移動探測點查看波程差。"
      ],
      "why": "水波槽實驗全面展示了波的四大基本特性（反射、折射、繞射、干涉）及通用波速公式 v = fλ。在水波槽底部的投影屏上，水波的波峰相當於凸透鏡會聚光線形成「亮紋」，波谷則發散光線形成「暗紋」。波的頻率 f 僅由振源決定，在傳播過程中保持不變；而水波波速 v 則取決於水深（深水區波速快，淺水區波速慢）。當兩列同頻率、恆定相位差的相干波相遇時，遵循波的疊加原理：波程差 Δd = nλ 處發生相長干涉（振幅最大），Δd = (n + ½)λ 處則發生相消干涉（水面平靜）。",
      "findings": "實驗驗證了 v - λ 圖象（在固定頻率 f 下）是一條斜率等於頻率 f 的穿過原點直線。當水波從深水區斜射入淺水區時，頻率 f 不變，但波速 v 與波長 λ 同時減小，波陣面偏向法線折射。在繞射實驗中，當狹縫寬度 a 減小至與波長 λ 相若 (a ≈ λ) 時，繞射最為顯著（水波呈半圓形散開），但波長與波速均保持不變。在雙源干涉實驗中，若提高振源頻率 f（導致波長 λ 減小），節線與腹線之間的夾角會變密（條紋間距減小）。"
    },
    "en": {
      "tools": [
        "3D transparent ripple tank and projection screen",
        "Variable-frequency straight dipper and twin spherical dippers",
        "Stroboscope",
        "Perspex block for creating a shallow water region",
        "Adjustable single-slit and double-slit barriers"
      ],
      "steps": [
        "Switch on the straight dipper to generate plane wavefronts, adjust the stroboscope frequency to 'freeze' the wave pattern on the screen, and measure the distance between adjacent bright fringes (wave crests) to find the wavelength λ.",
        "Refraction test: Drag the Perspex block into the tank to create a shallow region, rotate the block at an angle, and observe the change in wavelength and propagation direction as waves pass from deep to shallow water.",
        "Diffraction test: Remove the block, insert the single-slit barrier, and vary the slit width a (comparing a >> λ and a ≈ λ) to observe the degree of spreading of the waves after passing through the gap.",
        "Interference test: Switch to the 'Twin Spherical Dippers' (coherent sources) to observe alternating constructive (antinodal lines) and destructive (nodal lines) regions, and move the probe to inspect the path difference."
      ],
      "why": "The ripple tank demonstrates the four fundamental wave phenomena (reflection, refraction, diffraction, and interference) and the wave equation v = fλ. On the projection screen below the tank, wave crests act as converging lenses to form 'bright fringes', while troughs act as diverging lenses to form 'dark fringes'. Wave frequency f is determined solely by the vibrating source and remains unchanged during propagation, whereas water wave speed v depends on water depth (faster in deep water, slower in shallow water). When two coherent waves overlap, by the Principle of Superposition, constructive interference occurs where the path difference Δd = nλ, and destructive interference occurs where Δd = (n + ½)λ.",
      "findings": "At constant frequency f, the v - λ graph is a straight line through the origin with a slope equal to f. When water waves travel obliquely from deep into shallow water, frequency f remains constant while speed v and wavelength λ both decrease, bending the propagation direction towards the normal. In diffraction, narrowing the slit width a to match the wavelength (a ≈ λ) produces pronounced circular spreading without changing wavelength or speed. In two-source interference, increasing the source frequency f decreases the wavelength λ, causing the nodal and antinodal lines to become more closely spaced."
    }
  },
  "dimension": {
    "zh": {
      "tools": [
        "可自由縮放的 3D 幾何體（立方體、球體、不規則物塊）",
        "高精度游標卡尺 (Vernier Calipers) 與米尺",
        "溢水杯 (Displacement Can) 與量筒",
        "數碼電子天平",
        "量綱與尺度分析面板 (Dimensional Analyzer)"
      ],
      "steps": [
        "拖動游標卡尺測量規則立方體的邊長 L（精確至 0.01 cm），並將其放置在電子天平上讀取質量 m。",
        "拖動縮放滑桿將立方體的線性尺寸 L 依次放大為原來的 2 倍、3 倍、4 倍，點擊記錄對應的表面積 A、體積 V 與質量 m。",
        "切換為「不規則金屬石塊」，將其緩慢浸入裝滿水的溢水杯中，透過量筒讀取排開水的體積 V，結合天平質量計算密度 ρ。",
        "在分析面板切換查看 m - V、A - L² 及 V - L³ 圖象，檢驗物理公式的量綱一致性與幾何尺度定律。"
      ],
      "why": "物理學中的每一個物理量都具備特定的基本量綱（如長度 [L]、質量 [M]、時間 [T]），任何正確的物理方程兩邊必須滿足「量綱一致性」。在三維空間的幾何尺度關係 (Scaling Law) 中，當物體的線性尺寸 L 按比例放大 k 倍時，其表面積與長度的平方成正比 (A ∝ L²，放大 k² 倍)，而體積與質量則與長度的立方成正比 (V ∝ L³，放大 k³ 倍)。物質的密度定義為單位體積的質量，公式為 ρ = m / V（單位為 kg m⁻³ 或 g cm⁻³），是物質本身的固有屬性，不隨物體的幾何尺寸大小而改變。",
      "findings": "實驗數據顯示，對於同種均質材料，無論尺寸與形狀如何變化，其「質量 - 體積 (m - V) 圖象」始終是一條穿過原點的直線，斜率 (Slope = Δm / ΔV = ρ) 即為該物質的密度；若直線出現正 Y 軸截距，則代表天平在測量前未進行歸零校準（零點誤差）。同時，A - L 與 V - L 圖象均為非線性曲線，唯有通過量綱線性化轉換為「A - L²」及「V - L³」圖象時才會呈現穿過原點的直線。此外，隨着尺寸 L 增大，物體的「表面積與體積比 (A / V ∝ 1 / L)」會減小，這也解釋了為何體積越大的物體散熱越慢。"
    },
    "en": {
      "tools": [
        "Scalable 3D geometric solids (Cube, Sphere, Irregular stone)",
        "High-precision Vernier calipers and metre rule",
        "Displacement can (Eureka can) and measuring cylinder",
        "Digital electronic balance",
        "Dimensional and scaling analysis panel"
      ],
      "steps": [
        "Use the Vernier calipers to measure the side length L of the regular cube (accurate to 0.01 cm), and place it on the electronic balance to measure its mass m.",
        "Drag the scaling slider to enlarge the linear dimension L of the cube by factors of 2, 3, and 4, recording the corresponding surface area A, volume V, and mass m.",
        "Switch to the 'Irregular Metal Stone', lower it slowly into the water-filled displacement can, measure the volume V of displaced water in the measuring cylinder, and calculate its density ρ.",
        "Toggle between the m - V, A - L², and V - L³ graphs on the analysis panel to verify dimensional consistency and geometric scaling laws."
      ],
      "why": "Every physical quantity possesses fundamental dimensions (such as Length [L], Mass [M], and Time [T]), and any valid physical equation must be dimensionally consistent on both sides. By geometric scaling laws in 3D space, when the linear dimension L of an object is scaled up by a factor of k, its surface area scales with the square of length (A ∝ L², increasing by k²), while its volume and mass scale with the cube of length (V ∝ L³, increasing by k³). Density is defined as mass per unit volume, ρ = m / V (in kg m⁻³ or g cm⁻³), which is an intrinsic property of a material independent of the object's size or shape.",
      "findings": "For a homogeneous material, regardless of its size or shape, the 'Mass vs. Volume (m - V) graph' is always a straight line passing through the origin, where the slope (Slope = Δm / ΔV = ρ) gives the density of the material; a non-zero y-intercept indicates a zero error on the electronic balance. Meanwhile, the A - L and V - L graphs are non-linear curves that only become straight lines through the origin when linearized via dimensional analysis into 'A - L²' and 'V - L³' graphs. Furthermore, as linear size L increases, the 'surface-area-to-volume ratio (A / V ∝ 1 / L)' decreases, explaining why larger objects lose heat more slowly per unit mass."
    }
  }
};
