import { useMemo } from 'react'
import Title from '@/components/ui/Title'
import ProductItem from '@/components/product/ProductItem'
import Reveal from '@/components/ui/Reveal'
import { useApp } from '@/context/AppContext'

const LatestCollection = () => {
  const { products } = useApp();
  const latest = useMemo(() => products.slice(0, 8), [products]);

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