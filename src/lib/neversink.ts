const RAW_BASE =
  'https://raw.githubusercontent.com/NeverSinkDev/NeverSink-Filter/master'

// ponytail: master 브랜치 고정. 파일명 리네임되면 이 목록만 수정.
export const PRESETS = [
  { id: '0-SOFT', label: '0 - Soft' },
  { id: '1-REGULAR', label: '1 - Regular' },
  { id: '2-SEMI-STRICT', label: '2 - Semi-Strict' },
  { id: '3-STRICT', label: '3 - Strict' },
  { id: '4-VERY-STRICT', label: '4 - Very Strict' },
  { id: '5-UBER-STRICT', label: '5 - Uber Strict' },
  { id: '6-UBER-PLUS-STRICT', label: '6 - Uber-Plus Strict' },
] as const

export type PresetId = (typeof PRESETS)[number]['id']

export async function fetchPreset(id: PresetId): Promise<string> {
  const url = `${RAW_BASE}/${encodeURIComponent(`NeverSink's filter - ${id}.filter`)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`프리셋 다운로드 실패 (${res.status})`)
  return res.text()
}
