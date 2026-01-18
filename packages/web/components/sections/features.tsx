export function Features() {
  return (
    <section>
      <div>
        <h2>Built for Developers</h2>
        <div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <p>[FEATURE CARD {i}]</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
