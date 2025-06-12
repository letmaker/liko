/**
 * 系统接口类，为了适配不同底层接口
 */
export const system = {
  /**
   * 异步加载二进制数据为 Blob 对象
   */
  loadBlob: async (url: string): Promise<Blob> => {
    const res = await fetch(url);
    return res.blob();
  },

  /**
   * 异步加载文本内容
   */
  loadText: async (url: string): Promise<string> => {
    const res = await fetch(url);
    return res.text();
  },

  /**
   * 异步加载并解析 JSON 数据
   */
  loadJson: async <T = Record<string, unknown>>(url: string): Promise<T> => {
    const res = await fetch(url);
    return res.json();
  },

  /**
   * 异步加载二进制数据为 ArrayBuffer
   */
  loadArrayBuffer: async (url: string): Promise<ArrayBuffer> => {
    const res = await fetch(url);
    return res.arrayBuffer();
  },
};
