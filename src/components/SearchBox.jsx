import React, { useState } from 'react'

const SearchBox = ({ placeholder = "Search...", onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchTerm)
    }
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    // Optional: trigger search on every keystroke
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bdc1ca]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          className="w-full h-9 pl-9 pr-9 rounded-[10px] bg-[#303030] text-[#bdc1ca] placeholder-[#bdc1ca] outline-none border border-transparent focus:border-[#6e6e6e]"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded text-[#bdc1ca] hover:bg-[#3a3a3a] flex items-center justify-center"
            onClick={() => {
              setSearchTerm('')
              if (onSearch) onSearch('')
            }}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </form>
  )
}

export default SearchBox
