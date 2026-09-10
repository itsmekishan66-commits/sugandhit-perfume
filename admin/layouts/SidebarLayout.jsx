import PropTypes from 'prop-types'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const SidebarLayout = ({ setToken, children }) => {
  return (
    <>
      <Navbar setToken={setToken} />
      <div className='flex w-full'>
        <Sidebar />
        <div className='w-[70%] mx-auto my-8 text-gray-600 text-base'>
          {children}
        </div>
      </div>
    </>
  )
}

SidebarLayout.propTypes = {
  setToken: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
}

export default SidebarLayout