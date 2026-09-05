import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../Context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'
import Reveal from './Reveal'

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latest, setLatest] = useState([]);
  useEffect(() => {
    setLatest(products.slice(0, 8));
  }, [products]);

  return (
    <section className="my-20">
      <Title text1={'Latest'} text2={'Collection'} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-10">
        {latest.map((item, index) => (
          <Reveal key={item._id} delay={index * 60}>
            <ProductItem id={item._id} image={item.image} name={item.name} price={Number(item.price)} subCategory={item.subCategory} />
          </Reveal>
        ))}
      </div>
      {latest.length === 0 && (
        <p className="text-center text-ink-soft mt-10">
          Our curated collection is being bottled right now. ✨
        </p>
      )}
    </section>
  );
};

export default LatestCollection