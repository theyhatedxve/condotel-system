// Render the existing placeholder for the unfinished NFC administration page.
export default function PlaceholderPage({ title }) {
  return (
    /* Group the related content and actions into a distinct page section. */
    <section>
      <h1
        style={{
          marginTop: 0,
        }}
      >
        {title}
      </h1>

      <p>This module will be implemented in a later phase.</p>
    </section>
  );
}
