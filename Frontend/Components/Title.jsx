import Reveal from './Reveal';
import PropTypes from 'prop-types';

const Title = ({ text1, text2 }) => {
  return (
    <Reveal className="flex flex-col items-center mb-10">
      <p className="text-xs tracking-luxe uppercase text-gold mb-2">✦ Sugandhit ✦</p>
      <h2 className="font-display text-4xl sm:text-5xl font-medium text-center">
        {text1} <span className="italic gold-text">{text2}</span>
      </h2>
    </Reveal>
  );
};

Title.propTypes = {
  text1: PropTypes.string,
  text2: PropTypes.string,
};

export default Title;