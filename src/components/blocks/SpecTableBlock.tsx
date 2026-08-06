import Section from '../ui/Section';
import Container from '../ui/Container';
import Reveal from '../Reveal';
import SpecTable from '../ui/SpecTable';
import type { SpecTableProps } from './types';

export default function SpecTableBlock({ caption, rows }: SpecTableProps) {
  return (
    <Section tone="ink" as="div" className="pb-16 pt-4 md:pb-24">
      <Container>
        <Reveal delay={60}>
          <SpecTable caption={caption} rows={rows} className="max-w-2xl" />
        </Reveal>
      </Container>
    </Section>
  );
}
