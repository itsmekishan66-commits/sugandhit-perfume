import PropTypes from 'prop-types'

const AuthLayout = ({ children }) => {
  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-gradient-to-br from-[#fdf6ef] via-[#f7e8ef] to-[#f3dfd8] p-4'>
      {children}
    </div>
  )
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired
}

export default AuthLayout