export function Thread77Perks({items = []}: {items?: string[]}) {
  if (!items.length) return null;
  return (
    <ul className="t77-perks">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
