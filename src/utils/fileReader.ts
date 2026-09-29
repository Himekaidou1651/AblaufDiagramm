/**
 * @file fileReader.ts - 浏览器文件读取工具
 */

/**
 * @brief 读取文件内容为文本
 */
export function readFileAsText(
  file: File,
  encoding: string,
  readFailedMessage: string,
  abortMessage: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(readFailedMessage))
      reader.onabort = () => reject(new Error(abortMessage))
      reader.readAsText(file, encoding)
    } catch (err) {
      reject(err)
    }
  })
}
