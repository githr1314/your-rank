declare module 'qrcode' {
  interface QRCodeToCanvasOptions {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }

  function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeToCanvasOptions
  ): Promise<void>

  function toDataURL(
    text: string,
    options?: QRCodeToCanvasOptions & { type?: string; rendererOpts?: object }
  ): Promise<string>

  const QRCode: {
    toCanvas: typeof toCanvas
    toDataURL: typeof toDataURL
  }
  export default QRCode
}

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number
    useCORS?: boolean
    allowTaint?: boolean
    backgroundColor?: string
    logging?: boolean
    width?: number
    height?: number
    x?: number
    y?: number
    scrollX?: number
    scrollY?: number
    windowWidth?: number
    windowHeight?: number
    onclone?: (document: Document) => void
  }

  function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>

  export default html2canvas
}
