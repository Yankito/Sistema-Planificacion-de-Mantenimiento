interface SelectPillProps {
  value: string | number;
  onChange: (val: string) => void;
  options: (string | number)[];
  label: string;
  allLabel?: string;
}

export const SelectPill = ({ value, onChange, options, label, allLabel }: SelectPillProps) => (
  <div className="flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
    <span className="text-[10px] font-bold text-slate-400 uppercase mr-2 tracking-wider">{label}:</span>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer hover:text-pf-red transition-colors"
    >
      {allLabel && <option value="TODAS">{allLabel}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);