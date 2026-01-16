import { toJpeg, toPng } from 'html-to-image'
import { saveAs } from 'file-saver'

type ExportFormat = 'png' | 'jpeg'

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta?.match(/data:(.*?);base64/)?.[1] ?? 'application/octet-stream'
  const binary = atob(b64 ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function downloadNodeAsImage(
  node: HTMLElement,
  {
    filename,
    format,
    backgroundColor,
    pixelRatio = 2,
  }: {
    filename: string
    format: ExportFormat
    backgroundColor?: string
    pixelRatio?: number
  },
): Promise<void> {
  const common = {
    cacheBust: true,
    pixelRatio,
    backgroundColor,
  }

  const dataUrl =
    format === 'png'
      ? await toPng(node, common)
      : await toJpeg(node, { ...common, quality: 0.95 })

  saveAs(dataUrlToBlob(dataUrl), filename)
}
