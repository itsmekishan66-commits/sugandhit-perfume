import { useContext } from 'react'
import { ShopContext } from '../Context/ShopContextObject'
import ProductItem from '../Components/ProductItem'
import Reveal from '../Components/Reveal'
import Title from '../Components/Title'

const Wishlist = () => {
  const { products, wishlist, navigate } = useContext(ShopContext);

  const wishlisted = products.filter((item) => wishlist.includes(item._id));

  return (
    <div className="pt-8 min-h-[60vh]">
      <Title text1={'Your'} text2={'Wishlist'} />

      {wishlisted.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl italic text-ink-soft">Your wishlist is empty…</p>
          <p className="text-ink-soft mt-3">Save the scents you adore and find them here.</p>
          <button onClick={() => navigate('/collection')} className="btn-primary mt-8">Explore Collection</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-10 pt-4">
          {wishlisted.map((item, index) => (
            <Reveal key={item._id} delay={index * 50}>
              <ProductItem id={item._id} image={item.image} name={item.name} price={Number(item.price)} subCategory={item.subCategory} category={item.category} rating={item.rating} reviews={item.reviews} badge={item.badge} bestseller={item.bestseller} popular={item.popular} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist