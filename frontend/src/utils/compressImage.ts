/**
 * 图片压缩：canvas resize，限制长边不超过 maxDimension
 * 返回压缩后的 Blob
 */
export function compressImage(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 非图片类型或不支持的格式直接返回原文件
    if (!file.type.startsWith('image/')) {
      reject(new Error('不支持的文件类型'))
      return
    }

    // GIF 不压缩（保持动画）
    if (file.type === 'image/gif') {
      resolve(file)
      return
    }

    // 如果文件小于 500KB，不压缩
    if (file.size < 500 * 1024) {
      resolve(file)
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // 计算缩放比例
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // 如果尺寸没变且文件不大，直接返回原文件
      if (width === img.naturalWidth && height === img.naturalHeight && file.size < 1024 * 1024) {
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 初始化失败'))
        return
      }

      // 平滑缩放
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            // 降级返回原文件
            resolve(file)
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

/**
 * 将压缩后的 Blob 转为 File（保持原始文件名）
 */
export function blobToFile(blob: Blob, originalFile: File): File {
  const ext = originalFile.name.split('.').pop() || 'jpg'
  const name = originalFile.name.replace(/\.[^.]+$/, '') + '_compressed.' + ext
  return new File([blob], name, { type: blob.type || originalFile.type })
}
