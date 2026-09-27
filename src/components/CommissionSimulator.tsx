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
    <div className="mb-6 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-[#1B365D]">
            Kalkulator Simulasi Komisi & Harga Tayang Instagram
          </h3>
          <p className="text-[11px] text-slate-500">
            Cek berapa dana bersih yang Anda terima (100% utuh) dan estimasi harga jual di feed @info.barkasmajalengka.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700">
          Gratis Biaya Pendaftaran Awal
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Input */}
        <div className="md:col-span-5 space-y-2.5">
          <label className="block text-xs font-bold text-slate-700">
            Masukkan Target Harga Bersih (Nett) Anda:
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={simPriceRaw}
              onChange={handleInputChange}
              placeholder="250.000"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden font-mono font-extrabold text-sm text-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">Cepat:</span>
            {quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  numericNett === preset
                    ? 'bg-[#1B365D] text-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {preset >= 1000000 ? `${preset / 1000000}Jt` : `${preset / 1000}rb`}
              </button>
            ))}
          </div>
        </div>

        {/* Right Breakdown */}
        <div className="md:col-span-7 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/90 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 block">Diterima Penitip (100%)</span>
              <strong className="text-xs sm:text-sm font-mono font-extrabold text-emerald-700">
                {formatRupiah(numericNett > 0 ? numericNett : 0)}
              </strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 block">Bagi Hasil Admin</span>
              <strong className="text-xs sm:text-sm font-mono font-bold text-amber-700">
                + {formatRupiah(numericNett > 0 ? estimates.estimatedFee : 0)}
              </strong>
              <span className="block text-[9px] text-slate-400">{estimates.rateDescription}</span>
            </div>
            <div className="p-2.5 bg-[#1B365D] text-white rounded-xl">
              <span className="text-[10px] text-amber-200 block">Est. Harga Tayang IG</span>
              <strong className="text-xs sm:text-sm font-mono font-extrabold text-amber-300">
                {formatRupiah(numericNett > 0 ? estimates.suggestedListingPrice : 0)}
              </strong>
              <span className="block text-[9px] text-slate-300">Termasuk ruang nego</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-600">
              Skema otomatis: <strong>{estimates.tierName}</strong> ({estimates.rateDescription})
            </span>

            <button
              type="button"
              onClick={handleApply}
              disabled={numericNett < 10000}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#1B365D] font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {appliedFeedback ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Harga Diterapkan ke Form!</span>
                </>
              ) : (
                <>
                  <span>Gunakan Harga Ini di Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
