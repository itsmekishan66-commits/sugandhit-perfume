import Reveal from './Reveal';

interface TitleProps {
  text1?: string;
  text2?: string;
}

const Title = ({ text1, text2 }: TitleProps) => {
  return (
    <Reveal className="flex flex-col items-center mb-10">
      {/* <p className="text-xs tracking-luxe uppercase text-gold mb-2">✦ Sugandhit ✦</p> */}
      <h2 className="font-display text-4xl sm:text-5xl font-medium text-center">
        {text1} <span className="italic gold-text pr-3">{text2}</span>
      </h2>
    </Reveal>
  );
};

export default Title;