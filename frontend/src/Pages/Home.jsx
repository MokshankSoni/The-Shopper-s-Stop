import React from 'react'
import Hero from '../Components/Hero'
import LatestCollection from '../Components/LatestCollection'
import Bestsellers from '../Components/Bestsellers'
import Ourpolicy from '../Components/Ourpolicy'
import Registration from '../Components/Registeration'


const Home = () => {
  return (
    <div>
      <Hero/>
      <LatestCollection/>
      <Bestsellers/>
      <Ourpolicy/>
      <Registration/>
    </div>
  )
}

export default Home
