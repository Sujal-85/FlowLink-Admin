import React, {useEffect, useState} from 'react'

import { Helmet } from 'react-helmet'
import LayoutWrapper from '../components/LayoutWrapper'

const Page1 = (props) => {

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulate loading time for content
        const timer = setTimeout(() => {
        setIsLoading(false)
        }, 1000)
        
        return () => clearTimeout(timer)
    }, [])

  return (
    <LayoutWrapper isLoading={isLoading}>
      <div className="w-full">
        <Helmet>
          <title>Orders - FlowLink</title>
          <meta property="og:title" content="Orders - FlowLink" />
        </Helmet>
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Orders</h1>
          <button className="inline-flex items-center gap-2 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-[#303030]">
            <span>More actions</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-xl p-8 text-center">
          <div className="mx-auto mb-4 w-16 h-16 text-gray-500">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          
          <h2 className="text-[#303030] text-xl font-semibold font-manrope mb-2">Your orders will show here</h2>
          
          <p className="text-gray-600 text-sm max-w-[520px] mx-auto">
            To get orders and accept payments from customers, you need to select a plan. 
            You'll only be charged for your plan after your free trial ends.
          </p>
          
          <button className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-lg bg-brand-green text-white text-sm">
            Home
          </button>
        </div>

        <div className="py-4 text-center text-sm text-gray-600">
          <span>
            Learn more about <a href="#" className="text-brand-green hover:underline">orders</a>
          </span>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default Page1
