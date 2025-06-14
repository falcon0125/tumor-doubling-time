

import React, { useState, useCallback, useEffect, useRef } from 'react';
import MeasurementInput from './components/MeasurementInput.tsx';
import ResultDisplay from './components/ResultDisplay.tsx';
import { MeasurementInputData } from './types.tsx';

// Declare gtag as a global function for Google Analytics
declare global {
  interface Window {
    gtag?: (event: string, action: string, params?: Record<string, any>) => void;
  }
}

/**
 * Helper function to get today's date in YYYY-MM-DD format.
 * @returns {string} Today's date as a string.
 */
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Moved outside component for stability and to prevent re-creation on every render.
const initialMeasurementBase = { diameter: '', volume: '' }; 

interface ProcessDatesOutput {
  days: number | null; // Number of days (non-negative). Null if invalid date format.
  error: string | null; // Error message for invalid format or M2 < M1. Null if M2 >= M1 and format is valid.
}

/**
 * Processes two date strings, calculates the difference in days, and validates.
 * Dates are normalized to midnight UTC for robust day difference calculation.
 * @param {string} time1Str - The first date string (YYYY-MM-DD).
 * @param {string} time2Str - The second date string (YYYY-MM-DD).
 * @returns {ProcessDatesOutput} Object containing days difference and any error.
 */
const processDates = (time1Str: string, time2Str: string): ProcessDatesOutput => {
  // This function assumes non-empty strings are validated by the caller if critical.
  // For this app, `handleCalculate` checks for empty dates before calling.
  // `useEffect` for durationDisplay also checks for empty dates.

  const d1 = new Date(time1Str);
  const d2 = new Date(time2Str);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return { days: null, error: 'Invalid date selected for one or both measurements.' };
  }

  // Normalize dates to midnight UTC to compare calendar dates accurately, avoiding DST/timezone issues.
  const normDate1 = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate()));
  const normDate2 = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()));

  const diffMs = normDate2.getTime() - normDate1.getTime();

  if (diffMs < 0) {
    // Measurement 2 date is before Measurement 1 date
    return { days: null, error: 'Date for Measurement 2 must be after or the same as Date for Measurement 1.' };
  }

  // Convert milliseconds to days
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return { days: diffDays, error: null };
};


/**
 * @component TumorCalculatorApp
 * @description Main application component for calculating Tumor Volume Doubling Time (TVDT).
 * It allows users to input two tumor measurements (diameter or volume) at two different dates,
 * calculates the TVDT, and displays the result along with a risk assessment.
 */
const TumorCalculatorApp: React.FC = () => {
  // State for the first measurement's data (diameter/volume and date)
  const [measurement1, setMeasurement1] = useState<MeasurementInputData>({ ...initialMeasurementBase, time: '' });
  // State for the second measurement's data, defaults date to today
  const [measurement2, setMeasurement2] = useState<MeasurementInputData>({ ...initialMeasurementBase, time: getTodayDateString() });
  // State to store the calculated Tumor Volume Doubling Time (TVDT) in days
  const [tvdt, setTvdt] = useState<number | null>(null);
  // State to store any error messages that occur during validation or calculation
  const [error, setError] = useState<string | null>(null);
  // State to display the duration in days between the two selected measurement dates
  const [durationDisplay, setDurationDisplay] = useState<string | null>(null);
  // State to track if a calculation has been attempted, used to conditionally show the results section
  const [hasCalculated, setHasCalculated] = useState<boolean>(false); 

  /**
   * Callback to handle changes in the first measurement's input fields.
   * @param {keyof MeasurementInputData} field - The specific field that changed (e.g., 'diameter', 'volume', 'time').
   * @param {string} value - The new value of the field.
   */
  const handleM1Change = useCallback((field: keyof MeasurementInputData, value: string) => {
    setMeasurement1(prev => ({ ...prev, [field]: value }));
    setHasCalculated(false); // Reset calculation state if inputs change
    setTvdt(null); // Clear previous results
    setError(null); // Clear previous errors
  }, []);

  /**
   * Callback to handle changes in the second measurement's input fields.
   * @param {keyof MeasurementInputData} field - The specific field that changed.
   * @param {string} value - The new value of the field.
   */
  const handleM2Change = useCallback((field: keyof MeasurementInputData, value: string) => {
    setMeasurement2(prev => ({ ...prev, [field]: value }));
    setHasCalculated(false); // Reset calculation state if inputs change
    setTvdt(null); // Clear previous results
    setError(null); // Clear previous errors
  }, []);

  /**
   * Effect hook to calculate and display the duration between the two measurement dates.
   * Updates whenever measurement1.time or measurement2.time changes.
   */
  useEffect(() => {
    // This effect calculates and displays the duration between the two selected dates.
    if (!measurement1.time || !measurement2.time) {
      setDurationDisplay(null);
      return;
    }
    
    const { days, error: dateProcessingError } = processDates(measurement1.time, measurement2.time);

    if (!dateProcessingError && days !== null) { // days can be 0 or positive
      setDurationDisplay(`${days} day${days === 1 ? '' : 's'}`);
    } else {
      // If processDates returns an error (e.g. M2 < M1, or invalid format), durationDisplay becomes null
      setDurationDisplay(null);
    }
  }, [measurement1.time, measurement2.time]);

  /**
   * Calculates the volume from a measurement input.
   * Expects either diameter or volume to be provided, not both or neither.
   * @param {MeasurementInputData} measurement - The measurement data object.
   * @param {string} measurementLabel - A label for the measurement (e.g., "First Measurement") for error messages.
   * @returns {number | { error: string }} The calculated volume, or an error object if input is invalid.
   */
  const getVolumeFromMeasurement = useCallback((measurement: MeasurementInputData, measurementLabel: string): number | { error: string } => {
    const diameterStr = measurement.diameter.trim();
    const volumeStr = measurement.volume.trim();

    // Validate that either diameter or volume is filled, but not both
    if (diameterStr && volumeStr) {
      return { error: `For ${measurementLabel}, please provide a value for EITHER Diameter OR Volume, not both.` };
    }
    if (!diameterStr && !volumeStr) {
      return { error: `For ${measurementLabel}, please provide a value for EITHER Diameter OR Volume.` };
    }

    if (diameterStr) {
      const d = parseFloat(diameterStr);
      if (isNaN(d) || d <= 0) {
        return { error: `For ${measurementLabel}, Diameter must be a positive number.` };
      }
      // Calculate volume from diameter: V = (4/3)πr³ = (4/3)π(d/2)³
      return (4 / 3) * Math.PI * Math.pow(d / 2, 3);
    } else { // Volume string must be present due to earlier checks
      const v = parseFloat(volumeStr);
      if (isNaN(v) || v <= 0) {
        return { error: `For ${measurementLabel}, Volume must be a positive number.` };
      }
      return v;
    }
  }, []); 


  /**
   * Callback to perform the TVDT calculation.
   * Validates inputs, calculates volumes, and then calculates TVDT.
   * Sets error messages or TVDT result accordingly.
   */
  const handleCalculate = useCallback(() => {
    // Send Google Analytics events upon button click
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'button_click', {
        'event_category': 'Calculator',
        'event_label': 'Calculate TVDT'
      });
      window.gtag('event', 'tvdt_button_click');
    }
    
    setError(null); // Clear previous errors
    setTvdt(null);  // Clear previous TVDT

    // Validate that both measurement dates are provided before calling processDates
    if (!measurement1.time || !measurement2.time) {
      setError('Please select a date for both measurements.');
      setHasCalculated(false);
      return;
    }

    const { days: differenceInDays, error: dateProcessingError } = processDates(measurement1.time, measurement2.time);

    if (dateProcessingError) { // This catches invalid format OR M2 < M1 as per processDates logic
      setError(dateProcessingError);
      setHasCalculated(false);
      return;
    }
    
    // For TVDT calculation, M2 must be strictly after M1
    // differenceInDays from processDates will be non-null and non-negative if no error.
    if (differenceInDays === null || differenceInDays <= 0) { 
      setError('Date for Measurement 2 must be strictly later than Date for Measurement 1 for TVDT calculation.');
      setHasCalculated(false);
      return;
    }

    // Get volume for the first measurement
    const volume1Result = getVolumeFromMeasurement(measurement1, "First Measurement");
    if (typeof volume1Result === 'object' && volume1Result.error) {
      setError(volume1Result.error);
      setHasCalculated(false);
      return;
    }
    const volume1 = volume1Result as number;

    // Get volume for the second measurement
    const volume2Result = getVolumeFromMeasurement(measurement2, "Second Measurement");
    if (typeof volume2Result === 'object' && volume2Result.error) {
      setError(volume2Result.error);
      setHasCalculated(false);
      return;
    }
    const volume2 = volume2Result as number;
    
    // If all pre-calculation checks pass, mark that calculation has been attempted
    setHasCalculated(true);

    // Handle cases where TVDT is not applicable or calculable
    if (volume2 < volume1) {
      setError('Tumor is shrinking. TVDT is not applicable for shrinking tumors (Volume 2 should be > Volume 1).');
      setTvdt(-1); // Use -1 to indicate shrinking tumor for ResultDisplay
      return;
    }
    if (volume2 === volume1) {
      setError('Tumor volume has not changed. Doubling time is effectively infinite or cannot be calculated.');
      // tvdt remains null, ResultDisplay will show its default message for null TVDT.
      return;
    }

    // Calculate TVDT using the formula: TVDT = (Δt * ln(2)) / ln(V₂ / V₁)
    const logRatio = Math.log(volume2 / volume1);
    // Check for very small logRatio to prevent division by zero or instability
    if (logRatio <= 1e-9) { 
      setError('Calculated volumes are too close or Volume 2 is not sufficiently greater than Volume 1 for a stable doubling time calculation.');
      return;
    }

    const tvdtValue = differenceInDays * Math.log(2) / logRatio;
    setTvdt(tvdtValue);
    setError(null); // Clear any previous non-blocking error if calculation is successful
  }, [measurement1, measurement2, getVolumeFromMeasurement]); 
  
  /**
   * Callback to reset all input fields and results to their initial states.
   */
  const handleReset = useCallback(() => {
    setMeasurement1({ ...initialMeasurementBase, time: '' });
    setMeasurement2({ ...initialMeasurementBase, time: getTodayDateString() });
    setTvdt(null);
    setError(null);
    setDurationDisplay(null);
    setHasCalculated(false); // Reset calculation state
  }, []); 


  // JSX for the component's UI
  return (
    <div id="tumor-calculator-app-container" className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4 flex flex-col items-center" role="application">
      <div className="w-full max-w-3xl">
        {/* Header Section */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            Tumor Volume Doubling Time <span className="text-sky-400">(TVDT)</span> Calculator
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Enter two tumor measurements (providing either diameter or volume for each) and their respective dates to calculate TVDT.
          </p>
        </header>

        {/* Main Content Area */}
        <main className="space-y-8">
          {/* Measurement Inputs Grid */}
          <div id="measurement-inputs-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-6"> {/* Adjusted gap for responsiveness */}
            <MeasurementInput
              idPrefix="m1"
              title="First Measurement (Baseline)"
              data={measurement1}
              onDataChange={handleM1Change}
            />
            <MeasurementInput
              idPrefix="m2"
              title="Second Measurement (Follow-up)"
              data={measurement2}
              onDataChange={handleM2Change}
            />
          </div>

          {/* Duration Display Section (shows difference between selected dates) */}
          {durationDisplay && (
            <div id="duration-display-section" className="my-6 p-3 bg-slate-800 rounded-md shadow-md text-center">
              <p className="text-slate-300">
                Selected Duration: <span className="font-semibold text-sky-400">{durationDisplay}</span>
              </p>
            </div>
          )}

          {/* Error Message Display Section */}
          {error && ( 
            <div id="error-message-section" className="p-4 bg-red-900 border border-red-700 text-red-300 rounded-md shadow-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons: Calculate and Reset */}
          <div id="action-buttons-container" className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
            <button
              onClick={handleCalculate}
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition duration-150 ease-in-out transform hover:scale-105"
            >
              Calculate TVDT
            </button>
             <button
              onClick={handleReset}
              className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 transition duration-150 ease-in-out transform hover:scale-105"
            >
              Reset Fields
            </button>
          </div>
          
          {/* Result Display Section (conditionally rendered) */}
          {hasCalculated && <ResultDisplay tvdt={tvdt} />}

        </main>
        
        {/* Footer Section */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-slate-400">
            Disclaimer: This calculator is for informational purposes only and should not be used for medical diagnosis or treatment decisions. Always consult with a qualified healthcare professional. This table underscores that TDT is one of several critical features that must be considered in conjunction. This multi-factorial approach is essential for accurate diagnosis and risk stratification, moving beyond a simplistic interpretation of TDT alone and promoting a holistic assessment.
          </p>
          {/* TVDT Formula Details */}
          <div id="tvdt-formula-details" className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-700"> {/* Added border for separation */}
            <p className="font-semibold">TVDT Formula Used:</p>
            {/* The TVDT formula displayed using HTML and subscript for clarity */}
            <p 
              className="mt-1 text-base" 
              aria-label="TVDT formula reads: T V D T equals delta t multiplied by the natural logarithm of 2, all divided by the natural logarithm of (Volume 2 divided by Volume 1)."
            >
              TVDT = (&Delta;t &times; ln(2)) / ln(V<sub>2</sub>/V<sub>1</sub>)
            </p>
            <ul className="mt-2 list-none text-xs"> 
              <li>&Delta;t: Time interval between measurements (days)</li>
              <li>ln: Natural logarithm</li>
              <li>V<sub>1</sub>: Tumor volume at the first measurement</li>
              <li>V<sub>2</sub>: Tumor volume at the second measurement</li>
            </ul>
          </div>
          {/* Sphere Volume Formula */}
          <p className="text-xs text-slate-500 mt-3">
            Sphere volume formula used: V = (4/3)&pi;r&sup3;
          </p>
          {/* Link to med-flow.org */}
          <p className="text-xs text-slate-500 mt-3">
            <a 
              href="https://med-flow.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sky-400 hover:text-sky-300 underline transition-colors duration-150"
            >
              Visit med-flow.org
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TumorCalculatorApp;
