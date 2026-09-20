import { Bounce, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Toaster = () => (
  <ToastContainer
    position="top-right"
    autoClose={2600}
    hideProgressBar
    newestOnTop
    closeOnClick={false}
    closeButton={false}
    icon={false}
    draggable
    transition={Bounce}
    limit={3}
    className="sg-toast-container"
    toastClassName="sg-toast-item"
  />
);

export default Toaster;