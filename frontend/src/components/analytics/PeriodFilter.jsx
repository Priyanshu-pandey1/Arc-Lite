import { TIME_PERIODS } from '../../utils/constants'

/**
 * 7D / 30D / 90D / ALL segmented time filter from the dashboard header.
 */
export default function PeriodFilter({ period, onChange }) {
  return (
    <div
      aria-label="Time period selector"
      className="flex items-center self-start sm:self-auto bg-[#130f28] p-1 rounded-full border border-[#251c45]"
      role="group"
    >
      {TIME_PERIODS.map((option) => (
        <button
          aria-pressed={period === option}
          className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
            period === option
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-[#8b85a6] hover:text-white'
          }`}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}
