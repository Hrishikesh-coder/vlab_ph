import { useState, useEffect, useRef } from 'react';

const SOLUTIONS = [
  { name: "Battery Acid", ph: 1, color: "#FF0000" },
  { name: "Stomach Acid", ph: 2, color: "#FF3300" },
  { name: "Orange Juice", ph: 3, color: "#FF6600" },
  { name: "Tomato Juice", ph: 4, color: "#FF9900" },
  { name: "Black Coffee", ph: 5, color: "#FFCC00" },
  { name: "Urine", ph: 6, color: "#FFFF00" },
  { name: "Pure Water", ph: 7, color: "#CCFFCC" },
  { name: "Sea Water", ph: 8, color: "#99FFFF" },
  { name: "Baking Soda", ph: 9, color: "#66CCFF" },
  { name: "Milk of Magnesia", ph: 10, color: "#3399FF" },
  { name: "Ammonia", ph: 11, color: "#0066FF" },
  { name: "Soapy Water", ph: 12, color: "#0033CC" },
  { name: "Bleach", ph: 13, color: "#000099" },
  { name: "Drain Cleaner", ph: 14, color: "#330066" }
];

export default function PhScale() {
  // Container state
  const [liquidLevel, setLiquidLevel] = useState(0);
  const [waterDrops, setWaterDrops] = useState([]);
  const [soluteDrops, setSoluteDrops] = useState([]);
  const containerRef = useRef(null);

  // Solution state
  const [waterVolume, setWaterVolume] = useState(0); // mL initially empty
  const [soluteVolume, setSoluteVolume] = useState(0); // mL
  const [waterSolution, setWaterSolution] = useState(SOLUTIONS[6]); // Pure Water pH 7 - fixed
  const [soluteSolution, setSoluteSolution] = useState(SOLUTIONS[0]); // Battery Acid pH 1
  const [mixedSolution, setMixedSolution] = useState(SOLUTIONS[6]); // Initially just water
  
  // Dropper state
  const [isWaterPouring, setIsWaterPouring] = useState(false);
  const [isSolutePouring, setIsSolutePouring] = useState(false);
  
  // Calculate the mixed pH based on volumes and original pH values
  useEffect(() => {
    if (waterVolume + soluteVolume === 0) return;
    
    // Convert pH to hydrogen ion concentration [H+]
    const waterHPlus = Math.pow(10, -waterSolution.ph);
    const soluteHPlus = Math.pow(10, -soluteSolution.ph);
    
    // Calculate weighted average based on volumes
    const totalVolume = waterVolume + soluteVolume;
    const mixedHPlus = ((waterHPlus * waterVolume) + (soluteHPlus * soluteVolume)) / totalVolume;
    
    // Convert back to pH
    const mixedPh = -Math.log10(mixedHPlus);
    
    // Find the closest solution or interpolate between two
    let closestSolution = SOLUTIONS[0];
    let minDifference = Math.abs(SOLUTIONS[0].ph - mixedPh);
    
    for (const solution of SOLUTIONS) {
      const difference = Math.abs(solution.ph - mixedPh);
      if (difference < minDifference) {
        minDifference = difference;
        closestSolution = solution;
      }
    }
    
    // Interpolate color if between two integer pH values
    let finalColor = closestSolution.color;
    if (minDifference > 0.1) {
      const lowerPh = Math.floor(mixedPh);
      const upperPh = Math.ceil(mixedPh);
      
      if (lowerPh !== upperPh && lowerPh >= 1 && upperPh <= 14) {
        const lowerSolution = SOLUTIONS.find(s => s.ph === lowerPh);
        const upperSolution = SOLUTIONS.find(s => s.ph === upperPh);
        
        if (lowerSolution && upperSolution) {
          // Linear interpolation between colors
          const fraction = mixedPh - lowerPh;
          
          const lowerRgb = hexToRgb(lowerSolution.color);
          const upperRgb = hexToRgb(upperSolution.color);
          
          const r = Math.round(lowerRgb.r + fraction * (upperRgb.r - lowerRgb.r));
          const g = Math.round(lowerRgb.g + fraction * (upperRgb.g - lowerRgb.g));
          const b = Math.round(lowerRgb.b + fraction * (upperRgb.b - lowerRgb.b));
          
          finalColor = rgbToHex(r, g, b);
        }
      }
    }
    
    // Create a custom solution object for the mixed solution
    setMixedSolution({
      name: `Mixed Solution`,
      ph: parseFloat(mixedPh.toFixed(2)),
      color: finalColor
    });
    
  }, [waterVolume, soluteVolume, waterSolution, soluteSolution]);

  // Helper functions for color interpolation
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Handle water dropper animation
  useEffect(() => {
    if (!isWaterPouring) {
      return;
    }

    const createDrop = () => {
      if (!isWaterPouring || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropPosition = { x: containerRect.width / 3, y: 80 }; // Left dropper
      
      const newDrop = {
        id: Date.now(),
        x: dropPosition.x,
        y: dropPosition.y,
        opacity: 1,
        color: waterSolution.color
      };
      
      setWaterDrops(prev => [...prev, newDrop]);
      
      // Remove old drops and increase volumes
      setTimeout(() => {
        setWaterDrops(prev => prev.filter(drop => drop.id !== newDrop.id));
        setWaterVolume(prev => prev + 5); // Add 5mL of water
        setLiquidLevel(prev => Math.min(prev + 1, 90));
      }, 500);
    };

    const interval = setInterval(createDrop, 300);
    return () => clearInterval(interval);
  }, [isWaterPouring, waterSolution.color]);

  // Handle solute dropper animation
  useEffect(() => {
    if (!isSolutePouring) {
      return;
    }

    const createDrop = () => {
      if (!isSolutePouring || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropPosition = { x: (2 * containerRect.width) / 3, y: 80 }; // Right dropper
      
      const newDrop = {
        id: Date.now(),
        x: dropPosition.x,
        y: dropPosition.y,
        opacity: 1,
        color: soluteSolution.color
      };
      
      setSoluteDrops(prev => [...prev, newDrop]);
      
      // Remove old drops and increase volumes
      setTimeout(() => {
        setSoluteDrops(prev => prev.filter(drop => drop.id !== newDrop.id));
        setSoluteVolume(prev => prev + 1); // Add 1mL of solute
        setLiquidLevel(prev => Math.min(prev + 0.2, 90)); // Less volume increase
      }, 500);
    };

    const interval = setInterval(createDrop, 500);
    return () => clearInterval(interval);
  }, [isSolutePouring, soluteSolution.color]);

  // Handle dropper clicks
  const handleWaterDropperClick = () => {
    setIsWaterPouring(!isWaterPouring);
  };

  const handleSoluteDropperClick = () => {
    setIsSolutePouring(!isSolutePouring);
  };

  // Function to drain the container
  const drainContainer = () => {
    setLiquidLevel(0);
    setWaterVolume(0);
    setSoluteVolume(0);
  };

  // Function to handle solute solution change
  const handleSoluteSolutionChange = (event) => {
    const phValue = parseInt(event.target.value, 10);
    const solution = SOLUTIONS.find(sol => sol.ph === phValue);
    setSoluteSolution(solution);
  };

  // Determine text color based on background for readability
  const getTextColor = (bgColor) => {
    // Convert hex to RGB
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 125 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 p-6 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">pH Scale Simulation</h1>
      
      <div className="flex flex-col md:flex-row w-full max-w-6xl gap-6">
        {/* Left Panel - Solution Selection */}
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Select Solute</h2>
          
          <div className="flex flex-col space-y-2 max-h-64 overflow-y-auto">
            {SOLUTIONS.map((solution) => (
              <label 
                key={`solute-${solution.ph}`} 
                className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded"
              >
                <input
                  type="radio"
                  name="soluteSolution"
                  value={solution.ph}
                  checked={soluteSolution.ph === solution.ph}
                  onChange={handleSoluteSolutionChange}
                  className="form-radio"
                />
                <div 
                  className="w-6 h-6 rounded-full mr-2" 
                  style={{ backgroundColor: solution.color }}
                />
                <span className="text-sm font-medium">{solution.name} (pH {solution.ph})</span>
              </label>
            ))}
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Water Source</h3>
            <div className="flex items-center p-2 bg-gray-100 rounded">
              <div 
                className="w-6 h-6 rounded-full mr-2" 
                style={{ backgroundColor: waterSolution.color }}
              />
              <span className="font-medium">Pure Water (pH 7)</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">The water dropper always uses pure water with a neutral pH of 7.</p>
          </div>
        </div>
        
        {/* Middle Panel - Visualization */}
        <div className="w-full md:w-2/4 bg-white p-6 rounded-lg shadow-lg flex flex-col items-center" ref={containerRef}>
          {/* Water & Solute Droppers */}
          <div className="relative w-full h-32">
            {/* Water Dropper (Left) */}
            <div 
              className="absolute left-1/3 transform -translate-x-1/2 cursor-pointer"
              onClick={handleWaterDropperClick}
            >
              <div className="w-8 h-24 bg-gray-300 rounded-t-lg shadow-md"></div>
              <div className="w-16 h-5 bg-gray-500 rounded mt-0 shadow-md"></div>
              <div className="w-5 h-8 bg-gray-400 rounded-b-lg mx-auto shadow-md relative">
                <div className={`absolute bottom-0 left-0 right-0 h-2 rounded-b-lg ${isWaterPouring ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
              </div>
              <div 
                className="absolute top-28 w-5 h-5 rounded-full mx-auto left-1/2 transform -translate-x-1/2" 
                style={{ backgroundColor: waterSolution.color }}
              ></div>
              <div className="absolute top-40 w-full text-center">
                <span className="text-sm font-medium">Water</span>
                <p className="text-xs text-gray-500">(Click to {isWaterPouring ? 'stop' : 'start'})</p>
              </div>
            </div>
            
            {/* Solute Dropper (Right) */}
            <div 
              className="absolute right-1/3 transform translate-x-1/2 cursor-pointer"
              onClick={handleSoluteDropperClick}
            >
              <div className="w-8 h-24 bg-gray-300 rounded-t-lg shadow-md"></div>
              <div className="w-16 h-5 bg-gray-500 rounded mt-0 shadow-md"></div>
              <div className="w-5 h-8 bg-gray-400 rounded-b-lg mx-auto shadow-md relative">
                <div className={`absolute bottom-0 left-0 right-0 h-2 rounded-b-lg ${isSolutePouring ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
              </div>
              <div 
                className="absolute top-28 w-5 h-5 rounded-full mx-auto left-1/2 transform -translate-x-1/2" 
                style={{ backgroundColor: soluteSolution.color }}
              ></div>
              <div className="absolute top-40 w-full text-center">
                <span className="text-sm font-medium">Solute</span>
                <p className="text-xs text-gray-500">(Click to {isSolutePouring ? 'stop' : 'start'})</p>
              </div>
            </div>
            
            {/* Water Drops */}
            {waterDrops.map(drop => (
              <div
                key={drop.id}
                className="absolute w-4 h-6 rounded-b-full opacity-80"
                style={{
                  left: `${drop.x - 4}px`,
                  top: `${drop.y}px`,
                  backgroundColor: drop.color,
                  transform: 'translateY(0)',
                  animation: 'dropFall 0.5s linear forwards'
                }}
              />
            ))}
            
            {/* Solute Drops */}
            {soluteDrops.map(drop => (
              <div
                key={drop.id}
                className="absolute w-3 h-5 rounded-b-full opacity-80"
                style={{
                  left: `${drop.x - 3}px`,
                  top: `${drop.y}px`,
                  backgroundColor: drop.color,
                  transform: 'translateY(0)',
                  animation: 'dropFall 0.5s linear forwards'
                }}
              />
            ))}
          </div>
          
          {/* Container with Solution */}
          <div className="relative w-64 h-96 mt-24 overflow-hidden">
            {/* Improved beaker design */}
            <div className="absolute inset-0 border-4 border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
              {/* Glass effect */}
              <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-white via-transparent to-white"></div>
              
              {/* Measurement lines */}
              {[20, 40, 60, 80].map(level => (
                <div key={level} className="absolute w-8 h-0.5 bg-gray-400 left-0" style={{ bottom: `${level}%` }}>
                  <span className="absolute -left-6 text-xs text-gray-500" style={{ bottom: '0' }}>
                    {Math.round((level / 100) * 500)}
                  </span>
                </div>
              ))}
              
              {/* Liquid */}
              <div
                className="absolute bottom-0 w-full transition-all duration-300 ease-in-out"
                style={{ 
                  height: `${liquidLevel}%`, 
                  backgroundColor: mixedSolution.color,
                  transition: 'height 0.3s, background-color 0.5s'
                }}
              >
                {/* Meniscus effect */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white opacity-20 rounded-b-full transform -translate-y-1"></div>
                
                {/* pH Value Label */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold"
                  style={{ 
                    color: getTextColor(mixedSolution.color),
                    fontSize: '2.5rem',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  pH {mixedSolution.ph}
                </div>
              </div>
            </div>
          </div>
          
          {/* Drain Button */}
          <button
            onClick={drainContainer}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 font-medium shadow-md transition-colors"
          >
            Drain Beaker
          </button>
          
          {/* pH Scale Indicator */}
          <div className="w-full mt-8">
            <h3 className="text-center font-bold mb-2">pH Scale</h3>
            <div className="flex h-10 rounded-md overflow-hidden shadow-md">
              {SOLUTIONS.map(solution => (
                <div
                  key={solution.ph}
                  className="flex-1 flex items-center justify-center cursor-pointer transition-all"
                  style={{ 
                    backgroundColor: solution.color,
                    border: Math.round(mixedSolution.ph) === solution.ph ? '3px solid black' : 'none',
                    transform: Math.round(mixedSolution.ph) === solution.ph ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: getTextColor(solution.color) }}>
                    {solution.ph}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-gray-700 font-medium">
              <span>Acidic</span>
              <span>Neutral</span>
              <span>Basic</span>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Data & Information */}
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Solution Data</h2>
          
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-2">Water</h3>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">pH:</span>
                <span className="font-medium">{waterSolution.ph}</span>
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium">{waterVolume.toFixed(0)} mL</span>
                <span className="text-gray-600">Color:</span>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: waterSolution.color }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-2">Solute</h3>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">pH:</span>
                <span className="font-medium">{soluteSolution.ph}</span>
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium">{soluteVolume.toFixed(0)} mL</span>
                <span className="text-gray-600">Color:</span>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: soluteSolution.color }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-2">Mixed Solution</h3>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">pH:</span>
                <span className="font-medium">{mixedSolution.ph}</span>
                <span className="text-gray-600">Total Volume:</span>
                <span className="font-medium">{(waterVolume + soluteVolume).toFixed(0)} mL</span>
                <span className="text-gray-600">Color:</span>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: mixedSolution.color }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold mb-2 text-blue-800">About pH</h2>
            <p className="text-sm text-blue-800">Each unit of pH represents a 10-fold change in acidity. When solutions mix, the resulting pH depends on their relative volumes and original pH values.</p>
          </div>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">About pH Scale</h2>
        <p className="text-gray-700">The pH scale measures how acidic or basic a substance is. It ranges from 0 to 14:</p>
        <div className="flex space-x-8 mt-4">
          <div className="flex-1 p-3 bg-red-50 rounded-lg">
            <h3 className="font-bold text-red-700 mb-1">Acidic (pH &lt; 7)</h3>
            <p className="text-sm text-gray-700">Solutions with excess hydrogen ions. Common examples include citrus fruits, vinegar, and battery acid.</p>
          </div>
          <div className="flex-1 p-3 bg-green-50 rounded-lg">
            <h3 className="font-bold text-green-700 mb-1">Neutral (pH = 7)</h3>
            <p className="text-sm text-gray-700">Pure water is neutral with equal hydrogen and hydroxide ions.</p>
          </div>
          <div className="flex-1 p-3 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-700 mb-1">Basic (pH &gt; 7)</h3>
            <p className="text-sm text-gray-700">Solutions with excess hydroxide ions. Common examples include baking soda, soap, and bleach.</p>
          </div>
        </div>
        <p className="mt-4 text-gray-700">Each whole pH value below 7 is ten times more acidic than the next higher value. For example, pH 4 is ten times more acidic than pH 5 and 100 times more acidic than pH 6.</p>
      </div>
    </div>
  );
}