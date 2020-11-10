export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export const getImageBase64 = <T extends string | ArrayBuffer>(file: File) =>
  new Promise<T>((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      resolve(reader.result as T)
    };
    reader.onerror = reject
  })