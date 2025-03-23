import React from 'react'
import Hero from '../Components/Hero'
import LatestCollection from '../Components/LatestCollection'
import Bestsellers from '../Components/Bestsellers'
import Ourpolicy from '../Components/Ourpolicy'


const Home = () => {
  return (
    <div>
      <Hero/>
      <LatestCollection/>
      <Bestsellers/>
      <Ourpolicy/>
    </div>
  )
}

export default Home
