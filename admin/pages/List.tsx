import { useEffect, useState } from 'react';
import { backendUrl, currency } from '../config';
import { toast } from 'react-toastify';
import { productIdSchema } from '../validate/schemas';
import PageHeader from '../components/PageHeader';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: string | number;
  image: string[];
}

interface ListProps {
  token: string;
}

const List = ({ token }: ListProps) => {
  const [list, setList] = useState<Product[]>([]);

  const fetchList = async () => {
    try {
      const response = await fetch(backendUrl + '/api/product/list', {
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setList(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  const removeProduct = async (id: string | number) => {
    if (!token) {
      toast.error("Unauthorized: Please log in to remove products.");
      return;
    }

    const parsed = productIdSchema.safeParse({ id });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    try {
      const response = await fetch(backendUrl + '/api/product/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await fetchList();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    fetch(backendUrl + '/api/product/list', {
      headers: { token }
    })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) {
          setList(data.products);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error((error as Error).message);
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <>
      <PageHeader
        title="All Perfumes"
        subtitle="Manage the perfumes in your boutique"
        trailing={
          <span className="rounded-full border border-gold/20 bg-white/80 px-3 py-1 text-sm text-ink-soft">
            {list.length} {list.length === 1 ? 'scent' : 'scents'}
          </span>
        }
      />
      <div className='bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur'>
      <div className='flex flex-col gap-2'>
        {/* Table Headers */}
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-3 px-3 border border-gold/15 bg-cream text-sm font-semibold text-ink-soft rounded-lg'>
          <b>Image</b>
          <b>Name</b>
          <b>Audience</b>
          <b>Price</b>
          {token && <b className='text-center'>Action</b>}
        </div>

        {/* Product List */}
        {list.map((item) => (
          <div
            className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-2 px-3 border border-gold/10 text-sm text-ink-soft hover:bg-sand/40 hover:border-gold/30 transition-colors rounded-lg'
            key={item._id}
          >
            <img className='w-12 h-12 object-cover rounded-lg border border-gold/15' src={item.image[0]} alt='' />
            <p className='text-ink'>{item.name}</p>
            <p>{item.category}</p>
            <p className='font-medium text-ink'>{currency}{item.price}</p>
            {token && (
              <p
                onClick={() => removeProduct(item._id)}
                className='text-right md:text-center cursor-pointer text-lg text-red-500 hover:scale-110 transition-transform'
              >
                ✕
              </p>
            )}
          </div>
        ))}
        {list.length === 0 && <p className='text-center text-ink-soft/60 py-8'>No perfumes yet. Add your first one!</p>}
      </div>
    </div>
    </>
  );
};

export default List;