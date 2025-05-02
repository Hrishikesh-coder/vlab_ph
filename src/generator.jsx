import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, Compass, Play, Pause } from 'lucide-react';

// Hydroelectric Generator Simulation Component
export default function HydroelectricGeneratorSimulation() {
  // State variables
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
  const [showVoltmeter, setShowVoltmeter] = useState(true);
  const [indicatorType, setIndicatorType] = useState('light'); // 'light' or 'voltage'
  
  // Animation frame reference
  const frameId = useRef(null);
  const waterFlowRef = useRef(null);
  
  // Start/stop the simulation
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setWaterFlow(50); // Start with medium flow when play is pressed
    } else {
      setWaterFlow(0);  // Stop the flow when paused
    }
  };
  
  // Change number of loops
  const changeLoops = (increment) => {
    setLoops(prev => {
      const newValue = prev + increment;
      return Math.max(1, Math.min(5, newValue)); // Limit between 1 and 5
    });
  };
  
  // Update water flow value
  const updateWaterFlow = (e) => {
    if (isPlaying) {
      setWaterFlow(parseInt(e.target.value));
    }
  };
  
  // Animation logic for water flow and turbine rotation
  useEffect(() => {
    if (!isPlaying) {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      return;
    }
    
    const animate = () => {
      // Update turbine rotation based on water flow
      setTurbineRotation(prev => (prev + waterFlow / 100) % 360);
      
      // Calculate RPM based on water flow
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
  
  // Calculate voltage and light intensity based on parameters
  const voltage = (rpm / 100) * (magnetStrength / 100) * (loopArea / 100) * loops;
  const lightIntensity = Math.min(1, voltage);
  
  // Adjust magnet strength
  const handleMagnetStrengthChange = (e) => {
    setMagnetStrength(parseInt(e.target.value));
  };
  
  // Adjust loop area
  const handleLoopAreaChange = (e) => {
    setLoopArea(parseInt(e.target.value));
  };
  
  // Toggle indicator type (light bulb or voltmeter)
  const toggleIndicator = () => {
    setIndicatorType(prev => prev === 'light' ? 'voltage' : 'light');
  };
  
  // Create water drop elements
  const createWaterDrops = () => {
    if (waterFlow === 0) return null;
    
    const drops = [];
    const dropCount = Math.floor(waterFlow / 10) + 1;
    
    for (let i = 0; i < dropCount; i++) {
      const delay = i * (400 / dropCount);
      drops.push(
        <div 
          key={i} 
          className="absolute w-3 h-6 bg-blue-300 rounded-full opacity-80"
          style={{
            top: `${(i * 30) % 100}%`,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: `waterDrop ${1500 - waterFlow * 10}ms infinite linear ${delay}ms`
          }}
        />
      );
    }
    
    return drops;
  };
  
  return (
    <div className="flex flex-col items-center p-4 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Hydroelectric Generator</h1>
      
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-4">
        {/* Main simulation area */}
        <div className="flex-1 relative bg-black border border-gray-700 rounded-lg p-4 min-h-96">
          {/* Magnetic field arrows */}
          {showMagneticField && (
            <div className="absolute inset-0">
              {[...Array(15)].map((_, x) => (
                [...Array(15)].map((_, y) => (
                  <div 
                    key={`${x}-${y}`}
                    className="absolute w-1 h-1"
                    style={{
                      left: `${(x / 14) * 100}%`,
                      top: `${(y / 14) * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div 
                      className="absolute w-3 h-0.5 bg-yellow-300 opacity-20"
                      style={{
                        transform: `rotate(${45}deg)`,
                      }}
                    >
                      <div className="absolute right-0 top-1/2 w-1 h-1 bg-yellow-300 transform rotate-45 -translate-y-1/2"></div>
                    </div>
                  </div>
                ))
              ))}
            </div>
          )}
          
          {/* Water pipe */}
          <div className="absolute top-4 left-4 w-32 h-64">
            <div className="absolute left-4 top-0 w-12 h-32 bg-gray-400 rounded-t-lg"></div>
            <div className="absolute left-4 top-32 w-24 h-12 bg-gray-400"></div>
            <div className="absolute left-16 top-44 w-12 h-20 bg-gray-400 rounded-b-lg"></div>
            
            {/* Water flow container */}
            <div 
              ref={waterFlowRef}
              className="absolute left-8 top-0 w-4 h-32 overflow-hidden"
            >
              <div className="relative w-full h-full bg-blue-200 opacity-60">
                {createWaterDrops()}
              </div>
            </div>
            
            {/* Valve/faucet */}
            <div className="absolute left-4 top-28 w-12 h-8">
              <div className="absolute left-0 top-2 w-2 h-4 bg-gray-600"></div>
              <div className="absolute right-0 top-2 w-2 h-4 bg-gray-600"></div>
              <div className="absolute left-4 top-0 w-4 h-8 bg-gray-700 rounded-full"></div>
            </div>
          </div>
          
          {/* Turbine wheel */}
          <div className="absolute top-48 left-28 w-28 h-28">
            <div 
              className="absolute inset-0 rounded-full border-4 border-amber-700 flex items-center justify-center"
              style={{ transform: `rotate(${turbineRotation}deg)` }}
            >
              <div className="absolute w-full h-2 bg-amber-900"></div>
              <div className="absolute w-2 h-full bg-amber-900"></div>
              <div className="absolute w-full h-2 bg-amber-900 transform rotate-45"></div>
              <div className="absolute w-full h-2 bg-amber-900 transform -rotate-45"></div>
            </div>
            
            {/* RPM indicator */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600">
              <div className="text-center">
                <div className="text-white font-bold">{rpm}</div>
                <div className="text-xs text-gray-400">RPM</div>
              </div>
            </div>
            
            {/* Magnet */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 w-16 h-8 flex">
              <div className="w-1/2 h-full bg-red-600 flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <div className="w-1/2 h-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
            </div>
          </div>
          
          {/* Pickup coil */}
          <div className="absolute top-40 right-28 w-20 h-32">
            <div className="relative w-full h-full">
              {[...Array(loops)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-full rounded-full border-4 border-amber-600"
                  style={{
                    height: `${70 + i * 10}%`,
                    top: `${15 - i * 5}%`,
                    left: '0',
                  }}
                >
                  {/* Electron animations */}
                  {showElectrons && voltage > 0.2 && (
                    [...Array(4)].map((_, j) => (
                      <div 
                        key={j}
                        className="absolute w-2 h-2 rounded-full bg-blue-500"
                        style={{
                          top: '50%',
                          left: `${(j * 25) % 100}%`,
                          animation: `electronFlow ${2000 - rpm * 10}ms infinite linear ${j * 200}ms`
                        }}
                      >
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs">-</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Light bulb */}
          <div className="absolute top-8 right-28 w-20 h-20">
            {indicatorType === 'light' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-12 h-16 relative">
                  <div className="absolute bottom-0 w-full h-4 bg-gray-600 rounded-b-lg"></div>
                  <div 
                    className="absolute bottom-4 w-full h-12 rounded-t-full"
                    style={{
                      backgroundColor: `rgba(255, 255, 100, ${lightIntensity})`,
                      boxShadow: `0 0 ${lightIntensity * 20}px ${lightIntensity * 10}px rgba(255, 255, 100, ${lightIntensity})`
                    }}
                  ></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gray-400"></div>
                </div>
                
                {/* Light rays */}
                {lightIntensity > 0.1 && (
                  <div className="absolute inset-0">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute top-1/2 left-1/2 w-20 h-0.5 bg-yellow-300"
                        style={{
                          opacity: lightIntensity * 0.7,
                          transform: `rotate(${i * 30}deg)`,
                          transformOrigin: 'center',
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-2 bg-gray-600">
                    <div 
                      className="absolute top-0 left-1/2 h-full bg-blue-500"
                      style={{
                        width: `${voltage * 50}%`,
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  </div>
                  <div className="absolute text-xs text-center">
                    <div className="text-white font-bold">{voltage.toFixed(2)}V</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Compass */}
          {showCompass && (
            <div className="absolute bottom-8 right-16 w-16 h-16">
              <div className="w-full h-full rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-gray-400">N</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center rotate-180">
                  <div className="text-xs text-gray-400">S</div>
                </div>
                <div 
                  className="w-1 h-12 absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${turbineRotation}deg)`
                  }}
                >
                  <div className="w-full h-1/2 bg-red-500">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <div className="w-full h-1/2 bg-gray-400"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Field meter */}
          {showFieldMeter && (
            <div className="absolute bottom-8 right-40 w-10 h-10">
              <div className="w-full h-full rounded-full bg-gray-800 border-2 border-blue-500 flex items-center justify-center">
                <ArrowDown className="text-blue-500" size={20} />
              </div>
            </div>
          )}
          
          {/* Play/pause buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <button 
              className="bg-blue-500 hover:bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        </div>
        
        {/* Controls panel */}
        <div className="w-full lg:w-64 bg-gray-900 rounded-lg p-4">
          {/* Bar Magnet Control */}
          <div className="bg-blue-50 rounded-lg p-3 mb-4 text-black">
            <h3 className="font-bold mb-2">Bar Magnet</h3>
            <div className="mb-1 flex justify-between">
              <span>Strength:</span>
              <span>{magnetStrength}%</span>
            </div>
            <div className="mb-2 flex items-center">
              <button 
                className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                onClick={() => setMagnetStrength(Math.max(0, magnetStrength - 10))}
              >
                &lt;
              </button>
              <div className="flex-1 mx-1 h-6 bg-gray-200 relative">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={magnetStrength} 
                  onChange={handleMagnetStrengthChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="absolute top-0 left-0 bottom-0 w-full flex items-center">
                  <div className="absolute left-0 w-full h-1 bg-gray-400"></div>
                  <div
                    className="absolute h-full w-4 bg-blue-400"
                    style={{ left: `${magnetStrength}%`, transform: 'translateX(-50%)' }}
                  ></div>
                </div>
              </div>
              <button 
                className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                onClick={() => setMagnetStrength(Math.min(100, magnetStrength + 10))}
              >
                &gt;
              </button>
            </div>
            <div className="flex justify-between text-xs">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            
            <div className="mt-2">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={showMagneticField} 
                  onChange={() => setShowMagneticField(!showMagneticField)}
                  className="mr-2"
                />
                <span>Magnetic Field (B)</span>
              </label>
            </div>
          </div>
          
          {/* Pickup Coil Control */}
          <div className="bg-blue-50 rounded-lg p-3 mb-4 text-black">
            <h3 className="font-bold mb-2">Pickup Coil</h3>
            
            <div className="mb-2 flex items-center">
              <span className="mr-2">Indicator:</span>
              <div className="flex gap-1">
                <button 
                  className={`w-10 h-10 border ${indicatorType === 'light' ? 'border-blue-500 bg-gray-200' : 'border-gray-300'} flex items-center justify-center`}
                  onClick={() => setIndicatorType('light')}
                >
                  <div className="w-6 h-6 rounded-full bg-yellow-200"></div>
                </button>
                <button 
                  className={`w-10 h-10 border ${indicatorType === 'voltage' ? 'border-blue-500 bg-gray-200' : 'border-gray-300'} flex items-center justify-center`}
                  onClick={() => setIndicatorType('voltage')}
                >
                  <div className="w-6 h-4 bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">V</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex items-center">
                <span className="mr-2">Loops:</span>
                <div className="flex items-center">
                  <button 
                    className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                    onClick={() => changeLoops(-1)}
                  >
                    &lt;
                  </button>
                  <div className="w-6 h-6 bg-white flex items-center justify-center mx-1">
                    {loops}
                  </div>
                  <button 
                    className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                    onClick={() => changeLoops(1)}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mb-1 flex justify-between">
              <span>Loop Area:</span>
              <span>{loopArea}%</span>
            </div>
            <div className="mb-2 flex items-center">
              <button 
                className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                onClick={() => setLoopArea(Math.max(20, loopArea - 10))}
              >
                &lt;
              </button>
              <div className="flex-1 mx-1 h-6 bg-gray-200 relative">
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={loopArea} 
                  onChange={handleLoopAreaChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="absolute top-0 left-0 bottom-0 w-full flex items-center">
                  <div className="absolute left-0 w-full h-1 bg-gray-400"></div>
                  <div
                    className="absolute h-full w-4 bg-blue-400"
                    style={{ left: `${(loopArea - 20) * 100 / 80}%`, transform: 'translateX(-50%)' }}
                  ></div>
                </div>
              </div>
              <button 
                className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                onClick={() => setLoopArea(Math.min(100, loopArea + 10))}
              >
                &gt;
              </button>
            </div>
            <div className="flex justify-between text-xs">
              <span>20%</span>
              <span>60%</span>
              <span>100%</span>
            </div>
            
            <div className="mt-2">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={showElectrons} 
                  onChange={() => setShowElectrons(!showElectrons)}
                  className="mr-2"
                />
                <span>Electrons</span>
                <span className="ml-1 text-blue-600 text-xs">-</span>
              </label>
            </div>
          </div>
          
          {/* Water Flow Control */}
          <div className="bg-blue-50 rounded-lg p-3 mb-4 text-black">
            <h3 className="font-bold mb-2">Water Flow</h3>
            <div className="mb-1 flex justify-between">
              <span>Flow Rate:</span>
              <span>{waterFlow}%</span>
            </div>
            <div className="mb-2 flex items-center">
              <button 
                className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                onClick={() => isPlaying && setWaterFlow(Math.max(0, waterFlow - 10))}
                disabled={!isPlaying}
              >
                &lt;
              </button>
              <div className="flex-1 mx-1 h-6 bg-gray-200 relative">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={waterFlow} 
                  onChange={updateWaterFlow}
                  disabled={!isPlaying}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="absolute top-0 left-0 bottom-0 w-full flex items-center">
                  <div className="absolute left-0 w-full h-1 bg-gray-400"></div>
                  <div
                    className="absolute h-full w-4 bg-blue-400"
                    style={{ left: `${waterFlow}%`, transform: 'translateX(-50%)' }}
                  ></div>
                </div>
              </div>
              <button 
                className="w-6 h-6 bg-gray-300 flex items-center justify-center"
                onClick={() => isPlaying && setWaterFlow(Math.min(100, waterFlow + 10))}
                disabled={!isPlaying}
              >
                &gt;
              </button>
            </div>
          </div>
          
          {/* Tools */}
          <div className="bg-blue-50 rounded-lg p-3 text-black">
            <label className="flex items-center mb-2">
              <input 
                type="checkbox" 
                checked={showCompass} 
                onChange={() => setShowCompass(!showCompass)}
                className="mr-2"
              />
              <span>Compass</span>
              <span className="ml-2 text-xs">S — N</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={showFieldMeter} 
                onChange={() => setShowFieldMeter(!showFieldMeter)}
                className="mr-2"
              />
              <span>Field Meter</span>
              <Compass className="ml-2 text-blue-600" size={16} />
            </label>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes waterDrop {
          0% { transform: translateX(-50%) translateY(-100%); }
          100% { transform: translateX(-50%) translateY(200px); }
        }
        
        @keyframes electronFlow {
          0% { transform: translateY(-50%) translateX(0); }
          100% { transform: translateY(-50%) translateX(100%); }
        }
      `}</style>
    </div>
  );
}