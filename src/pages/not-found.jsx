import React, { useEffect, useState } from 'react'

import { Helmet } from 'react-helmet'
import Loader from "../components/Loader"

const NotFound = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {isLoading && <Loader />}
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <Helmet>
          <title>404 - Not Found</title>
        </Helmet>
        <h3 className="text-sm tracking-wide text-gray-600">OOPS! PAGE NOT FOUND</h3>
        <div className="my-2">
          <h1 className="text-[80px] leading-none font-extrabold text-[#303030]">404</h1>
        </div>
        <div>
          <h2 className="text-lg text-gray-700 max-w-[640px]">
            WE ARE SORRY, BUT THE PAGE YOU REQUESTED WAS NOT FOUND
          </h2>
        </div>
      </div>
    </>
  )
}

export default NotFound

