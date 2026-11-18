export function textToPortableText(text: string) {
  if (!text) return [];
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return paragraphs.map((para, index) => ({
    _type: "block",
    _key: `block_${Date.now()}_${index}`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `span_${Date.now()}_${index}`,
        text: para.trim(),
        marks: [],
      },
    ],
  }));
}

export function portableTextToPlainText(blocks: any[] | null | undefined): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks
    .map((block) => {
      if (block._type !== "block" || !block.children) {
        return "";
      }
      return block.children.map((child: any) => child.text).join("");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
