import { useMemo } from "react";
import Title from "@/components/ui/Title";
import ProductItem from "@/components/product/ProductItem";
import Reveal from "@/components/ui/Reveal";
import { useApp } from "@/context/AppContext";

const BestSeller = () => {
  const { products } = useApp();
  const bestseller = useMemo(() => {
    const best = products.filter((item) => item.bestseller);
    return best.length ? best.slice(0, 4) : products.slice(0, 4);
  }, [products]);

  return (
    <section className="my-20">
      <Title text1={'Best'} text2={'Sellers'} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-10">
        {bestseller.map((item, index) => (
          <Reveal key={item._id} delay={index * 60}>
            <ProductItem id={item._id} image={item.image} name={item.name} price={Number(item.price)} subCategory={item.subCategory} />
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default BestSeller;