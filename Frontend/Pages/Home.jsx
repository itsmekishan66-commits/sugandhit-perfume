import Hero from '../Components/Hero'
import LatestCollection from '../Components/LatestCollection'
import BestSeller from '../Components/BestSeller'
import OurPolicy from '../Components/OurPolicy'
import NewsLetterBox from '../Components/NewsLetterBox'
import CustomizeCTA from '../Components/CustomizeCTA'

const Home = () => {
  return (
    <div>
      <Hero />
      <CustomizeCTA />
      <LatestCollection />
      <OurPolicy />
      <BestSeller />
      <NewsLetterBox />
    </div>
  );
};

export default Home