import React from 'react'

const FilterTabs = ({ value = 'All', onChange, options = ['All','Active','Draft','Archived'] }) => {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap md:flex-nowrap overflow-x-auto">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange && onChange(opt)}
          className={`h-8 px-3 rounded-full text-sm whitespace-nowrap ${
            value === opt
              ? 'bg-[#1a1a1a] text-white'
              : 'bg-white border border-gray-300 text-gray-800'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default FilterTabs
