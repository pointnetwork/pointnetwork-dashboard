export default class ProcessError extends Error {
  code: number | null = null

  constructor(message: string, code: number | null = null) {
    super(`${message}, CODE: ${code}`);
    this.code = code
  }
}
