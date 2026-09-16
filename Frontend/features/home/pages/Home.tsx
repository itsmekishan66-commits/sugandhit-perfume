import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsLetterBox from '../components/NewsLetterBox'
import CustomizeCTA from '@/features/customization/components/CustomizeCTA'

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