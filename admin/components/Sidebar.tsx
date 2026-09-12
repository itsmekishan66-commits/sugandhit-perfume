import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='w-[18%] min-h-screen bg-white border-r border-orange-100/60 pt-6'>
      <div className='flex flex-col gap-3 pl-[12%] pr-4 text-[15px]'>
        <NavLink className='flex items-center gap-3 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50/60 hover:text-[#7c2d12] transition-colors side-link' to="/" end>
          <p className='text-xl'>📊</p>
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50/60 hover:text-[#7c2d12] transition-colors side-link' to="/add" >
          <p className='text-xl'>➕</p>
          <p className='hidden md:block'>Add Products</p>
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50/60 hover:text-[#7c2d12] transition-colors side-link' to="/list" >
          <p className='text-xl'>📦</p>
          <p className='hidden md:block'>Product List</p>
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50/60 hover:text-[#7c2d12] transition-colors side-link' to="/orders" >
          <p className='text-xl'>🛍️</p>
          <p className='hidden md:block'>Orders</p>
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50/60 hover:text-[#7c2d12] transition-colors side-link' to="/custom-orders" >
          <p className='text-xl'>✨</p>
          <p className='hidden md:block'>Custom Orders</p>
        </NavLink>

      </div>
    </div>
  )
}

export default Sidebar