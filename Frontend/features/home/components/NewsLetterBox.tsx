import Reveal from '@/components/ui/Reveal'
import { toast } from 'react-toastify'
import { subscribeNewsletter } from '../home.service'

const NewsLetterBox = () => {
  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '');
    const result = await subscribeNewsletter(email);
    if (result.success) {
      toast.success(result.message || 'Subscribed!');
    } else {
      toast.error(result.message || 'Something went wrong.');
    }
  };

  return (
    <Reveal className="my-24 text-center">
      <div className="rounded-4xl bg-ink text-cream px-6 py-16 md:px-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-espresso/40 blur-3xl" />
        <div className="relative">
          <p className="text-gold tracking-luxe uppercase text-xs mb-3">✦ Join the Community ✦</p>
          <h3 className="font-display text-4xl md:text-5xl font-medium text-center">
            Receive <span className="italic gold-text px-2">10% off</span> your first
            <br className="hidden md:block" /> custom blend
          </h3>
          <p className="text-cream/70 mt-4 max-w-lg mx-auto">
            Early access to new notes, seasonal accords and private bottle pre-orders.
          </p>
          <form onSubmit={onSubmitHandler} className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
            <input
              name="email"
              className="w-full px-5 py-4 rounded-full bg-cream/10 border border-cream/20 text-cream placeholder:text-cream/40 focus:border-gold transition-colors"
              type="email"
              placeholder="Your email address"
              required
            />
            <button type="submit" className="btn-gold whitespace-nowrap w-full sm:w-auto">Subscribe</button>
          </form>
        </div>
      </div>
    </Reveal>
  );
};

export default NewsLetterBox;