export function generateStaticParams() {
  return [
    { id: 'l1' },
    { id: 'l2' },
    { id: 'l3' },
    { id: 'l4' },
  ];
}

export default function LegislatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
