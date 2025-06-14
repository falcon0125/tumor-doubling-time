import React from 'react';
import { RiskProfile } from '../types.tsx'; 

interface ResultDisplayProps {
  tvdt: number | null;
}

const getRiskProfile = (tvdtValue: number | null): RiskProfile => {
  if (tvdtValue === null) {
    return { label: 'Awaiting calculation...', color: 'bg-slate-700', textColor: 'text-slate-300' };
  }
  if (tvdtValue < 0) { 
    return { label: 'Shrinking / Error', color: 'bg-sky-700', textColor: 'text-sky-100' };
  }
  if (tvdtValue < 400) {
    return { label: 'Dangerous', color: 'bg-red-600', textColor: 'text-white' };
  }
  if (tvdtValue < 600) {
    return { label: 'Caution', color: 'bg-yellow-500', textColor: 'text-black' };
  }
  return { label: 'Less Concern', color: 'bg-green-600', textColor: 'text-white' };
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ tvdt }) => {
  const riskProfile = getRiskProfile(tvdt);

  return (
    <div className="mt-8 p-6 bg-slate-800 rounded-lg shadow-xl">
      <h3 className="text-2xl font-semibold text-slate-100 mb-4 text-center">Result</h3>
      {tvdt !== null ? (
        <div className="text-center">
          <p className="text-lg text-slate-300 mb-4">Tumor Volume Doubling Time (TVDT)</p>
          <p className="text-4xl font-bold text-slate-100 mb-2"> {/* Changed text-sky-400 to text-slate-100 */}
            {tvdt.toFixed(2)} days
          </p>
          
          
          <div className={`w-full h-10 rounded-md flex items-center justify-center transition-colors duration-300 ease-in-out ${riskProfile.color}`}>
            <span className={`font-semibold ${riskProfile.textColor}`}>
              {riskProfile.label}
            </span>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-300">Risk Indication Key:</p>
            <ul className="list-none list-inside ml-0 sm:ml-4 text-left sm:text-center mt-2 space-y-1">
              {/* Using brighter colors for text in dark mode for better contrast against slate-800 if not on the colored bar itself */}
              <li><span className="font-medium text-red-400">{'< 400 days:'}</span> Dangerous</li>
              <li><span className="font-medium text-yellow-400">{'400 - 599 days:'}</span> Caution</li>
              <li><span className="font-medium text-green-400">{'>= 600 days:'}</span> Less Concern</li>
            </ul>
          </div>
        </div>
      ) : (
        <p className={`text-center py-4 font-medium ${riskProfile.textColor}`}>{riskProfile.label}</p>
      )}
    </div>
  );
};

export default ResultDisplay;