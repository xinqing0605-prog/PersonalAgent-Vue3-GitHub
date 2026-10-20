const localImage = /^\/api\/images\/[a-f0-9]{64}\.(png|jpg|webp)$/

export async function storeImage(source: string): Promise<string> {
  // Always ask the server to check account ownership, even for local URLs.
  const response = await fetch('/api/images/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  })
  const result = await response.json()
  if (!response.ok || !localImage.test(result.url)) throw new Error(result.detail || '保存图片失败')
  return result.url
}

async function imageBlob(source: string): Promise<Blob> {
  const url = await storeImage(source)
  const response = await fetch(url)
  if (!response.ok) throw new Error('无法读取图片，请重新登录后重试')
  return response.blob()
}

async function pngBlob(source: string): Promise<Blob> {
  const blob = await imageBlob(source)
  if (blob.type === 'image/png') return blob
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width; canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法转换图片')
    context.drawImage(bitmap, 0, 0)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      value => value ? resolve(value) : reject(new Error('无法转换图片')), 'image/png',
    ))
  } finally { bitmap.close() }
}

function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('无法读取图片数据'))
    reader.readAsDataURL(blob)
  })
}

type NativeImageApi = {
  copy_image?: (data: string) => Promise<{ success: boolean; message?: string }>
  save_image?: (data: string) => Promise<{ success: boolean; cancelled?: boolean; message?: string }>
}
function nativeApi(): NativeImageApi | undefined {
  return (window as unknown as { pywebview?: { api?: NativeImageApi } }).pywebview?.api
}

export async function copyImage(source: string): Promise<void> {
  const native = nativeApi()
  if (native?.copy_image) {
    const result = await native.copy_image(await asDataUrl(await pngBlob(source)))
    if (!result.success) throw new Error(result.message || '复制图片失败')
    return
  }
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('当前环境无法复制图片，请保存图片后使用，或通过 HTTPS 打开网页版。')
  }
  // Call write during the click; resolving the PNG can take a network roundtrip.
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob(source) })])
}

export async function downloadImage(source: string): Promise<boolean> {
  const blob = await imageBlob(source)
  const native = nativeApi()
  if (native?.save_image) {
    const result = await native.save_image(await asDataUrl(blob))
    if (result.cancelled) return false
    if (!result.success) throw new Error(result.message || '保存图片失败')
    return true
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `生成图片.${blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png'}`
  document.body.append(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
  return true
}
