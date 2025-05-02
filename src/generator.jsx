import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, Compass, Play, Pause, Gauge, Magnet, Coins, Droplets, Zap, Lightbulb } from 'lucide-react';

export default function HydroelectricGeneratorSimulation() {
  const [waterFlow, setWaterFlow] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [magnetStrength, setMagnetStrength] = useState(75);
  const [loopArea, setLoopArea] = useState(50);
  const [loops, setLoops] = useState(2);
  const [turbineRotation, setTurbineRotation] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [showMagneticField, setShowMagneticField] = useState(true);
  const [showElectrons, setShowElectrons] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [showFieldMeter, setShowFieldMeter] = useState(false);
  const [indicatorType, setIndicatorType] = useState('light');

  const frameId = useRef(null);
  const waterFlowRef = useRef(null);

  const toggleTap = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setWaterFlow(50);
    } else {
      setWaterFlow(waterFlow > 0 ? 0 : 50);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setWaterFlow(50);
    } else {
      setWaterFlow(0);
    }
  };

  const changeLoops = (increment) => {
    setLoops(prev => Math.max(1, Math.min(5, prev + increment)));
  };

  const updateWaterFlow = (e) => {
    if (isPlaying) {
      setWaterFlow(parseInt(e.target.value));
    }
  };

  useEffect(() => {
    if (waterFlow === 0) {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      return;
    }

    const animate = () => {
      setTurbineRotation(prev => (prev + waterFlow / 100) % 360);
      setRpm(Math.round(waterFlow * 1.2));
      frameId.current = requestAnimationFrame(animate);
    };

    frameId.current = requestAnimationFrame(animate);

    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [isPlaying, waterFlow]);

  const voltage = (rpm / 100) * (magnetStrength / 100) * (loopArea / 100) * loops;
  const lightIntensity = waterFlow === 0 ? 0 : Math.min(1, voltage);

  const handleMagnetStrengthChange = (e) => {
    setMagnetStrength(parseInt(e.target.value));
  };

  const handleLoopAreaChange = (e) => {
    setLoopArea(parseInt(e.target.value));
  };

  const toggleIndicator = () => {
    setIndicatorType(prev => (prev === 'light' ? 'voltage' : 'light'));
  };

  const createWaterDrops = () => {
    if (waterFlow === 0) return null;

    const drops = [];
    const dropCount = Math.floor(waterFlow / 5) + 2;

    for (let i = 0; i < dropCount; i++) {
      const delay = i * (400 / dropCount);
      drops.push(
        <div
          key={i}
          className="absolute w-3 h-8 bg-gradient-to-b from-blue-300 to-blue-600 rounded-full opacity-90 shadow-sm"
          style={{
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: `waterDrop ${1200 - waterFlow * 8}ms infinite linear ${delay}ms`,
          }}
        />
      );
    }

    return drops;
  };

  const createMagneticFieldLines = () => {
    if (!showMagneticField) return null;

    const lines = [];
    const lineCount = 8;

    for (let i = 0; i < lineCount; i++) {
      const offset = (i - lineCount / 2) * 20;
      lines.push(
        <div
          key={i}
          className="absolute w-1 h-1"
          style={{
            left: '50%',
            top: `${50 + offset}px`,
            transform: 'translate(-50%, -50%)',
            animation: `fieldLine ${4000 - rpm * 20}ms infinite linear ${i * 200}ms`,
          }}
        >
          <div
            className="absolute w-8 h-0.5 bg-yellow-300/30"
            style={{
              transform: `rotate(${turbineRotation}deg)`,
            }}
          >
            <div className="absolute right-0 top-1/2 w-1 h-1 bg-yellow-400/50 transform rotate-45 -translate-y-1/2"></div>
          </div>
        </div>
      );
    }

    return lines;
  };

  const createElectrons = () => {
    if (!showElectrons || voltage <= 0.2) return null;

    const electrons = [];
    const electronCount = 12;
    const rotationSpeed = Math.max(1000, 8000 - voltage * 3000); // Rotation speed based on voltage

    for (let i = 0; i < electronCount; i++) {
      // Fixed positions in a grid pattern
      const row = Math.floor(i / 4);
      const col = i % 4;
      const posX = 20 + col * 20;
      const posY = 20 + row * 20;

      // Alternating rotation direction
      const direction = i % 2 === 0 ? 1 : -1;

      electrons.push(
        <div
          key={i}
          className="absolute"
          style={{
            top: `${posY}%`,
            left: `${posX}%`,
            width: '16px',
            height: '16px',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="relative w-full h-full"
            style={{
              animation: `rotate ${rotationSpeed}ms infinite linear ${direction < 0 ? 'reverse' : ''}`,
            }}
          >
            {/* Compass needle with clear North/South coloring */}
            <div className="absolute top-0 left-1/2 w-1 h-4 bg-red-600 transform -translate-x-1/2 rounded-t-full"></div>
            <div className="absolute bottom-0 left-1/2 w-1 h-4 bg-blue-600 transform -translate-x-1/2 rounded-b-full"></div>
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white border border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            {/* Black needle to show rotation */}
            <div
              className="absolute top-0 left-1/2 w-1 h-6 bg-black transform -translate-x-1/2 rounded-full"
              style={{ zIndex: 10 }}
            ></div>
          </div>
        </div>
      );
    }

    return <>{electrons}</>;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen text-white font-sans">
      <header className="w-full max-w-6xl mb-4 text-center">
        <h1 className="text-2xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          Hydroelectric Generator Lab
        </h1>
        <p className="text-gray-400 max-w-md mx-auto text-sm">
          Explore a hydroelectric generator by adjusting water flow, magnet strength, and coil properties
        </p>
      </header>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative bg-gray-850 border border-gray-700 rounded-lg p-4 min-h-[450px] shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {createMagneticFieldLines()}
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {createElectrons()}
          </div>

          <div className="absolute top-4 left-4 w-36 h-72">
            <div className="absolute left-4 top-0 w-12 h-28 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-lg border-2 border-gray-800 shadow-inner"></div>
            <div className="absolute left-4 top-28 w-20 h-8 bg-gradient-to-r from-gray-600 to-gray-700 border-2 border-gray-800"></div>
            <div className="absolute left-12 top-36 w-12 h-20 bg-gradient-to-b from-gray-600 to-gray-700 rounded-b-lg border-2 border-gray-800 shadow-inner"></div>

            <div ref={waterFlowRef} className="absolute left-8 top-0 w-4 h-72 overflow-hidden">
              <div className="relative w-full h-full bg-gradient-to-b from-blue-400/30 to-blue-500/30">
                {createWaterDrops()}
              </div>
            </div>

            <div className="absolute left-4 top-24 w-12 h-8 cursor-pointer group" onClick={toggleTap}>
              <div className="absolute left-0 top-2 w-2 h-4 bg-gradient-to-b from-gray-700 to-gray-600 group-hover:bg-gray-500 transition-colors"></div>
              <div className="absolute right-0 top-2 w-2 h-4 bg-gradient-to-b from-gray-700 to-gray-600 group-hover:bg-gray-500 transition-colors"></div>
              <div className="absolute left-4 top-0 w-4 h-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full group-hover:bg-gray-700 transition-all flex items-center justify-center shadow-md">
                <div className={`w-2 h-2 rounded-full ${waterFlow > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
          </div>

          <div className="absolute top-40 left-28 w-40 h-40">
            <div
              className="absolute inset-0 rounded-full border-4 border-gray-800 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center shadow-lg"
              style={{ transform: `rotate(${turbineRotation}deg)`, transition: 'transform 0.05s linear' }}
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-18 h-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full shadow-md"
                  style={{ transform: `rotate(${i * 45}deg)` }}
                />
              ))}
              <div className="w-10 h-10 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full border-2 border-gray-700 shadow-inner"></div>
            </div>

            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-16 h-8 rounded-full bg-gray-900/90 flex items-center justify-center border-2 border-gray-800 shadow-md">
              <div className="text-center">
                <div className="text-white font-semibold flex items-center justify-center text-sm">
                  <Gauge className="mr-1" size={12} /> {rpm}
                </div>
                <div className="text-xs text-gray-400">RPM</div>
              </div>
            </div>
          </div>

          <div className="absolute top-64 left-36 w-24 h-12 flex rounded-lg overflow-hidden shadow-lg border-2 border-gray-800">
            <div className="w-1/2 h-full bg-gradient-to-b from-red-800 to-red-900 flex items-center justify-center shadow-inner">
              <span className="text-white font-bold text-lg drop-shadow">N</span>
            </div>
            <div className="w-1/2 h-full bg-gradient-to-b from-blue-800 to-blue-900 flex items-center justify-center shadow-inner">
              <span className="text-white font-bold text-lg drop-shadow">S</span>
            </div>
          </div>

          <div className="absolute top-28 right-28 w-24 h-36">
            <div className="relative w-full h-full perspective-1000">
              {[...Array(loops)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full rounded-lg border-3 border-amber-700/90 bg-amber-900/20 shadow-lg"
                  style={{
                    transform: `translateZ(${i * -12}px) scale(${0.9 + i * 0.06})`,
                    opacity: 0.9 - i * 0.12,
                    background: 'radial-gradient(circle, rgba(255,191,0,0.15) 0%, rgba(255,191,0,0.05) 70%)',
                    borderStyle: 'solid',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="absolute top-8 right-8 w-26 h-26">
            {indicatorType === 'light' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-15.6 h-20.8">
                  <div className="absolute bottom-0 w-full h-5.2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg border-2 border-gray-700 shadow-md"></div>
                  <div
                    className="absolute bottom-5.2 w-full h-15.6 rounded-t-full border-2 border-yellow-500/60 bg-gradient-to-b from-white/20 to-yellow-100/30"
                    style={{
                      background: `radial-gradient(circle at 50% 30%, rgba(255,255,255,${lightIntensity * 0.5}) 0%, rgba(255,230,100,${lightIntensity * 0.3}) 70%)`,
                      boxShadow: lightIntensity > 0 ? `0 0 ${lightIntensity * 40}px ${lightIntensity * 20}px rgba(255, 255, 100, ${lightIntensity * 0.8})` : 'none',
                      transition: 'all 0.3s ease-out',
                    }}
                  >
                    <div className="absolute top-2.6 left-1/2 transform -translate-x-1/2 w-1 h-5 bg-gray-700 rounded-full"></div>
                    <div className="absolute top-3.9 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                    <div className="absolute top-5.2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
                {lightIntensity > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-26 h-0.5 bg-yellow-400/40"
                        style={{
                          opacity: lightIntensity,
                          transform: `rotate(${i * 45}deg) translateX(-50%)`,
                          transformOrigin: 'left center',
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-blue-700/70 flex items-center justify-center shadow-lg">
                  <div className="relative w-full px-2">
                    <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-800"
                        style={{
                          width: `${Math.min(100, voltage * 50)}%`,
                          transition: 'width 0.3s ease-out',
                        }}
                      ></div>
                    </div>
                    <div className="absolute top-5 left-0 w-full text-center">
                      <div className="text-white font-bold flex items-center justify-center text-xs">
                        <Zap className="mr-1" size={10} /> {voltage.toFixed(2)}V
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showCompass && (
            <div className="absolute bottom-6 right-12 w-14 h-14">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-gray-700 flex items-center justify-center relative shadow-md">
                <div className="absolute inset-0 flex items-start justify-center pt-1">
                  <div className="text-xs text-red-600 font-bold">N</div>
                </div>
                <div className="absolute inset-0 flex items-end justify-center pb-1">
                  <div className="text-xs text-gray-500">S</div>
                </div>
                <div
                  className="w-1 h-10 absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2"
                  style={{ transform: `translate(-50%, -50%) rotate(${turbineRotation}deg)`, transition: 'transform 0.1s linear' }}
                >
                  <div className="w-full h-1/2 bg-gradient-to-b from-red-700 to-red-800">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-800 rounded-full"></div>
                  </div>
                  <div className="w-full h-1/2 bg-gradient-to-b from-gray-700 to-gray-800"></div>
                </div>
              </div>
            </div>
          )}

          {showFieldMeter && (
            <div className="absolute bottom-6 right-28 w-10 h-10 rounded-full bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-blue-700/70 flex items-center justify-center shadow-md">
              <ArrowDown
                className="text-blue-600"
                size={16}
                style={{ transform: `rotate(${turbineRotation}deg)`, transition: 'transform 0.1s linear' }}
              />
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <button
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="text-white" size={18} /> : <Play className="text-white" size={18} />}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-72 bg-gray-850 rounded-lg p-4 shadow-xl border border-gray-700">
          <h2 className="text-base font-bold mb-3 text-white flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Controls
          </h2>

          <div className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
            <h3 className="font-semibold mb-2 text-blue-300 flex items-center">
              <Magnet className="mr-2" size={14} /> Magnet Strength
            </h3>
            <div className="flex items-center gap-2">
              <button
                className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                onClick={() => setMagnetStrength(Math.max(0, magnetStrength - 10))}
              >
                −
              </button>
              <div className="flex-1 h-2 bg-gray-700 rounded-full relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={magnetStrength}
                  onChange={handleMagnetStrengthChange}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-full"
                  style={{ width: `${magnetStrength}%` }}
                ></div>
              </div>
              <button
                className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                onClick={() => setMagnetStrength(Math.min(100, magnetStrength + 10))}
              >
                +
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">{magnetStrength}%</div>
            <label className="flex items-center mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMagneticField}
                onChange={() => setShowMagneticField(!showMagneticField)}
                className="sr-only"
              />
              <div className={`w-7 h-3 rounded-full ${showMagneticField ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transform ${showMagneticField ? 'translate-x-4' : 'translate-x-0'} transition-transform`}></div>
              </div>
              <span className="ml-2 text-xs">Show Field</span>
            </label>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
            <h3 className="font-semibold mb-2 text-amber-300 flex items-center">
              <Coins className="mr-2" size={14} /> Pickup Coil
            </h3>
            <div className="mb-2">
              <div className="text-xs text-gray-400 mb-1">Indicator</div>
              <div className="flex gap-2">
                <button
                  className={`flex-1 py-1 rounded-md border ${indicatorType === 'light' ? 'border-amber-500 bg-gray-700' : 'border-gray-600'}`}
                  onClick={() => setIndicatorType('light')}
                >
                  <Lightbulb size={14} className="mx-auto mb-1" />
                  <span className="text-xs">Bulb</span>
                </button>
                <button
                  className={`flex-1 py-1 rounded-md border ${indicatorType === 'voltage' ? 'border-amber-500 bg-gray-700' : 'border-gray-600'}`}
                  onClick={() => setIndicatorType('voltage')}
                >
                  <Zap size={14} className="mx-auto mb-1" />
                  <span className="text-xs">Voltmeter</span>
                </button>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Loops</span>
                <span className="text-xs text-amber-300">{loops}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-md text-sm" onClick={() => changeLoops(-1)}>
                  −
                </button>
                <div className="flex-1 h-2 bg-gray-700 rounded-full flex items-center justify-between px-1">
                  {[1, 2, 3, 4, 5].map(num => (
                    <div key={num} className={`w-2 h-2 rounded-full ${loops >= num ? 'bg-amber-500' : 'bg-gray-600'}`}></div>
                  ))}
                </div>
                <button className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-md text-sm" onClick={() => changeLoops(1)}>
                  +
                </button>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Loop Area</span>
                <span className="text-xs text-amber-300">{loopArea}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                  onClick={() => setLoopArea(Math.max(20, loopArea - 10))}
                >
                  −
                </button>
                <div className="flex-1 h-2 bg-gray-700 rounded-full relative">
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={loopArea}
                    onChange={handleLoopAreaChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full"
                    style={{ width: `${(loopArea - 20) * 100 / 80}%` }}
                  ></div>
                </div>
                <button
                  className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                  onClick={() => setLoopArea(Math.min(100, loopArea + 10))}
                >
                  +
                </button>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showElectrons}
                onChange={() => setShowElectrons(!showElectrons)}
                className="sr-only"
              />
              <div className={`w-7 h-3 rounded-full ${showElectrons ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transform ${showElectrons ? 'translate-x-4' : 'translate-x-0'} transition-transform`}></div>
              </div>
              <span className="ml-2 text-xs">Show Electrons</span>
            </label>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
            <h3 className="font-semibold mb-2 text-cyan-300 flex items-center">
              <Droplets className="mr-2" size={14} /> Water Flow
            </h3>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Flow Rate</span>
                <span className="text-xs text-cyan-300">{waterFlow}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`w-7 h-7 ${isPlaying ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500'} rounded-md text-sm`}
                  onClick={() => isPlaying && setWaterFlow(Math.max(0, waterFlow - 10))}
                  disabled={!isPlaying}
                >
                  −
                </button>
                <div className="flex-1 h-2 bg-gray-700 rounded-full relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={waterFlow}
                    onChange={updateWaterFlow}
                    disabled={!isPlaying}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-cyan-700 rounded-full"
                    style={{ width: `${waterFlow}%` }}
                  ></div>
                </div>
                <button
                  className={`w-7 h-7 ${isPlaying ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500'} rounded-md text-sm`}
                  onClick={() => isPlaying && setWaterFlow(Math.min(100, waterFlow + 10))}
                  disabled={!isPlaying}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h3 className="font-semibold mb-2 text-gray-300 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Tools
            </h3>
            <label className="flex items-center justify-between mb-2 cursor-pointer">
              <div className="flex items-center">
                <Compass className="mr-2 text-blue-400" size={12} />
                <span className="text-xs">Compass</span>
              </div>
              <div className={`w-7 h-3 rounded-full ${showCompass ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transform ${showCompass ? 'translate-x-4' : 'translate-x-0'} transition-transform`}></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center">
                <ArrowDown className="mr-2 text-blue-400" size={12} />
                <span className="text-xs">Field Meter</span>
              </div>
              <div className={`w-7 h-3 rounded-full ${showFieldMeter ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transform ${showFieldMeter ? 'translate-x-4' : 'translate-x-0'} transition-transform`}></div>
              </div>
            </label>
            <input
              type="checkbox"
              checked={showFieldMeter}
              onChange={() => setShowFieldMeter(!showFieldMeter)}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        @keyframes waterDrop {
          0% { transform: translateX(-50%) translateY(-20%); opacity: 0; }
          10% { opacity: 0.9; }
          80% { transform: translateX(-50%) translateY(450px); opacity: 0.9; }
          100% { transform: translateX(-50%) translateY(500px); opacity: 0; }
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fieldLine {
          0% { transform: translate(-50%, -50%) translateY(0); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) translateY(20px); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) translateY(40px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}