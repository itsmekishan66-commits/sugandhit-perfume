import { useState } from 'react'
import Title from '@/components/ui/Title'
import Reveal from '@/components/ui/Reveal'
import { contactSchema } from '@/validate/schemas'
import { showToast } from '@/components/feedback/toast'

interface ContactResult {
  success: boolean;
  message: string;
}

const Contact = () => {
  const [result, setResult] = useState<ContactResult | null>(null);

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = contactSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      concern: formData.get('concern'),
      message: formData.get('message'),
    });
    if (!parsed.success) {
      showToast(parsed.error.issues[0].message, 'error');
      return;
    }
    setResult({
      success: true,
      message: `Message sent. Our fragrance concierge will reach out shortly.`,
    });
  };

  const inputClass = "w-full px-5 py-4 rounded-2xl bg-white/80 border border-gold/25 focus:border-gold transition-colors text-sm";
  const labelClass = "text-sm font-medium mb-2 inline-block";

  return (
    <div className="pt-2">
      <Title text1={'Get in'} text2={'touch'} />
      <Reveal className="max-w-4xl mx-auto card-lux rounded-4xl p-8 md:p-12">
        <form onSubmit={onSubmitHandler} className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Your name</label>
            <input name="name" className={inputClass} type="text" required placeholder="e.g. Aarav Shakya" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" className={inputClass} type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <label className={labelClass}>Subject</label>
            <input name="subject" className={inputClass} type="text" required placeholder="Custom blend query…" />
          </div>
          <div>
            <label className={labelClass}>Concern</label>
            <select name="concern" className={inputClass + ' select-soft'} required defaultValue="">
              <option value="" disabled>Select a reason</option>
              <option>Order enquiry</option>
              <option>Custom perfume guidance</option>
              <option>Delivery / tracking</option>
              <option>Something else</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Message</label>
            <textarea name="message" className={inputClass} rows={5} required placeholder="Tell us about the scent you’re after…"></textarea>
          </div>
          <div className="sm:col-span-2 flex sm:flex-row flex-col items-center gap-4">
            <button className="btn-primary w-full sm:w-auto">Send Message</button>
            {result && (
              <p className={`text-sm text-center sm:text-left ${result.success ? 'text-green-700' : 'text-red-600'}`}>{result.message}</p>
            )}
          </div>
        </form>
      </Reveal>

      <Reveal className="mt-14 grid md:grid-cols-3 gap-6 text-center">
        {[
          ['☎️', '+977 9804068834', 'Mon–Sat, 9am–7pm'],
          ['✉️', 'hello@sugandhit.com', 'We reply within a day'],
          ['📍', 'Kathmandu, Nepal', 'Studio visits by appointment'],
        ].map(([icon, a, b]) => (
          <div key={a} className="card-lux rounded-2xl p-6">
            <div className="text-3xl mb-3">{icon}</div>
            <p className="font-display text-xl font-semibold">{a}</p>
            <p className="text-sm text-ink-soft mt-1">{b}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );
};

export default Contact;