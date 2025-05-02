import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Sun, Moon } from 'lucide-react';
import * as math from 'mathjs';

const CurveFittingSimulation = () => {
  const canvasWidth = 600;
  const canvasHeight = 400;
  const xMin = -10;
  const xMax = 10;
  const yMin = -10;
  const yMax = 10;

  const generateInitialPoints = () =>
    Array.from({ length: 8 }, (_, i) => ({
      x: (i + 1) * 2 - 10,
      y: Math.random() * 10 - 5,
      error: 1,
    }));

  const [points, setPoints] = useState(generateInitialPoints());
  const [fitType, setFitType] = useState('quadratic');
  const [coefficients, setCoefficients] = useState([]);
  const [showCurve, setShowCurve] = useState(true);
  const [showResiduals, setShowResiduals] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [chiSquare, setChiSquare] = useState(0);
  const [reducedChiSquare, setReducedChiSquare] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const canvasRef = useRef(null);
  const fitTimeoutRef = useRef(null);

  const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * canvasWidth;
  const toCanvasY = (y) => canvasHeight - ((y - yMin) / (yMax - yMin)) * canvasHeight;
  const fromCanvasX = (px) => (px / canvasWidth) * (xMax - xMin) + xMin;
  const fromCanvasY = (py) => yMin + (1 - py / canvasHeight) * (yMax - yMin);

  const evaluatePolynomial = (x, coeffs) => {
    if (!coeffs || coeffs.length === 0) return 0;
    return coeffs.reduce((sum, coeff, i) => sum + (coeff || 0) * Math.pow(x, i), 0);
  };

  const fitPolynomial = () => {
    const degree = { linear: 1, quadratic: 2, cubic: 3, best: 2 }[fitType] || 2;
    const X = [];
    const y = [];
    const weights = [];

    points.forEach((p) => {
      const row = [];
      for (let i = 0; i <= degree; i++) {
        row.push(Math.pow(p.x, i));
      }
      X.push(row);
      y.push([p.y]);
      weights.push(1 / (p.error * p.error));
    });

    const W = math.diag(weights);
    const Xt = math.transpose(X);
    const XtWX = math.multiply(Xt, W, X);
    const XtWy = math.multiply(Xt, W, y);
    let coeffs;
    try {
      coeffs = math.squeeze(math.lusolve(XtWX, XtWy));
    } catch (e) {
      console.warn('Singular matrix, using zeros');
      coeffs = Array(degree + 1).fill(0);
    }

    if (!Array.isArray(coeffs)) coeffs = [coeffs];
    // Ensure the coefficients array matches the degree
    coeffs = coeffs.slice(0, degree + 1);
    while (coeffs.length < degree + 1) coeffs.push(0);

    let chi2 = 0;
    points.forEach((p) => {
      const yFit = evaluatePolynomial(p.x, coeffs);
      chi2 += Math.pow((p.y - yFit) / p.error, 2);
    });
    const dof = points.length - (degree + 1);
    const reducedChi2 = dof > 0 ? chi2 / dof : 0;

    setCoefficients(coeffs);
    setChiSquare(chi2);
    setReducedChiSquare(reducedChi2);
  };

  const getTarget = (mx, my) => {
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      const ey = (p.error / (yMax - yMin)) * canvasHeight;

      // Increase hit area for points to make them easier to grab
      if (Math.hypot(cx - mx, cy - my) <= 10) {
        return { type: 'point', index: i };
      }

      if (Math.hypot(cx - mx, (cy - ey) - my) <= 6) {
        return { type: 'errorTop', index: i };
      }
      if (Math.hypot(cx - mx, (cy + ey) - my) <= 6) {
        return { type: 'errorBottom', index: i };
      }
    }
    return null;
  };

  const drawGraph = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Set background based on theme
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    ctx.strokeStyle = isDarkMode ? '#4b5563' : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = xMin; x <= xMax; x += 5) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), toCanvasY(yMin));
      ctx.lineTo(toCanvasX(x), toCanvasY(yMax));
      ctx.stroke();
    }
    for (let y = yMin; y <= yMax; y += 5) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(xMin), toCanvasY(y));
      ctx.lineTo(toCanvasX(xMax), toCanvasY(y));
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = isDarkMode ? '#d1d5db' : '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xMin), toCanvasY(0));
    ctx.lineTo(toCanvasX(xMax), toCanvasY(0));
    ctx.moveTo(toCanvasX(0), toCanvasY(yMin));
    ctx.lineTo(toCanvasX(0), toCanvasY(yMax));
    ctx.stroke();

    // Draw fitted curve
    if (showCurve && coefficients.length > 0) {
      ctx.strokeStyle = isDarkMode ? '#f97316' : '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= canvasWidth; px += 2) {
        const x = fromCanvasX(px);
        const y = evaluatePolynomial(x, coefficients);
        if (y >= yMin && y <= yMax) {
          ctx[px === 0 ? 'moveTo' : 'lineTo'](px, toCanvasY(y));
        }
      }
      ctx.stroke();
    }

    // Draw points with error bars
    points.forEach((p, index) => {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      const ey = (p.error / (yMax - yMin)) * canvasHeight;

      // Draw error bars
      ctx.strokeStyle = isDarkMode ? '#d1d5db' : '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - ey);
      ctx.lineTo(cx, cy + ey);
      ctx.moveTo(cx - 5, cy - ey);
      ctx.lineTo(cx + 5, cy - ey);
      ctx.moveTo(cx - 5, cy + ey);
      ctx.lineTo(cx + 5, cy + ey);
      ctx.stroke();

      // Draw error handles
      const isTopHovered = hoverTarget?.type === 'errorTop' && hoverTarget.index === index;
      const isBottomHovered = hoverTarget?.type === 'errorBottom' && hoverTarget.index === index;
      
      ctx.fillStyle = isTopHovered ? '#ef4444' : '#f97316';
      ctx.beginPath();
      ctx.arc(cx, cy - ey, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = isBottomHovered ? '#ef4444' : '#f97316';
      ctx.beginPath();
      ctx.arc(cx, cy + ey, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw data point
      const isPointHovered = hoverTarget?.type === 'point' && hoverTarget.index === index;
      const isDragging = dragging?.index === index && dragging.type === 'point';
      
      ctx.fillStyle = isDragging ? '#ef4444' : isPointHovered ? '#60a5fa' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx, cy, isPointHovered || isDragging ? 9 : 7, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = isDarkMode ? '#1f2937' : '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, isPointHovered || isDragging ? 10 : 8, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw residuals
      if (showResiduals && coefficients.length > 0) {
        const yFit = evaluatePolynomial(p.x, coefficients);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, toCanvasY(yFit));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const target = getTarget(mx, my);
    
    if (target) {
      setDragging(target);
      e.preventDefault();
      
      if (target.type === 'point') {
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grabbing';
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const target = getTarget(mx, my);
    setHoverTarget(target);

    // Update cursor style based on hover target
    if (canvasRef.current) {
      canvasRef.current.style.cursor = target
        ? target.type === 'point'
          ? dragging?.type === 'point' ? 'grabbing' : 'grab'
          : 'ns-resize'
        : 'default';
    }

    // Handle dragging
    if (dragging) {
      e.preventDefault();
      if (dragging.type === 'point') {
        setPoints((prev) => {
          const newPoints = [...prev];
          const p = { ...newPoints[dragging.index] };
          let x = fromCanvasX(mx);
          let y = fromCanvasY(my);
          x = Math.max(xMin + 0.1, Math.min(xMax - 0.1, x));
          y = Math.max(yMin + 0.1, Math.min(yMax - 0.1, y));
          newPoints[dragging.index] = { ...p, x, y };
          return newPoints;
        });
        
        // Update the fit with debounce
        if (!isManual) {
          if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
          fitTimeoutRef.current = setTimeout(() => {
            fitPolynomial();
          }, 100);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = hoverTarget ? 'grab' : 'default';
      }
      if (!isManual) fitPolynomial();
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (dragging && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        if (dragging.type === 'point') {
          setPoints((prev) => {
            const newPoints = [...prev];
            const p = { ...newPoints[dragging.index] };
            let x = fromCanvasX(mx);
            let y = fromCanvasY(my);
            x = Math.max(xMin + 0.1, Math.min(xMax - 0.1, x));
            y = Math.max(yMin + 0.1, Math.min(yMax - 0.1, y));
            newPoints[dragging.index] = { ...p, x, y };
            return newPoints;
          });
          
          if (!isManual) {
            if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
            fitTimeoutRef.current = setTimeout(() => {
              fitPolynomial();
            }, 100);
          }
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragging) {
        setDragging(null);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = hoverTarget ? 'grab' : 'default';
        }
        if (!isManual) fitPolynomial();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
    };
  }, [dragging, isManual, hoverTarget]);

  const handleCoefficientChange = (index, value) => {
    const newCoeffs = [...coefficients];
    newCoeffs[index] = parseFloat(value);
    setCoefficients(newCoeffs);
    setIsManual(true);

    // Recalculate chi-square
    let chi2 = 0;
    points.forEach((p) => {
      const yFit = evaluatePolynomial(p.x, newCoeffs);
      chi2 += Math.pow((p.y - yFit) / p.error, 2);
    });
    const degree = { linear: 1, quadratic: 2, cubic: 3, best: 2 }[fitType] || 2;
    const dof = points.length - (degree + 1);
    setChiSquare(chi2);
    setReducedChiSquare(dof > 0 ? chi2 / dof : 0);
  };

  const resetSimulation = () => {
    setPoints(generateInitialPoints());
    setFitType('quadratic');
    setShowCurve(true);
    setShowResiduals(false);
    setShowValues(false);
    setIsManual(false);
    setDragging(null);
    setHoverTarget(null);
    
    // Need to reset coefficients but wait for points to update first
    setTimeout(() => {
      fitPolynomial();
    }, 10);
  };

  // Generate default coefficients when fit type changes
  useEffect(() => {
    if (!isManual) {
      fitPolynomial();
    }
  }, [points, fitType]);

  // Redraw when any visual state changes
  useEffect(() => {
    drawGraph();
  }, [
    coefficients, 
    points, 
    showCurve, 
    showResiduals, 
    dragging, 
    hoverTarget, 
    isDarkMode
  ]);

  // Initial fitting on component mount
  useEffect(() => {
    fitPolynomial();
  }, []);

  // Handle fit type change
  const handleFitTypeChange = (type) => {
    setFitType(type);
    setIsManual(false);
    // Clear any pending fits
    if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
    // Immediate fit for better responsiveness
    setTimeout(() => {
      fitPolynomial();
    }, 10);
  };

  // Switch to manual mode with current coefficients
  const handleManualModeChange = () => {
    // If we don't have coefficients yet, calculate them first
    if (coefficients.length === 0) {
      fitPolynomial();
    }
    setIsManual(true);
  };

  const getEquation = () => {
    if (coefficients.length === 0) return 'y = 0';
    const degree = { linear: 1, quadratic: 2, cubic: 3, best: 2 }[fitType] || 2;
    let equation = 'y = ';
    const terms = [];
    for (let i = degree; i >= 0; i--) {
      const coeff = coefficients[i] || 0;
      if (Math.abs(coeff) < 0.001 && i !== 0) continue;
      
      const formattedCoeff = Math.abs(coeff) < 0.01 ? '0.00' : coeff.toFixed(2);
      
      if (i === 0) {
        terms.push(`${formattedCoeff}`);
      } else if (i === 1) {
        terms.push(`${formattedCoeff}x`);
      } else {
        terms.push(`${formattedCoeff}x^${i}`);
      }
    }
    
    if (terms.length === 0) return 'y = 0';
    
    // Join terms with proper signs
    return 'y = ' + terms.join(' + ').replace(/\+ -/g, '- ');
  };

  const getEquationFormat = () => {
    const degree = { linear: 1, quadratic: 2, cubic: 3, best: 2 }[fitType] || 2;
    if (degree === 1) return 'y = ax + b';
    if (degree === 2) return 'y = ax² + bx + c';
    if (degree === 3) return 'y = ax³ + bx² + cx + d';
    return 'y = 0';
  };

  const getParamLabels = () => {
    const degree = { linear: 1, quadratic: 2, cubic: 3, best: 2 }[fitType] || 2;
    if (degree === 1) return ['b', 'a'];
    if (degree === 2) return ['c', 'b', 'a'];
    if (degree === 3) return ['d', 'c', 'b', 'a'];
    return [];
  };

  const getDeviations = () => {
    return points.map((p) => {
      const yFit = evaluatePolynomial(p.x, coefficients);
      const deviation = p.y - yFit;
      return { x: p.x, y: p.y, yFit, deviation };
    });
  };

  return (
    <div className={`flex flex-col items-center p-4 min-h-screen ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`}>
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} hover:bg-opacity-80 transition`}
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex flex-row gap-4 w-full max-w-6xl">
        {/* Left Panel - Deviations */}
        <div className={`flex flex-col items-center ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg shadow-md p-2 w-32`}>
          <h2 className="text-lg font-semibold mb-2 text-orange-600">Deviations</h2>
          <div className={`w-10 h-48 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-lg relative`}>
            <div
              className="absolute bottom-0 w-full bg-blue-600 rounded-b-lg"
              style={{ height: `${Math.min(reducedChiSquare * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2">χ² = {chiSquare.toFixed(2)}</p>
          <p className="text-sm">r² = {reducedChiSquare.toFixed(2)}</p>
        </div>

        {/* Center - Graph */}
        <div className={`flex-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg shadow-md p-4 relative`}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} w-full`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {getEquation()}
          </div>
          <div className={`flex justify-between mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>X: {xMin} to {xMax}</span>
            <span>Y: {yMin} to {yMax}</span>
          </div>
        </div>

        {/* Right Panel - Controls */}
        <div className={`flex flex-col ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg shadow-md p-4 w-48`}>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={showCurve}
              onChange={() => setShowCurve(!showCurve)}
              className="mr-2 accent-blue-500"
            />
            <span className="text-sm">Show Curve</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={showResiduals}
              onChange={() => setShowResiduals(!showResiduals)}
              className="mr-2 accent-blue-500"
            />
            <span className="text-sm">Show Residuals</span>
          </label>
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={showValues}
              onChange={() => setShowValues(!showValues)}
              className="mr-2 accent-blue-500"
            />
            <span className="text-sm">Show Values</span>
          </label>
          
          <div className="mb-4 border-t border-b py-2">
            <h3 className="text-sm font-medium mb-2">Fit Type</h3>
            {['linear', 'quadratic', 'cubic'].map((type) => (
              <label key={type} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="fitType"
                  value={type}
                  checked={fitType === type && !isManual}
                  onChange={() => handleFitTypeChange(type)}
                  className="mr-2 accent-blue-500"
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
            <label className="flex items-center">
              <input
                type="radio"
                name="fitType"
                value="adjustable"
                checked={isManual}
                onChange={handleManualModeChange}
                className="mr-2 accent-blue-500"
              />
              <span className="text-sm">Adjustable fit</span>
            </label>
          </div>
          
          {/* Coefficient sliders for manual mode */}
          {isManual && coefficients.length > 0 && (
            <div className="mb-2">
              <h3 className="text-sm font-medium mb-2">Parameters</h3>
              {coefficients.map((coeff, i) => (
                <div key={i} className="mb-2">
                  <label className="text-sm flex justify-between items-center">
                    <span>{getParamLabels()[i]}</span>
                    <span className="ml-2">{coeff.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={coeff}
                    onChange={(e) => handleCoefficientChange(i, e.target.value)}
                    className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-lg appearance-none cursor-pointer`}
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-2 text-sm">
            <p className="text-center">Form: {getEquationFormat()}</p>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between w-full max-w-6xl mt-4">
        {/* Bottom Left - Info */}
        <div className="w-32 text-center">
          <p className="text-sm">Drag blue points to adjust data</p>
        </div>

        {/* Bottom Center - Deviations Table */}
        {showValues && (
          <div className={`flex-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg shadow-md p-4`}>
            <h3 className="text-sm font-medium mb-2">Point Values & Deviations</h3>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>X</th>
                  <th className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>Y</th>
                  <th className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>Y (fit)</th>
                  <th className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>Deviation</th>
                </tr>
              </thead>
              <tbody>
                {getDeviations().map((d, i) => (
                  <tr key={i}>
                    <td className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>{d.x.toFixed(2)}</td>
                    <td className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>{d.y.toFixed(2)}</td>
                    <td className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>{d.yFit.toFixed(2)}</td>
                    <td className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} px-2 py-1`}>{d.deviation.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Right - Reset Button */}
        <button
          onClick={resetSimulation}
          className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition"
          title="Reset Simulation"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default CurveFittingSimulation;