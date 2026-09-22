import { useEffect, useState } from 'react'
import { getAudioStatus, subscribeAudioStatus, type AudioStatus } from '../lib/speech'

/**
 * Tình trạng phát âm của máy đang dùng, tự cập nhật khi trình duyệt nạp xong
 * danh sách giọng đọc (Chrome và Edge nạp bất đồng bộ).
 */
export function useAudioStatus(): AudioStatus {
  const [status, setStatus] = useState<AudioStatus>(getAudioStatus)

  useEffect(() => {
    setStatus(getAudioStatus())
    return subscribeAudioStatus(setStatus)
  }, [])

  return status
}
