export function QuickStart() {
  return (
    <section>
      <div>
        <h2> Quick Start</h2>
        <div>
          <div>[ PACKAGE MANAGER OPTIONS: npm / pnpm / yarn ]</div>
        </div>
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>[ STEP {i}]</div>
          ))}
        </div>
      </div>
    </section>
  );
}
