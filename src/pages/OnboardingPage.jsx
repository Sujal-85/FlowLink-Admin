import React, { useMemo, useState, useEffect } from 'react'
import { useHistory, Redirect } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import logo from '../assets/flowlink-logo-white.png'

const STORAGE_KEY_DONE = 'flowlink_onboarding_done'
const STORAGE_KEY_ANSWERS = 'flowlink_onboarding_answers'

const steps = [
  {
    key: 'sellWhere',
    title: 'Where can we help you sell?',
    options: [
      { value: 'online', title: 'Online', description: 'Website, social, marketplaces' },
      { value: 'in_person', title: 'In-person', description: 'Retail store, pop-ups, events' },
      { value: 'both', title: 'Both', description: 'Online & in-person' },
    ],
  },
  {
    key: 'businessType',
    title: 'Is this shop for a new or existing business?',
    options: [
      { value: 'new', title: 'New business or idea', description: '' },
      { value: 'existing', title: 'Existing business', description: '' },
    ],
  },
  {
    key: 'needProductsHelp',
    title: 'Lastly, want help finding new products to sell?',
    options: [
      { value: 'yes', title: 'Yes', description: 'Dropshipping, print-on-demand' },
      { value: 'no', title: 'No', description: 'I already have products to sell' },
    ],
  },
]

const OnboardingPage = () => {
  const history = useHistory()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ANSWERS)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const done = useMemo(() => localStorage.getItem(STORAGE_KEY_DONE) === '1', [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers))
  }, [answers])

  if (done) {
    return <Redirect to="/home" />
  }

  const step = steps[index]
  const selected = answers[step.key]
  const canNext = !!selected
  const isLast = index === steps.length - 1

  const choose = (value) => setAnswers((prev) => ({ ...prev, [step.key]: value }))

  const next = () => {
    if (!canNext) return
    if (isLast) {
      localStorage.setItem(STORAGE_KEY_DONE, '1')
      history.push('/home')
      return
    }
    setIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  const back = () => setIndex((i) => Math.max(i - 1, 0))

  const skip = () => {
    localStorage.setItem(STORAGE_KEY_DONE, '1')
    history.push('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f0c] to-[#0b1f16] relative">
      {/* Top-left logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <img src={logo} alt="Flowlink" className="w-7 h-7 rounded" />
        <span className="text-white font-semibold text-lg font-manrope">Flowlink</span>
      </div>

      {/* Center Card Stack effect */}
      <div className="container mx-auto px-4">
        <div className="pt-28 pb-16 flex justify-center">
          <div className="relative">
            <div className="absolute -top-3 left-3 right-0 h-5 rounded-2xl bg-white/30 blur-sm" />
            <div className="absolute -top-1 left-1 right-0 h-5 rounded-2xl bg-white/50" />

            <div className="relative bg-white rounded-2xl shadow-xl w-[min(960px,100%)]">
              <div className="p-6 md:p-8">
                <h1 className="text-xl md:text-2xl font-semibold text-[#0f1720] font-manrope">{step.title}</h1>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {step.options.map((opt) => {
                    const active = selected === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => choose(opt.value)}
                        className={`text-left rounded-xl border transition-all select-none px-4 py-4 bg-gray-50 hover:bg-gray-100 ${
                          active ? 'ring-2 ring-black bg-white border-gray-300' : 'border-gray-200'
                        }`}
                      >
                        <div className="text-[15px] font-medium text-[#0f1720]">{opt.title}</div>
                        {opt.description && (
                          <div className="text-[12px] text-gray-500 mt-1">{opt.description}</div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    className={`text-sm inline-flex items-center gap-1 ${index === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-black'}`}
                    onClick={back}
                    disabled={index === 0}
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>

                  <button
                    className={`h-9 px-3 rounded-lg text-sm inline-flex items-center gap-1 ${
                      canNext ? 'bg-[#1a1a1a] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={next}
                    disabled={!canNext}
                  >
                    {isLast ? 'Finish' : 'Next'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={skip}
              className="mt-6 text-white/80 hover:text-white text-sm inline-flex items-center gap-2"
            >
              <span>Skip customized setup</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
