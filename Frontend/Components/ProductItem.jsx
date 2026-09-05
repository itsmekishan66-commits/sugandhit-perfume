import { useContext } from 'react'
import { ShopContext } from '../Context/ShopContext'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

const ProductItem = ({ id, image, name, price, subCategory }) => {
  const { currency } = useContext(ShopContext);
  return (
    <Link className="group text-ink cursor-pointer" to={`/product/${id}`}>
      <div className="img-zoom-wrap rounded-2xl bg-white shadow-sm shadow-espresso/5 border border-gold/10 card-lux">
        {image && image[0] ? (
          <img className="w-full aspect-[3/4] object-cover" src={image[0]} alt={name} loading="lazy" />
        ) : (
          <div className="w-full aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-blush to-sand">
            <span className="font-display text-espresso/50 italic">Sugandhit</span>
          </div>
        )}
      </div>
      <div className="pt-4 flex items-start justify-between">
        <div>
          <p className="font-medium tracking-wide">{name}</p>
          <p className="text-xs tracking-luxe uppercase text-ink-soft mt-1">{subCategory || 'Parfum'}</p>
        </div>
        <p className="font-display text-lg gold-text font-semibold whitespace-nowrap">{currency}{price}</p>
      </div>
    </Link>
  );
};

ProductItem.propTypes = {
  id: PropTypes.string.isRequired,
  image: PropTypes.array,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  subCategory: PropTypes.string,
};

export default ProductItem