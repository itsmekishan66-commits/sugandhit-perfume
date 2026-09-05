import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const Reveal = ({ children, direction = 'up', delay = 0, className = '', as: Tag = 'div' }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('visible');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dirClass = direction === 'left' ? 'reveal-left' : direction === 'right' ? 'reveal-right' : direction === 'zoom' ? 'reveal-zoom' : '';

  return (
    <Tag ref={ref} className={`reveal ${dirClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
};

Reveal.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['up', 'left', 'right', 'zoom']),
  delay: PropTypes.number,
  className: PropTypes.string,
  as: PropTypes.elementType,
};

export default Reveal;