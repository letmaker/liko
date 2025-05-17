export const system = {
  loadBlob: async (url: string): Promise<Blob> => {
    const res = await fetch(url);
    return res.blob();
  },

  loadText: async (url: string): Promise<string> => {
    const res = await fetch(url);
    return res.text();
  },

  loadJson: async <T = Record<string, unknown>>(url: string): Promise<T> => {
    const res = await fetch(url);
    return res.json();
  },
  loadArrayBuffer: async (url: string): Promise<ArrayBuffer> => {
    const res = await fetch(url);
    return res.arrayBuffer();
  },
};
