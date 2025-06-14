
import React from 'react';
import { MeasurementInputData } from '../types.tsx';

interface MeasurementInputProps {
  idPrefix: string;
  title: string;
  data: MeasurementInputData;
  onDataChange: (field: keyof MeasurementInputData, value: string) => void;
}

const MeasurementInput: React.FC<MeasurementInputProps> = ({ idPrefix, title, data, onDataChange }) => {
  const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onDataChange('diameter', newValue);
    if (newValue.trim() !== '') {
      onDataChange('volume', ''); 
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onDataChange('volume', newValue);
    if (newValue.trim() !== '') {
      onDataChange('diameter', ''); 
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange('time', e.target.value);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl space-y-4 h-full flex flex-col">
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 italic">Please fill in EITHER Diameter OR Volume below.</p>
      
      <div className="flex-grow space-y-4">
        <div>
          <label htmlFor={`${idPrefix}-diameter`} className="block text-sm font-medium text-slate-300 mb-1">
            Diameter (mm)
          </label>
          <input
            type="number"
            id={`${idPrefix}-diameter`}
            value={data.diameter}
            onChange={handleDiameterChange}
            placeholder="e.g., 10"
            step="0.1" // Added step attribute
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 placeholder-slate-500"
            aria-describedby={`${idPrefix}-dimension-instruction`}
          />
        </div>

        {/* Removed the "OR" text separator here */}

        <div>
          <label htmlFor={`${idPrefix}-volume`} className="block text-sm font-medium text-slate-300 mb-1">
            Volume (mm³)
          </label>
          <input
            type="number"
            id={`${idPrefix}-volume`}
            value={data.volume}
            onChange={handleVolumeChange}
            placeholder="e.g., 523"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 placeholder-slate-500"
            aria-describedby={`${idPrefix}-dimension-instruction`}
          />
        </div>
        <p id={`${idPrefix}-dimension-instruction`} className="sr-only">Enter diameter or volume, not both.</p>
      </div>


      <div className="mt-auto">
        <label htmlFor={`${idPrefix}-time`} className="block text-sm font-medium text-slate-300 mb-1">
          Date of Measurement
        </label>
        <input
          type="date" // Changed from "number" to "date"
          id={`${idPrefix}-time`}
          value={data.time} // Expects "YYYY-MM-DD"
          onChange={handleTimeChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 placeholder-slate-500"
        />
      </div>
    </div>
  );
};

export default MeasurementInput;
