export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const serialized = JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "\\u003c",
      ">": "\\u003e",
      "&": "\\u0026",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029",
    };
    return entities[character];
  });

  return <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: serialized }} />;
}
