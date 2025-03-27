export function logImage(base64: string, size = 200) {
  const width = size;
  const style = [
    "font-size: 1px;",
    `padding: ${width}px ${300}px;`,
    `background: url(${base64}) no-repeat;`,
    "background-size: contain;",
  ].join(" ");
  console.log("%c ", style);
}
