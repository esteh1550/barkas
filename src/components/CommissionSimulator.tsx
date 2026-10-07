import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatRupiah, calculateListingEstimates, parseRupiahInput } from '../utils/formatters';

interface CommissionSimulatorProps {
  onApplyNettPrice: (nettPrice: number) => void;
}

export const CommissionSimulator: React.FC<CommissionSimulatorProps> = ({ onApplyNettPrice }) => {
  const [simPriceRaw, setSimPriceRaw] = useState<string>('250.000');
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  const numericNett = parseRupiahInput(simPriceRaw) || 0;
  const estimates = calculateListingEstimates(numericNett > 0 ? numericNett : 100000);

  const quickPresets = [75000, 150000, 350000, 750000, 1500000];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseRupiahInput(raw);
    if (num === 0 && raw === '') {
      setSimPriceRaw('');
      return;
    }
    setSimPriceRaw(num.toLocaleString('id-ID'));
  };

  const handleSelectPreset = (amount: number) => {
    setSimPriceRaw(amount.toLocaleString('id-ID'));
  };

  const handleApply = () => {
    if (numericNett < 10000) return;
    onApplyNettPrice(numericNett);
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  return (
    <div className="mb-6 bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-stone-800 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C25E34] font-bold block">
            SIMULASI SKEMA OPERASIONAL
          </span>
          <h3 className="text-sm sm:text-base font-serif-editorial font-bold text-stone-950">
            Kalkulator Transparansi Komisi & Estimasi Harga Tayang
          </h3>
          <p className="text-[11px] text-stone-600">
            Hitung dana bersih yang Anda terima (100% utuh tanpa potongan rahasia) dan estimasi tayang di etalase.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-stone-900 text-amber-200 border border-stone-800 shrink-0">
          GRATIS BIAYA DAFTAR
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Input */}
        <div className="md:col-span-5 space-y-2.5">
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
            Masukkan Target Harga Bersih (Nett) Anda:
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-stone-500">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={simPriceRaw}
              onChange={handleInputChange}
              placeholder="250.000"
              className="w-full pl-10 pr-4 py-2.5 border-2 border-stone-400 bg-white focus:bg-white focus:border-stone-900 focus:outline-hidden font-mono font-extrabold text-sm text-stone-900 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-stone-500 font-mono font-bold mr-1">Cepat:</span>
            {quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2 py-1 border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  numericNett === preset
                    ? 'bg-stone-900 text-amber-300 border-stone-900 shadow-[1px_1px_0px_#1C1917]'
                    : 'bg-white border-stone-400 hover:border-stone-800 hover:bg-[#FAF7F2] text-stone-800'
                }`}
              >
                {preset >= 1000000 ? `${preset / 1000000}Jt` : `${preset / 1000}rb`}
              </button>
            ))}
          </div>
        </div>

        {/* Right Breakdown */}
        <div className="md:col-span-7 bg-[#ECE5D8] border-2 border-stone-800 p-4 space-y-3 shadow-[2px_2px_0px_#1C1917]">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
              <span className="text-[10px] font-mono text-stone-600 block uppercase">Diterima Penitip</span>
              <strong className="text-xs sm:text-sm font-mono font-extrabold text-stone-950">
                {formatRupiah(numericNett > 0 ? numericNett : 0)}
              </strong>
            </div>
            <div className="p-2.5 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
              <span className="text-[10px] font-mono text-stone-600 block uppercase">Bagi Hasil Admin</span>
              <strong className="text-xs sm:text-sm font-mono font-bold text-[#C25E34]">
                +{formatRupiah(numericNett > 0 ? estimates.estimatedFee : 0)}
              </strong>
              <span className="block text-[9px] text-stone-500 font-mono">{estimates.rateDescription}</span>
            </div>
            <div className="p-2.5 bg-stone-900 text-stone-50 border border-stone-900 shadow-[2px_2px_0px_#C25E34]">
              <span className="text-[10px] text-amber-300 block font-mono uppercase">Est. Tayang</span>
              <strong className="text-xs sm:text-sm font-mono font-extrabold text-amber-200">
                {formatRupiah(numericNett > 0 ? estimates.suggestedListingPrice : 0)}
              </strong>
              <span className="block text-[9px] text-stone-400 font-mono">Kelipatan 5rb</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-stone-400">
            <span className="text-[11px] font-mono text-stone-700">
              Skema: <strong>{estimates.tierName}</strong> ({estimates.rateDescription})
            </span>

            <button
              type="button"
              onClick={handleApply}
              disabled={numericNett < 10000}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-200 font-mono font-bold text-xs border-2 border-stone-900 shadow-[2px_2px_0px_#C25E34] transition-colors cursor-pointer disabled:opacity-50"
            >
              {appliedFeedback ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Harga Diterapkan!</span>
                </>
              ) : (
                <>
                  <span>Gunakan di Form</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
