import { useContext, useMemo } from 'react'
import { ShopContext } from '../Context/ShopContextObject'
import Title from './Title';
import ProductItem from "./ProductItem";
import Reveal from './Reveal';
import PropTypes from 'prop-types'

const RelatedProducts = ({ category, subCategory }) => {
  const { products } = useContext(ShopContext);

  const related = useMemo(() => {
    if (products.length === 0) return [];
    let copy = products.filter((item) => item.category === category);
    copy = copy.filter((item) => item.subCategory === subCategory);
    copy = copy.slice(0, 4);
    if (copy.length === 0) {
      copy = products.slice(0, 4);
    }
    return copy;
  }, [products, category, subCategory]);

  return (
    <div className="my-24" key={category + subCategory}>
      <div className="text-center py-2">
        <Title text1={'You may'} text2={'also love'} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-10">
        {related.map((item, index) => (
          <Reveal key={item._id} delay={index * 60}>
            <ProductItem id={item._id} image={item.image} name={item.name} price={Number(item.price)} subCategory={item.subCategory} />
          </Reveal>
        ))}
      </div>
    </div>
  );
};

RelatedProducts.propTypes = {
  category: PropTypes.string,
  subCategory: PropTypes.string,
};

export default RelatedProducts;