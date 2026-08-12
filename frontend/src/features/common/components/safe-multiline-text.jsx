export const splitSafeMultilineText = (value) => String(value ?? '').split(/<br\s*\/?>/gi);

export default function SafeMultilineText({ value }) {
  if (!value) return null;
  const parts = splitSafeMultilineText(value);

  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
