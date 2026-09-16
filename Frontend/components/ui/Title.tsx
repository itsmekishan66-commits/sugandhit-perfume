import Reveal from '@/components/ui/Reveal';

interface TitleProps {
  text1?: string;
  text2?: string;
}

const Title = ({ text1, text2 }: TitleProps) => {
  return (
    <Reveal className="flex flex-col items-center mb-10">
      <h2 className="font-display text-4xl sm:text-5xl font-medium text-center">
        {text1} <span className="italic gold-text pr-3">{text2}</span>
      </h2>
    </Reveal>
  );
};

export default Title;